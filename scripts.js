document.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authSubmit = document.getElementById('auth-submit');
  const toggleAuthButton = document.getElementById('toggle-auth');
  const emailContainer = document.getElementById('email-container');
  const googleLoginButton = document.createElement('button');
  googleLoginButton.id = 'google-login';
  googleLoginButton.className = 'google-btn';
  googleLoginButton.innerHTML = `
    <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
    Sign in with Google
  `;
  
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