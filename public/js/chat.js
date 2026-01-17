const userData = JSON.parse(localStorage.getItem('user') || 'null');
if (!userData) {
  window.location.href = '/';
}

document.getElementById('userAvatar').textContent = userData.avatar;
document.getElementById('userNickname').textContent = userData.nickname;
document.getElementById('userDetails').textContent = `${userData.year} Year • ${userData.branch} ${userData.division}`;

const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

let currentRoom = null;
let currentRoomType = null;
let typingTimeout = null;
let isTyping = false;
const typingUsers = new Set();

const roomIcons = {
  general: '💬',
  confession: '🤫',
  rant: '😤'
};

function joinRoom(roomType) {
  if (currentRoom) {
    socket.emit('leave-room', {
      userId: userData.id,
      room: currentRoom
    });
  }
  
  const room = `${userData.year}-${userData.branch}-${userData.division}-${roomType}`;
  currentRoom = room;
  currentRoomType = roomType;
  
  socket.emit('join-room', {
    userId: userData.id,
    room,
    year: userData.year,
    branch: userData.branch,
    division: userData.division,
    roomType
  });
  
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('activeChat').style.display = 'flex';
  
  document.getElementById('chatRoomIcon').textContent = roomIcons[roomType];
  document.getElementById('chatRoomName').textContent = getRoomName(roomType);
  document.getElementById('chatRoomUsers').textContent = `${userData.year} Year • ${userData.branch} ${userData.division}`;
  
  document.getElementById('chatMessages').innerHTML = '';
  
  typingUsers.clear();
  updateTypingIndicator();
}

function getRoomName(roomType) {
  const names = {
    general: 'General Chat',
    confession: 'Confessions',
    rant: 'Rant Room'
  };
  return names[roomType] || 'Chat Room';
}

function leaveRoom() {
  if (currentRoom) {
    socket.emit('leave-room', {
      userId: userData.id,
      room: currentRoom
    });
  }
  
  currentRoom = null;
  currentRoomType = null;
  typingUsers.clear();
  
  document.getElementById('welcomeScreen').style.display = 'flex';
  document.getElementById('activeChat').style.display = 'none';
  document.getElementById('messageInput').value = '';
}

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  
  if (!message || !currentRoom) return;
  
  if (isTyping) {
    socket.emit('typing-stop', { room: currentRoom });
    isTyping = false;
  }
  
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

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function handleTyping() {
  if (!currentRoom) return;
  
  if (!isTyping) {
    socket.emit('typing-start', { 
      room: currentRoom,
      nickname: userData.nickname,
      avatar: userData.avatar
    });
    isTyping = true;
  }
  
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  
  typingTimeout = setTimeout(() => {
    socket.emit('typing-stop', { room: currentRoom });
    isTyping = false;
  }, 2000);
}

window.addEventListener('DOMContentLoaded', () => {
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('input', handleTyping);
  }
});

function deleteMessage(messageId) {
  if (confirm('Delete this message for everyone?')) {
    console.log('Deleting message:', messageId);
    
    socket.emit('delete-message', {
      messageId: messageId,
      userId: userData.id,
      room: currentRoom
    });
  }
}

socket.on('load-messages', (messages) => {
  const messagesDiv = document.getElementById('chatMessages');
  messagesDiv.innerHTML = '';
  
  console.log('Loading messages:', messages);
  
  messages.forEach(msg => {
    addMessageToUI(msg);
  });
  
  scrollToBottom();
});

socket.on('new-message', (message) => {
  console.log('New message received:', message);
  addMessageToUI(message);
  scrollToBottom();
});

socket.on('message-deleted', (data) => {
  console.log('Message deleted:', data.messageId);
  
  const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
  if (messageElement) {
    messageElement.style.transition = 'opacity 0.3s';
    messageElement.style.opacity = '0';
    setTimeout(() => {
      messageElement.remove();
    }, 300);
  }
});

socket.on('online-count-update', (data) => {
  console.log('Online count updated:', data.count);
  updateOnlineCount(data.count);
});

socket.on('user-typing', (data) => {
  console.log('User typing:', data.nickname);
  typingUsers.add(JSON.stringify(data));
  updateTypingIndicator();
});

socket.on('user-stopped-typing', (data) => {
  console.log('User stopped typing');
  for (let user of typingUsers) {
    const userData = JSON.parse(user);
    if (userData.socketId === data.socketId) {
      typingUsers.delete(user);
      break;
    }
  }
  updateTypingIndicator();
});

function updateOnlineCount(count) {
  const roomUsersElement = document.getElementById('chatRoomUsers');
  if (roomUsersElement) {
    const baseText = `${userData.year} Year • ${userData.branch} ${userData.division}`;
    roomUsersElement.textContent = `${baseText} • ${count} online`;
  }
}

function updateTypingIndicator() {
  const typingIndicatorDiv = document.getElementById('typingIndicator');
  
  if (typingUsers.size === 0) {
    typingIndicatorDiv.style.display = 'none';
    return;
  }
  
  typingIndicatorDiv.style.display = 'flex';
  
  const typingArray = Array.from(typingUsers).map(u => JSON.parse(u));
  
  if (typingArray.length === 1) {
    typingIndicatorDiv.innerHTML = `
      <span class="typing-avatar">${typingArray[0].avatar}</span>
      <span class="typing-text">${typingArray[0].nickname} is typing</span>
      <span class="typing-dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    `;
  } else if (typingArray.length === 2) {
    typingIndicatorDiv.innerHTML = `
      <span class="typing-text">${typingArray[0].nickname} and ${typingArray[1].nickname} are typing</span>
      <span class="typing-dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    `;
  } else {
    typingIndicatorDiv.innerHTML = `
      <span class="typing-text">Several people are typing</span>
      <span class="typing-dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    `;
  }
}

socket.on('user-joined', (data) => {
  addSystemMessage(data.message);
});

socket.on('user-left', (data) => {
  addSystemMessage(data.message);
});

socket.on('error', (data) => {
  alert('Error: ' + data.message);
});

function addMessageToUI(message) {
  const messagesDiv = document.getElementById('chatMessages');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.setAttribute('data-message-id', message.id);
  
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const avatar = message.avatar || '👤';
  const nickname = message.nickname || 'Anonymous';
  const messageText = message.message || '';
  
  const isOwnMessage = message.userId === userData.id;
  
  messageDiv.innerHTML = `
    <div class="message-header">
      <div class="message-avatar">${avatar}</div>
      <div class="message-nickname">${nickname}</div>
      <div class="message-time">${time}</div>
      ${isOwnMessage ? `
        <button class="message-delete-btn" onclick="deleteMessage('${message.id}')" title="Delete for everyone">
          🗑️
        </button>
      ` : ''}
    </div>
    <div class="message-content">${escapeHtml(messageText)}</div>
  `;
  
  messagesDiv.appendChild(messageDiv);
}

function addSystemMessage(text) {
  const messagesDiv = document.getElementById('chatMessages');
  
  const systemDiv = document.createElement('div');
  systemDiv.className = 'system-message';
  systemDiv.textContent = text;
  
  messagesDiv.appendChild(systemDiv);
  scrollToBottom();
}

function scrollToBottom() {
  const messagesDiv = document.getElementById('chatMessages');
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Socket disconnected');
});