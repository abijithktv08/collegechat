// ============================================
// FILE: public/js/chat.js - FIXED FOR DEPLOYMENT
// ============================================

const userData = JSON.parse(localStorage.getItem('user') || 'null');
if (!userData) {
  window.location.href = '/';
}

document.getElementById('userAvatar').textContent = userData.avatar;
document.getElementById('userNickname').textContent = userData.nickname;
document.getElementById('userDetails').textContent = `${userData.year} Year • ${userData.branch} ${userData.division}`;

// FIXED: Socket.IO connection for deployment
const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

let currentRoom = null;
let currentRoomType = null;

const roomIcons = {
  general: '💬',
  confession: '🤫',
  rant: '😤'
};

// Rest of your chat.js code continues exactly as before...
// (Keep all your existing functions: joinRoom, leaveRoom, sendMessage, etc.)
