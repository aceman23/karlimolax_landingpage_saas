require('dotenv').config();
const mongoose = require('mongoose');
const { Vehicle } = require('../server/models/schema.js');
const connectDB = require('../server/db.js');

async function updateVehicleImages() {
  try {
    await connectDB();
    console.log('MongoDB Connected for updating vehicle images...');

    // Find all vehicles
    const vehicles = await Vehicle.find({});
    console.log(`Found ${vehicles.length} vehicles to update`);

    // Update each vehicle
    for (const vehicle of vehicles) {
      // If the vehicle has imageUrls array, take the first image as imageUrl
      if (vehicle.imageUrls && vehicle.imageUrls.length > 0) {
        vehicle.imageUrl = vehicle.imageUrls[0];
        // Remove the imageUrls field
        vehicle.imageUrls = undefined;
        await vehicle.save();
        console.log(`Updated vehicle ${vehicle.name} with imageUrl: ${vehicle.imageUrl}`);
      }
    }

    console.log('Vehicle image updates complete.');
  } catch (error) {
    console.error('Error updating vehicle images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
}

// Run the update
updateVehicleImages().catch(console.error); 