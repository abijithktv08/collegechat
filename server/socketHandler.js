const Message = require('./models/Message');
const User = require('./models/User');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);
    
    // User joins a room
    socket.on('join-room', async (data) => {
      try {
        const { userId, room, year, branch, division, roomType } = data;
        
        socket.join(room);
        socket.userId = userId;
        socket.currentRoom = room;
        
        console.log(`User ${userId} joined room: ${room}`);
        
        await User.findByIdAndUpdate(userId, { isOnline: true });
        
        const messages = await Message.find({ room })
          .sort({ timestamp: -1 })
          .limit(50)
          .lean();
        
        console.log(`Loading ${messages.length} messages for room ${room}`);
        
        const formattedMessages = messages.reverse().map(msg => ({
          id: msg._id.toString(),
          userId: msg.userId.toString(),
          nickname: msg.senderNickname || 'Anonymous',
          avatar: msg.senderAvatar || '👤',
          message: msg.message,
          timestamp: msg.timestamp,
          senderPhone: msg.senderPhone
        }));
        
        socket.emit('load-messages', formattedMessages);
        
        io.to(room).emit('user-joined', {
          message: 'Someone joined the chat! 🎉'
        });
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room: ' + error.message });
      }
    });
    
    // User sends message
    socket.on('send-message', async (data) => {
      try {
        const { userId, message, room, year, branch, division, roomType } = data;
        
        console.log(`Message from user ${userId} in room ${room}`);
        
        const user = await User.findById(userId);
        
        if (!user) {
          console.error('User not found:', userId);
          socket.emit('error', { message: 'User not found' });
          return;
        }
        
        console.log(`User found: ${user.nickname} (${user.avatar})`);
        
        const newMessage = new Message({
          userId: user._id,
          senderPhone: user.phoneNumber,
          senderNickname: user.nickname,
          senderAvatar: user.avatar,
          message,
          room,
          year,
          branch,
          division,
          roomType,
          timestamp: new Date()
        });
        
        await newMessage.save();
        console.log('Message saved to database');
        
        const messageToSend = {
          id: newMessage._id.toString(),
          userId: user._id.toString(),
          nickname: user.nickname,
          avatar: user.avatar,
          message: message,
          timestamp: newMessage.timestamp,
          senderPhone: user.phoneNumber
        };
        
        console.log('Broadcasting message:', messageToSend);
        io.to(room).emit('new-message', messageToSend);
        
      } catch (error) {
        console.error('Message error:', error);
        socket.emit('error', { message: 'Failed to send message: ' + error.message });
      }
    });
    
    // DELETE MESSAGE - Only message owner can delete
    socket.on('delete-message', async (data) => {
      try {
        const { messageId, userId, room } = data;
        
        console.log(`Delete request: messageId=${messageId}, userId=${userId}`);
        
        // Find the message
        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }
        
        // Check if user owns this message
        if (message.userId.toString() !== userId) {
          socket.emit('error', { message: 'You can only delete your own messages' });
          return;
        }
        
        // Delete from database
        await Message.findByIdAndDelete(messageId);
        console.log('Message deleted from database');
        
        // Notify everyone in the room to remove message
        io.to(room).emit('message-deleted', {
          messageId: messageId
        });
        
        console.log('Broadcasted message deletion to room:', room);
        
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message: ' + error.message });
      }
    });
    
    // User leaves room
    socket.on('leave-room', async (data) => {
      try {
        const { userId, room } = data;
        socket.leave(room);
        console.log(`User ${userId} left room ${room}`);
        
        io.to(room).emit('user-left', {
          message: 'Someone left the chat 👋'
        });
      } catch (error) {
        console.error('Leave room error:', error);
      }
    });
    
    // User disconnects
    socket.on('disconnect', async () => {
      console.log('❌ User disconnected:', socket.id);
      
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });
      }
    });
  });
}

module.exports = setupSocketHandlers;