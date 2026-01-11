// ============================================
// FILE 16: public/js/admin.js
// Location: college-chat/public/js/admin.js
// Admin dashboard logic
// ============================================

let adminPassword = '';

// Admin login
function adminLogin() {
  const passwordInput = document.getElementById('adminPassword');
  adminPassword = passwordInput.value;
  
  if (!adminPassword) {
    alert('Please enter password');
    return;
  }
  
  // Try to fetch stats to verify password
  fetchStats();
}

function handleAdminKeyPress(event) {
  if (event.key === 'Enter') {
    adminLogin();
  }
}

// Fetch stats
async function fetchStats() {
  try {
    const response = await fetch('/api/admin/stats', {
      headers: { 'password': adminPassword }
    });
    
    if (response.status === 401) {
      alert('Invalid password');
      return;
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Login successful
      document.getElementById('loginBox').style.display = 'none';
      document.getElementById('adminContent').style.display = 'block';
      
      // Update stats
      document.getElementById('totalUsers').textContent = data.stats.totalUsers;
      document.getElementById('onlineUsers').textContent = data.stats.onlineUsers;
      document.getElementById('totalMessages').textContent = data.stats.totalMessages;
      
      // Load users
      fetchUsers();
      fetchMessages();
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Fetch users
async function fetchUsers() {
  try {
    const response = await fetch('/api/admin/users', {
      headers: { 'password': adminPassword }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const tbody = document.getElementById('usersTableBody');
      tbody.innerHTML = '';
      
      data.users.forEach(user => {
        const tr = document.createElement('tr');
        
        const lastLogin = new Date(user.lastLogin).toLocaleString();
        const status = user.isOnline ? 
          '<span class="status-online">● Online</span>' : 
          '<span class="status-offline">● Offline</span>';
        
        tr.innerHTML = `
          <td>${user.avatar}</td>
          <td>${user.nickname}</td>
          <td><strong>${user.phoneNumber}</strong></td>
          <td>${user.year}</td>
          <td>${user.branch}</td>
          <td>${user.division}</td>
          <td>${status}</td>
          <td>${lastLogin}</td>
        `;
        
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

// Fetch messages
async function fetchMessages() {
  try {
    const response = await fetch('/api/admin/messages', {
      headers: { 'password': adminPassword }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const tbody = document.getElementById('messagesTableBody');
      tbody.innerHTML = '';
      
      data.messages.forEach(msg => {
        const tr = document.createElement('tr');
        
        const time = new Date(msg.timestamp).toLocaleString();
        
        tr.innerHTML = `
          <td>${time}</td>
          <td>${msg.senderAvatar}</td>
          <td>${msg.senderNickname}</td>
          <td><strong>${msg.senderPhone}</strong></td>
          <td>${msg.roomType}</td>
          <td>${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}</td>
        `;
        
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
}

// Search user by phone
async function searchUser() {
  const phone = document.getElementById('searchPhone').value.trim();
  
  if (phone.length !== 10) {
    alert('Please enter a valid 10-digit phone number');
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/user/${phone}`, {
      headers: { 'password': adminPassword }
    });
    
    const data = await response.json();
    
    if (data.success && data.user) {
      const resultsDiv = document.getElementById('searchResults');
      
      resultsDiv.innerHTML = `
        <div class="user-detail-card">
          <h3>User Information</h3>
          <div class="detail-row">
            <span class="detail-label">Avatar:</span>
            <span class="detail-value">${data.user.avatar}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Nickname:</span>
            <span class="detail-value">${data.user.nickname}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value"><strong>${data.user.phoneNumber}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Year:</span>
            <span class="detail-value">${data.user.year}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Branch:</span>
            <span class="detail-value">${data.user.branch}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Division:</span>
            <span class="detail-value">${data.user.division}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">${data.user.isOnline ? '🟢 Online' : '⚪ Offline'}</span>
          </div>
        </div>
        
        <div class="user-detail-card">
          <h3>Recent Messages (${data.messages.length})</h3>
          <table class="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Room</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              ${data.messages.map(msg => `
                <tr>
                  <td>${new Date(msg.timestamp).toLocaleString()}</td>
                  <td>${msg.roomType}</td>
                  <td>${msg.message}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      document.getElementById('searchResults').innerHTML = `
        <div class="user-detail-card">
          <p>No user found with this phone number.</p>
        </div>
      `;
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Tab switching
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName + 'Tab').classList.add('active');
  
  // Activate button
  event.target.classList.add('active');
}

// Refresh data
function refreshData() {
  fetchStats();
  fetchUsers();
  fetchMessages();
}
// Add these functions to admin.js

async function clearAllMessages() {
  if (!confirm('⚠️ Are you sure? This will delete ALL messages permanently!')) {
    return;
  }
  
  try {
    const response = await fetch('/api/admin/messages/clear-all', {
      method: 'DELETE',
      headers: { 'password': adminPassword }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ ' + data.message);
      fetchMessages();
    } else {
      alert('❌ ' + data.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function clearRoomMessages(roomType) {
  if (!confirm(`Delete all ${roomType} messages?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/messages/clear/${roomType}`, {
      method: 'DELETE',
      headers: { 'password': adminPassword }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ ' + data.message);
      fetchMessages();
    } else {
      alert('❌ ' + data.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function clearOldMessages(days) {
  if (!confirm(`Delete messages older than ${days} days?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/messages/clear-old/${days}`, {
      method: 'DELETE',
      headers: { 'password': adminPassword }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ ' + data.message);
      fetchMessages();
    } else {
      alert('❌ ' + data.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}