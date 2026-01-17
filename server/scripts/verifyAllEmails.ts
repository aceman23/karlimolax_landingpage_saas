import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function verifyAllEmails() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karlimolax');
    console.log('Connected to MongoDB');

    // Update all users
    const result = await User.updateMany(
      { isEmailVerified: { $ne: true } }, // Find all users where email is not verified
      { 
        $set: { 
          isEmailVerified: true,
          emailVerificationToken: undefined,
          emailVerificationExpires: undefined
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} users`);
    console.log('All users have been marked as email verified');

    // Get total user count
    const totalUsers = await User.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
verifyAllEmails(); 