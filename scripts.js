document.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authSubmit = document.getElementById('auth-submit');
  const toggleAuthButton = document.getElementById('toggle-auth');
  const emailContainer = document.getElementById('email-container');
  const authContainer = document.getElementById('auth-container');
  const rootContainer = document.getElementById('root');

  let isRegistering = false;
  let user = null;

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
        // Authentication successful, show the app content
        user = data;
        authContainer.classList.remove('active');
        rootContainer.classList.add('active');
        console.log('Success:', data);
        initializeApp();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred, please try again later.');
    }
  });

  function initializeApp() {
    console.log('Initializing App for User:', user.username);
    // Fetch user's vehicles and fuel-ups here
  }

  // Placeholder functions for later usage
  async function fetchVehicles() {
    // Fetch user's vehicles
  }

  async function addVehicle(vehicleData) {
    // Add new vehicle
  }

  async function fetchFuelUps(vehicleId) {
    // Fetch fuel-ups for a specific vehicle
  }

  async function addFuelUp(fuelUpData) {
    // Add a new fuel-up record
  }

  // Example calls for vehicle and fuel-up actions
  // addVehicle({ vin: '123ABC', make: 'Toyota', model: 'Corolla', year: 2020, initialMileage: 10000 });
  // addFuelUp({ vehicleId: 1, mileage: 12000, liters: 40, price: 3.50, gasStation: 'Shell' });
});
