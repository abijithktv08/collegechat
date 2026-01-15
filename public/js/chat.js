// Check if user is logged in how are you
const API_URL = window.location.origin;
const userData = JSON.parse(localStorage.getItem('user') || 'null');
if (!userData) {
  window.location.href = '/';
}

// Display user info
document.getElementById('userAvatar').textContent = userData.avatar;
document.getElementById('userNickname').textContent = userData.nickname;
document.getElementById('userDetails').textContent = `${userData.year} Year • ${userData.branch} ${userData.division}`;

// Socket.IO connection
const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

let currentRoom = null;
let currentRoomType = null;

// Room icons
const roomIcons = {
  general: '💬',
  confession: '🤫',
  rant: '😤'
};

// Join a room
function joinRoom(roomType) {
  // Leave current room if any
  if (currentRoom) {
    socket.emit('leave-room', {
      userId: userData.id,
      room: currentRoom
    });
  }
  
  // Create room name
  const room = `${userData.year}-${userData.branch}-${userData.division}-${roomType}`;
  currentRoom = room;
  currentRoomType = roomType;
  
  // Join room via socket
  socket.emit('join-room', {
    userId: userData.id,
    room,
    year: userData.year,
    branch: userData.branch,
    division: userData.division,
    roomType
  });
  
  // Update UI
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('activeChat').style.display = 'flex';
  
  document.getElementById('chatRoomIcon').textContent = roomIcons[roomType];
  document.getElementById('chatRoomName').textContent = getRoomName(roomType);
  document.getElementById('chatRoomUsers').textContent = `${userData.year} Year • ${userData.branch} ${userData.division}`;
  
  // Clear messages
  document.getElementById('chatMessages').innerHTML = '';
}

function getRoomName(roomType) {
  const names = {
    general: 'General Chat',
    confession: 'Confessions',
    rant: 'Rant Room'
  };
  return names[roomType] || 'Chat Room';
}

// Leave current room
function leaveRoom() {
  if (currentRoom) {
    socket.emit('leave-room', {
      userId: userData.id,
      room: currentRoom
    });
  }
  
  currentRoom = null;
  currentRoomType = null;
  
  document.getElementById('welcomeScreen').style.display = 'flex';
  document.getElementById('activeChat').style.display = 'none';
  document.getElementById('messageInput').value = '';
}

// Send message
function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  
  if (!message || !currentRoom) return;
  
  socket.emit('send-message', {
    userId: userData.id,
    message,
    room: currentRoom,
    year: userData.year,
    branch: userData.branch,
    division: userData.division,
    roomType: currentRoomType
  });
  
  messageInput.value = '';
}

// Handle Enter key
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Socket event listeners
socket.on('load-messages', (messages) => {
  const messagesDiv = document.getElementById('chatMessages');
  messagesDiv.innerHTML = '';
  
  console.log('Loading messages:', messages); // Debug log
  
  messages.forEach(msg => {
    // FIX: Handle both new messages and old database messages
    const messageData = {
      id: msg._id || msg.id,
      nickname: msg.senderNickname || msg.nickname || 'Anonymous',
      avatar: msg.senderAvatar || msg.avatar || '👤',
      message: msg.message,
      timestamp: msg.timestamp
    };
    
    addMessageToUI(messageData);
  });
  
  scrollToBottom();
});

socket.on('new-message', (message) => {
  console.log('New message received:', message); // Debug log
  addMessageToUI(message);
  scrollToBottom();
});

socket.on('user-joined', (data) => {
  addSystemMessage(data.message);
});

socket.on('user-left', (data) => {
  addSystemMessage(data.message);
});

socket.on('error', (data) => {
  alert('Error: ' + data.message);
});

// Add message to UI - FIXED VERSION
function addMessageToUI(message) {
  const messagesDiv = document.getElementById('chatMessages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // FIX: Ensure avatar and nickname are never undefined
  const avatar = message.avatar || '👤';
  const nickname = message.nickname || 'Anonymous';
  const messageText = message.message || '';
  
  messageDiv.innerHTML = `
    <div class="message-header">
      <div class="message-avatar">${avatar}</div>
      <div class="message-nickname">${nickname}</div>
      <div class="message-time">${time}</div>
    </div>
    <div class="message-content">${escapeHtml(messageText)}</div>
  `;
  
  messagesDiv.appendChild(messageDiv);
}

// Add system message
function addSystemMessage(text) {
  const messagesDiv = document.getElementById('chatMessages');
  
  const systemDiv = document.createElement('div');
  systemDiv.className = 'system-message';
  systemDiv.textContent = text;
  
  messagesDiv.appendChild(systemDiv);
  scrollToBottom();
}

// Scroll to bottom
function scrollToBottom() {
  const messagesDiv = document.getElementById('chatMessages');
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Logout
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}

// Debug: Log when socket connects
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Socket disconnected');
});
