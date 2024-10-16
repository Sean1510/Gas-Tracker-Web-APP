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
      
          let totalLiters = 0;
      
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
                <td>${new Date(fuelUp.date).toLocaleDateString()}</td>
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
            const firstFuelUp = fuelUps[fuelUps.length - 1];
            const lastFullTankIndex = fuelUps.findIndex(fuelUp => fuelUp.is_full_tank);
            
            for (let i = lastFullTankIndex; i < fuelUps.length - 1; i++) {
              totalLiters += fuelUps[i].liters;
            }
            
            const totalDistance = fuelUps[lastFullTankIndex].mileage - firstFuelUp.mileage;
            const averageUsage = (totalLiters / totalDistance) * 100;
            
            tableHTML += `
              <div class="statistics-summary">
                <h4>Overall Statistics</h4>
                <p>Average Consumption: ${averageUsage.toFixed(2)} L/100km</p>
                <p>Total Distance: ${totalDistance.toLocaleString()} km</p>
                <p>Total Fuel: ${totalLiters.toFixed(2)} L</p>
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
          // Check if it's the first fuel-up
          const fuelUps = await fetchFuelUps(vehicleId);
          if (fuelUps.length === 0 && !document.getElementById('is_full_tank').checked) {
            alert("To make sure the accuracy of your gas usage calculations, your first fill-up must be full. Please add next time.");
            return; // Prevent submission
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