document.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authSubmit = document.getElementById('auth-submit');
  const toggleAuthButton = document.getElementById('toggle-auth');
  const emailContainer = document.getElementById('email-container');

  let isRegistering = false;

  // Check if the user is already logged in
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    window.location.href = 'dashboard.html';
  }

  // Toggle between Login and Register modes
  toggleAuthButton.addEventListener('click', () => {
    isRegistering = !isRegistering;
    authTitle.textContent = isRegistering ? 'Register' : 'Login';
    authSubmit.textContent = isRegistering ? 'Register' : 'Login';
    toggleAuthButton.textContent = isRegistering ? 'Already have an account? Login' : "Don't have an account? Register";

    // Show email field during registration
    emailContainer.style.display = isRegistering ? 'block' : 'none';
  });

  // Form submission handler for Login/Register
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = isRegistering ? document.getElementById('email').value : null;

    const payload = {
      username,
      password,
      email
    };

    try {
      let endpoint = isRegistering ? '/.netlify/functions/register' : '/.netlify/functions/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        const user = {
          id: data.user.id,
          username: data.user.username,
          token: data.token
        };
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Login successful');
        window.location.href = 'dashboard.html';
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred, please try again later.');
    }
  });
});