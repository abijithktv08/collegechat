const Message = require('./models/Message');
const User = require('./models/User');

const roomUsers = new Map();

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);
    
    socket.on('join-room', async (data) => {
      try {
        const { userId, room, year, branch, division, roomType } = data;
        
        socket.join(room);
        socket.userId = userId;
        socket.currentRoom = room;
        
        const user = await User.findByIdAndUpdate(userId, { isOnline: true }, { new: true });
        
        if (user) {
          socket.userNickname = user.nickname;
          socket.userAvatar = user.avatar;
        }
        
        if (!roomUsers.has(room)) {
          roomUsers.set(room, new Set());
        }
        roomUsers.get(room).add(socket.id);
        
        const onlineCount = roomUsers.get(room).size;
        io.to(room).emit('online-count-update', { count: onlineCount });
        
        const messages = await Message.find({ room })
          .sort({ timestamp: -1 })
          .limit(50)
          .lean();
        
        const formattedMessages = messages.reverse().map(msg => ({
          id: msg._id.toString(),
          userId: msg.userId.toString(),
          nickname: msg.senderNickname || 'Anonymous',
          avatar: msg.senderAvatar || '👤',
          message: msg.message,
          timestamp: msg.timestamp
        }));
        
        socket.emit('load-messages', formattedMessages);
        io.to(room).emit('user-joined', { message: 'Someone joined! 🎉' });
      } catch (error) {
        console.error('Join error:', error);
      }
    });
    
    socket.on('send-message', async (data) => {
      try {
        const { userId, message, room, year, branch, division, roomType } = data;
        const user = await User.findById(userId);
        if (!user) return;
        
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
        
        io.to(room).emit('new-message', {
          id: newMessage._id.toString(),
          userId: user._id.toString(),
          nickname: user.nickname,
          avatar: user.avatar,
          message: message,
          timestamp: newMessage.timestamp
        });
      } catch (error) {
        console.error('Message error:', error);
      }
    });
    
    socket.on('delete-message', async (data) => {
      try {
        const { messageId, userId, room } = data;
        const message = await Message.findById(messageId);
        
        if (!message || message.userId.toString() !== userId) return;
        
        await Message.findByIdAndDelete(messageId);
        io.to(room).emit('message-deleted', { messageId });
      } catch (error) {
        console.error('Delete error:', error);
      }
    });
    
    socket.on('typing-start', (data) => {
      socket.to(data.room).emit('user-typing', { 
        nickname: data.nickname,
        avatar: data.avatar,
        socketId: socket.id 
      });
    });
    
    socket.on('typing-stop', (data) => {
      socket.to(data.room).emit('user-stopped-typing', { socketId: socket.id });
    });
    
    socket.on('leave-room', async (data) => {
      try {
        socket.leave(data.room);
        
        if (roomUsers.has(data.room)) {
          roomUsers.get(data.room).delete(socket.id);
          const onlineCount = roomUsers.get(data.room).size;
          io.to(data.room).emit('online-count-update', { count: onlineCount });
        }
      } catch (error) {
        console.error('Leave error:', error);
      }
    });
    
    socket.on('disconnect', async () => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });
      }
      
      if (socket.currentRoom && roomUsers.has(socket.currentRoom)) {
        roomUsers.get(socket.currentRoom).delete(socket.id);
        const onlineCount = roomUsers.get(socket.currentRoom).size;
        io.to(socket.currentRoom).emit('online-count-update', { count: onlineCount });
        io.to(socket.currentRoom).emit('user-stopped-typing', { socketId: socket.id });
      }
    });
  });
}

module.exports = setupSocketHandlers;