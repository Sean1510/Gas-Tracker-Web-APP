document.addEventListener('DOMContentLoaded', () => {
  const rootContainer = document.getElementById('root');
  const logoutBtn = document.getElementById('logout-btn');
  let user = null;

  // Check if the user is logged in
  user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = 'index.html';
  } else {
    initializeApp();
  }

  logoutBtn.addEventListener('click', logout);

  function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }
  
  function initializeApp() {
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
      
  async function displayVehicles(vehicles, container) {
    container.innerHTML = `
      <div class="vehicles-header">
        <h2>Your Vehicles</h2>
        <button id="add-vehicle-btn" class="btn btn-primary">
            <span class="plus-icon">+</span> Add Vehicle
        </button>
      </div>
    `;
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'vehicles-grid';
    
    vehicles.forEach(async vehicle => {
      const vehicleCard = document.createElement('div');
      vehicleCard.className = 'vehicle-card';
      
      // Calculate a random gradient for the card header
      const gradients = [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #2193b0, #6dd5ed)',
        'linear-gradient(135deg, #ee9ca7, #ffdde1)',
        'linear-gradient(135deg, #42275a, #734b6d)',
        'linear-gradient(135deg, #bdc3c7, #2c3e50)'
      ];
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

      // Fetch latest mileage from fuel-ups
      const latestMileage = await fetchLatestFuelUp(vehicle.id);
      const currentMileage = latestMileage !== null ? latestMileage : vehicle.current_mileage;
      
      vehicleCard.innerHTML = `
        <div class="vehicle-card-header" style="background: ${randomGradient}">
          <div class="vehicle-icon">🚗</div>
          <h3>${vehicle.year} ${vehicle.make}</h3>
          <p class="vehicle-model">${vehicle.model}</p>
        </div>
        <div class="vehicle-card-body">
          <div class="vehicle-info">
            <div class="info-item">
              <span class="info-label">VIN</span>
              <span class="info-value">${vehicle.vin}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Current Mileage</span>
              <span class="info-value">${currentMileage.toLocaleString()} km</span>
            </div>
          </div>
          <button class="btn btn-secondary view-fuel-ups-btn" data-vehicle-id="${vehicle.id}">
            View Fuel History
          </button>
        </div>
      `;
      
      gridContainer.appendChild(vehicleCard);
      
      vehicleCard.querySelector('.view-fuel-ups-btn').addEventListener('click', () => {
        document.querySelectorAll('.vehicle-card').forEach(card => {
          card.classList.remove('active');
        });
        vehicleCard.classList.add('active');
        displayFuelUps(vehicle.id);
      });
    });
    
    container.appendChild(gridContainer);
    
    document.getElementById('add-vehicle-btn').addEventListener('click', showAddVehicleForm);
  }

  function displayAddVehiclePrompt(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🚗</div>
        <h3>Welcome to Your Vehicle Tracker!</h3>
        <p>You don't have any vehicles yet. Let's add your first one!</p>
        <button id="add-vehicle-btn" class="primary-button">
          <span class="plus-icon">+</span> Add Your First Vehicle
        </button>
      </div>
    `;
    
    document.getElementById('add-vehicle-btn').addEventListener('click', showAddVehicleForm);
  }
      
  function displayFuelUps(vehicleId) {
    fetchFuelUps(vehicleId).then(fuelUps => {
      const fuelUpsContainer = document.createElement('div');
      fuelUpsContainer.id = 'fuel-ups-container';
      fuelUpsContainer.className = 'fuel-ups-wrapper';
      rootContainer.appendChild(fuelUpsContainer);
  
      if (fuelUps.length === 0) {
        fuelUpsContainer.innerHTML = `
          <h3>Fuel-Ups</h3>
          <p>No fuel-ups recorded for this vehicle yet.</p>
          <button id="add-fuel-up-btn" data-vehicle-id="${vehicleId}">Add Fuel-Up</button>
        `;
        document.getElementById('add-fuel-up-btn').addEventListener('click', () => showAddFuelUpForm(vehicleId));
        return;
      }
  
      // Sort fuel-ups by date in descending order
      fuelUps.sort((a, b) => new Date(b.date) - new Date(a.date));
  
      let tableHTML = `
        <h3>Fuel-Ups History</h3>
        <div class="table-responsive">
          <table class="fuel-ups-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Mileage</th>
                <th>Liters</th>
                <th>Price/L</th>
                <th>Total</th>
                <th>Station</th>
                <th>Full Tank</th>
                <th>Usage (L/100km)</th>
              </tr>
            </thead>
            <tbody>
      `;
  
      fuelUps.forEach((fuelUp, index) => {
        let gasUsage = '-';
        let cumulativeLiters = fuelUp.liters;
        let cumulativeDistance = 0;
  
        // Calculate gas usage between full tank fill-ups
        for (let i = index + 1; i < fuelUps.length; i++) {
          const nextFuelUp = fuelUps[i];
          cumulativeDistance = fuelUp.mileage - nextFuelUp.mileage;
          
          if (fuelUp.is_full_tank && nextFuelUp.is_full_tank) {
            gasUsage = ((cumulativeLiters / cumulativeDistance) * 100).toFixed(2);
            break;
          }
          cumulativeLiters += nextFuelUp.liters;
        }
  
        tableHTML += `
          <tr>
            <td>${new Date(fuelUp.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
            <td>${fuelUp.mileage.toLocaleString()}</td>
            <td>${fuelUp.liters.toFixed(3)}</td>
            <td>$${fuelUp.price_per_liter.toFixed(3)}</td>
            <td>$${fuelUp.total_cost.toFixed(2)}</td>
            <td>${fuelUp.gas_station}</td>
            <td>${fuelUp.is_full_tank ? '✓' : '✗'}</td>
            <td>${gasUsage}</td>
          </tr>
        `;
      });
  
      tableHTML += `
            </tbody>
          </table>
        </div>
      `;
  
      // Calculate overall statistics
      if (fuelUps.length > 1) {
        let totalLiters = 0;
        let totalCost = 0;
        const firstFuelUp = fuelUps[fuelUps.length - 1];
        const lastFullTankIndex = fuelUps.findIndex(fuelUp => fuelUp.is_full_tank);
        
        for (let i = lastFullTankIndex; i < fuelUps.length - 1; i++) {
          totalLiters += fuelUps[i].liters;
          totalCost += fuelUps[i].total_cost;
        }
        
        const totalDistance = fuelUps[lastFullTankIndex].mileage - firstFuelUp.mileage;
        const averageUsage = (totalLiters / totalDistance) * 100;
        const averageCost = totalCost / totalLiters;
        const costperkm = totalCost / totalDistance;

        tableHTML += `
          <div class="statistics-summary">
            <h4>Overall Statistics</h4>
            <div class="statistics-grid">
              <div class="statistic-card">
                <h5>Average Consumption</h5>
                <p class="statistic-value">${averageUsage.toFixed(2)} L/100km</p>
              </div>
              <div class="statistic-card">
                <h5>Average Cost per Liter</h5>
                <p class="statistic-value">$${averageCost.toFixed(2)}</p>
              </div>
              <div class="statistic-card">
                <h5>Total Distance</h5>
                <p class="statistic-value">${totalDistance.toLocaleString()} km</p>
              </div>
              <div class="statistic-card">
                <h5>Total Fuel</h5>
                <p class="statistic-value">${totalLiters.toFixed(2)} L</p>
              </div>
              <div class="statistic-card">
                <h5>Total Cost</h5>
                <p class="statistic-value">$${totalCost.toFixed(2)}</p>
              </div>
              <div class="statistic-card">
                <h5>Cost per km</h5>
                <p class="statistic-value">$${costperkm.toFixed(2)}</p>
              </div>
            </div>
          </div>
        `;
      }
  
      // Add button
      tableHTML += `
        <button id="add-fuel-up-btn" data-vehicle-id="${vehicleId}">Add Fuel-Up</button>
      `;
  
      fuelUpsContainer.innerHTML = tableHTML;
      document.getElementById('add-fuel-up-btn').addEventListener('click', () => showAddFuelUpForm(vehicleId));
    });
  }
      
  async function fetchFuelUps(vehicleId) {
    console.log('Fetching fuel-ups for vehicle:', vehicleId);
    try {
      const response = await fetch(`/.netlify/functions/getFuelUps?vehicleId=${vehicleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch fuel-ups');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching fuel-ups:', error);
      return [];
    }
  }

  async function fetchLatestFuelUp(vehicleId) {
    try {
      const fuelUps = await fetchFuelUps(vehicleId);
      if (fuelUps.length === 0) {
          return null; // No fuel-ups available
      }
      // Sort fuel-ups by date and return the latest mileage
      fuelUps.sort((a, b) => new Date(b.date) - new Date(a.date));
      return fuelUps[0].mileage;
    } catch (error) {
      console.error('Error fetching latest fuel-up:', error);
      return null;
    }
  }
      
  function showAddVehicleForm() {
    const formHTML = `
      <div class="modal" id="addVehicleModal">
        <div class="modal-content">
          <h3>Add New Vehicle</h3>
          <form id="addVehicleForm" class="form">
            <div class="form-group">
              <label for="vin">VIN</label>
              <input type="text" id="vin" required>
            </div>
            <div class="form-group">
              <label for="make">Make</label>
              <input type="text" id="make" required>
            </div>
            <div class="form-group">
              <label for="model">Model</label>
              <input type="text" id="model" required>
            </div>
            <div class="form-group">
              <label for="year">Year</label>
              <input type="number" id="year" required>
            </div>
            <div class="form-group">
              <label for="current_mileage">Current Mileage</label>
              <input type="number" id="current_mileage">
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Add Vehicle</button>
              <button type="button" class="btn btn-secondary" id="cancelAddVehicle">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  
    document.body.insertAdjacentHTML('beforeend', formHTML);
  
    const modal = document.getElementById('addVehicleModal');
    const form = document.getElementById('addVehicleForm');
    const cancelButton = document.getElementById('cancelAddVehicle');
  
    modal.style.display = 'block';
  
    cancelButton.addEventListener('click', () => {
      modal.remove();
    });
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const vehicleData = {
        vin: document.getElementById('vin').value,
        make: document.getElementById('make').value,
        model: document.getElementById('model').value,
        year: parseInt(document.getElementById('year').value),
        current_mileage: parseInt(document.getElementById('current_mileage').value)
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
        
        modal.remove();
        showNotification('Vehicle added successfully', 'success');
        initializeApp(); // Refresh the vehicles list
      } catch (error) {
        console.error('Error adding vehicle:', error);
        showNotification('Failed to add vehicle. Please try again.', 'error');
      }
    });
  }
      
  function showAddFuelUpForm(vehicleId) {
    const formHTML = `
      <div class="modal" id="addFuelUpModal">
        <div class="modal-content">
          <h3>Add Fuel-Up</h3>
          <form id="addFuelUpForm" class="form">
            <div class="form-group">
              <label for="date">Date</label>
              <input type="date" id="date" required>
            </div>
            <div class="form-group">
              <label for="mileage">Mileage</label>
              <input type="number" id="mileage" required>
            </div>
            <div class="form-group">
              <label for="liters">Liters</label>
              <input type="number" id="liters" step="0.001" required>
            </div>
            <div class="form-group">
              <label for="price_per_liter">Price per Liter</label>
              <input type="number" id="price_per_liter" step="0.001" required>
            </div>
            <div class="form-group">
              <label for="gas_station">Gas Station</label>
              <input type="text" id="gas_station" required>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="is_full_tank" checked>
                Full Tank
              </label>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Add Fuel-Up</button>
              <button type="button" class="btn btn-secondary" id="cancelAddFuelUp">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
  
    document.body.insertAdjacentHTML('beforeend', formHTML);
  
    const modal = document.getElementById('addFuelUpModal');
    const form = document.getElementById('addFuelUpForm');
    const cancelButton = document.getElementById('cancelAddFuelUp');
  
    modal.style.display = 'block';
  
    cancelButton.addEventListener('click', () => {
      modal.remove();
    });
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Check if it's the first fuel-up
      const fuelUps = await fetchFuelUps(vehicleId);
      if (fuelUps.length === 0 && !document.getElementById('is_full_tank').checked) {
        showNotification("To ensure accuracy of your gas usage calculations, your first fill-up must be full. Please try again.", 'error');
        return;
      }
  
      const fuelUpData = {
        vehicle_id: vehicleId,
        date: document.getElementById('date').value,
        mileage: parseInt(document.getElementById('mileage').value),
        liters: parseFloat(document.getElementById('liters').value),
        price_per_liter: parseFloat(document.getElementById('price_per_liter').value),
        gas_station: document.getElementById('gas_station').value,
        is_full_tank: document.getElementById('is_full_tank').checked
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
        
        modal.remove();
        showNotification('Fuel-up added successfully', 'success');
        displayFuelUps(vehicleId); // Refresh the fuel-ups list
      } catch (error) {
        console.error('Error adding fuel-up:', error);
        showNotification('Failed to add fuel-up. Please try again.', 'error');
      }
    });
  }

  // Add this helper function for notifications
  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }             
});