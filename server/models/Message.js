// ============================================
// FILE: server/models/Message.js
// Location: college-chat/server/models/Message.js
// Message database model
// ============================================

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderPhone: {
    type: String,
    required: true
  },
  senderNickname: {
    type: String,
    required: true
  },
  senderAvatar: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  room: {
    type: String,
    required: true
  },
  year: {
    type: String
  },
  branch: {
    type: String
  },
  division: {
    type: String
  },
  roomType: {
    type: String,
    enum: ['general', 'confession', 'rant']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ room: 1, timestamp: -1 });
messageSchema.index({ userId: 1 });
messageSchema.index({ senderPhone: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;