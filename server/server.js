// ============================================
// FILE: server/server.js
// Location: college-chat/server/server.js
// COMPLETE SERVER WITH DEBUGGING
// ============================================

console.log('🚀 Starting server...');
console.log('📁 Current directory:', __dirname);
const feedbackRouter = require('./routes/feedback');


// Load environment variables
require('dotenv').config();
console.log('✅ Environment variables loaded');

// Import required packages
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');
console.log('✅ Core packages imported');

// Try to import custom modules with error handling
let connectDatabase, setupSocketHandlers, adminRoutes, otpRoutes;

try {
  connectDatabase = require('./database');
  console.log('✅ database.js loaded');
} catch (error) {
  console.error('❌ ERROR loading database.js:', error.message);
  process.exit(1);
}

try {
  setupSocketHandlers = require('./socketHandler');
  console.log('✅ socketHandler.js loaded');
} catch (error) {
  console.error('❌ ERROR loading socketHandler.js:', error.message);
  process.exit(1);
}

try {
  adminRoutes = require('./adminRoutes');
  console.log('✅ adminRoutes.js loaded');
} catch (error) {
  console.error('❌ ERROR loading adminRoutes.js:', error.message);
  process.exit(1);
}

try {
  otpRoutes = require('./otpService');
  console.log('✅ otpService.js loaded');
} catch (error) {
  console.error('❌ ERROR loading otpService.js:', error.message);
  process.exit(1);
}

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
console.log('✅ Express and Socket.IO initialized');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/feedback', feedbackRouter);

console.log('✅ Middleware configured');

// Connect to database
connectDatabase();

// Setup Socket.IO
setupSocketHandlers(io);
console.log('✅ Socket.IO handlers configured');

// API Routes
app.use('/api/otp', otpRoutes);
app.use('/api/admin', adminRoutes);
console.log('✅ API routes configured');

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/chat.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Server error: ' + err.message 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════╗');
  console.log(`║  🚀 Server running on ${PORT}     ║`);
  console.log(`║  🌐 http://localhost:${PORT}      ║`);
  console.log(`║  👨‍💼 Admin: /admin.html         ║`);
  console.log('╚════════════════════════════════╝');
  console.log('');
  console.log('✅ All systems ready!');
  console.log('📝 Test server: http://localhost:' + PORT + '/api/test');
  console.log('');
});