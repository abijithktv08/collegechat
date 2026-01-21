const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// Submit feedback
router.post('/submit', async (req, res) => {
  try {
    console.log('📝 Feedback request received');
    console.log('Body:', req.body);
    
    const { userId, feedbackType, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }
    
    let feedbackData = {
      feedbackType: feedbackType || 'other',
      message: message,
      createdAt: new Date()
    };
    
    // Try to get user info if userId provided
    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          feedbackData.userId = user._id;
          feedbackData.userPhone = user.phoneNumber;
          feedbackData.userNickname = user.nickname;
          feedbackData.userAvatar = user.avatar;
        }
      } catch (err) {
        console.log('User not found, saving feedback anyway');
      }
    }
    
    const feedback = new Feedback(feedbackData);
    await feedback.save();
    
    console.log('✅ Feedback saved:', feedback._id);
    
    return res.json({ 
      success: true, 
      message: 'Thank you for your feedback!' 
    });
    
  } catch (error) {
    console.error('❌ Feedback error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to save feedback' 
    });
  }
});

// Get all feedback (admin only)
router.get('/all', async (req, res) => {
  try {
    const { password } = req.headers;
    
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(100);
    
    return res.json({ 
      success: true, 
      feedbacks: feedbacks 
    });
    
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch feedbacks' 
    });
  }
});

// Update feedback status (admin only)
router.put('/:id/status', async (req, res) => {
  try {
    const { password } = req.headers;
    const { status } = req.body;
    
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    await Feedback.findByIdAndUpdate(req.params.id, { status });
    
    return res.json({ 
      success: true, 
      message: 'Status updated' 
    });
    
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update status' 
    });
  }
});

module.exports = router;
