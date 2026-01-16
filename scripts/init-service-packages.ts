import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// ServicePackage Schema (matches server/models/schema.ts)
const servicePackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  base_price: { type: Number, required: true },
  is_hourly: { type: Boolean, default: false },
  minimum_hours: { type: Number },
  vehicle_id: { type: String },
  image_url: { type: String },
  is_active: { type: Boolean, default: true },
  airports: [{ type: String }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const ServicePackage = mongoose.model('ServicePackage', servicePackageSchema, 'servicepackages');

// Default service packages data
const defaultPackages = [
  {
    name: 'Airport Special',
    description: 'Luxury transfer to and from LAX and greater Los Angeles airports (SNA, LGB, ONT).',
    base_price: 250,
    is_hourly: false,
    minimum_hours: undefined,
    vehicle_id: 'mercedes-sprinter',
    image_url: '/plane.png',
    is_active: true,
    airports: ['LAX', 'SNA', 'LGB', 'ONT'],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: 'Disneyland Park & Hotel / Airports',
    description: 'Premium luxury transportation to Disneyland Park, Disney Resort hotels, and major Southern California airports (LAX, SNA, LGB, ONT). Perfect for families and groups, our spacious Mercedes Sprinter limousines provide comfortable, reliable service with professional chauffeurs. Ideal for theme park visits, hotel transfers, and airport connections throughout the Disneyland area.',
    base_price: 250,
    is_hourly: false,
    minimum_hours: undefined,
    vehicle_id: 'mercedes-sprinter',
    image_url: '/disneyland.png',
    is_active: true,
    airports: [],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: 'Special Events',
    description: 'Elevate your special occasion with premium luxury transportation. Perfect for weddings, proms, quinceañeras, sweet 16s, birthday celebrations, corporate events, concerts, sporting events, funerals, wine tasting tours, and more. Our spacious Mercedes Sprinter limousines provide elegant, comfortable transportation for groups, ensuring you arrive in style with professional chauffeurs who understand the importance of your event. Hourly service available with flexible scheduling to accommodate your celebration needs.',
    base_price: 130,
    is_hourly: true,
    minimum_hours: 4,
    vehicle_id: 'mercedes-sprinter',
    image_url: '/weddings.png',
    is_active: true,
    airports: [],
    created_at: new Date(),
    updated_at: new Date()
  }
];

async function initializeServicePackages() {
  try {
    console.log('Initializing service packages...');
    
    await connectDB();
    
    // Check if service packages already exist
    const existingCount = await ServicePackage.countDocuments();
    console.log(`Found ${existingCount} existing service packages`);
    
    if (existingCount === 0) {
      console.log('No service packages found, creating default packages...');
      
      const result = await ServicePackage.insertMany(defaultPackages);
      console.log(`Successfully created ${result.length} service packages`);
      
      // Log the created packages
      result.forEach((pkg, index) => {
        console.log(`Package ${index + 1}: ${pkg.name} - $${pkg.base_price}${pkg.is_hourly ? '/hr' : ''}`);
      });
    } else {
      console.log('Service packages already exist. Checking schema compatibility...');
      
      // Check if existing packages have the required fields
      const samplePackage = await ServicePackage.findOne();
      if (samplePackage) {
        console.log('Sample existing package fields:', Object.keys(samplePackage.toObject()));
        
        // Check if airports field exists, if not, update the schema
        if (!samplePackage.airports) {
          console.log('Updating existing packages to include airports field...');
          await ServicePackage.updateMany(
            { airports: { $exists: false } },
            { $set: { airports: [] } }
          );
          console.log('Updated existing packages with airports field');
        }
      }
    }
    
    // Final verification
    const finalCount = await ServicePackage.countDocuments();
    const finalPackages = await ServicePackage.find();
    
    console.log(`\nFinal verification: ${finalCount} service packages in database`);
    finalPackages.forEach((pkg, index) => {
      console.log(`  ${index + 1}. ${pkg.name} - $${pkg.base_price}${pkg.is_hourly ? '/hr' : ''} - Airports: ${pkg.airports?.join(', ') || 'None'}`);
    });
    
    console.log('\nService packages initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing service packages:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
if (require.main === module) {
  initializeServicePackages();
}

export default initializeServicePackages; 