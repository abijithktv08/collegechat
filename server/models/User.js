// ============================================
// FILE: server/models/User.js
// PURPOSE: Database model for storing user information
// ADMIN NOTE: This stores phone numbers so you can track who's chatting
// ============================================

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Phone number (this is how you track users as admin)
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Anonymous nickname shown in chat (random generated)
  nickname: {
    type: String,
    required: true
  },
  
  // Avatar identifier (so you can see their avatar in admin panel)
  avatar: {
    type: String,
    required: true
  },
  
  // Academic year (2nd, 1st, 3rd, 4th - can add more later)
  year: {
    type: String,
    required: true,
    enum: ['1st', '2nd', '3rd', '4th']
  },
  
  // Branch (ENTC, Computer, etc.)
  branch: {
    type: String,
    required: true
  },
  
  // Division (A, B, C, etc.)
  division: {
    type: String,
    required: true
  },
  
  // Last login time
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // Account creation time
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Is user currently online
  isOnline: {
    type: Boolean,
    default: false
  }
});

// Create index for faster queries
userSchema.index({ phoneNumber: 1 });
userSchema.index({ year: 1, branch: 1, division: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;