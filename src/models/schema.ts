import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User Profile Schema
export interface IProfile extends Document {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'driver', 'customer'] },
  phone: { type: String },
  password: { type: String },
}, { timestamps: true });

profileSchema.pre<IProfile>('save', async function (next) {
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    // Ensure that 'error' is properly typed or cast if necessary before passing to next
    if (error instanceof Error) {
        return next(error);
    }
    return next(new Error('Error hashing password'));
  }
});

// Vehicle Schema
export interface IVehicle extends Document {
  name: string;
  type: string;
  capacity: number;
  status: string;
  licensePlate: string;
  year: number;
  make: string;
  vehicleModel: string;
  color: string;
  features: string[];
  images: string[];
  basePrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>({
  name: { type: String, required: true },
  type: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, required: true, enum: ['available', 'in_use', 'maintenance'] },
  licensePlate: { type: String, required: true, unique: true },
  year: { type: Number, required: true },
  make: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  color: { type: String, required: true },
  features: [{ type: String }],
  images: [{ type: String }],
  basePrice: { type: Number, required: true },
}, { timestamps: true });

// Customer Schema
export interface ICustomer extends Document {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  userId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
}, { timestamps: true });

// Booking Schema
export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: Date;
  dropoffTime: Date;
  status: string;
  price: number;
  paymentStatus: string;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'Profile' },
  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  pickupTime: { type: Date, required: true },
  dropoffTime: { type: Date, required: true },
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
}, { timestamps: true });

// SMS Log Schema
export interface ISMSLog extends Document {
  bookingId: mongoose.Types.ObjectId;
  phoneNumber: string;
  message: string;
  status: string;
  createdAt: Date;
}

const smsLogSchema = new Schema<ISMSLog>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  phoneNumber: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, required: true },
}, { timestamps: true });

// Admin Settings Schema
export interface IAdminSettings extends Document {
  type: string;
  distanceFeeEnabled: boolean;
  distanceThreshold: number;
  distanceFee: number;
  perMileFeeEnabled: boolean;
  perMileFee: number;
  minFee: number;
  maxFee: number;
  stopPrice: number;
  updatedAt: Date;
}

const adminSettingsSchema = new Schema<IAdminSettings>({
  type: { type: String, required: true, enum: ['pricing', 'notifications', 'security', 'database'] },
  distanceFeeEnabled: { type: Boolean, default: true },
  distanceThreshold: { type: Number, default: 40 },
  distanceFee: { type: Number, default: 20 },
  perMileFeeEnabled: { type: Boolean, default: false },
  perMileFee: { type: Number, default: 2 },
  minFee: { type: Number, default: 0 },
  maxFee: { type: Number, default: 1000 },
  stopPrice: { type: Number, default: 25 },
  updatedAt: { type: Date, default: Date.now }
});

// Booking Status History Schema
export interface IBookingStatusHistory extends Document {
  bookingId: mongoose.Types.ObjectId;
  status: string;
  changedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

const bookingStatusHistorySchema = new Schema<IBookingStatusHistory>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] 
  },
  changedBy: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  notes: { type: String },
}, { timestamps: true });

// Service Package Schema
export interface IServicePackage extends Document {
  name: string;
  description: string;
  price: number;
  duration: number;
  vehicleId: mongoose.Types.ObjectId;
  features: string[];
  airports?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const servicePackageSchema = new Schema<IServicePackage>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  features: [{ type: String }],
  airports: [{ type: String }],
}, { timestamps: true });

// Driver Document Schema
export interface IDriverDocument extends Document {
  driverId: mongoose.Types.ObjectId;
  type: string;
  number: string;
  expiryDate: Date;
  fileUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const driverDocumentSchema = new Schema<IDriverDocument>({
  driverId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: { type: String, required: true },
  number: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  fileUrl: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'approved', 'rejected'] 
  },
}, { timestamps: true });

// Driver Rating Schema
export interface IDriverRating extends Document {
  driverId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const driverRatingSchema = new Schema<IDriverRating>({
  driverId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, { timestamps: true });

// Create and export models
export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export const SMSLog = mongoose.model<ISMSLog>('SMSLog', smsLogSchema);
export const AdminSettings = mongoose.model<IAdminSettings>('AdminSettings', adminSettingsSchema);
export const BookingStatusHistory = mongoose.model<IBookingStatusHistory>('BookingStatusHistory', bookingStatusHistorySchema);
export const ServicePackage = mongoose.model<IServicePackage>('ServicePackage', servicePackageSchema);
export const DriverDocument = mongoose.model<IDriverDocument>('DriverDocument', driverDocumentSchema);
export const DriverRating = mongoose.model<IDriverRating>('DriverRating', driverRatingSchema); 