-- This file provides a complete representation of the expected database schema
-- It is useful as documentation and for setting up new environments

-- ENUMS
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'driver', 'customer');
CREATE TYPE IF NOT EXISTS booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE IF NOT EXISTS vehicle_status AS ENUM ('available', 'in_use', 'maintenance');
CREATE TYPE IF NOT EXISTS payment_status AS ENUM ('pending', 'paid', 'refunded');

-- TABLES
-- User profiles linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text,
  phone text,
  role user_role DEFAULT 'customer',
  avatar_url text,
  driver_license text,
  driver_status text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vehicles/fleet
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  capacity int NOT NULL,
  price_per_hour numeric(10,2) NOT NULL,
  price_per_mile numeric(10,2) NOT NULL,
  fixed_price numeric(10,2),
  image_url text NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  status vehicle_status DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT customers_email_key UNIQUE (email)
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  vehicle_id uuid REFERENCES vehicles(id) NOT NULL,
  driver_id uuid REFERENCES profiles(id),
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  pickup_date date NOT NULL,
  pickup_time time NOT NULL,
  hours int NOT NULL,
  passengers int NOT NULL,
  special_requests text,
  total_amount numeric(10,2) NOT NULL,
  status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  package_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Booking status history
CREATE TABLE IF NOT EXISTS booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) NOT NULL,
  previous_status booking_status,
  new_status booking_status NOT NULL,
  changed_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Service packages
CREATE TABLE IF NOT EXISTS service_packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  rate numeric(10,2) NOT NULL,
  is_hourly boolean DEFAULT false,
  minimum_hours int,
  vehicle_id uuid REFERENCES vehicles(id) NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- SMS Logs
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  message_type text NOT NULL,
  message_body text NOT NULL,
  message_sid text,
  status text,
  created_at timestamptz DEFAULT now()
);

-- Admin notification settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  phone_number text,
  receive_booking_notifications boolean DEFAULT true,
  receive_update_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Customer notification settings
CREATE TABLE IF NOT EXISTS customer_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) NOT NULL,
  receive_booking_confirmations boolean DEFAULT true,
  receive_driver_assignments boolean DEFAULT true,
  receive_ride_reminders boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Driver availability
CREATE TABLE IF NOT EXISTS driver_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles(id) NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_driver_schedule UNIQUE (driver_id, day_of_week)
);

-- Driver documents
CREATE TABLE IF NOT EXISTS driver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles(id) NOT NULL,
  document_type text NOT NULL,
  document_number text,
  expiration_date date,
  verification_status text DEFAULT 'pending',
  document_url text,
  uploaded_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Driver ratings
CREATE TABLE IF NOT EXISTS driver_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) NOT NULL,
  driver_id uuid REFERENCES profiles(id) NOT NULL,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Driver locations for tracking
CREATE TABLE IF NOT EXISTS driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles(id) NOT NULL,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  accuracy numeric(9, 2),
  recorded_at timestamptz DEFAULT now(),
  CONSTRAINT unique_driver_location UNIQUE (driver_id, recorded_at)
);

-- Seed data tracking
CREATE TABLE IF NOT EXISTS seed_data_applied (
  applied_at timestamptz DEFAULT now()
);