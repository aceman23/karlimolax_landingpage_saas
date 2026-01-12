require('dotenv').config({ path: './.env' }); // Path for running from project root
const mongoose = require('mongoose');
// Adjust to your compiled JS output directory if not directly in server/
const { Vehicle } = require('./dist/server/models/schema.js'); 
const connectDB = require('./dist/server/db.js');

const vehiclesToSeed = [
  {
    name: 'Mercedes Limo Sprinter (VIP1)',
    make: 'Mercedes-Benz',
    model: 'Sprinter Limo',
    year: 2023, // Example year
    description: 'Ultimate luxury and comfort with the VIP1 Limo Sprinter. Perfect for special occasions and executive travel.',
    capacity: 10, // Example capacity
    pricePerHour: 150, // Example price
    features: ['Plush leather seating', 'Ambient lighting', 'Privacy partition', 'Premium sound system', 'Bar area', 'Smart TV'],
    imageUrls: ['/placeholder-limo-sprinter.jpg'], // Placeholder image URL
    licensePlate: 'VIPLIMO1', // Example, ensure uniqueness
    vin: 'VINLIMO1SPRINTERXYZ', // Example, ensure uniqueness
    status: 'active',
  },
  {
    name: 'Mercedes Executive Sprinter (VIP2)',
    make: 'Mercedes-Benz',
    model: 'Sprinter Executive',
    year: 2023, // Example year
    description: 'Sophisticated and spacious, the VIP2 Executive Sprinter is ideal for corporate clients and group travel.',
    capacity: 12, // Example capacity
    pricePerHour: 140, // Example price
    features: ['Comfortable captain chairs', 'Workstations', 'On-board WiFi', 'Luggage space', 'Refreshments'],
    imageUrls: ['/placeholder-exec-sprinter.jpg'], // Placeholder image URL
    licensePlate: 'VIPEXEC2', // Example, ensure uniqueness
    vin: 'VINEXEC2SPRINTERXYZ', // Example, ensure uniqueness
    status: 'active',
  }
];

async function seedVehicles() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found in .env file. Please ensure it is configured.');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('MongoDB Connected for seeding...');

    // Optional: Clear existing vehicles if you want a fresh seed
    // await Vehicle.deleteMany({});
    // console.log('Existing vehicles cleared.');

    for (const vehicleData of vehiclesToSeed) {
      // Check if vehicle with the same VIN or license plate already exists
      const existingByVin = await Vehicle.findOne({ vin: vehicleData.vin });
      const existingByPlate = await Vehicle.findOne({ licensePlate: vehicleData.licensePlate });

      if (existingByVin) {
        console.log(`Vehicle with VIN ${vehicleData.vin} already exists. Skipping.`);
        continue;
      }
      if (existingByPlate) {
        console.log(`Vehicle with License Plate ${vehicleData.licensePlate} already exists. Skipping.`);
        continue;
      }

      const vehicle = new Vehicle(vehicleData);
      await vehicle.save();
      console.log(`Vehicle '${vehicle.name}' seeded successfully.`);
    }

    console.log('Vehicle seeding complete.');
  } catch (error) {
    console.error('Error seeding vehicles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
}

seedVehicles(); 