import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Vehicle } from '../server/models/schema'; // Path to .ts file relative to script location
import connectDB from '../server/db'; // Path to .ts file relative to script location

dotenv.config({ path: '../.env' }); // Path to .env from script location

const vehiclesToSeed = [
  {
    name: 'Mercedes VIP Sprinter',
    make: 'Mercedes-Benz',
    model: 'Sprinter VIP',
    year: 2024, 
    description: 'Ultimate luxury and comfort with the VIP1 Limo Sprinter. Perfect for special occasions and executive travel.',
    capacity: 12, 
    pricePerHour: 150, 
    features: ['Plush leather seating', 'Ambient lighting', 'Privacy partition', 'Premium sound system', 'Bar area', 'Smart TV'],
    imageUrls: ['/exec-image-2.png', '/limo.png'],
    licensePlate: 'VIPLIMO1',
    vin: 'VINLIMO1SPRINTERXYZ',
    status: 'active',
  },
  {
    name: 'Mercedes Sprinter Limo',
    make: 'Mercedes-Benz',
    model: 'Sprinter Limo',
    year: 2023, 
    description: 'Sophisticated and spacious, the VIP2 Executive Sprinter is ideal for corporate clients and group travel.',
    capacity: 12, 
    pricePerHour: 140, 
    features: ['Comfortable captain chairs', 'Workstations', 'On-board WiFi', 'Luggage space', 'Refreshments'],
    imageUrls: ['/exec-image-1.png', '/limo.png'],
    licensePlate: 'VIPEXEC2',
    vin: 'VINEXEC2SPRINTERXYZ',
    status: 'active',
  }
];

async function seedVehicles() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in .env file. Please ensure it is configured.');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('MongoDB Connected for seeding...');

    for (const vehicleData of vehiclesToSeed) {
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
