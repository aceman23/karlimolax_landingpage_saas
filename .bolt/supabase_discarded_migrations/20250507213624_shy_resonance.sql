/*
  # Initial database schema

  1. New Tables
    - `profiles` - User profiles with roles
    - `vehicles` - Fleet of vehicles
    - `bookings` - Customer bookings
    - `booking_status_history` - Booking status change log
    - `customers` - Customer information

  2. Security
    - Enable RLS on all tables
    - Add policies for proper data access
*/

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'driver', 'customer');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table
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

-- Create vehicles table
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

-- Create customers table
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

-- Create bookings table
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

-- Create booking_status_history table to track status changes
CREATE TABLE IF NOT EXISTS booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) NOT NULL,
  previous_status booking_status,
  new_status booking_status NOT NULL,
  changed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create service_packages table
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

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_pickup_date ON bookings(pickup_date);
CREATE INDEX idx_booking_history_booking_id ON booking_status_history(booking_id);
CREATE INDEX idx_customers_user_id ON customers(user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (role = 'admin');

-- RLS Policies for vehicles
CREATE POLICY "Anyone can view vehicles"
  ON vehicles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage vehicles"
  ON vehicles FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- RLS Policies for customers
CREATE POLICY "Customers can view their own data"
  ON customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can manage customer data"
  ON customers FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- RLS Policies for bookings
CREATE POLICY "Customers can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view assigned bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid()
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- RLS Policies for booking_status_history
CREATE POLICY "Anyone with access to a booking can view its history"
  ON booking_status_history FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
        OR driver_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

CREATE POLICY "Admins and drivers can add to booking history"
  ON booking_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'driver')
    )
  );

-- RLS Policies for service_packages
CREATE POLICY "Anyone can view service packages"
  ON service_packages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage service packages"
  ON service_packages FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Create functions to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to call the function
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON service_packages
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create a function to log booking status changes
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO booking_status_history (
      booking_id,
      previous_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function
CREATE TRIGGER log_booking_status_change
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE PROCEDURE log_booking_status_change();