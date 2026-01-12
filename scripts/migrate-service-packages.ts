import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}

const client = new MongoClient(mongoUri);

// Service packages data
const servicePackages = [
  {
    id: 'lax-special',
    name: 'Airport Special',
    description: 'Luxury transfer to and from LAX and greater Los Angeles airports (SNA, LGB, ONT).',
    rate: '$250 (Fixed rate)',
    vehicle: 'mercedes-sprinter',
    imageUrl: '/plane.png',
    airports: ['LAX', 'SNA', 'LGB', 'ONT']
  },
  {
    id: 'disneyland',
    name: 'Disneyland Park & Hotel / Airports',
    description: 'Direct service to Disneyland Park, hotels, and airports.',
    rate: '$250 (Fixed rate)',
    vehicle: 'mercedes-sprinter',
    imageUrl: '/disneyland.png',
  },
  {
    id: 'special-events',
    name: 'Special Events',
    description: 'Perfect for weddings, proms, and other special occasions.',
    rate: '$130/hr (4 hour minimum)',
    vehicle: 'mercedes-sprinter',
    imageUrl: '/weddings.png',
  }
];

// Transform the service packages to match our new schema
const transformedPackages = servicePackages.map(pkg => ({
  id: pkg.id,
  name: pkg.name,
  description: pkg.description,
  base_price: parseFloat(pkg.rate.replace(/[^0-9.]/g, '')),
  is_hourly: pkg.rate.includes('/hr'),
  minimum_hours: pkg.rate.includes('minimum') ? 4 : undefined,
  vehicle_id: pkg.vehicle,
  image_url: pkg.imageUrl,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
}));

async function migrateServicePackages() {
  try {
    console.log('Starting service packages migration...');

    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('service_packages');

    // First, check if we already have packages
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing packages. Skipping migration.`);
      return;
    }

    // Insert the packages
    const result = await collection.insertMany(transformedPackages);
    console.log('Successfully migrated service packages:');
    console.log(`Inserted ${result.insertedCount} packages`);

  } catch (error) {
    console.error('Error migrating service packages:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

migrateServicePackages(); 