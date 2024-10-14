document.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authSubmit = document.getElementById('auth-submit');
  const toggleAuthButton = document.getElementById('toggle-auth');
  const authContainer = document.getElementById('auth-container');
  const rootContainer = document.getElementById('root');

  let isRegistering = false;
  let user = null;

  toggleAuthButton.addEventListener('click', () => {
    isRegistering = !isRegistering;
    authTitle.textContent = isRegistering ? 'Register' : 'Login';
    authSubmit.textContent = isRegistering ? 'Register' : 'Login';
    toggleAuthButton.textContent = isRegistering ? 'Already have an account? Login' : "Don't have an account? Register";
  });

  // Authentication (Login/Register) Form Submission
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

  // Placeholder for initialization after login/register
  function initializeApp() {
    console.log('Initializing App for User:', user.username);
    // Fetch user's vehicles and fuel-ups
    fetchVehicles();
  }

  // Fetch vehicles for the logged-in user
  async function fetchVehicles() {
    try {
      const response = await fetch('/.netlify/functions/getVehicles', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const vehicles = await response.json();
      displayVehicles(vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  }

  // Display vehicles (dummy function)
  function displayVehicles(vehicles) {
    console.log('Displaying vehicles:', vehicles);
    // Implement UI logic to show the user's vehicles here
  }

  // Add new vehicle for the user
  async function addVehicle(vehicleData) {
    try {
      const response = await fetch('/.netlify/functions/addVehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData)
      });
      const newVehicle = await response.json();
      console.log('Vehicle added:', newVehicle);
      fetchVehicles();
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  }

  // Fetch fuel-ups for a specific vehicle
  async function fetchFuelUps(vehicleId) {
    try {
      const response = await fetch(`/.netlify/functions/getFuelUps?vehicleId=${vehicleId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const fuelUps = await response.json();
      displayFuelUps(fuelUps);
    } catch (error) {
      console.error('Error fetching fuel-ups:', error);
    }
  }

  // Display fuel-ups (dummy function)
  function displayFuelUps(fuelUps) {
    console.log('Displaying fuel-ups:', fuelUps);
    // Implement UI logic to show the user's fuel-up history here
  }

  // Add new fuel-up for the selected vehicle
  async function addFuelUp(fuelUpData) {
    try {
      const response = await fetch('/.netlify/functions/addFuelUp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fuelUpData)
      });
      const newFuelUp = await response.json();
      console.log('Fuel-up added:', newFuelUp);
      fetchFuelUps(fuelUpData.vehicleId);
    } catch (error) {
      console.error('Error adding fuel-up:', error);
    }
  }

  // Example function calls (you would trigger these with form submissions or buttons in your UI):
  // Example: addVehicle({ vin: '123ABC', make: 'Toyota', model: 'Corolla', year: 2020, initialMileage: 10000 });
  // Example: addFuelUp({ vehicleId: 1, mileage: 12000, liters: 40, price: 3.50, gasStation: 'Shell' });

});
