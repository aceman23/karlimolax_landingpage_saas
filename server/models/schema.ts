import mongoose, { Schema, Document } from 'mongoose';

// Profile Schema
const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'driver', 'customer'],
    default: 'customer'
  },
  phone: {
    type: String,
    trim: true
  },
  driverStatus: {
    type: String,
    enum: ['available', 'offline', 'on-ride'],
    default: 'offline'
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  licenseNumber: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: { type: Date, default: Date.now }
});

// Vehicle Schema
const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  capacity: { type: Number, required: true },
  pricePerHour: { type: Number, required: true },
  features: [{ type: String }],
  description: { type: String },
  imageUrl: { type: String },
  imageUrls: [{ type: String }],
  year: { type: Number },
  licensePlate: { type: String },
  vin: { type: String },
  color: { type: String },
  status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
  lastMaintenance: { type: Date },
  nextMaintenance: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Customer Schema
const customerSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  userId: { type: String, unique: true, sparse: true },
  companyName: String,
  billingAddress: String,
  billingCity: String,
  billingState: String,
  billingZipCode: String,
  paymentMethod: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Stop Schema
export interface IStop extends Document {
  bookingId: mongoose.Types.ObjectId;
  location: string;
  order: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const stopSchema = new Schema<IStop>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  location: { type: String, required: true },
  order: { type: Number, required: true },
  price: { type: Number, required: true },
}, { timestamps: true });

// Update Booking Schema
export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  vehicleId?: mongoose.Types.ObjectId;
  vehicleName?: string; // Add vehicle name field
  driverId?: mongoose.Types.ObjectId;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: Date;
  dropoffTime?: Date;
  status: string;
  price: number;
  paymentStatus: string;
  specialInstructions?: string;
  stops?: mongoose.Types.ObjectId[];
  packageId?: string;
  packageName?: string;
  hours?: number;
  isTest?: boolean;
  passengers?: number;
  totalAmount?: number;
  gratuity?: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
  notes?: string;
  carSeats?: number;
  boosterSeats?: number;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
  vehicleName: { type: String }, // Add vehicle name field
  driverId: { type: Schema.Types.ObjectId, ref: 'Profile' },
  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  pickupTime: { type: Date, required: true },
  dropoffTime: { type: Date },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] 
  },
  price: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    required: true, 
    enum: ['pending', 'paid', 'refunded'] 
  },
  specialInstructions: { type: String },
  stops: [{ type: Schema.Types.ObjectId, ref: 'Stop' }],
  packageId: { type: String },
  packageName: { type: String },
  hours: { type: Number },
  isTest: { type: Boolean, default: false },
  passengers: { type: Number, default: 1 },
  carSeats: { type: Number, default: 0 },
  boosterSeats: { type: Number, default: 0 },
  totalAmount: { type: Number },
  gratuity: {
    type: {
      type: String,
      enum: ['none', 'percentage', 'custom', 'cash'],
      default: 'none'
    },
    percentage: { type: Number },
    customAmount: { type: Number },
    amount: { type: Number, default: 0 }
  },
  notes: { type: String }
}, { timestamps: true });

// Service Package Schema
const servicePackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  base_price: { type: Number, required: true },
  duration: { type: Number, required: false }, // Duration in minutes, optional for now
  is_hourly: { type: Boolean, default: false },
  minimum_hours: { type: Number },
  vehicle_id: { type: String },
  image_url: { type: String },
  is_active: { type: Boolean, default: true },
  airports: [{ type: String }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Driver Document Schema
const driverDocumentSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: { type: String, required: true },
  number: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  fileUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Driver Rating Schema
const driverRatingSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

// Booking Status History Schema
const bookingStatusHistorySchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

// Admin Settings Schema
const adminSettingsSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['settings'] },
  key: { type: String, required: true, unique: true },
  // Booking settings
  // Note: default is true, but false values must be explicitly saved
  bookingsEnabled: { type: Boolean, default: true, required: false },
  // Notification settings
  smsEnabled: { type: Boolean, default: true },
  emailEnabled: { type: Boolean, default: true },
  bookingNotifications: { type: Boolean, default: true },
  driverAssignments: { type: Boolean, default: true },
  paymentNotifications: { type: Boolean, default: true },
  // Email notification settings
  emailNotifications: {
    sendToCustomer: { type: Boolean, default: true },
    sendToAdmin: { type: Boolean, default: true },
    sendToDriver: { type: Boolean, default: true },
    adminEmails: [{ type: String, required: true }],
    customTemplates: {
      customer: { type: String, default: '' },
      admin: { type: String, default: '' },
      driver: { type: String, default: '' }
    }
  },
  // Pricing settings
  distanceFeeEnabled: { type: Boolean, default: false },
  distanceThreshold: { type: Number, default: 0 },
  distanceFee: { type: Number, default: 0 },
  perMileFeeEnabled: { type: Boolean, default: false },
  perMileFee: { type: Number, default: 0 },
  minFee: { type: Number, default: 0 },
  maxFee: { type: Number, default: 0 },
  stopPrice: { type: Number, default: 25 },
  carSeatPrice: { type: Number, default: 15 },
  boosterSeatPrice: { type: Number, default: 10 },
  distanceTiers: [{
    minDistance: { type: Number, required: true },
    maxDistance: { type: Number, required: true },
    fee: { type: Number, required: true }
  }],
  timeSurcharges: [{
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    surcharge: { type: Number, required: true }
  }],
  vehiclePackagePricing: [{
    vehicleId: { type: String, required: true },
    packageId: { type: String, required: true },
    distanceThreshold: { type: Number, required: true },
    perMileFee: { type: Number, required: true }
  }],
  feeRules: [{
    condition: { type: String, required: true },
    fee: { type: Number, required: true }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create a pre-save middleware to ensure admin email is set
adminSettingsSchema.pre('save', function(next) {
  if (this.isNew && (!this.emailNotifications?.adminEmails || this.emailNotifications.adminEmails.length === 0)) {
    this.emailNotifications = {
      ...this.emailNotifications,
      adminEmails: [process.env.ADMIN_EMAIL || 'admin@example.com'],
      sendToCustomer: this.emailNotifications?.sendToCustomer ?? true,
      sendToAdmin: this.emailNotifications?.sendToAdmin ?? true,
      sendToDriver: this.emailNotifications?.sendToDriver ?? true
    };
  }
  next();
});

// Create a static method to get or create admin settings
adminSettingsSchema.statics.getOrCreateAdminSettings = async function() {
  let settings = await this.findOne({ type: 'settings', key: 'admin_settings' });
  
  if (!settings) {
    settings = await this.create({
      type: 'settings',
      key: 'admin_settings',
      // Booking settings - explicitly set to true by default
      bookingsEnabled: true,
      emailNotifications: {
        sendToAdmin: true,
        adminEmails: [process.env.ADMIN_EMAIL || 'admin@example.com'],
        customTemplates: {
          admin: `
            New Booking Details:
            
            Booking ID: {{bookingId}}
            Customer: {{customerName}}
            Email: {{customerEmail}}
            Phone: {{customerPhone}}
            
            Pickup: {{pickupLocation}}
            Dropoff: {{dropoffLocation}}
            Pickup Time: {{pickupTime}}
            Dropoff Time: {{dropoffTime}}
            
            Status: {{status}}
            Price: {{price}}
            Package: {{packageName}}
            Hours: {{hours}}
            Passengers: {{passengers}}
            Special Instructions: {{specialInstructions}}
          `
        }
      }
    });
  } else {
    // If settings exist but bookingsEnabled is missing, initialize it
    if (settings.bookingsEnabled === null || settings.bookingsEnabled === undefined) {
      settings.bookingsEnabled = true;
      await settings.save();
    }
  }
  
  return settings;
};

// Create and export models
export const Profile = mongoose.model('Profile', profileSchema, 'users');
export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export const Customer = mongoose.model('Customer', customerSchema);
export const Stop = mongoose.model<IStop>('Stop', stopSchema);
export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export const ServicePackage = mongoose.model('ServicePackage', servicePackageSchema, 'servicepackages');
export const DriverDocument = mongoose.model('DriverDocument', driverDocumentSchema);
export const DriverRating = mongoose.model('DriverRating', driverRatingSchema);
export const BookingStatusHistory = mongoose.model('BookingStatusHistory', bookingStatusHistorySchema); 
export const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema); 