// ============================================
// FILE: server/adminRoutes.js
// Location: college-chat/server/adminRoutes.js
// Admin panel API routes
// ============================================

const express = require('express');
const router = express.Router();
const User = require('./models/User');
const Message = require('./models/Message');

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
  const { password } = req.headers;
  if (password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

// Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ lastLogin: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all messages
router.get('/messages', authenticateAdmin, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('userId');
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get messages by room
router.get('/messages/:room', authenticateAdmin, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user by phone
router.get('/user/:phone', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findOne({ phoneNumber: req.params.phone });
    const messages = await Message.find({ senderPhone: req.params.phone }).sort({ timestamp: -1 });
    res.json({ success: true, user, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const totalMessages = await Message.countDocuments();
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        onlineUsers,
        totalMessages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
// Add this route to adminRoutes.js after other routes

// Clear all messages
router.delete('/messages/clear-all', authenticateAdmin, async (req, res) => {
  try {
    const result = await Message.deleteMany({});
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} messages` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear messages by room type
router.delete('/messages/clear/:roomType', authenticateAdmin, async (req, res) => {
  try {
    const result = await Message.deleteMany({ roomType: req.params.roomType });
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} messages from ${req.params.roomType}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear messages older than X days
router.delete('/messages/clear-old/:days', authenticateAdmin, async (req, res) => {
  try {
    const days = parseInt(req.params.days);
    const cutoffDate = new Date(Date.now() - days*24*60*60*1000);
    const result = await Message.deleteMany({ timestamp: { $lt: cutoffDate } });
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} messages older than ${days} days` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});