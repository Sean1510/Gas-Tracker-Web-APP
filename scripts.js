import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

const API_BASE_URL = '/.netlify/functions';

const GasTracker = () => {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [fuelUps, setFuelUps] = useState([]);
  const [newFuelUp, setNewFuelUp] = useState({ mileage: '', liters: '', price: '', gasStation: '' });
  const [newVehicle, setNewVehicle] = useState({ vin: '', make: '', model: '', year: '', initialMileage: '' });

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  useEffect(() => {
    if (selectedVehicle) {
      fetchFuelUps();
    }
  }, [selectedVehicle]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getUser`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getVehicles`);
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchFuelUps = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getFuelUps?vehicleId=${selectedVehicle.id}`);
      setFuelUps(response.data);
    } catch (error) {
      console.error('Error fetching fuel-ups:', error);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/addVehicle`, newVehicle);
      setVehicles([...vehicles, response.data]);
      setNewVehicle({ vin: '', make: '', model: '', year: '', initialMileage: '' });
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  };

  const handleAddFuelUp = async (e) => {
    e.preventDefault();
    try {
      const fuelUpData = {
        ...newFuelUp,
        vehicleId: selectedVehicle.id,
        totalCost: newFuelUp.liters * newFuelUp.price
      };
      const response = await axios.post(`${API_BASE_URL}/addFuelUp`, fuelUpData);
      setFuelUps([...fuelUps, response.data]);
      setNewFuelUp({ mileage: '', liters: '', price: '', gasStation: '' });
    } catch (error) {
      console.error('Error adding fuel-up:', error);
    }
  };

  const calculateMPG = () => {
    if (fuelUps.length < 2) return null;
    const totalDistance = fuelUps[fuelUps.length - 1].mileage - fuelUps[0].mileage;
    const totalLiters = fuelUps.reduce((sum, fuelUp) => sum + fuelUp.liters, 0);
    const mpg = (totalDistance / totalLiters) * 3.78541; // Convert L/100km to MPG
    return mpg.toFixed(2);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Gas Usage and Price Tracker</h1>

      {!user ? (
        <p>Loading user data...</p>
      ) : (
        <>
          <h2>Welcome, {user.username}!</h2>

          <h3>Your Vehicles</h3>
          <select onChange={(e) => setSelectedVehicle(vehicles.find(v => v.id === parseInt(e.target.value)))}>
            <option value="">Select a vehicle</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.vin})
              </option>
            ))}
          </select>

          <h3>Add New Vehicle</h3>
          <form onSubmit={handleAddVehicle}>
            <input
              type="text"
              value={newVehicle.vin}
              onChange={(e) => setNewVehicle({...newVehicle, vin: e.target.value})}
              placeholder="VIN"
              required
            />
            <input
              type="text"
              value={newVehicle.make}
              onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
              placeholder="Make"
              required
            />
            <input
              type="text"
              value={newVehicle.model}
              onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
              placeholder="Model"
              required
            />
            <input
              type="number"
              value={newVehicle.year}
              onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
              placeholder="Year"
              required
            />
            <input
              type="number"
              value={newVehicle.initialMileage}
              onChange={(e) => setNewVehicle({...newVehicle, initialMileage: e.target.value})}
              placeholder="Initial Mileage"
              required
            />
            <button type="submit">Add Vehicle</button>
          </form>

          {selectedVehicle && (
            <>
              <h3>Add Fuel-Up for {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</h3>
              <form onSubmit={handleAddFuelUp}>
                <input
                  type="number"
                  value={newFuelUp.mileage}
                  onChange={(e) => setNewFuelUp({...newFuelUp, mileage: e.target.value})}
                  placeholder="Current Mileage"
                  required
                />
                <input
                  type="number"
                  value={newFuelUp.liters}
                  onChange={(e) => setNewFuelUp({...newFuelUp, liters: e.target.value})}
                  placeholder="Liters"
                  required
                />
                <input
                  type="number"
                  value={newFuelUp.price}
                  onChange={(e) => setNewFuelUp({...newFuelUp, price: e.target.value})}
                  placeholder="Price per Liter"
                  required
                />
                <input
                  type="text"
                  value={newFuelUp.gasStation}
                  onChange={(e) => setNewFuelUp({...newFuelUp, gasStation: e.target.value})}
                  placeholder="Gas Station"
                  required
                />
                <button type="submit">Add Fuel-Up</button>
              </form>

              <h3>Fuel-Up History</h3>
              <ul>
                {fuelUps.map((fuelUp) => (
                  <li key={fuelUp.id}>
                    Date: {new Date(fuelUp.date).toLocaleDateString()} -
                    Mileage: {fuelUp.mileage} -
                    Liters: {fuelUp.liters} -
                    Price/L: ${fuelUp.price_per_liter.toFixed(2)} -
                    Total: ${fuelUp.total_cost.toFixed(2)} -
                    Station: {fuelUp.gas_station}
                  </li>
                ))}
              </ul>
              <p>Average MPG: {calculateMPG()}</p>
            </>
          )}
        </>
      )}
    </div>
  );
};

ReactDOM.render(<GasTracker />, document.getElementById('root'));
