/**
 * Script to update all existing bookings to include customer information
 * This is a one-time migration script to fix the missing customer information issue
 * CommonJS version
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import models directly from Mongoose
mongoose.set('strictQuery', false);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/limo-app');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Define schemas
    const profileSchema = new mongoose.Schema({
      userId: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true, trim: true, lowercase: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      role: { type: String, enum: ['admin', 'driver', 'customer'], default: 'customer' },
      phone: String,
      password: { type: String, required: true },
    });

    const bookingSchema = new mongoose.Schema({
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      customerName: { type: String },
      customerEmail: { type: String },
      vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
      driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
      pickupLocation: { type: String, required: true },
      dropoffLocation: { type: String, required: true },
      pickupTime: { type: Date, required: true },
      dropoffTime: { type: Date, required: true },
      status: { type: String, enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
      price: { type: Number, required: true },
      notes: String,
      packageId: { type: String },
      packageName: { type: String },
      hours: { type: Number },
      isTest: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    // Create models
    const Profile = mongoose.model('Profile', profileSchema, 'users');
    const Booking = mongoose.model('Booking', bookingSchema);
    
    return { conn, Profile, Booking };
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const updateBookingCustomers = async () => {
  try {
    // Connect to database and get models
    const { conn, Profile, Booking } = await connectDB();
    
    // Get all bookings that don't have customerName or customerEmail
    const bookings = await Booking.find({
      $or: [
        { customerName: { $exists: false } },
        { customerEmail: { $exists: false } },
        { customerName: null },
        { customerEmail: null }
      ]
    }).populate('customerId');
    
    console.log(`Found ${bookings.length} bookings to update with customer information`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each booking
    for (const booking of bookings) {
      try {
        // Skip if already has both fields
        if (booking.customerName && booking.customerEmail) {
          continue;
        }
        
        // Try to get customer information from customerId
        let customerName = 'Unknown Customer';
        let customerEmail = 'No email';
        
        if (booking.customerId) {
          // Direct reference to a Profile
          if (typeof booking.customerId === 'object' && booking.customerId.firstName) {
            customerName = `${booking.customerId.firstName} ${booking.customerId.lastName || ''}`;
            customerEmail = booking.customerId.email || 'No email';
          }
          // Old structure with Customer collection and nested profileId
          else if (typeof booking.customerId === 'object' && booking.customerId.profileId) {
            const profileId = booking.customerId.profileId;
            // If profileId is a string, need to fetch the profile
            if (typeof profileId === 'string') {
              const profile = await Profile.findById(profileId);
              if (profile) {
                customerName = `${profile.firstName} ${profile.lastName || ''}`;
                customerEmail = profile.email || 'No email';
              }
            } 
            // If profileId is already an object
            else if (typeof profileId === 'object' && profileId) {
              customerName = `${profileId.firstName} ${profileId.lastName || ''}`;
              customerEmail = profileId.email || 'No email';
            }
          }
          // If customerId is a string, need to fetch the profile
          else if (typeof booking.customerId === 'string' || booking.customerId instanceof mongoose.Types.ObjectId) {
            const profile = await Profile.findById(booking.customerId);
            if (profile) {
              customerName = `${profile.firstName} ${profile.lastName || ''}`;
              customerEmail = profile.email || 'No email';
            }
          }
        }
        
        console.log(`Updating booking ${booking._id} with name: ${customerName}, email: ${customerEmail}`);
        
        // Update the booking with customer information
        const updatedBooking = await Booking.findByIdAndUpdate(
          booking._id,
          {
            $set: {
              customerName,
              customerEmail
            }
          },
          { new: true }
        );
        
        console.log(`Updated booking ${booking._id}: ${customerName}, ${customerEmail}`);
        updatedCount++;
      } catch (err) {
        console.error(`Error updating booking ${booking._id}:`, err);
        errorCount++;
      }
    }
    
    console.log(`Update complete. ${updatedCount} bookings updated. ${errorCount} errors encountered.`);
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error in update script:', error);
    process.exit(1);
  }
};

// Run the update function
updateBookingCustomers(); 