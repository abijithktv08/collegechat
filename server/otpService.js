// ============================================
// FILE: server/otpService.js
// Location: college-chat/server/otpService.js
// Handles OTP generation and login
// ============================================
const express = require('express');
const router = express.Router();
const User = require('./models/User');

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Generate random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate random nickname
function generateNickname() {
  const adjectives = ['Cool', 'Swift', 'Brave', 'Bright', 'Quick', 'Smart', 'Bold', 'Calm', 'Happy', 'Lucky'];
  const nouns = ['Tiger', 'Eagle', 'Lion', 'Panda', 'Wolf', 'Bear', 'Fox', 'Owl', 'Hawk', 'Deer'];
  const num = Math.floor(Math.random() * 99);
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${num}`;
}

// Generate random avatar
function generateAvatar() {
  const avatars = ['🦊', '🐼', '🦁', '🐯', '🐻', '🦅', '🦉', '🐺', '🦌', '🐱', '🐶', '🐸', '🐨', '🦝', '🦦'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

// Send OTP
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }
    
    const otp = generateOTP();
    otpStore.set(phoneNumber, otp);
    
    // In production: Send SMS here using Twilio/AWS SNS
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
    
    // Auto-expire OTP after 5 minutes
    setTimeout(() => otpStore.delete(phoneNumber), 5 * 60 * 1000);
    
    res.json({ success: true, message: 'OTP sent successfully', otp }); // Remove otp in production
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP and login
router.post('/verify', async (req, res) => {
  try {
    const { phoneNumber, otp, year, branch, division } = req.body;
    
    const storedOTP = otpStore.get(phoneNumber);
    
    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Check if user exists
    let user = await User.findOne({ phoneNumber });
    
    if (!user) {
      // Create new user
      user = new User({
        phoneNumber,
        nickname: generateNickname(),
        avatar: generateAvatar(),
        year,
        branch,
        division
      });
      await user.save();
    } else {
      // Update existing user
      user.lastLogin = Date.now();
      user.isOnline = true;
      await user.save();
    }
    
    otpStore.delete(phoneNumber);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        year: user.year,
        branch: user.branch,
        division: user.division
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;