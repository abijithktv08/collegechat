let adminPassword = '';
const API_URL = window.location.origin;
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
    const response = await fetch(`${API_URL}/api/admin/stats`, {
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
  const selectedTab = document.getElementById(tabName + 'Tab');
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Activate button
  if (event && event.target) {
    event.target.classList.add('active');
  }
  
  // Load feedback when feedback tab is clicked
  if (tabName === 'feedback') {
    console.log('Feedback tab clicked, loading...');
    loadFeedback();
  }
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
async function loadFeedback() {
  console.log('🔄 Loading feedback...');
  
  if (!adminPassword) {
    console.error('❌ Not logged in');
    return;
  }
  
  try {
    const response = await fetch(`${window.location.origin}/api/feedback/all`, {
      headers: { 'password': adminPassword }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Failed:', data.message);
      const tbody = document.getElementById('feedbackTable');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:red;">Error: ${data.message}</td></tr>`;
      }
      return;
    }
    
    const feedbacks = data.feedbacks || [];
    const tbody = document.getElementById('feedbackTable');
    
    if (!tbody) {
      console.error('❌ feedbackTable not found');
      return;
    }
    
    // Update stats
    document.getElementById('totalFeedback').textContent = feedbacks.length;
    document.getElementById('newFeedback').textContent = feedbacks.filter(f => f.status === 'new').length;
    document.getElementById('resolvedFeedback').textContent = feedbacks.filter(f => f.status === 'resolved').length;
    
    tbody.innerHTML = '';
    
    if (feedbacks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px;">No feedback yet</td></tr>';
      return;
    }
    
    feedbacks.forEach(f => {
      const date = new Date(f.createdAt).toLocaleString();
      const icons = { bug: '🐛', feature: '✨', improvement: '📈', other: '💭' };
      const statusColors = { new: '#ff9800', reviewed: '#2196f3', resolved: '#4caf50' };
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="white-space:nowrap;">${date}</td>
        <td>${f.userAvatar || '👤'} ${f.userNickname || 'Anonymous'}</td>
        <td><strong>${f.userPhone || 'N/A'}</strong></td>
        <td>${icons[f.feedbackType]} ${f.feedbackType}</td>
        <td style="max-width:300px;">${f.message}</td>
        <td>
          <span style="color:${statusColors[f.status]}; font-weight:600;">
            ${f.status.toUpperCase()}
          </span>
        </td>
        <td>
          <select id="status-${f._id}" onchange="handleStatusChange('${f._id}')" style="padding:5px; border-radius:5px; border:1px solid #ddd;">
            <option value="new" ${f.status === 'new' ? 'selected' : ''}>New</option>
            <option value="reviewed" ${f.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
            <option value="resolved" ${f.status === 'resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    console.log('✅ Loaded', feedbacks.length, 'feedbacks');
    
  } catch (error) {
    console.error('❌ Error:', error);
    const tbody = document.getElementById('feedbackTable');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:red;">Error loading</td></tr>`;
    }
  }
}

function handleStatusChange(feedbackId) {
  const selectElement = document.getElementById(`status-${feedbackId}`);
  if (!selectElement) {
    console.error('Select element not found');
    return;
  }
  
  const newStatus = selectElement.value;
  console.log('Changing status to:', newStatus);
  
  updateFeedbackStatus(feedbackId, newStatus);
}

async function updateFeedbackStatus(id, status) {
  console.log('Updating feedback:', id, 'to', status);
  
  if (!adminPassword) {
    alert('❌ Please login first!');
    return;
  }
  
  try {
    const response = await fetch(`${window.location.origin}/api/feedback/${id}/status`, {
      method: 'PUT',
      headers: {
        'password': adminPassword,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ Status updated to: ' + status.toUpperCase());
      loadFeedback();
    } else {
      alert('❌ Failed: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Network error');
  }
}