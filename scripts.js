document.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authSubmit = document.getElementById('auth-submit');
  const toggleAuthButton = document.getElementById('toggle-auth');
  const emailContainer = document.getElementById('email-container');
  const googleLoginButton = document.createElement('button');
  googleLoginButton.id = 'google-login';
  googleLoginButton.className = 'google-btn';
  googleLoginButton.innerHTML = '<img src="google-icon.png" alt="Google"> Sign in with Google';
  
  // Insert Google button after the form
  authForm.insertAdjacentElement('afterend', googleLoginButton);

  let isRegistering = false;

  // Check if the user is already logged in
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
      window.location.href = 'dashboard.html';
  }

  // Toggle between Login and Register modes
  toggleAuthButton.addEventListener('click', (e) => {
      e.preventDefault();
      isRegistering = !isRegistering;
      authTitle.textContent = isRegistering ? 'Create Account' : 'Welcome Back';
      authSubmit.textContent = isRegistering ? 'Register' : 'Sign In';
      toggleAuthButton.textContent = isRegistering ? 'Already have an account? Login' : "Don't have an account? Register";
      emailContainer.style.display = isRegistering ? 'block' : 'none';
  });

  // Form submission handler for Login/Register
  authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const email = isRegistering ? document.getElementById('email').value : null;
      const payload = { username, password, email };

      try {
          let endpoint = isRegistering ? '/.netlify/functions/register' : '/.netlify/functions/login';
          const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          const data = await response.json();

          if (response.ok) {
              const user = { id: data.user.id, username: data.user.username, token: data.token };
              localStorage.setItem('user', JSON.stringify(user));
              window.location.href = 'dashboard.html';
          } else {
              showNotification(data.message, 'error');
          }
      } catch (error) {
          console.error('Error:', error);
          showNotification('An error occurred, please try again later.', 'error');
      }
  });

  // Add Google login handler
  googleLoginButton.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      // Get Google auth URL from backend
      const response = await fetch('/.netlify/functions/get-google-auth-url');
      const { url } = await response.json();
      
      // Redirect to Google login
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      showNotification('Failed to initialize Google login', 'error');
    }
  });

  // Check for Google auth callback
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    handleGoogleCallback(code);
  }

  async function handleGoogleCallback(code) {
    try {
      const response = await fetch('/.netlify/functions/verify-google-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (response.ok) {
        const user = { 
          id: data.user.id, 
          username: data.user.username, 
          token: data.token,
          isGoogleUser: true
        };
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = 'dashboard.html';
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Google authentication failed', 'error');
    }
  }

  function showNotification(message, type) {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
  }
});