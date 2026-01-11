// ============================================
// FILE: server/socketHandler.js
// Location: college-chat/server/socketHandler.js
// Handles real-time chat - AVATAR FIX
// ============================================

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
        console.log(`User ${userId} joined room: ${room}`);
        
        // Update user online status
        await User.findByIdAndUpdate(userId, { isOnline: true });
        
        // Load recent messages (last 50)
        const messages = await Message.find({ room })
          .sort({ timestamp: -1 })
          .limit(50)
          .lean();
        
        console.log(`Loading ${messages.length} messages for room ${room}`);
        
        // FIX: Make sure all messages have avatar and nickname
        const formattedMessages = messages.reverse().map(msg => ({
          id: msg._id,
          nickname: msg.senderNickname || 'Anonymous',
          avatar: msg.senderAvatar || '👤',
          message: msg.message,
          timestamp: msg.timestamp,
          senderNickname: msg.senderNickname || 'Anonymous',
          senderAvatar: msg.senderAvatar || '👤'
        }));
        
        socket.emit('load-messages', formattedMessages);
        
        // Notify room
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
        
        // Get user details
        const user = await User.findById(userId);
        
        if (!user) {
          console.error('User not found:', userId);
          socket.emit('error', { message: 'User not found' });
          return;
        }
        
        console.log(`User found: ${user.nickname} (${user.avatar})`);
        
        // Save message to database
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
        
        // Broadcast to room - FIXED: Always include avatar and nickname
        const messageToSend = {
          id: newMessage._id,
          nickname: user.nickname,
          avatar: user.avatar,
          message: message,
          timestamp: newMessage.timestamp
        };
        
        console.log('Broadcasting message:', messageToSend);
        io.to(room).emit('new-message', messageToSend);
        
      } catch (error) {
        console.error('Message error:', error);
        socket.emit('error', { message: 'Failed to send message: ' + error.message });
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
    });
  });
}

module.exports = setupSocketHandlers;