// ============================================
// FILE: public/js/login.js
// Location: college-chat/public/js/login.js
// Login page logic - OTP and authentication
// ============================================

let currentOTP = '';
let currentPhone = '';

// Send OTP to phone number
async function sendOTP() {
  const phoneInput = document.getElementById('phoneInput');
  const phone = phoneInput.value.trim();
  
  // Validate phone number
  if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) {
    showError('Please enter a valid 10-digit phone number');
    return;
  }
  
  try {
    console.log('Sending OTP to:', phone);
    
    const response = await fetch('http://localhost:3000/api/otp/send', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber: phone })
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.success) {
      currentPhone = phone;
      currentOTP = data.otp; // In production, this won't be sent
      
      // Show OTP on screen (for testing - remove in production)
      document.getElementById('otpDisplay').textContent = `Your OTP: ${data.otp}`;
      
      // Move to OTP step
      showStep('otpStep');
      showSuccess('OTP sent successfully! Check your phone.');
      
      // In production, you won't show OTP
      console.log('OTP sent to', phone, ':', data.otp);
    } else {
      showError(data.message || 'Failed to send OTP');
    }
  } catch (error) {
    console.error('Network error:', error);
    showError('Network error. Make sure server is running on http://localhost:3000');
  }
}

// Verify OTP
async function verifyOTP() {
  const otpInput = document.getElementById('otpInput');
  const otp = otpInput.value.trim();
  
  if (otp.length !== 6 || !/^[0-9]+$/.test(otp)) {
    showError('Please enter a valid 6-digit OTP');
    return;
  }
  
  if (otp !== currentOTP) {
    showError('Invalid OTP. Please try again.');
    return;
  }
  
  // Move to details step
  showStep('detailsStep');
  showSuccess('OTP verified! Please select your details.');
}

// Complete login
async function completeLogin() {
  const year = document.getElementById('yearSelect').value;
  const branch = document.getElementById('branchSelect').value;
  const division = document.getElementById('divisionSelect').value;
  
  if (!year || !branch || !division) {
    showError('Please select all details');
    return;
  }
  
  try {
    console.log('Completing login...');
    
    const response = await fetch('http://localhost:3000/api/otp/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: currentPhone,
        otp: currentOTP,
        year,
        branch,
        division
      })
    });
    
    console.log('Verify response status:', response.status);
    
    const data = await response.json();
    console.log('Verify response data:', data);
    
    if (data.success) {
      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to chat
      showSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1000);
    } else {
      showError(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Network error:', error);
    showError('Network error. Make sure server is running and MongoDB is connected.');
  }
}

// Helper functions
function showStep(stepId) {
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active');
  });
  document.getElementById(stepId).classList.add('active');
}

function backToPhone() {
  showStep('phoneStep');
  document.getElementById('otpInput').value = '';
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  const successDiv = document.getElementById('successMessage');
  successDiv.textContent = message;
  successDiv.style.display = 'block';
  setTimeout(() => {
    successDiv.style.display = 'none';
  }, 3000);
}

// Check if server is running on page load
window.addEventListener('load', async () => {
  try {
    const response = await fetch('http://localhost:3000/api/test');
    const data = await response.json();
    if (data.success) {
      console.log('✅ Server connected successfully');
    }
  } catch (error) {
    console.error('❌ Cannot connect to server. Make sure to run: npm run dev');
    showError('Cannot connect to server. Please start the server first!');
  }
});