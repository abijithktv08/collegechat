// ============================================
// FILE: public/js/login.js - FIXED FOR DEPLOYMENT
// ============================================

let currentOTP = '';
let currentPhone = '';

// Auto-detect API URL (works locally AND deployed)
const API_URL = window.location.origin;

console.log('🌐 Using API URL:', API_URL);

// Send OTP to phone number
async function sendOTP() {
  const phoneInput = document.getElementById('phoneInput');
  const phone = phoneInput.value.trim();
  
  if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) {
    showError('Please enter a valid 10-digit phone number');
    return;
  }
  
  try {
    console.log('Sending OTP to:', phone);
    console.log('API endpoint:', `${API_URL}/api/otp/send`);
    
    const response = await fetch(`${API_URL}/api/otp/send`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ phoneNumber: phone })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.success) {
      currentPhone = phone;
      currentOTP = data.otp;
      
      // Show OTP on screen (for testing)
      document.getElementById('otpDisplay').textContent = `Your OTP: ${data.otp}`;
      
      showStep('otpStep');
      showSuccess('OTP sent successfully! Check your phone.');
      
      console.log('✅ OTP sent to', phone, ':', data.otp);
    } else {
      showError(data.message || 'Failed to send OTP');
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    showError(`Cannot connect to server: ${error.message}`);
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
    console.log('API endpoint:', `${API_URL}/api/otp/verify`);
    
    const response = await fetch(`${API_URL}/api/otp/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Verify response data:', data);
    
    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      
      showSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1000);
    } else {
      showError(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    showError(`Network error: ${error.message}`);
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

// Check server connection on page load
window.addEventListener('load', async () => {
  try {
    console.log('🔄 Testing server connection...');
    console.log('API URL:', API_URL);
    
    const response = await fetch(`${API_URL}/api/test`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Server connected successfully');
    }
  } catch (error) {
    console.error('❌ Cannot connect to server:', error);
    showError('Warning: Cannot verify server connection. Try logging in anyway.');
  }
});
