export interface Vehicle {
  id: string;
  _id?: string;
  name: string;
  make: string;
  model: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  pricePerMile: number;
  fixedPrice?: number;
  imageUrl: string;
  features: string[];
  year?: number;
  license_plate?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ServicePackage {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  base_price: number;
  duration: number; // Duration in minutes
  is_hourly?: boolean; // Whether the package is charged by the hour
  minimum_hours?: number; // Minimum number of hours required for hourly packages
  vehicle_id?: string;
  image_url?: string;
  is_active: boolean;
  airports?: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface BookingDetails {
  pickupAddress?: string;
  dropoffAddress?: string;
  stops?: {
    location: string;
    order: number;
    price: number;
  }[];
  pickupDate: Date;
  pickupTime?: string;
  hours?: number;
  passengers?: number;
  carSeats?: number;
  boosterSeats?: number;
  specialRequests?: string;
  vehicleId?: string;
  vehicleName?: string; // Add vehicle name field
  packageId?: string;
  airportCode?: string;
  distance?: {
    text: string;
    value: number;
  };
  acknowledgeVomitFee?: boolean;
  acknowledgeGracePeriod?: boolean;
  acknowledgeCancellationPolicy?: boolean;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PaymentInfo {
  cardholderName: string;
  totalAmount: number;
  isPaid: boolean;
  paymentDate?: Date;
}

export interface Booking {
  id: string;
  _id?: string;
  customerId?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  customerName?: string;
  customerEmail?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  vehicleId?: string; // Vehicle ID as string
  vehicleName?: string; // Vehicle name as string
  vehicle?: {
    name: string;
    make?: string;
    model?: string;
    capacity?: number;
  };
  driverId?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  dropoffTime?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  totalAmount: number;
  notes?: string;
  packageName?: string;
  packageId?: string;
  airportCode?: string;
  hours?: number;
  passengers?: number;
  carSeats?: number;
  boosterSeats?: number;
  package?: {
    name: string;
    hours: number;
  };
  stops?: Array<{
    location: string;
    order: number;
    price: number;
  }>;
  additionalStops?: string[];
  createdAt?: string;
  updatedAt?: string;
  bookingDetails?: {
    pickupAddress?: string;
    dropoffAddress?: string;
    pickupDate?: Date;
    pickupTime?: string;
    packageId?: string;
    specialRequests?: string;
    stops?: Array<{
      location: string;
      order: number;
      price: number;
    }>;
  };
  gratuity?: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
}

// Profile type (similar to User in AuthContext)
// Represents the user profile data, typically from Profile schema in backend
export interface Profile {
  id: string; // Corresponds to Profile._id from backend
  email: string;
  role: 'admin' | 'driver' | 'customer';
  firstName?: string;
  lastName?: string;
  phone?: string; // Phone is on Profile schema
  // Add other fields from Profile schema as needed, e.g., address, driverStatus, licenseNumber
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  driverStatus?: 'available' | 'offline' | 'on-ride';
  licenseNumber?: string;
  // Do not include password here
}

interface DistanceTier {
  minDistance: number;
  maxDistance: number;
  fee: number;
}

interface TimeSurcharge {
  startTime: string;
  endTime: string;
  surcharge: number;
}

interface VehiclePackagePricing {
  vehicleId: string;
  packageId: string;
  distanceThreshold: number;
  perMileFee: number;
}

interface FeeRule {
  condition: string;
  fee: number;
}

interface PricingSettings {
  distanceFeeEnabled: boolean;
  distanceThreshold: number;
  distanceFee: number;
  perMileFeeEnabled: boolean;
  perMileFee: number;
  minFee: number;
  maxFee: number;
  distanceTiers: DistanceTier[];
  timeSurcharges: TimeSurcharge[];
  vehiclePackagePricing: VehiclePackagePricing[];
  feeRules: FeeRule[];
  stopPrice: number;
  carSeatPrice: number;
  boosterSeatPrice: number;
}