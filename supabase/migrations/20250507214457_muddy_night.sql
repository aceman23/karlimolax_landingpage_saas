/*
  # Complete Database Schema for KarLimoLAX

  1. New Tables
    - `customers` - Customer information
    - `bookings` - Booking records
    - `vehicles` - Vehicle information
    - `drivers` - Driver information
    - `driver_documents` - Driver document records
    - `service_packages` - Service package definitions
    - `payment_records` - Payment information

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for user roles
    - Set up relationships between tables
*/

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  user_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Customers can read and update their own records
CREATE POLICY "Customers can view own data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can update own data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all customer data
CREATE POLICY "Admins can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create vehicles table if it doesn't exist
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  capacity int NOT NULL,
  price_per_hour numeric(10,2) NOT NULL,
  price_per_mile numeric(10,2) NOT NULL,
  fixed_price numeric(10,2),
  image_url text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  features jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Anyone can read vehicle data
CREATE POLICY "Anyone can view vehicles"
  ON vehicles
  FOR SELECT
  USING (true);

-- Only admins can modify vehicles
CREATE POLICY "Admins can modify vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create service packages table
CREATE TABLE IF NOT EXISTS service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  base_price numeric(10,2) NOT NULL,
  is_hourly boolean DEFAULT false,
  minimum_hours int,
  vehicle_id uuid REFERENCES vehicles,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on service_packages
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can read service packages
CREATE POLICY "Anyone can view service packages"
  ON service_packages
  FOR SELECT
  USING (true);

-- Only admins can modify service packages
CREATE POLICY "Admins can modify service packages"
  ON service_packages
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers,
  vehicle_id uuid REFERENCES vehicles,
  package_id uuid REFERENCES service_packages,
  driver_id uuid REFERENCES profiles,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  pickup_date date NOT NULL,
  pickup_time time NOT NULL,
  hours int,
  passengers int NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Customers can see their own bookings
CREATE POLICY "Customers can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM customers WHERE id = customer_id
  ));

-- Drivers can see bookings assigned to them
CREATE POLICY "Drivers can view assigned bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create payment_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  transaction_id text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  cardholder_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on payment_records
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payment records
CREATE POLICY "Customers can view own payments"
  ON payment_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT c.user_id FROM payment_records p
    JOIN bookings b ON p.booking_id = b.id
    JOIN customers c ON b.customer_id = c.id
    WHERE p.id = payment_records.id
  ));

-- Admins can manage all payment records
CREATE POLICY "Admins can manage all payments"
  ON payment_records
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create driver_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS driver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('license', 'insurance', 'background_check', 'vehicle_registration', 'other')),
  document_url text NOT NULL,
  expiration_date date,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on driver_documents
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own documents
CREATE POLICY "Drivers can view own documents"
  ON driver_documents
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Admins can manage all driver documents
CREATE POLICY "Admins can manage all driver documents"
  ON driver_documents
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create driver_availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS driver_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on driver_availability
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;

-- Drivers can manage their own availability
CREATE POLICY "Drivers can manage own availability"
  ON driver_availability
  FOR ALL
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- Admins can view all driver availability
CREATE POLICY "Admins can view all driver availability"
  ON driver_availability
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create driver_ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS driver_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings NOT NULL,
  driver_id uuid REFERENCES profiles NOT NULL,
  customer_id uuid REFERENCES customers NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on driver_ratings
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;

-- Customers can view and add ratings for their bookings
CREATE POLICY "Customers can manage ratings for their bookings"
  ON driver_ratings
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT c.user_id FROM driver_ratings dr
    JOIN customers c ON dr.customer_id = c.id
    WHERE dr.id = driver_ratings.id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT c.user_id FROM customers c
    WHERE c.id = customer_id
  ));

-- Drivers can view their own ratings
CREATE POLICY "Drivers can view own ratings"
  ON driver_ratings
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Admins can view all ratings
CREATE POLICY "Admins can view all ratings"
  ON driver_ratings
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Function to calculate driver's average rating
CREATE OR REPLACE FUNCTION get_driver_average_rating(driver_uuid uuid)
RETURNS numeric AS $$
  SELECT COALESCE(AVG(rating), 0)
  FROM driver_ratings
  WHERE driver_id = driver_uuid;
$$ LANGUAGE SQL;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_customers_timestamp
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vehicles_timestamp
BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_bookings_timestamp
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_payment_records_timestamp
BEFORE UPDATE ON payment_records
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_service_packages_timestamp
BEFORE UPDATE ON service_packages
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_driver_documents_timestamp
BEFORE UPDATE ON driver_documents
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_driver_availability_timestamp
BEFORE UPDATE ON driver_availability
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create email_notifications table for future use with email templates
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  subject text NOT NULL,
  body_template text NOT NULL,
  is_html boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on email_notifications
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can manage email templates
CREATE POLICY "Admins can manage email templates"
  ON email_notifications
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  first_name text,
  last_name text,
  email text,
  phone text,
  role text DEFAULT 'customer',
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profiles
CREATE POLICY "Users can read own profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profiles
CREATE POLICY "Users can update own profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile during registration
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');