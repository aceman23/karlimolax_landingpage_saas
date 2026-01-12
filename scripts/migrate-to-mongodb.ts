import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb';
import {
  Profile,
  Vehicle,
  ServicePackage,
  AdminSettings
} from '../src/models/schema';
import dotenv from 'dotenv';

dotenv.config();

async function initializeData() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Initialize sample profiles
    const profiles = [
      {
        email: 'admin@dapperlax.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+13105557890'
      },
      {
        email: 'driver1@dapperlax.com',
        firstName: 'Michael',
        lastName: 'Johnson',
        role: 'driver',
        phone: '+12135551234'
      },
      {
        email: 'driver2@dapperlax.com',
        firstName: 'Sarah',
        lastName: 'Thompson',
        role: 'driver',
        phone: '+13105555678'
      }
    ];

    for (const profile of profiles) {
      await Profile.create(profile);
    }
    console.log(`Created ${profiles.length} profiles`);

    // Initialize sample vehicles
    const vehicles = [
      {
        name: 'Luxury Sedan',
        type: 'sedan',
        capacity: 4,
        status: 'available',
        licensePlate: 'LAX1234',
        year: 2024,
        make: 'Mercedes-Benz',
        model: 'S-Class',
        color: 'Black',
        features: ['Leather Seats', 'WiFi', 'Premium Sound'],
        images: ['sedan1.jpg', 'sedan2.jpg'],
        basePrice: 150
      },
      {
        name: 'Executive SUV',
        type: 'suv',
        capacity: 6,
        status: 'available',
        licensePlate: 'LAX5678',
        year: 2024,
        make: 'BMW',
        model: 'X7',
        color: 'White',
        features: ['Third Row Seating', 'Panoramic Roof', 'Entertainment System'],
        images: ['suv1.jpg', 'suv2.jpg'],
        basePrice: 200
      }
    ];

    for (const vehicle of vehicles) {
      await Vehicle.create(vehicle);
    }
    console.log(`Created ${vehicles.length} vehicles`);

    // Initialize sample service packages
    const packages = [
      {
        name: 'Airport Transfer',
        description: 'Luxury airport transfer service',
        duration: '3 hours',
        basePrice: 150,
        features: ['Meet & Greet', 'Flight Tracking', 'Free Wait Time'],
        isActive: true
      },
      {
        name: 'City Tour',
        description: 'Customized city tour experience',
        duration: '6 hours',
        basePrice: 300,
        features: ['Professional Driver', 'Custom Itinerary', 'Complimentary Drinks'],
        isActive: true
      }
    ];

    await ServicePackage.insertMany(packages);
    console.log(`Created ${packages.length} service packages`);

    // Initialize admin settings
    const settings = [
      {
        type: 'pricing',
        distanceFeeEnabled: false,
        distanceThreshold: 0,
        distanceFee: 0,
        perMileFeeEnabled: false,
        perMileFee: 0,
        minFee: 0,
        maxFee: 0
      },
      {
        type: 'notifications',
          smsEnabled: true,
          emailEnabled: true,
          bookingNotifications: true,
          driverAssignments: true,
          paymentNotifications: true
      },
      {
        type: 'businessHours',
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '23:00' },
          saturday: { open: '07:00', close: '23:00' },
          sunday: { open: '07:00', close: '22:00' }
      }
    ];

    for (const setting of settings) {
      await AdminSettings.create(setting);
    }
    console.log(`Created ${settings.length} admin settings`);

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

initializeData(); 