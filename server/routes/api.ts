import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { Profile, Vehicle, Booking, Customer, ServicePackage, DriverDocument, DriverRating, BookingStatusHistory, Stop } from '../models/schema.js';
import User from '../models/User.js'; // Add User model import
import connectDB from '../db.js'; // Import connectDB
import { sendEmail, templates, sendBookingConfirmation } from '../utils/email.js'; // Import email utilities
import crypto from 'crypto';
import { sendBookingNotificationEmail } from '../utils/emailService.js';
import { AdminSettings } from '../models/schema.js';
import { Settings } from '../models/schema.js';
import { IgApiClient } from 'instagram-private-api';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
    })
  : null;

// Add a helper function to check if Stripe is initialized
const getStripe = () => {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check your environment variables.');
  }
  return stripe;
};

// Helper function to add package information to booking objects
const addPackageInformation = (booking: any) => {
  if (!booking) return null;
  
  // First, create a clean booking object with any available direct customer info
  let customerName = 'Unknown Customer';
  let customerEmail = 'No email';
  let customerPhone = 'No phone';
  
  // Try to get customer information from various sources
  if (booking.customerName) {
    customerName = booking.customerName;
  } else if (booking.customerId && typeof booking.customerId === 'object' && booking.customerId.firstName) {
    // Type assertion to handle customerId properties safely
    const customer = booking.customerId as { 
      firstName?: string; 
      lastName?: string; 
      email?: string; 
      phone?: string;
      profileId?: any;
    };
    
    customerName = `${customer.firstName || ''} ${customer.lastName || ''}`;
  } else if (booking.customerId && typeof booking.customerId === 'object' && booking.customerId.profileId) {
    // Old structure with nested profileId
    const profile = booking.customerId.profileId;
    if (profile && typeof profile === 'object' && profile.firstName) {
      // Type assertion for profile object
      const typedProfile = profile as {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
      };
      
      customerName = `${typedProfile.firstName || ''} ${typedProfile.lastName || ''}`;
    }
  }
  
  if (booking.customerEmail) {
    customerEmail = booking.customerEmail;
  } else if (booking.customerId && typeof booking.customerId === 'object' && booking.customerId.email) {
    // Type assertion to handle customerId properties safely
    const customer = booking.customerId as { email?: string };
    customerEmail = customer.email || 'No email';
  } else if (booking.customerId && typeof booking.customerId === 'object' && booking.customerId.profileId) {
    // Old structure with nested profileId
    const profile = booking.customerId.profileId;
    if (profile && typeof profile === 'object' && profile.email) {
      // Type assertion for profile object
      const typedProfile = profile as { email?: string };
      customerEmail = typedProfile.email || 'No email';
    }
  }
  
  if (booking.customerPhone) {
    customerPhone = booking.customerPhone;
  } else if (booking.customerId && typeof booking.customerId === 'object' && booking.customerId.phone) {
    // Type assertion to handle customerId properties safely
    const customer = booking.customerId as { phone?: string };
    customerPhone = customer.phone || 'No phone';
  } else if (booking.customerId && typeof booking.customerId === 'object' && booking.customerId.profileId) {
    // Old structure with nested profileId
    const profile = booking.customerId.profileId;
    if (profile && typeof profile === 'object' && profile.phone) {
      // Type assertion for profile object
      const typedProfile = profile as { phone?: string };
      customerPhone = typedProfile.phone || 'No phone';
    }
  }
  
  // Log passengers field from original booking
  console.log('[DEBUG] addPackageInformation - Original booking passengers:', booking.passengers);
  
  const processedBooking = {
    ...booking,
    customerName: booking.customerName || customerName,
    customerEmail: booking.customerEmail || customerEmail,
    customerPhone: booking.customerPhone || customerPhone,
    // Ensure customer information is available
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone
    },
    // Explicitly preserve passengers field
    passengers: booking.passengers !== undefined ? booking.passengers : undefined
  };

  // Add package information if applicable
  if (booking?.packageId) {
    processedBooking.package = {
      name: booking.packageName || 'Custom Package',
      hours: booking.hours
    };
  }
  
  // Explicitly ensure passengers field is preserved
  console.log('[DEBUG] addPackageInformation - Original booking passengers:', booking.passengers);
  if (booking.passengers !== undefined) {
    processedBooking.passengers = Number(booking.passengers);
  }
  console.log('[DEBUG] addPackageInformation - Processed booking passengers:', processedBooking.passengers);
  
  return processedBooking;
};

// Define a custom Request type for authenticated routes
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string; 
    email: string;
    role: string;
  };
}

const router = express.Router();

// Authentication Middleware
const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    console.error('[ERROR] JWT_SECRET is not set in environment variables');
    console.error('[ERROR] This is a server configuration issue. Please set JWT_SECRET in your environment variables.');
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'JWT_SECRET environment variable is not configured. Please contact the administrator.',
      code: 'MISSING_JWT_SECRET'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; email: string; role: string; iat: number; exp: number };
    // Attach decoded user information to the request object
    req.user = { 
      userId: decoded.userId, 
      email: decoded.email,
      role: decoded.role 
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Driver Role Middleware
const driverRoleMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Access denied. Driver role required.' });
  }
  next();
};

// Admin Role Middleware
const adminRoleMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    next();
  } catch (dbError) {
    console.error('Database connection error in adminRoleMiddleware:', dbError);
    return res.status(500).json({ error: 'Internal server error during role verification.' });
  }
};

// Profile routes
router.get('/profiles', async (req, res) => {
  try {
    await connectDB();
    const query: any = {};
    if (req.query.role) {
      query.role = req.query.role as string;
    }
    const profiles = await Profile.find(query);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

router.get('/profiles/:id', async (req, res) => {
  try {
    await connectDB();
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.post('/profiles', async (req, res) => {
  try {
    await connectDB();
    const { email, password, firstName, lastName, role, userId, phone, address, city, state, zipCode } = req.body;

    // Check if profile already exists by email or userId
    const existingProfileByEmail = await Profile.findOne({ email });
    if (existingProfileByEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (userId) {
        const existingProfileByUserId = await Profile.findOne({ userId });
        if (existingProfileByUserId) {
            return res.status(400).json({ error: 'User ID already exists' });
        }
    }

    // Password will be hashed by the pre('save') hook in profileSchema
    const profileData = {
      email,
      password, // Pass plain password, model will hash it
      firstName,
      lastName,
      role: role || 'customer',
      userId: userId || new mongoose.Types.ObjectId().toString(),
      phone,
      address,
      city,
      state,
      zipCode,
    };

    const profile = await Profile.create(profileData);
    
    // DEBUG LOG: Log the password hash as stored in the database
    console.log('[DEBUG] Profile Created - Stored Password Hash:', profile.password);

    // Exclude password from the response
    const { password: _, ...profileResponse } = profile.toObject();

    res.status(201).json(profileResponse);
  } catch (error: any) { // Added :any for error type
    // Ensure connectDB errors are handled if they propagate here
    if (!(error instanceof mongoose.Error) && error.message && error.message.includes('database')) {
        console.error("ConnectDB error before profile creation:", error);
        return res.status(503).json({ error: 'Database service unavailable.' });
    }
    console.error("Error creating profile:", error);
    if (error.code === 11000) {
        // More specific duplicate error messages
        if (error.keyPattern && error.keyPattern.email) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }
        if (error.keyPattern && error.keyPattern.userId) {
            return res.status(400).json({ error: 'This User ID is already taken.' });
        }
        return res.status(400).json({ error: 'A duplicate key error occurred.' });
    }
    res.status(500).json({ error: 'Failed to create profile. Please try again.' });
  }
});

router.put('/profiles/:id', authMiddleware, adminRoleMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // connectDB() is called in adminRoleMiddleware
    const { role, currentPassword, newPassword, ...otherFieldsToUpdate } = req.body;

    // Validate role if provided
    if (role && !['admin', 'driver', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const profileToUpdate = await Profile.findById(req.params.id);
    if (!profileToUpdate) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // If changing password
    if (newPassword) {
      // Admin password reset: if adminPasswordReset flag is set, skip current password verification
      const isAdminPasswordReset = req.body.adminPasswordReset === true;
      
      if (!isAdminPasswordReset) {
        // Regular password change: verify current password
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }

        const user = await User.findById(profileToUpdate.userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();
      } else {
        // Admin password reset: no current password required
        const user = await User.findById(profileToUpdate.userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Update password directly (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();
      }
    }

    // Update profile fields
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    Object.keys(otherFieldsToUpdate).forEach(key => {
      if (allowedFields.includes(key)) {
        (profileToUpdate as any)[key] = otherFieldsToUpdate[key] || '';
      }
    });

    // Update role if provided
    if (role) {
      profileToUpdate.role = role;
    }

    // Defensive check: If userId is missing on the fetched document
    if (!profileToUpdate.userId) {
        console.warn(`[WARN] User profile ${profileToUpdate._id} was missing userId before save. Assigning a new one.`);
        profileToUpdate.userId = new mongoose.Types.ObjectId(); 
    }

    await profileToUpdate.save();
    
    // Return updated profile without sensitive data
    const { password: _, ...profileResponse } = profileToUpdate.toObject();
    res.json(profileResponse);
  } catch (error: any) { 
    console.error('Error updating profile:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e: any) => e.message).join(', ');
        return res.status(400).json({ error: `Validation failed: ${messages}` });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.delete('/profiles/:id', authMiddleware, adminRoleMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // connectDB() is called in adminRoleMiddleware
    const profileId = req.params.id;
    console.log(`[DELETE /profiles/:id] Attempting to delete profile with ID: ${profileId}`);

    if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).json({ error: 'Invalid profile ID' });
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      console.log(`[DELETE /profiles/:id] Profile not found: ${profileId}`);
      return res.status(404).json({ error: 'Profile not found' });
    }

    console.log(`[DELETE /profiles/:id] Found profile:`, {
      id: profile._id,
      email: profile.email,
      userId: profile.userId
    });

    // Also delete the associated User document if userId exists
    if (profile.userId) {
      try {
        const userDeleted = await User.findByIdAndDelete(profile.userId);
        if (userDeleted) {
          console.log(`[INFO] Deleted User document with ID: ${profile.userId}`);
        } else {
          console.log(`[WARN] User document not found for ID: ${profile.userId}`);
        }
      } catch (userError: any) {
        console.warn(`[WARN] Failed to delete User document ${profile.userId}:`, userError);
        // Continue with profile deletion even if User deletion fails
      }
    } else {
      console.log(`[WARN] Profile has no userId, skipping User deletion`);
    }

    // Delete the profile
    const deletedProfile = await Profile.findByIdAndDelete(profileId);
    if (!deletedProfile) {
      console.log(`[ERROR] Profile was not deleted: ${profileId}`);
      return res.status(500).json({ error: 'Failed to delete profile' });
    }

    console.log(`[INFO] Successfully deleted profile: ${profileId}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('[ERROR] Error deleting profile:', error);
    const errorMessage = error.message || 'Failed to delete user';
    res.status(500).json({ error: errorMessage });
  }
});

// Vehicle routes
router.get('/public/vehicles', async (req, res) => {
  try {
    await connectDB();
    const vehicles = await Vehicle.find({ status: 'active' });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.get('/vehicles', async (req, res) => {
  try {
    await connectDB();
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.get('/vehicles/:id', async (req, res) => {
  try {
    await connectDB();
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

router.post('/vehicles', authMiddleware, adminRoleMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB(); 
    
    // Log the received data for debugging
    console.log('Received vehicle data:', req.body);

    // Validate required fields
    const requiredFields = ['name', 'make', 'model', 'capacity', 'pricePerHour'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        fields: missingFields 
      });
    }

    // Validate field types and ranges
    if (typeof req.body.capacity !== 'number' || req.body.capacity <= 0) {
      return res.status(400).json({ error: 'Capacity must be a positive number' });
    }

    if (typeof req.body.pricePerHour !== 'number' || req.body.pricePerHour <= 0) {
      return res.status(400).json({ error: 'Price per hour must be a positive number' });
    }

    // Convert comma-separated strings to arrays if they exist
    const features = req.body.features ? (typeof req.body.features === 'string' ? req.body.features.split(',').map((s: string) => s.trim()).filter((s: string) => s) : req.body.features) : [];
    const imageUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls.filter(Boolean) : (req.body.imageUrl ? [req.body.imageUrl] : []);

    const vehicleData = {
      name: req.body.name,
      make: req.body.make,
      model: req.body.model,
      capacity: Number(req.body.capacity),
      pricePerHour: Number(req.body.pricePerHour),
      features,
      description: req.body.description || '',
      imageUrl: (imageUrls[0] || req.body.imageUrl || ''),
      imageUrls,
      status: 'active'
    };

    // Log the processed data before creation
    console.log('Creating vehicle with data:', vehicleData);

    const vehicle = await Vehicle.create(vehicleData);
    
    // Log the created vehicle
    console.log('Created vehicle:', vehicle);

    res.status(201).json(vehicle);
  } catch (error: any) {
    console.error("Error creating vehicle:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({ error: `Validation failed: ${messages.join(', ')}` });
    }
    res.status(500).json({ error: 'Failed to create vehicle. Please try again.' });
  }
});

router.put('/vehicles/:id', authMiddleware, adminRoleMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid vehicle ID format' });
    }
    
    // Check if vehicle exists first
    const existingVehicle = await Vehicle.findById(req.params.id);
    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Basic validation similar to POST route
    const { name, make, model, year, licensePlate, vin, capacity, pricePerHour, status } = req.body;
    
    // Validate field types and ranges if they exist
    if (year !== undefined && (typeof year !== 'number' || year < 1900 || year > new Date().getFullYear() + 1)) {
      return res.status(400).json({ error: 'Invalid year value' });
    }

    if (capacity !== undefined && (typeof capacity !== 'number' || capacity <= 0)) {
      return res.status(400).json({ error: 'Capacity must be a positive number' });
    }

    if (pricePerHour !== undefined && (typeof pricePerHour !== 'number' || pricePerHour <= 0)) {
      return res.status(400).json({ error: 'Price per hour must be a positive number' });
    }

    if (status !== undefined && !['active', 'maintenance', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Convert comma-separated strings to arrays if they exist
    const features = req.body.features ? (typeof req.body.features === 'string' ? req.body.features.split(',').map((s: string) => s.trim()).filter((s: string) => s) : req.body.features) : [];
    const imageUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls.filter(Boolean) : (req.body.imageUrl ? [req.body.imageUrl] : undefined);
    
    const vehicleData = {
      ...req.body,
      features,
      ...(imageUrls ? { imageUrls, imageUrl: imageUrls[0] || req.body.imageUrl || '' } : {}),
      updatedAt: new Date()
    };

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, vehicleData, { new: true });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error: any) {
    console.error("Error updating vehicle:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({ error: `Validation failed: ${messages.join(', ')}` });
    }
    if (error.code === 11000) { // Duplicate key error (e.g., for unique VIN)
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `A vehicle with this ${field} already exists.` });
    }
    res.status(500).json({ error: 'Failed to update vehicle. Please try again.' });
  }
});

router.delete('/vehicles/:id', authMiddleware, adminRoleMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// Add interfaces for populated data
interface PopulatedCustomer {
  profileId: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

interface PopulatedVehicle {
  _id: mongoose.Types.ObjectId;
  name: string;
  capacity: number;
  pricePerHour: number;
}

interface PopulatedBooking extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  customerId: PopulatedCustomer;
  vehicleId: PopulatedVehicle;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: Date;
  hours: number;
  notes?: string;
  price: number;
  status: string;
  createdAt: Date;
}

// Add this function before the route handlers
function calculateDistance(pickupLocation: string, dropoffLocation: string): number {
  // This is a placeholder implementation
  // In a real application, you would use a geocoding service (like Google Maps API)
  // to calculate the actual distance between the locations
  return 0;
}

// Booking routes
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const query: any = {};
    const { customerId, driverId, date, status, email } = req.query;

    if (email) {
      // Search for bookings directly by email
      query.customerEmail = email;
    } else if (customerId && mongoose.Types.ObjectId.isValid(customerId as string)) {
      query.customerId = customerId;
    } else if (customerId) {
      return res.status(400).json({ error: 'Invalid customerId format' });
    }

    if (driverId && mongoose.Types.ObjectId.isValid(driverId as string)) {
      query.driverId = driverId;
    } else if (driverId) {
      return res.status(400).json({ error: 'Invalid driverId format' });
    }

    if (status) {
      query.status = status as string;
    }

    if (date && typeof date === 'string') {
      const dayStart = new Date(date as string);
      if (isNaN(dayStart.getTime())) {
        return res.status(400).json({ error: 'Invalid date format for query. Use YYYY-MM-DD.'});
      }
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(date as string);
      dayEnd.setUTCHours(23, 59, 59, 999);
      query.pickupTime = { $gte: dayStart, $lte: dayEnd };
    }

    const bookings = await Booking.find(query)
      .populate('customerId', 'firstName lastName email phone') // Populate directly from Profile
      .populate('vehicleId', 'make model year name color imageUrl')
      .populate('driverId', 'firstName lastName email phone')
      .populate('stops')
      .lean();
    
    // Add package information to each booking using the helper function
    const bookingsWithPackages = bookings.map(addPackageInformation);

    res.json(bookingsWithPackages);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/bookings/:id', async (req, res) => {
  try {
    await connectDB();
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'firstName lastName email phone') // Populate directly from Profile
      .populate('vehicleId')
      .populate('driverId');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

router.post('/bookings', async (req: Request, res: Response) => {
  console.log('Booking creation request received');
  try {
    // Check if bookings are enabled
    await connectDB();
    const bookingSettings = await AdminSettings.findOne({ type: 'settings', key: 'admin_settings' });
    const bookingsEnabled = bookingSettings?.bookingsEnabled !== undefined ? bookingSettings.bookingsEnabled : true;
    
    if (!bookingsEnabled) {
      return res.status(403).json({ 
        error: 'Bookings are currently disabled',
        message: 'We are currently not accepting new bookings. Please try again later or contact us for assistance.'
      });
    }

    const {
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      paymentStatus,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      hours,
      vehicleId,
      vehicleName,
      notes,
      packageId,
      packageName,
      passengers,
      stops,
      airportCode,
      testMode = false,
      price,
      totalAmount,
      carSeats,
      boosterSeats,
      gratuity
    } = req.body;

    console.log('Booking data received:', {
      customerEmail,
      customerName,
      customerPhone,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      vehicleId,
      vehicleName,
      totalAmount
    });

    // Validate required fields
    if (!customerEmail || !customerName || !customerPhone || !pickupLocation || !dropoffLocation || !pickupTime) {
      console.error('Missing required fields:', { customerEmail, customerName, customerPhone, pickupLocation, dropoffLocation, pickupTime });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get or create admin settings for fees
    const adminSettings = await (AdminSettings as any).getOrCreateAdminSettings();

    console.log('DEBUG - Vehicle info from request:', { vehicleId, vehicleName });

    // Create the booking data
    const bookingData = {
      customerId: customerId || null, // Use provided customerId or null
      customerEmail,
      customerName,
      customerPhone,
      paymentStatus,
      pickupLocation,
      dropoffLocation,
      pickupTime: new Date(pickupTime),
      dropoffTime: hours && hours > 0 ? new Date(new Date(pickupTime).getTime() + Number(hours) * 3600000) : undefined,
      status: testMode ? 'confirmed' : 'pending',
      price: price,
      vehicleId,
      vehicleName,
      totalAmount: totalAmount,
      notes,
      packageId,
      packageName: packageName || (
        packageId === 'lax-special' ? 'Airport Special' :
        packageId === 'disneyland' ? 'Disneyland Park & Hotel' :
        packageId === 'special-events' ? 'Special Events' :
        'Custom Package'
      ),
      hours: hours && hours > 0 ? hours : undefined,
      isTest: testMode || false,
      passengers: passengers !== undefined && passengers !== null ? Number(passengers) : 1,
      carSeats: carSeats !== undefined && carSeats !== null ? Number(carSeats) : 0,
      boosterSeats: boosterSeats !== undefined && boosterSeats !== null ? Number(boosterSeats) : 0,
      gratuity: gratuity || {
        type: 'none',
        amount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Creating booking with data:', bookingData);

    // Create the booking first
    const bookingModel = new Booking(bookingData);
    const booking = await bookingModel.save();

    console.log('DEBUG - Booking created with vehicle info:', {
      vehicleId: booking.vehicleId,
      vehicleName: booking.vehicleName
    });

    // Create stops if provided
    if (stops && Array.isArray(stops) && stops.length > 0) {
      const stopPromises = stops.map(async (stop: any) => {
        const stopModel = new Stop({
          bookingId: booking._id,
          location: stop.location,
          order: stop.order,
          price: stop.price
        });
        return stopModel.save();
      });

      const createdStops = await Promise.all(stopPromises);
      
      // Update booking with stop references
      booking.stops = createdStops.map(stop => stop._id);
      await booking.save();
    }

    // Populate the booking with related data
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'customerId',
        select: 'firstName lastName email phone',
        model: 'Profile'
      })
      .populate('vehicleId', 'name make model year capacity pricePerHour imageUrl')
      .populate('stops')
      .lean();
    
    if (!populatedBooking) {
      throw new Error('Failed to retrieve created booking');
    }

    // Send booking confirmation email to customer
    try {
      console.log('Preparing to send booking confirmation email for booking:', populatedBooking._id);
      
      // Get customer email
      const customerEmail = populatedBooking.customerEmail;
      
      console.log('Customer email found:', customerEmail);
      
      if (!customerEmail) {
        console.error('No customer email found for booking:', populatedBooking._id);
        // Don't throw error, just log it
        console.log('Skipping email sending due to missing email');
      } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        console.error('Invalid email format:', customerEmail);
          console.log('Skipping email sending due to invalid email format');
        } else {
      // Generate email template
      const emailTemplate = templates.bookingConfirmation(populatedBooking);
      console.log('Email template generated successfully');
      
      console.log('Preparing to send admin notification email for booking:', populatedBooking._id);
      
          try {
            await sendBookingNotificationEmail(populatedBooking);
          } catch (adminEmailError) {
            console.error('Failed to send admin notification email:', adminEmailError);
            // Don't fail the booking creation if admin email fails
          }

      // Send email - this will throw an error if SMTP_USER is not karlimolax@gmail.com
      await sendEmail({
        to: customerEmail,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html
      });

      console.log('[SUCCESS] Booking confirmation email sent successfully from karlimolax@gmail.com');
        }
      }
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail the booking creation if email fails
      console.log('Continuing with booking creation despite email failure');
    }

    res.status(201).json(populatedBooking);
  } catch (error: any) {
    console.error('Error creating booking:', error);
    
    // Log more details about the error
    if (error.name) console.error('Error name:', error.name);
    if (error.message) console.error('Error message:', error.message);
    if (error.stack) console.error('Error stack:', error.stack);
    
    // Return a more specific error message
    const errorMessage = error.message || 'Failed to create booking';
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Send booking confirmation email
router.post('/bookings/send-confirmation', async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Find the booking and populate related data
    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'customerId',
        select: 'firstName lastName email phone',
        model: 'Profile'
      })
      .populate('vehicleId', 'name make model year capacity pricePerHour imageUrl')
      .populate('stops')
    .lean();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get customer email - first try the direct email field, then the populated customer
    const customerEmail = booking.customerEmail || 
                         (booking.customerId as any)?.email;

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email not found' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Send confirmation email
    const emailTemplate = templates.bookingConfirmation(booking);
    await sendEmail({
      to: customerEmail,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html
    });

    res.json({ message: 'Confirmation email sent successfully' });
  } catch (error: any) {
    console.error('Error sending booking confirmation email:', error);
    res.status(500).json({ error: error.message || 'Failed to send confirmation email' });
  }
});

// Bootstrap endpoint to create essential data if missing
router.post('/bootstrap/essential-data', async (req, res) => {
  try {
    console.log('[BOOTSTRAP] Starting essential data bootstrap');
    await connectDB();
    
    const result = {
      vehicles: { created: 0, existing: 0 },
      servicePackages: { created: 0, existing: 0 },
      errors: []
    };

    // Bootstrap Vehicles
    try {
      const existingVehicles = await Vehicle.countDocuments();
      console.log('[BOOTSTRAP] Existing vehicles:', existingVehicles);
      
      if (existingVehicles === 0) {
        console.log('[BOOTSTRAP] Creating default vehicles...');
        
        const defaultVehicles = [
          {
            name: 'Mercedes Limo Sprinter (VIP1)',
            make: 'Mercedes-Benz',
            model: 'Sprinter Limo',
            year: 2023,
            description: 'Ultimate luxury and comfort with the VIP1 Limo Sprinter. Perfect for special occasions and executive travel.',
            capacity: 10,
            pricePerHour: 150,
            features: ['Plush leather seating', 'Ambient lighting', 'Privacy partition', 'Premium sound system', 'Bar area', 'Smart TV'],
            imageUrl: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
            licensePlate: 'LIMO001',
            vin: 'WD3PE7CD5EP123456',
            color: 'Black',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            name: 'Mercedes Executive Sprinter (VIP2)',
            make: 'Mercedes-Benz',
            model: 'Sprinter Executive',
            year: 2023,
            description: 'Sophisticated and spacious, the VIP2 Executive Sprinter is ideal for corporate clients and group travel.',
            capacity: 12,
            pricePerHour: 140,
            features: ['Comfortable captain chairs', 'Workstations', 'On-board WiFi', 'Luggage space', 'Refreshments'],
            imageUrl: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
            licensePlate: 'EXEC001',
            vin: 'WD3PE7CD5EP123457',
            color: 'White',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const createdVehicles = await Vehicle.insertMany(defaultVehicles);
        result.vehicles.created = createdVehicles.length;
        console.log('[BOOTSTRAP] Created vehicles:', result.vehicles.created);
      } else {
        result.vehicles.existing = existingVehicles;
        console.log('[BOOTSTRAP] Vehicles already exist:', existingVehicles);
      }
    } catch (vehicleError) {
      const errorMsg = `Vehicle bootstrap error: ${vehicleError instanceof Error ? vehicleError.message : 'Unknown'}`;
      result.errors.push(errorMsg);
      console.error('[BOOTSTRAP]', errorMsg);
    }

    // Bootstrap Service Packages
    try {
      const existingPackages = await ServicePackage.countDocuments();
      console.log('[BOOTSTRAP] Existing service packages:', existingPackages);
      
      if (existingPackages === 0) {
        console.log('[BOOTSTRAP] Creating default service packages...');
        
        const defaultPackages = [
          {
            name: 'Airport Special',
            description: 'Luxury transfer to and from LAX and greater Los Angeles airports (SNA, LGB, ONT).',
            base_price: 250,
            duration: 120, // 2 hours in minutes
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
            duration: 120, // 2 hours in minutes
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
            base_price: 520, // 4 hours * $130
            duration: 240, // 4 hours in minutes
            vehicle_id: 'mercedes-sprinter',
            image_url: '/weddings.png',
            is_active: true,
            airports: [],
            created_at: new Date(),
            updated_at: new Date()
          }
        ];

        const createdPackages = await ServicePackage.insertMany(defaultPackages);
        result.servicePackages.created = createdPackages.length;
        console.log('[BOOTSTRAP] Created service packages:', result.servicePackages.created);
      } else {
        result.servicePackages.existing = existingPackages;
        console.log('[BOOTSTRAP] Service packages already exist:', existingPackages);
      }
    } catch (packageError) {
      const errorMsg = `Service package bootstrap error: ${packageError instanceof Error ? packageError.message : 'Unknown'}`;
      result.errors.push(errorMsg);
      console.error('[BOOTSTRAP]', errorMsg);
    }

    console.log('[BOOTSTRAP] Bootstrap completed:', result);
    res.json({
      message: 'Bootstrap completed',
      result: result,
      success: result.errors.length === 0
    });

  } catch (error) {
    console.error('[BOOTSTRAP] Bootstrap failed:', error);
    res.status(500).json({
      error: 'Bootstrap failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Payment endpoints
// Test endpoint to verify Stripe configuration
router.get('/test-stripe', async (req, res) => {
  try {
    console.log('[DEBUG] Testing Stripe configuration');
    console.log('[DEBUG] Stripe secret key configured:', !!process.env.STRIPE_SECRET_KEY);
    console.log('[DEBUG] Stripe secret key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Stripe not configured',
        details: 'STRIPE_SECRET_KEY is missing'
      });
    }
    
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe initialization failed',
        details: 'Could not initialize Stripe instance'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Stripe is properly configured',
      stripeInitialized: !!stripe
    });
  } catch (error: any) {
    console.error('[ERROR] Stripe test failed:', error);
    res.status(500).json({ 
      error: 'Stripe test failed',
      details: error.message || 'Unknown error'
    });
  }
});

router.post('/create-payment-intent', async (req, res) => {
  try {
    console.log('[DEBUG] Creating payment intent with data:', req.body);
    console.log('[DEBUG] Stripe secret key configured:', !!process.env.STRIPE_SECRET_KEY);
    console.log('[DEBUG] Stripe secret key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));
    
    const { amount, currency = 'usd', metadata = {} } = req.body;

    if (!amount) {
      console.error('[ERROR] Amount is missing from request');
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Validate amount is a valid number
    const amountNumber = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(amountNumber) || amountNumber <= 0) {
      console.error('[ERROR] Invalid amount:', amount);
      return res.status(400).json({ error: 'Invalid amount. Amount must be a positive number.' });
    }

    // Stripe requires minimum of 50 cents (0.50 USD)
    if (amountNumber < 50) {
      console.error('[ERROR] Amount too low:', amountNumber);
      return res.status(400).json({ error: 'Amount must be at least $0.50 (50 cents)' });
    }

    // Ensure amount is an integer (in cents)
    const amountInCents = Math.round(amountNumber);

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[ERROR] Stripe secret key not configured');
      return res.status(500).json({ 
        error: 'Payment processing is not configured',
        details: 'Stripe configuration missing'
      });
    }

    const stripe = getStripe();
    if (!stripe) {
      console.error('[ERROR] Failed to initialize Stripe');
      return res.status(500).json({ 
        error: 'Payment processing is not available',
        details: 'Stripe initialization failed'
      });
    }

    console.log('[DEBUG] Creating payment intent with amount (cents):', amountInCents);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents, // Amount in cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
      capture_method: 'automatic', // Explicitly set to automatically capture payment
      // Add a unique description to help with debugging
      description: `Booking payment - ${new Date().toISOString()}`,
    });

    console.log('[DEBUG] Payment intent created:', paymentIntent.id);
    console.log('[DEBUG] Payment intent status:', paymentIntent.status);
    console.log('[DEBUG] Client secret present:', !!paymentIntent.client_secret);
    
    if (!paymentIntent.client_secret) {
      console.error('[ERROR] Payment intent created but no client secret returned');
      return res.status(500).json({ 
        error: 'Failed to create payment session',
        details: 'No client secret returned from Stripe'
      });
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error('[ERROR] Failed to create payment intent:', error);
    console.error('[ERROR] Error type:', error.type);
    console.error('[ERROR] Error code:', error.code);
    console.error('[ERROR] Error message:', error.message);
    console.error('[ERROR] Error raw:', JSON.stringify(error, null, 2));
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError' || error.code) {
      const errorMessage = error.message || 'Invalid payment request';
      return res.status(400).json({ 
        error: 'Failed to create payment intent',
        details: errorMessage,
        stripeError: error.code
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message || 'Unknown error'
    });
  }
});

router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    res.json({ paymentIntent });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

router.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const refund = await getStripe().refunds.create({
      payment_intent: paymentIntentId,
    });
    res.json({ refund });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Authorize.Net: charge with Accept.js opaque data
router.post('/payments/authorize/charge', async (req: Request, res: Response) => {
  try {
    const authorizeDebug = String(process.env.AUTHORIZE_DEBUG || 'true').toLowerCase() === 'true';
    const { amount, opaqueData, invoiceNumber, description, billing } = req.body || {};
    if (authorizeDebug) {
      console.log('[Authorize.Net DEBUG] Charge request received', {
        amount,
        hasOpaqueData: !!opaqueData,
        invoiceNumber,
        hasDescription: !!description,
        hasBilling: !!billing,
        clientIp: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress
      });
    }
    if (!amount || !opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return res.status(400).json({ error: 'amount and opaqueData (dataDescriptor, dataValue) are required' });
    }

    const loginId = process.env.AUTHORIZE_API_LOGIN_ID;
    const transactionKey = process.env.AUTHORIZE_TRANSACTION_KEY;
    
    // Enhanced debugging for authentication credentials
    if (authorizeDebug) {
      console.log('[Authorize.Net DEBUG] Authentication check', {
        hasLoginId: !!loginId,
        loginIdLength: loginId?.length,
        hasTransactionKey: !!transactionKey,
        transactionKeyLength: transactionKey?.length,
        env: process.env.AUTHORIZE_ENV || 'not set'
      });
    }
    
    if (!loginId || !transactionKey) {
      console.error('[Authorize.Net ERROR] Missing credentials:', {
        hasLoginId: !!loginId,
        hasTransactionKey: !!transactionKey,
        availableEnvVars: Object.keys(process.env).filter(key => key.includes('AUTHORIZE'))
      });
      return res.status(500).json({ 
        error: 'Authorize.Net credentials not configured',
        details: {
          hasLoginId: !!loginId,
          hasTransactionKey: !!transactionKey
        }
      });
    }

    const isProduction = (process.env.AUTHORIZE_ENV || '').toLowerCase() === 'production';
    const endpoint = isProduction
      ? 'https://api2.authorize.net/xml/v1/request.api'
      : 'https://apitest.authorize.net/xml/v1/request.api';
    if (authorizeDebug) {
      console.log('[Authorize.Net DEBUG] Environment', { isProduction, endpoint });
    }

    const body = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: loginId,
          transactionKey: transactionKey
        },
        transactionRequest: {
          transactionType: 'authCaptureTransaction',
          amount: Number(amount),
          payment: {
            opaqueData: {
              dataDescriptor: opaqueData.dataDescriptor,
              dataValue: opaqueData.dataValue
            }
          },
          order: invoiceNumber || description ? {
            invoiceNumber: invoiceNumber || undefined,
            description: description || undefined
          } : undefined,
          billTo: billing ? {
            firstName: billing.firstName,
            lastName: billing.lastName,
            address: billing.address,
            city: billing.city,
            state: billing.state,
            zip: billing.zip,
            country: billing.country || 'US'
          } : undefined,
          customerIP: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || undefined
        }
      }
    };

    if (authorizeDebug) {
      console.log('[Authorize.Net DEBUG] Request body (sanitized)', {
        ...body,
        createTransactionRequest: {
          ...body.createTransactionRequest,
          merchantAuthentication: {
            name: loginId,
            transactionKey: transactionKey ? '[HIDDEN]' : 'MISSING'
          }
        }
      });
    }

    const response = await fetch(endpoint as any, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json() as any;
    if (authorizeDebug) {
      console.log('[Authorize.Net DEBUG] Raw response summary', {
        status: response.status,
        resultCode: result?.transactionResponse?.responseCode || result?.messages?.resultCode,
        authCode: result?.transactionResponse?.authCode,
        transId: result?.transactionResponse?.transId,
        errorText: result?.transactionResponse?.errors?.[0]?.errorText || result?.messages?.message?.[0]?.text,
        fullResponse: result
      });
    }

    const resultCode = result?.transactionResponse?.responseCode || result?.messages?.resultCode;
    const ok = resultCode === '1' || result?.messages?.resultCode === 'Ok';

    if (!ok) {
      const errMsg = result?.transactionResponse?.errors?.[0]?.errorText
        || result?.messages?.message?.[0]?.text
        || 'Payment failed';
      
      // Enhanced error logging
      console.error('[Authorize.Net ERROR] Payment failed:', {
        error: errMsg,
        resultCode,
        response: result
      });
      
      return res.status(402).json({ error: errMsg, raw: result });
    }

    return res.json({
      success: true,
      transactionId: result?.transactionResponse?.transId,
      authCode: result?.transactionResponse?.authCode,
      response: result
    });
  } catch (err) {
    console.error('Authorize.Net charge error:', err);
    return res.status(500).json({ error: 'Authorize.Net charge failed' });
  }
});

// Authorize.Net: void or refund by transactionId
router.post('/payments/authorize/refund', async (req: Request, res: Response) => {
  try {
    const authorizeDebug = String(process.env.AUTHORIZE_DEBUG || 'true').toLowerCase() === 'true';
    const { transactionId, amount, last4, expDate } = req.body || {};
    if (authorizeDebug) {
      console.log('[Authorize.Net DEBUG] Refund/Void request', { transactionId, amount, hasLast4: !!last4, hasExp: !!expDate });
    }
    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId is required' });
    }

    const loginId = process.env.AUTHORIZE_API_LOGIN_ID;
    const transactionKey = process.env.AUTHORIZE_TRANSACTION_KEY;
    if (!loginId || !transactionKey) {
      return res.status(500).json({ error: 'Authorize.Net credentials not configured' });
    }

    const isProduction = (process.env.AUTHORIZE_ENV || '').toLowerCase() === 'production';
    const endpoint = isProduction
      ? 'https://api2.authorize.net/xml/v1/request.api'
      : 'https://apitest.authorize.net/xml/v1/request.api';
    if (authorizeDebug) {
      console.log('[Authorize.Net DEBUG] Environment', { isProduction, endpoint });
    }

    // If unsettled, use void; otherwise refund (requires last4/expDate)
    const transactionType = amount ? 'refundTransaction' : 'voidTransaction';
    const payment = transactionType === 'refundTransaction' ? {
      creditCard: {
        cardNumber: last4 ? String(last4).padStart(4, '0') : '1111',
        expirationDate: expDate || 'XXXX'
      }
    } : undefined;

    const body = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: loginId,
          transactionKey: transactionKey
        },
        transactionRequest: {
          transactionType,
          amount: amount ? Number(amount) : undefined,
          refTransId: transactionId,
          payment
        }
      }
    } as any;

    const response = await fetch(endpoint as any, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json() as any;
    if (authorizeDebug) {
      console.log('[Authorize.Net DEBUG] Refund/Void response', {
        status: response.status,
        resultCode: result?.transactionResponse?.responseCode || result?.messages?.resultCode,
        transId: result?.transactionResponse?.transId,
        errorText: result?.transactionResponse?.errors?.[0]?.errorText || result?.messages?.message?.[0]?.text
      });
    }

    const ok = (result?.transactionResponse?.responseCode === '1') || (result?.messages?.resultCode === 'Ok');
    if (!ok) {
      const errMsg = result?.transactionResponse?.errors?.[0]?.errorText
        || result?.messages?.message?.[0]?.text
        || 'Refund/Void failed';
      return res.status(400).json({ error: errMsg, raw: result });
    }

    return res.json({ success: true, response: result });
  } catch (err) {
    console.error('Authorize.Net refund/void error:', err);
    return res.status(500).json({ error: 'Authorize.Net refund/void failed' });
  }
});

// Webhook endpoint for Stripe events
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Stripe secret key not configured');
    return res.status(400).send('Stripe not configured');
  }

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    // Initialize Stripe with the secret key only when needed
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
    });

    event = stripeInstance.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // Here you can update your database, send confirmation emails, etc.
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Signup route - Only admins can create accounts (deprecated, use /auth/register instead)
router.post('/signup', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    await connectDB(); // Ensure database connection
    const { email, password, firstName, lastName, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user - email verification not required
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'customer',
      phone,
      isEmailVerified: true // Set to true by default - no email verification required
    });

    // Return user data (excluding sensitive information)
    const { password: _, emailVerificationToken: __, ...userData } = user.toObject();
    res.status(201).json({
      user: userData,
      message: 'User account created successfully.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error creating user account' });
  }
});

// Email verification route
router.get('/verify-email/:token', async (req, res) => {
  try {
    await connectDB();
    const { token } = req.params;
    console.log('[DEBUG] Verifying email with token:', token);

    if (!token) {
      console.log('[DEBUG] No token provided');
      return res.status(400).json({ 
        success: false,
        error: 'Verification token is required' 
      });
    }

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    console.log('[DEBUG] User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('[DEBUG] User details:', {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        tokenExpires: user.emailVerificationExpires
      });
    }

    if (!user) {
      // Check if token exists but is expired
      const expiredUser = await User.findOne({ emailVerificationToken: token });
      if (expiredUser) {
        console.log('[DEBUG] Token found but expired');
        return res.status(400).json({ 
          success: false,
          error: 'Verification token has expired. Please request a new verification email.',
          expired: true
        });
      }

      console.log('[DEBUG] Invalid token');
      return res.status(400).json({ 
        success: false,
        error: 'Invalid verification token. Please request a new verification email.' 
      });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      console.log('[DEBUG] Email already verified');
      return res.status(200).json({ 
        success: true,
        message: 'Email is already verified. You can now log in.',
        alreadyVerified: true,
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    }

    console.log('[DEBUG] Updating user verification status');
    // Update user verification status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      console.log('[DEBUG] Sending welcome email');
      const welcomeEmail = templates.welcomeEmail({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      });
      
      await sendEmail({
        to: user.email,
        subject: welcomeEmail.subject,
        text: welcomeEmail.text,
        html: welcomeEmail.html
      });
      
      console.log(`[INFO] Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error('[ERROR] Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    console.log('[DEBUG] Verification successful');
    res.json({ 
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('[ERROR] Email verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while verifying your email. Please try again or contact support.' 
    });
  }
});

// Update login route to check for email verification
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Email verification is not required - users can log in immediately after account creation

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data and token
    const { password: _, emailVerificationToken: __, ...userData } = user.toObject();
    res.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Resend verification email route
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Generate verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

    // Send verification email
    const verificationEmail = templates.emailVerification(verificationUrl, {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email
    });

    await sendEmail({
      to: user.email,
      subject: verificationEmail.subject,
      text: verificationEmail.text,
      html: verificationEmail.html
    });

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Error sending verification email' });
  }
});

// Service Package routes
router.get('/service-packages', async (req, res) => {
  try {
    await connectDB();
    const packages = await ServicePackage.find();
    res.json(packages);
  } catch (error) {
    console.error('Error fetching service packages:', error);
    res.status(500).json({ error: 'Failed to fetch service packages' });
  }
});

router.post('/service-packages', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    console.log('Creating service package with data:', req.body);
    await connectDB();
    const {
      name,
      description,
      base_price,
      is_hourly,
      minimum_hours,
      vehicle_id,
      image_url,
      is_active,
      airports
    } = req.body;

    // Validate required fields
    if (!name || !base_price) {
      console.log('Validation failed:', { name, base_price });
      return res.status(400).json({ error: 'Name and base price are required' });
    }

    // Create the new service package
    const newPackage = new ServicePackage({
      name,
      description,
      base_price,
      is_hourly,
      minimum_hours,
      vehicle_id,
      image_url,
      is_active,
      airports,
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log('Attempting to save package:', newPackage);
    const savedPackage = await newPackage.save();
    console.log('Package saved successfully:', savedPackage);
    res.status(201).json(savedPackage);
  } catch (error) {
    console.error('Error creating service package:', error);
    res.status(500).json({ 
      error: 'Failed to create service package',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/service-packages/:id', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    await connectDB();
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid service package ID format' });
    }
    
    // Check if package exists first
    const existingPackage = await ServicePackage.findById(req.params.id);
    if (!existingPackage) {
      return res.status(404).json({ error: 'Service package not found' });
    }
    
    const {
      name,
      description,
      base_price,
      is_hourly,
      minimum_hours,
      vehicle_id,
      image_url,
      is_active,
      airports
    } = req.body;
    
    // Validate required fields
    if (name !== undefined && !name) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    if (base_price !== undefined) {
      // Validate base price is a positive number
      if (typeof base_price !== 'number' || base_price <= 0) {
        return res.status(400).json({ error: 'Base price must be a positive number' });
      }
    }

    // Validate minimum hours if is_hourly is true
    if (is_hourly && minimum_hours !== undefined && (!minimum_hours || minimum_hours <= 0)) {
      return res.status(400).json({ error: 'Minimum hours must be a positive number for hourly packages' });
    }

    // Build update object with only provided fields
    const updateFields: { [key: string]: any } = {
      updated_at: new Date()
    };

    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) {
      // Ensure description is not empty if provided (schema requires it)
      if (description === '' || description === null) {
        return res.status(400).json({ error: 'Description cannot be empty' });
      }
      updateFields.description = description;
    }
    if (base_price !== undefined) updateFields.base_price = base_price;
    if (is_hourly !== undefined) {
      updateFields.is_hourly = is_hourly;
      // Only set minimum_hours if is_hourly is true, otherwise set to undefined
      if (is_hourly && minimum_hours !== undefined) {
        updateFields.minimum_hours = minimum_hours;
      } else if (!is_hourly) {
        // If not hourly, set minimum_hours to undefined
        updateFields.minimum_hours = undefined;
      }
    } else if (minimum_hours !== undefined) {
      // If is_hourly is not being changed but minimum_hours is provided
      // Check current package to see if it's hourly
      const currentPackage = await ServicePackage.findById(req.params.id).lean();
      if (currentPackage && (currentPackage as any).is_hourly) {
        updateFields.minimum_hours = minimum_hours;
      } else if (currentPackage && !(currentPackage as any).is_hourly) {
        return res.status(400).json({ error: 'Cannot set minimum_hours for non-hourly packages' });
      }
    }
    if (vehicle_id !== undefined) updateFields.vehicle_id = vehicle_id;
    if (image_url !== undefined) updateFields.image_url = image_url;
    if (is_active !== undefined) updateFields.is_active = is_active;
    if (airports !== undefined) updateFields.airports = airports;

    console.log('[DEBUG] Updating service package:', req.params.id);
    console.log('[DEBUG] Update fields:', JSON.stringify(updateFields, null, 2));

    // Use $set operator for proper MongoDB update
    const updateData: any = { $set: updateFields };
    
    // If minimum_hours is being set to undefined, use $unset
    if (updateFields.minimum_hours === undefined && existingPackage.is_hourly === false) {
      updateData.$unset = { minimum_hours: '' };
      delete updateData.$set.minimum_hours;
    }

    const updatedPackage = await ServicePackage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ error: 'Service package not found after update' });
    }

    console.log('[DEBUG] Service package updated successfully:', updatedPackage._id);
    res.json(updatedPackage);
  } catch (error: any) {
    console.error('[ERROR] Error updating service package:', error);
    console.error('[ERROR] Error stack:', error?.stack);
    console.error('[ERROR] Error name:', error?.name);
    console.error('[ERROR] Error code:', error?.code);
    
    // Handle MongoDB validation errors
    if (error?.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message);
      return res.status(400).json({ 
        error: 'Validation error',
        details: validationErrors.join(', ')
      });
    }
    
    // Handle MongoDB cast errors
    if (error?.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid data format',
        details: error.message
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to update service package',
      details: errorMessage
    });
  }
});

router.delete('/service-packages/:id', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    await connectDB();
    const deletedPackage = await ServicePackage.findByIdAndDelete(req.params.id);
    if (!deletedPackage) {
      return res.status(404).json({ error: 'Service package not found' });
    }
    res.json({ message: 'Service package deleted successfully' });
  } catch (error) {
    console.error('Error deleting service package:', error);
    res.status(500).json({ error: 'Failed to delete service package' });
  }
});

// Admin dashboard routes
router.get('/admin/dashboard/stats', async (req: Request, res: Response) => {
  try {
    await connectDB();
    
    const [
      totalBookings,
      totalCustomers,
      totalDrivers,
      totalVehicles,
      totalRevenue
    ] = await Promise.all([
      Booking.countDocuments(),
      Profile.countDocuments({ role: 'customer' }),
      Profile.countDocuments({ role: 'driver' }),
      Vehicle.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    res.json({
      totalBookings,
      totalCustomers,
      totalDrivers,
      totalVehicles,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/admin/recent-bookings', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const limit = parseInt(req.query.limit as string) || 5;
    
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('customerId', 'firstName lastName email phone')
      .populate('vehicleId', 'make model')
      .populate('driverId', 'firstName lastName')
      .lean();
    
    const bookingsWithPackages = bookings.map(addPackageInformation);
    res.json(bookingsWithPackages);
  } catch (error) {
    console.error('Failed to fetch recent bookings:', error);
    res.status(500).json({ error: 'Failed to fetch recent bookings' });
  }
});

router.get('/admin/dashboard/monthly-bookings', async (req: Request, res: Response) => {
  try {
    await connectDB();
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const formattedStats = monthlyStats.map(stat => ({
      month: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}`,
      bookings: stat.bookings,
      revenue: stat.revenue
    }));

    res.json(formattedStats);
  } catch (error) {
    console.error('Failed to fetch monthly bookings:', error);
    res.status(500).json({ error: 'Failed to fetch monthly bookings' });
  }
});

// Customer routes
router.get('/customers/by-profile/:profileId', async (req, res) => {
  try {
    await connectDB();
    
    // First find the profile
    const profile = await Profile.findById(req.params.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Then find the customer record
    const customer = await Customer.findOne({ profileId: profile._id });
    
    // Return both profile and customer data
    res.json({
      profile: {
        _id: profile._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode
      },
      customer: customer || null
    });
  } catch (error) {
    console.error('Error fetching customer by profile ID:', error);
    res.status(500).json({ error: 'Failed to fetch customer data' });
  }
});

// Update customer data
router.put('/customers/by-profile/:profileId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    
    // First find the profile
    const profile = await Profile.findById(req.params.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Verify that the authenticated user is updating their own profile
    if (profile.userId.toString() !== req.user?.userId) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    // Prepare update objects with only the fields that are provided
    const userUpdate: any = {};
    const profileUpdate: any = {};
    const customerUpdate: any = {};

    if (req.body.firstName) userUpdate.firstName = req.body.firstName;
    if (req.body.lastName) userUpdate.lastName = req.body.lastName;
    if (req.body.email) userUpdate.email = req.body.email;
    if (req.body.phone) userUpdate.phone = req.body.phone;

    // Copy the same fields to profile update
    Object.assign(profileUpdate, userUpdate);
    if (req.body.address) profileUpdate.address = req.body.address;
    if (req.body.city) profileUpdate.city = req.body.city;
    if (req.body.state) profileUpdate.state = req.body.state;
    if (req.body.zipCode) profileUpdate.zipCode = req.body.zipCode;

    if (req.body.companyName) customerUpdate.companyName = req.body.companyName;
    if (req.body.billingAddress) customerUpdate.billingAddress = req.body.billingAddress;
    customerUpdate.userId = req.user.userId;

    // Update the User document
    const user = await User.findOneAndUpdate(
      { _id: profile.userId },
      userUpdate,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the Profile document
    const updatedProfile = await Profile.findOneAndUpdate(
      { _id: profile._id },
      profileUpdate,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Then find and update the customer record
    const customer = await Customer.findOneAndUpdate(
      { profileId: profile._id },
      customerUpdate,
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    if (!customer) {
      throw new Error('Failed to create or update customer record');
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      },
      profile: {
        _id: updatedProfile._id,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        address: updatedProfile.address,
        city: updatedProfile.city,
        state: updatedProfile.state,
        zipCode: updatedProfile.zipCode
      },
      customer: {
        _id: customer._id,
        profileId: customer.profileId,
        companyName: customer.companyName,
        billingAddress: customer.billingAddress
      }
    });
  } catch (error: any) {
    console.error('Error updating customer data:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid customer data provided' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A customer with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to update customer data' });
  }
});

// Driver Dashboard routes
router.get('/driver/dashboard-data', authMiddleware, driverRoleMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    
    // Get driver profile
    const profile = await Profile.findOne({ userId: req.user?.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    // Get current ride (if any)
    const currentRide = await Booking.findOne({
      driverId: profile._id,
      status: { $in: ['confirmed', 'in_progress'] }
    }).populate('customerId').populate('vehicleId');

    // Get upcoming rides
    const upcomingRides = await Booking.find({
      driverId: profile._id,
      status: 'pending',
      pickupTime: { $gt: new Date() }
    }).populate('customerId').populate('vehicleId').sort({ pickupTime: 1 });

    // Get past rides (last 10)
    const pastRides = await Booking.find({
      driverId: profile._id,
      status: 'completed'
    }).populate('customerId').populate('vehicleId')
      .sort({ pickupTime: -1 })
      .limit(10);

    // Calculate performance metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEarnings = await Booking.aggregate([
      {
        $match: {
          driverId: profile._id,
          status: 'completed',
          pickupTime: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' }
        }
      }
    ]);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const weeklyEarnings = await Booking.aggregate([
      {
        $match: {
          driverId: profile._id,
          status: 'completed',
          pickupTime: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' }
        }
      }
    ]);

    // Get driver ratings
    const ratings = await DriverRating.find({ driverId: profile._id });
    const averageRating = ratings.length > 0
      ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
      : 0;

    const dashboardData = {
      profile: {
        _id: profile._id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: profile.role,
        phone: profile.phone,
        driverStatus: profile.driverStatus
      },
      currentRide: currentRide ? {
        ...currentRide.toObject(),
        customerId: currentRide.customerId,
        vehicleId: currentRide.vehicleId
      } : null,
      upcomingRides: upcomingRides.map(ride => ({
        ...ride.toObject(),
        customerId: ride.customerId,
        vehicleId: ride.vehicleId
      })),
      pastRides: pastRides.map(ride => ({
        ...ride.toObject(),
        customerId: ride.customerId,
        vehicleId: ride.vehicleId
      })),
      performanceMetrics: {
        todayEarnings: todayEarnings[0]?.total || 0,
        weeklyEarnings: weeklyEarnings[0]?.total || 0,
        rating: averageRating,
        completedRides: pastRides.length
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching driver dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch driver dashboard data' });
  }
});

// Driver Profile routes
router.get('/driver/profile', authMiddleware, driverRoleMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    
    // Get driver profile
    const profile = await Profile.findOne({ userId: req.user?.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ error: 'Failed to fetch driver profile' });
  }
});

router.put('/driver/profile', authMiddleware, driverRoleMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    
    // Get driver profile
    const profile = await Profile.findOne({ userId: req.user?.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    // Update profile fields
    const updateFields = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      licenseNumber: req.body.licenseNumber
    };

    // Update the Profile document
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: req.user?.userId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    // Update the User document
    const user = await User.findOneAndUpdate(
      { _id: profile.userId },
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      profile: updatedProfile,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error: any) {
    console.error('Error updating driver profile:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message).join(', ');
      return res.status(400).json({ error: `Validation failed: ${messages}` });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `An account with this ${field} already exists.` });
    }
    res.status(500).json({ error: 'Failed to update profile. Please try again.' });
  }
});

// Driver change password route
router.put('/driver/change-password', authMiddleware, driverRoleMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Find the user
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Error changing password:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message).join(', ');
      return res.status(400).json({ error: `Validation failed: ${messages}` });
    }
    res.status(500).json({ error: 'Failed to change password. Please try again.' });
  }
});

// Assign driver to booking
router.put('/bookings/:id/assign-driver', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { driverId, sendEmail } = req.body;

    if (!driverId) {
      return res.status(400).json({ error: 'Driver ID is required' });
    }

    // Validate driver exists and is a driver
    const driver = await Profile.findOne({ _id: driverId, role: 'driver' });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Find and update the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking with driver assignment
    booking.driverId = driverId;
    booking.status = 'confirmed';
    await booking.save();

    // Create status history entry
    await BookingStatusHistory.create({
      bookingId: booking._id,
      status: 'confirmed',
      changedBy: req.user?.userId,
      comment: `Driver ${driver.firstName} ${driver.lastName} assigned`
    });

    // Populate the booking data for response and email
    // Don't use .lean() initially to ensure populate works, then convert if needed
    const populatedBooking = await Booking.findById(id)
      .populate({
        path: 'customerId',
        select: 'firstName lastName email phone',
        model: 'Profile'
      })
      .populate('vehicleId')
      .populate({
        path: 'driverId',
        select: 'firstName lastName email phone',
        model: 'Profile'
      });

    if (!populatedBooking) {
      return res.status(404).json({ error: 'Failed to retrieve updated booking' });
    }
    
    // Convert to plain object for email template
    const bookingForEmail = populatedBooking.toObject ? populatedBooking.toObject() : { ...populatedBooking };
    
    console.log('[DRIVER ASSIGNMENT] Populated booking retrieved:', {
      bookingId: bookingForEmail._id,
      hasDriverId: !!bookingForEmail.driverId,
      driverIdType: typeof bookingForEmail.driverId,
      driverIdIsObject: bookingForEmail.driverId && typeof bookingForEmail.driverId === 'object',
      driverName: bookingForEmail.driverId ? `${(bookingForEmail.driverId as any).firstName} ${(bookingForEmail.driverId as any).lastName}` : 'N/A'
    });

    // Send driver assignment email to customer (only if sendEmail is true)
    if (sendEmail === true) {
      try {
        // Try multiple ways to get customer email
        const customerEmail = bookingForEmail.customerEmail || 
          (bookingForEmail.customerId as any)?.email ||
          (bookingForEmail as any).customer?.email;
        
        console.log('[DRIVER ASSIGNMENT] Attempting to send email. Customer email:', customerEmail);
        console.log('[DRIVER ASSIGNMENT] Booking data:', {
          bookingId: bookingForEmail._id,
          customerEmail: bookingForEmail.customerEmail,
          hasCustomerId: !!bookingForEmail.customerId,
          hasDriverId: !!bookingForEmail.driverId
        });
        
        if (customerEmail) {
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(customerEmail)) {
            // Ensure driver information is available
            if (!bookingForEmail.driverId) {
              console.error('[DRIVER ASSIGNMENT] ERROR: Driver ID not found in populated booking');
              console.error('[DRIVER ASSIGNMENT] Booking driverId field:', bookingForEmail.driverId);
              console.error('[DRIVER ASSIGNMENT] Original driverId from request:', driverId);
              // Try to manually populate driver if it's just an ObjectId
              if (driverId && driver) {
                console.log('[DRIVER ASSIGNMENT] Manually adding driver info to booking object');
                bookingForEmail.driverId = {
                  firstName: driver.firstName,
                  lastName: driver.lastName,
                  email: driver.email || '',
                  phone: driver.phone || ''
                } as any;
              }
            }
            
            // Check if we have driver info now
            if (bookingForEmail.driverId && typeof bookingForEmail.driverId === 'object') {
              console.log('[DRIVER ASSIGNMENT] Sending driver assignment email to customer:', customerEmail);
              console.log('[DRIVER ASSIGNMENT] Driver info:', {
                firstName: (bookingForEmail.driverId as any).firstName,
                lastName: (bookingForEmail.driverId as any).lastName,
                phone: (bookingForEmail.driverId as any).phone
              });
              
              const emailTemplate = templates.driverAssignment(bookingForEmail);
              console.log('[DRIVER ASSIGNMENT] Email template created successfully');
              
              // Send email - this will throw an error if SMTP_USER is not karlimolax@gmail.com
              await sendEmail({
                to: customerEmail,
                subject: emailTemplate.subject,
                text: emailTemplate.text,
                html: emailTemplate.html
              });
              
              console.log('[SUCCESS] Driver assignment email sent successfully from karlimolax@gmail.com to customer:', customerEmail);
            } else {
              console.error('[DRIVER ASSIGNMENT] ERROR: Driver information not available after populate. Cannot send email.');
              console.error('[DRIVER ASSIGNMENT] DriverId value:', bookingForEmail.driverId);
            }
          } else {
            console.error('[DRIVER ASSIGNMENT] Invalid email format for driver assignment email:', customerEmail);
          }
        } else {
          console.warn('[DRIVER ASSIGNMENT] No customer email found for driver assignment notification. Booking:', bookingForEmail._id);
          console.warn('[DRIVER ASSIGNMENT] Available booking fields:', Object.keys(bookingForEmail));
        }
      } catch (emailError: any) {
        console.error('[DRIVER ASSIGNMENT] Failed to send driver assignment email:', emailError);
        console.error('[DRIVER ASSIGNMENT] Error details:', {
          message: emailError?.message,
          stack: emailError?.stack,
          name: emailError?.name
        });
        // Don't fail the driver assignment if email fails, but log it clearly
      }
    } else {
      console.log('[DRIVER ASSIGNMENT] Email sending skipped (sendEmail=false or not provided)');
    }
    
    // Return populated booking (convert to object if needed)
    const responseBooking = populatedBooking.toObject ? populatedBooking.toObject() : bookingForEmail;
    res.json(responseBooking);
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ error: 'Failed to assign driver' });
  }
});

// Driver rides endpoint
router.get('/driver/rides', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.user.userId;

    // Find all bookings assigned to this driver
    const bookings = await Booking.find({ driverId })
      .populate('customerId', 'firstName lastName')
      .populate('vehicleId', 'name')
      .sort({ pickupTime: -1 });

    // Transform the bookings into the format expected by the frontend
    const rides = bookings.map(booking => ({
      id: booking._id,
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      scheduledTime: booking.pickupTime,
      status: booking.status,
      customerName: `${booking.customerId?.firstName || ''} ${booking.customerId?.lastName || ''}`,
      vehicleType: booking.vehicleId?.name || 'Unknown Vehicle',
      price: booking.price || 0,
      distance: booking.distance || '0 km',
      duration: booking.duration || '0 min'
    }));

    res.json({ rides });
  } catch (error) {
    console.error('Error fetching driver rides:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Driver ride status update endpoint
router.patch('/driver/rides/:id/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const driverId = req.user.userId;

    // Find the booking and verify it belongs to this driver
    const booking = await Booking.findOne({ _id: id, driverId });
    if (!booking) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Update the booking status
    booking.status = status;
    booking.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: driverId
    });

    await booking.save();

    res.json({ message: 'Ride status updated successfully' });
  } catch (error) {
    console.error('Error updating ride status:', error);
    res.status(500).json({ error: 'Failed to update ride status' });
  }
});

// Customer bookings endpoint
router.get('/bookings/customer', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  console.log('here1');
  try {
    if (!req.user?.userId || !req.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await connectDB();
    
    // Get profile
    const profile = await Profile.findOne({ email: req.user.email });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let bookings;
    if (profile.role === 'driver') {
      bookings = await Booking.find({ customerEmail: req.user.email })
        .populate({ path: 'driverId', select: 'firstName lastName', model: 'Profile' })
        .populate({ path: 'vehicleId', select: 'name', model: 'Vehicle' })
        .populate({ path: 'customerId', select: 'firstName lastName', model: 'Profile' })
        .sort({ pickupTime: -1 });
    } else if (profile.role === 'customer') {
      bookings = await Booking.find({ customerEmail: req.user.email })
        .populate({ path: 'driverId', select: 'firstName lastName', model: 'Profile' })
        .populate({ path: 'vehicleId', select: 'name', model: 'Vehicle' })
        .populate({ path: 'customerId', select: 'firstName lastName', model: 'Profile' })
        .sort({ pickupTime: -1 });
    } else {
      return res.status(403).json({ error: 'Unauthorized role' });
    }

    // Debug: Log bookings
    console.log('[DEBUG] /bookings/customer - bookings found:', bookings.length);

    // Helper to check if a value is a populated object
    function isPopulated(obj) {
      return obj && typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof require('mongoose').Types.ObjectId);
    }

    // Transform the bookings into the format expected by the frontend
    const transformedBookings = bookings.map(booking => {
      let driverName = 'Not assigned';
      if (isPopulated(booking.driverId) && booking.driverId.firstName) {
        driverName = `${booking.driverId.firstName} ${booking.driverId.lastName}`;
      }
      let vehicleType = 'Unknown Vehicle';
      if (isPopulated(booking.vehicleId) && booking.vehicleId.name) {
        vehicleType = booking.vehicleId.name;
      }
      let customerName = 'Unknown Customer';
      if (isPopulated(booking.customerId) && booking.customerId.firstName) {
        customerName = `${booking.customerId.firstName} ${booking.customerId.lastName}`;
      }
      return {
        id: booking._id,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        scheduledTime: booking.pickupTime,
        status: booking.status,
        driverName,
        vehicleType,
        price: booking.price || 0,
        distance: booking.distance || '0 km',
        duration: booking.duration || '0 min',
        customerName
      };
    });

    res.json({ bookings: transformedBookings });
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

interface GooglePlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
}

interface GooglePlaceSearchResponse {
  results: GooglePlaceSearchResult[];
  status: string;
}

interface GooglePlaceReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url?: string;
}

interface GooglePlaceDetails {
  result: {
    reviews?: GooglePlaceReview[];
    rating?: number;
    user_ratings_total?: number;
  };
  status: string;
}

// Google Reviews endpoint
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const fallback = {
      reviews: [],
      totalRatings: 0,
      averageRating: 0
    };

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('Google Places API key not configured');
      return res.json(fallback);
    }
  
    // Prefer a configured Place ID if available, else fallback to text search
    let placeId = process.env.GOOGLE_PLACE_ID || process.env.GOOGLE_PLACES_PLACE_ID || process.env.PLACE_ID || '';
    if (!placeId) {
      // Search for the place to get its ID
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=Dapper%20Limo%20Los%20Angeles&location=34.0522,-118.2437&radius=50000&key=${apiKey}`;
      const searchResponse = await fetch(searchUrl as any);
      const searchData = await searchResponse.json() as GooglePlaceSearchResponse;
  
      console.log('Search response:', JSON.stringify(searchData, null, 2));
  
      if (!searchData.results || searchData.results.length === 0) {
        console.error('No results found for Dapper Limo');
        return res.json(fallback);
      }
  
      placeId = searchData.results[0].place_id;
      console.log('Found place ID via search:', placeId, 'for business:', searchData.results[0].name);
    }
  
    // Then fetch the place details including reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name,formatted_address&key=${apiKey}`;
    const detailsResponse = await fetch(detailsUrl as any);
    const detailsData = await detailsResponse.json() as GooglePlaceDetails;
  
    console.log('Details response:', JSON.stringify(detailsData, null, 2));
  
    if (!detailsData.result || !detailsData.result.reviews) {
      console.error('No reviews found for Dapper Limo');
      return res.json(fallback);
    }
  
    // Transform the reviews to match our frontend format
    const reviews = detailsData.result.reviews.map(review => ({
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.time,
      profile_photo_url: review.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}`
    }));
  
    console.log('Fetched reviews:', reviews.length);
  
    res.json({
      reviews,
      totalRatings: detailsData.result.user_ratings_total || 0,
      averageRating: detailsData.result.rating || 0
    });
  
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    // Return empty reviews array if there's an error
    res.json({
      reviews: [],
      totalRatings: 0,
      averageRating: 0
    });
  }
});

// Instagram media thumbnails endpoint
router.get('/instagram/media', async (req: Request, res: Response) => {
  try {
    const username = process.env.INSTAGRAM_USERNAME;
    const password = process.env.INSTAGRAM_PASSWORD;
    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam ? Number(limitParam) : 12;
    const fetchAll = String(req.query.all || '').toLowerCase() === 'true';
    const MAX_ITEMS = 120;

    if (!username || !password) {
      console.error('Instagram credentials not configured (INSTAGRAM_USERNAME/INSTAGRAM_PASSWORD)');
      return res.json({ images: [] });
    }

    const ig = new IgApiClient();
    ig.state.generateDevice(username);

    // Optional: load saved state from disk or env to avoid frequent challenges
    try {
      const savedState = process.env.INSTAGRAM_STATE_JSON;
      if (savedState) {
        await ig.state.deserialize(savedState);
      }
    } catch {}

    await ig.account.login(username, password);

    // Save state for reuse if needed
    try {
      const serialized = await ig.state.serialize();
      delete (serialized as any).constants;
      // If you want to persist: process.env.INSTAGRAM_STATE_JSON = JSON.stringify(serialized);
    } catch {}

    const targetUsername = (req.query.username as string) || process.env.INSTAGRAM_TARGET_USERNAME || 'k.a.r_limousine';
    const targetId = await ig.user.getIdByUsername(targetUsername);
    const feed = ig.feed.user(targetId);
    let userMediaItems: any[] = [];
    try {
      // First page
      userMediaItems = await feed.items();
      // If requested, keep fetching pages up to cap
      if (fetchAll) {
        while (userMediaItems.length < MAX_ITEMS) {
          const nextPage = await feed.items();
          if (!Array.isArray(nextPage) || nextPage.length === 0) break;
          userMediaItems = userMediaItems.concat(nextPage);
        }
      }
    } catch {}

    const images: Array<{ src: string; href?: string; alt?: string }> = [];

    const toHttps = (url?: string) => (url ? url.replace(/^http:/, 'https:') : '');
    const pickBestCandidate = (candidates?: Array<{ url: string; width?: number }>) => {
      if (!Array.isArray(candidates) || candidates.length === 0) return '';
      const sorted = [...candidates].sort((a, b) => (b.width || 0) - (a.width || 0));
      return toHttps(sorted[0]?.url);
    };

    const seen = new Set<string>();

    for (const item of userMediaItems) {
      const cap = fetchAll ? MAX_ITEMS : limit;
      if (images.length >= cap) break;
      const code = item.code;
      const href = code ? `https://www.instagram.com/p/${code}/` : undefined;
      const alt = (item.caption?.text && typeof item.caption.text === 'string') ? item.caption.text.substring(0, 120) : 'Instagram post';

      // Single image
      if (item.media_type === 1 && item.image_versions2?.candidates?.length) {
        const url = pickBestCandidate(item.image_versions2.candidates);
        if (url && !seen.has(url)) {
          images.push({ src: url, href, alt });
          seen.add(url);
        }
        continue;
      }

      // Carousel: add each image child until limit
      if (item.media_type === 8 && Array.isArray(item.carousel_media)) {
        for (const child of item.carousel_media) {
          const cap2 = fetchAll ? MAX_ITEMS : limit;
          if (images.length >= cap2) break;
          if (child.media_type === 1 && child.image_versions2?.candidates?.length) {
            const url = pickBestCandidate(child.image_versions2.candidates);
            if (url && !seen.has(url)) {
              images.push({ src: url, href, alt });
              seen.add(url);
            }
          } else if (child.media_type === 2 && child.image_versions2?.candidates?.length) {
            // Video child: use cover image if available
            const url = pickBestCandidate(child.image_versions2.candidates);
            if (url && !seen.has(url)) {
              images.push({ src: url, href, alt });
              seen.add(url);
            }
          }
        }
        continue;
      }

      // Video: try to use cover image if available; otherwise skip
      if (item.media_type === 2 && item.image_versions2?.candidates?.length) {
        const url = pickBestCandidate(item.image_versions2.candidates);
        if (url && !seen.has(url)) {
          images.push({ src: url, href, alt });
          seen.add(url);
        }
      }
    }

    // Return proxied image URLs to avoid client-side issues and handle CORS/expiry
    const proxiedImages = images.map(img => ({
      ...img,
      src: `/api/instagram/image?u=${encodeURIComponent(Buffer.from(img.src).toString('base64'))}`
    }));

    return res.json({ images: proxiedImages });
  } catch (err) {
    console.error('Failed to fetch Instagram media:', err);
    return res.json({ images: [] });
  }
});

// Instagram image proxy endpoint
router.get('/instagram/image', async (req: Request, res: Response) => {
  try {
    const encoded = (req.query.u as string) || '';
    if (!encoded) {
      return res.status(400).send('Missing image URL');
    }
    const decodedUrl = Buffer.from(encoded, 'base64').toString('utf8');
    let parsed: URL;
    try {
      parsed = new URL(decodedUrl);
    } catch {
      return res.status(400).send('Invalid image URL');
    }

    const hostname = parsed.hostname.toLowerCase();
    const allowed = hostname.includes('cdninstagram.com') || hostname.includes('fbcdn.net') || hostname.includes('instagram');
    if (!allowed) {
      return res.status(400).send('Disallowed host');
    }

    const upstream = await fetch(decodedUrl as any, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!upstream.ok) {
      return res.status(502).send('Failed to fetch image');
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Instagram image proxy error:', err);
    res.status(500).send('Proxy error');
  }
});

// Contact form email endpoint
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // Fetch admin emails from settings
    const adminSettings = await AdminSettings.findOne({ type: 'settings', key: 'admin_settings' });
    const adminEmails = adminSettings?.emailNotifications?.adminEmails || [];
    if (!adminEmails.length) {
      return res.status(500).json({ error: 'No admin email is configured to receive contact form submissions.' });
    }

    // Compose email content
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    await sendEmail({
      to: adminEmails.join(','),
      subject: 'New Contact Form Submission',
      html,
    });

    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending contact form email:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// Customer profile update route
router.put('/customer/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    
    // Get customer profile
    const profile = await Profile.findOne({ userId: req.user?.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Prepare update objects with only the fields that are provided
    const userUpdate: any = {};
    const customerUpdate: any = {};

    // User and Profile fields (excluding email)
    if (req.body.firstName) userUpdate.firstName = req.body.firstName;
    if (req.body.lastName) userUpdate.lastName = req.body.lastName;
    if (req.body.phone) userUpdate.phone = req.body.phone;
    if (req.body.address) userUpdate.address = req.body.address;
    if (req.body.city) userUpdate.city = req.body.city;
    if (req.body.state) userUpdate.state = req.body.state;
    if (req.body.zipCode) userUpdate.zipCode = req.body.zipCode;

    // Customer specific fields
    if (req.body.companyName) customerUpdate.companyName = req.body.companyName;
    if (req.body.billingAddress) customerUpdate.billingAddress = req.body.billingAddress;
    customerUpdate.userId = req.user?.userId;

    // Update the User document
    const user = await User.findOneAndUpdate(
      { _id: profile.userId },
      userUpdate,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error: any) {
    console.error("Error updating customer profile:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message).join(', ');
      return res.status(400).json({ error: `Validation failed: ${messages}` });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `An account with this ${field} already exists.` });
    }
    res.status(500).json({ error: 'Failed to update profile. Please try again.' });
  }
});

// Change password route
router.put('/customer/change-password', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Find the user
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Error changing password:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message).join(', ');
      return res.status(400).json({ error: `Validation failed: ${messages}` });
    }
    res.status(500).json({ error: 'Failed to change password. Please try again.' });
  }
});

// Authorize.Net client config for Accept.js (safe to expose)
router.get('/payments/authorize/config', async (_req, res) => {
  try {
    const clientKey = process.env.AUTHORIZE_CLIENT_KEY || process.env.VITE_AUTHORIZE_CLIENT_KEY;
    const apiLoginID = process.env.AUTHORIZE_API_LOGIN_ID || process.env.VITE_AUTHORIZE_API_LOGIN_ID;
    if (!clientKey || !apiLoginID) {
      return res.status(500).json({ error: 'Authorize.Net client keys not configured' });
    }
    return res.json({ clientKey, apiLoginID });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load payment configuration' });
  }
});

// Test Authorize.Net configuration (for debugging)
router.get('/payments/authorize/test-config', async (_req, res) => {
  try {
    const loginId = process.env.AUTHORIZE_API_LOGIN_ID;
    const transactionKey = process.env.AUTHORIZE_TRANSACTION_KEY;
    const clientKey = process.env.AUTHORIZE_CLIENT_KEY;
    const env = process.env.AUTHORIZE_ENV || 'sandbox';
    
    const config = {
      hasLoginId: !!loginId,
      loginIdLength: loginId?.length,
      hasTransactionKey: !!transactionKey,
      transactionKeyLength: transactionKey?.length,
      hasClientKey: !!clientKey,
      clientKeyLength: clientKey?.length,
      environment: env,
      allAuthorizeVars: Object.keys(process.env).filter(key => key.includes('AUTHORIZE'))
    };
    
    console.log('[Authorize.Net DEBUG] Configuration test:', config);
    
    return res.json({
      success: true,
      config,
      message: loginId && transactionKey ? 'Credentials appear to be configured' : 'Missing credentials'
    });
  } catch (err) {
    console.error('[Authorize.Net ERROR] Config test failed:', err);
    return res.status(500).json({ error: 'Failed to test configuration' });
  }
});

// Proxy Accept.js through our domain to avoid blockers and CSP issues
router.get('/payments/accept-js', async (req, res) => {
  try {
    const authorizeDebug = String(process.env.AUTHORIZE_DEBUG || 'true').toLowerCase() === 'true';
    const env = (process.env.AUTHORIZE_ENV || 'sandbox').toLowerCase();
    const useProd = env === 'production';
    const primary = useProd ? 'https://js.authorize.net/v1/Accept.js' : 'https://jstest.authorize.net/v1/Accept.js';
    const fallback = useProd ? 'https://jstest.authorize.net/v1/Accept.js' : 'https://js.authorize.net/v1/Accept.js';

    const tryFetch = async (url: string) => {
      if (authorizeDebug) console.log('[Authorize.Net DEBUG] Proxy fetch', { url });
      const upstream = await fetch(url as any, {
        method: 'GET',
        headers: {
          'Accept': 'application/javascript,text/javascript,application/x-javascript,*/*;q=0.1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Cache-Control': 'no-cache'
        }
      });
      return upstream;
    };

    let upstream = await tryFetch(primary);
    if (!upstream.ok) {
      if (authorizeDebug) console.warn('[Authorize.Net WARN] Primary Accept.js fetch failed', { status: upstream.status });
      upstream = await tryFetch(fallback);
    }
    if (!upstream.ok) {
      return res.status(502).send('Failed to load Accept.js');
    }

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=300');
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.send(buf);
  } catch (e) {
    return res.status(500).send('Accept.js proxy error');
  }
});

// Alias without the word "accept" to avoid overzealous blockers
router.get('/payments/library.js', async (req, res) => {
  try {
    const authorizeDebug = String(process.env.AUTHORIZE_DEBUG || 'true').toLowerCase() === 'true';
    const env = (process.env.AUTHORIZE_ENV || 'sandbox').toLowerCase();
    const useProd = env === 'production';
    const primary = useProd ? 'https://js.authorize.net/v1/Accept.js' : 'https://jstest.authorize.net/v1/Accept.js';
    const fallback = useProd ? 'https://jstest.authorize.net/v1/Accept.js' : 'https://js.authorize.net/v1/Accept.js';

    const tryFetch = async (url: string) => {
      if (authorizeDebug) console.log('[Authorize.Net DEBUG] Proxy fetch (alias)', { url });
      const upstream = await fetch(url as any, {
        method: 'GET',
        headers: {
          'Accept': 'application/javascript,text/javascript,application/x-javascript,*/*;q=0.1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Cache-Control': 'no-cache'
        }
      });
      return upstream;
    };

    let upstream = await tryFetch(primary);
    if (!upstream.ok) {
      if (authorizeDebug) console.warn('[Authorize.Net WARN] Primary library fetch failed', { status: upstream.status });
      upstream = await tryFetch(fallback);
    }
    if (!upstream.ok) {
      return res.status(502).send('Failed to load library');
    }

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=300');
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.send(buf);
  } catch (e) {
    return res.status(500).send('Library proxy error');
  }
});

// Authorize.Net: test payment processing
router.post('/payments/authorize/test', async (req: Request, res: Response) => {
  try {
    const authorizeDebug = String(process.env.AUTHORIZE_DEBUG || 'true').toLowerCase() === 'true';
    
    if (authorizeDebug) {
      console.log('[Authorize.Net DEBUG] Test payment request received');
    }

    const loginId = process.env.AUTHORIZE_API_LOGIN_ID;
    const transactionKey = process.env.AUTHORIZE_TRANSACTION_KEY;
    
    if (!loginId || !transactionKey) {
      return res.status(500).json({ 
        error: 'Authorize.Net credentials not configured',
        success: false
      });
    }

    const isProduction = (process.env.AUTHORIZE_ENV || '').toLowerCase() === 'production';
    const endpoint = isProduction
      ? 'https://api2.authorize.net/xml/v1/request.api'
      : 'https://apitest.authorize.net/xml/v1/request.api';

    // Test with a minimal amount (1 cent) to verify processing
    const body = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: loginId,
          transactionKey: transactionKey
        },
        transactionRequest: {
          transactionType: 'authCaptureTransaction',
          amount: 0.01,
          payment: {
            creditCard: {
              cardNumber: '4111111111111111',
              expirationDate: '2025-12',
              cardCode: '123'
            }
          },
          order: {
            description: 'Test Payment - Dapper Limo'
          }
        }
      }
    };

    const response = await fetch(endpoint as any, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const result = await response.json() as any;
    
    if (authorizeDebug) {
      console.log('[Authorize.Net DEBUG] Test payment response:', {
        status: response.status,
        resultCode: result?.transactionResponse?.responseCode || result?.messages?.resultCode,
        authCode: result?.transactionResponse?.authCode,
        transId: result?.transactionResponse?.transId,
        errorText: result?.transactionResponse?.errors?.[0]?.errorText || result?.messages?.message?.[0]?.text
      });
    }

    const resultCode = result?.transactionResponse?.responseCode || result?.messages?.resultCode;
    const ok = resultCode === '1' || result?.messages?.resultCode === 'Ok';

    if (!ok) {
      const errMsg = result?.transactionResponse?.errors?.[0]?.errorText
        || result?.messages?.message?.[0]?.text
        || 'Test payment failed';
      
      return res.status(402).json({ 
        error: errMsg, 
        success: false,
        raw: result 
      });
    }

    return res.json({
      success: true,
      message: 'Authorize.Net payment processing is working correctly',
      transactionId: result?.transactionResponse?.transId,
      authCode: result?.transactionResponse?.authCode,
      environment: isProduction ? 'production' : 'sandbox'
    });
  } catch (err) {
    console.error('Authorize.Net test error:', err);
    return res.status(500).json({ 
      error: 'Authorize.Net test failed',
      success: false 
    });
  }
});

// Auth.Net: simple auth test endpoint
router.get('/payments/authorize/auth-test', async (req: Request, res: Response) => {
  try {
    const loginId = (process.env.AUTHORIZE_API_LOGIN_ID || '').trim();
    const transactionKey = (process.env.AUTHORIZE_TRANSACTION_KEY || '').trim();
    const isProduction = (process.env.AUTHORIZE_ENV || '').toLowerCase() === 'production';
    const endpoint = isProduction
      ? 'https://api2.authorize.net/xml/v1/request.api'
      : 'https://apitest.authorize.net/xml/v1/request.api';
 
    if (!loginId || !transactionKey) {
      return res.status(500).json({ ok: false, error: 'Missing credentials' });
    }
 
    const body = {
      authenticateTestRequest: {
        merchantAuthentication: {
          name: loginId,
          transactionKey: transactionKey
        }
      }
    };
 
    const response = await fetch(endpoint as any, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    const ok = result?.messages?.resultCode === 'Ok';
    return res.status(ok ? 200 : 401).json({ ok, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Auth test failed' });
  }
});

export default router;