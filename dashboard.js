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
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';
        
        vehicles.forEach(vehicle => {
          const vehicleElement = document.createElement('div');
          vehicleElement.className = 'grid-item';
          vehicleElement.innerHTML = `
            <h3>${vehicle.year} ${vehicle.make} ${vehicle.model}</h3>
            <p><strong>VIN:</strong> ${vehicle.vin}</p>
            <p><strong>Initial Mileage:</strong> ${vehicle.initial_mileage}</p>
            <button class="view-fuel-ups-btn" data-vehicle-id="${vehicle.id}">View Fuel-Ups</button>
          `;
          gridContainer.appendChild(vehicleElement);
      
          vehicleElement.querySelector('.view-fuel-ups-btn').addEventListener('click', () => {
            displayFuelUps(vehicle.id);
          });
        });
        
        container.appendChild(gridContainer);
      
        const addVehicleBtn = document.createElement('button');
        addVehicleBtn.textContent = 'Add Another Vehicle';
        addVehicleBtn.addEventListener('click', showAddVehicleForm);
        addVehicleBtn.style.marginTop = '20px';
        container.appendChild(addVehicleBtn);
      }
      
      async function displayFuelUps(vehicleId) {
        const fuelUps = await fetchFuelUps(vehicleId);
        const fuelUpsContainer = document.createElement('div');
        fuelUpsContainer.id = 'fuel-ups-container';
        rootContainer.appendChild(fuelUpsContainer);
      
        if (fuelUps.length === 0) {
          fuelUpsContainer.innerHTML = `
            <h3>Fuel-Ups</h3>
            <p>No fuel-ups recorded for this vehicle yet.</p>
            <button id="add-fuel-up-btn" data-vehicle-id="${vehicleId}">Add Fuel-Up</button>
          `;
          document.getElementById('add-fuel-up-btn').addEventListener('click', () => showAddFuelUpForm(vehicleId));
        } else {
          // Sort fuel-ups by date in descending order
          fuelUps.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          fuelUpsContainer.innerHTML = '<h3>Fuel-Ups</h3>';
          const fuelUpGrid = document.createElement('div');
          fuelUpGrid.className = 'fuel-up-grid';
          
          let totalLiters = 0;
          let totalDistance = 0;
      
          fuelUps.forEach((fuelUp, index) => {
            const fuelUpElement = document.createElement('div');
            fuelUpElement.className = 'fuel-up-item';
          
            let gasUsage = '';
            let cumulativeLiters = fuelUp.liters;
            let cumulativeDistance = 0;
            let startDate = new Date(fuelUp.date);
          
            // Look for the next full fill-up
            for (let i = index + 1; i < fuelUps.length; i++) {
              const nextFuelUp = fuelUps[i];
              cumulativeDistance = fuelUp.mileage - nextFuelUp.mileage;
              
              if (fuelUp.is_full_tank && nextFuelUp.is_full_tank) {
                const usage = (cumulativeLiters / cumulativeDistance) * 100;
                const endDate = new Date(nextFuelUp.date);
                gasUsage = `
                  <p><strong>Usage:</strong> ${usage.toFixed(3)} L/100km</p>
                  <p><strong>Date Range:</strong> ${endDate.toLocaleDateString()} - ${startDate.toLocaleDateString()}</p>
                  <p><strong>Distance:</strong> ${cumulativeDistance} km</p>
                `;
                break;
              }
              
              cumulativeLiters += nextFuelUp.liters;
            }
          
            fuelUpElement.innerHTML = `
              <p><strong>Date:</strong> ${new Date(fuelUp.date).toLocaleDateString()}</p>
              <p><strong>Mileage:</strong> ${fuelUp.mileage}</p>
              <p><strong>Liters:</strong> ${fuelUp.liters.toFixed(3)}</p>
              <p><strong>Price/L:</strong> $${fuelUp.price_per_liter.toFixed(3)}</p>
              <p><strong>Total:</strong> $${fuelUp.total_cost.toFixed(3)}</p>
              <p><strong>Station:</strong> ${fuelUp.gas_station}</p>
              <p><strong>Full Tank:</strong> ${fuelUp.is_full_tank ? 'Yes' : 'No'}</p>
              ${gasUsage}
            `;
            fuelUpGrid.appendChild(fuelUpElement);
          });
          
          fuelUpsContainer.appendChild(fuelUpGrid);
      
          // Calculate and display average gas usage
          if (fuelUps.length > 1) {
            const averageUsage = (totalLiters / totalDistance) * 100;
            
            const averageElement = document.createElement('div');
            averageElement.innerHTML = `
              <h4>Gas Usage Statistics</h4>
              <p><strong>Overall Average (excluding first fill-up):</strong> ${averageUsage.toFixed(3)} L/100km</p>
            `;
            fuelUpsContainer.appendChild(averageElement);
          }
      
          const addFuelUpBtn = document.createElement('button');
          addFuelUpBtn.textContent = 'Add Fuel-Up';
          addFuelUpBtn.addEventListener('click', () => showAddFuelUpForm(vehicleId));
          addFuelUpBtn.style.marginTop = '20px';
          fuelUpsContainer.appendChild(addFuelUpBtn);
        }
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
          <label>
            <input type="checkbox" id="is_full_tank" checked> Full Tank
          </label>
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