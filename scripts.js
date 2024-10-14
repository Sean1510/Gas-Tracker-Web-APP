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

  // Check if the user is already logged in
  user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    authContainer.classList.remove('active');
    rootContainer.classList.add('active');
    initializeApp();
  } else {
    // If user is not logged in, show the auth container
    authContainer.classList.add('active');
    rootContainer.classList.remove('active');
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
        const data = await response.json();
        user = {
          id: data.user.id,
          username: data.user.username,
          token: data.token
        };
        localStorage.setItem('user', JSON.stringify(user));
        authContainer.classList.remove('active');
        rootContainer.classList.add('active');
        console.log('Login successful');
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
    
    const vehiclesContainer = document.createElement('div');
    vehiclesContainer.id = 'vehicles-container';
    rootContainer.appendChild(vehiclesContainer);
  
    fetchVehicles().then(vehicles => {
      if (vehicles.length === 0) {
        displayAddVehiclePrompt(vehiclesContainer);
      } else {
        displayVehicles(vehicles, vehiclesContainer);
      }
    });
  }
  
  async function fetchVehicles() {
    try {
      const response = await fetch('/.netlify/functions/getVehicles', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  }

  function displayAddVehiclePrompt(container) {
    container.innerHTML = `
      <p>You don't have any vehicles yet. Let's add one!</p>
      <button id="add-vehicle-btn">Add Vehicle</button>
    `;
    document.getElementById('add-vehicle-btn').addEventListener('click', showAddVehicleForm);
  }
  
  function displayVehicles(vehicles, container) {
    container.innerHTML = '<h2>Your Vehicles</h2>';
    vehicles.forEach(vehicle => {
      const vehicleElement = document.createElement('div');
      vehicleElement.className = 'vehicle';
      vehicleElement.innerHTML = `
        <h3>${vehicle.year} ${vehicle.make} ${vehicle.model}</h3>
        <p>VIN: ${vehicle.vin}</p>
        <p>Initial Mileage: ${vehicle.initial_mileage}</p>
        <button class="view-fuel-ups-btn" data-vehicle-id="${vehicle.id}">View Fuel-Ups</button>
      `;
      container.appendChild(vehicleElement);
  
      vehicleElement.querySelector('.view-fuel-ups-btn').addEventListener('click', () => {
        displayFuelUps(vehicle.id);
      });
    });
  
    const addVehicleBtn = document.createElement('button');
    addVehicleBtn.textContent = 'Add Another Vehicle';
    addVehicleBtn.addEventListener('click', showAddVehicleForm);
    container.appendChild(addVehicleBtn);
  }
  
  async function displayFuelUps(vehicleId) {
    const fuelUps = await fetchFuelUps(vehicleId);
    const fuelUpsContainer = document.createElement('div');
    fuelUpsContainer.id = 'fuel-ups-container';
    rootContainer.appendChild(fuelUpsContainer);
  
    if (fuelUps.length === 0) {
      fuelUpsContainer.innerHTML = `
        <p>No fuel-ups recorded for this vehicle yet.</p>
        <button id="add-fuel-up-btn" data-vehicle-id="${vehicleId}">Add Fuel-Up</button>
      `;
      document.getElementById('add-fuel-up-btn').addEventListener('click', () => showAddFuelUpForm(vehicleId));
    } else {
      fuelUpsContainer.innerHTML = '<h3>Fuel-Ups</h3>';
      fuelUps.forEach(fuelUp => {
        const fuelUpElement = document.createElement('div');
        fuelUpElement.className = 'fuel-up';
        fuelUpElement.innerHTML = `
          <p>Date: ${new Date(fuelUp.date).toLocaleDateString()}</p>
          <p>Mileage: ${fuelUp.mileage}</p>
          <p>Liters: ${fuelUp.liters}</p>
          <p>Price per Liter: $${fuelUp.price_per_liter.toFixed(3)}</p>
          <p>Total Cost: $${fuelUp.total_cost.toFixed(2)}</p>
          <p>Gas Station: ${fuelUp.gas_station}</p>
        `;
        fuelUpsContainer.appendChild(fuelUpElement);
      });
  
      const addFuelUpBtn = document.createElement('button');
      addFuelUpBtn.textContent = 'Add Fuel-Up';
      addFuelUpBtn.addEventListener('click', () => showAddFuelUpForm(vehicleId));
      fuelUpsContainer.appendChild(addFuelUpBtn);
    }
  }
  
  async function fetchFuelUps(vehicleId) {
    try {
      const response = await fetch(`/.netlify/functions/getFuelUps?vehicleId=${vehicleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch fuel-ups');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching fuel-ups:', error);
      return [];
    }
  }
  
  function showAddVehicleForm() {
    const form = document.createElement('form');
    form.innerHTML = `
      <h3>Add New Vehicle</h3>
      <input type="text" id="vin" placeholder="VIN" required>
      <input type="text" id="make" placeholder="Make" required>
      <input type="text" id="model" placeholder="Model" required>
      <input type="number" id="year" placeholder="Year" required>
      <input type="number" id="initial_mileage" placeholder="Initial Mileage" required>
      <button type="submit">Add Vehicle</button>
    `;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const vehicleData = {
        vin: document.getElementById('vin').value,
        make: document.getElementById('make').value,
        model: document.getElementById('model').value,
        year: parseInt(document.getElementById('year').value),
        initial_mileage: parseInt(document.getElementById('initial_mileage').value)
      };
      
      try {
        const response = await fetch('/.netlify/functions/addVehicle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(vehicleData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to add vehicle');
        }
        
        // Refresh the vehicles list
        initializeApp();
      } catch (error) {
        console.error('Error adding vehicle:', error);
        alert('Failed to add vehicle. Please try again.');
      }
    });
    
    rootContainer.appendChild(form);
  }
  
  function showAddFuelUpForm(vehicleId) {
    const form = document.createElement('form');
    form.innerHTML = `
      <h3>Add Fuel-Up</h3>
      <input type="date" id="date" required>
      <input type="number" id="mileage" placeholder="Mileage" required>
      <input type="number" id="liters" placeholder="Liters" step="0.001" required>
      <input type="number" id="price_per_liter" placeholder="Price per Liter" step="0.001" required>
      <input type="text" id="gas_station" placeholder="Gas Station" required>
      <button type="submit">Add Fuel-Up</button>
    `;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fuelUpData = {
        vehicle_id: vehicleId,
        date: document.getElementById('date').value,
        mileage: parseInt(document.getElementById('mileage').value),
        liters: parseFloat(document.getElementById('liters').value),
        price_per_liter: parseFloat(document.getElementById('price_per_liter').value),
        gas_station: document.getElementById('gas_station').value
      };
      
      // Calculate total_cost
      fuelUpData.total_cost = fuelUpData.liters * fuelUpData.price_per_liter;
      
      try {
        const response = await fetch('/.netlify/functions/addFuelUp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(fuelUpData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to add fuel-up');
        }
        
        // Refresh the fuel-ups list
        displayFuelUps(vehicleId);
      } catch (error) {
        console.error('Error adding fuel-up:', error);
        alert('Failed to add fuel-up. Please try again.');
      }
    });
    
    rootContainer.appendChild(form);
  }
});
