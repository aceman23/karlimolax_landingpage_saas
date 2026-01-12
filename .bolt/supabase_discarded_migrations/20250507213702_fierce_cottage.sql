/*
  # Driver Management System

  1. New Tables
    - `driver_availability` - Tracks driver work hours
    - `driver_documents` - Stores driver document information
    - `driver_ratings` - Customer ratings for drivers

  2. Security
    - Enable RLS on all tables
    - Add policies for driver data access
*/

-- Driver availability schedule
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

-- Driver document tracking
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

-- Driver ratings from customers
CREATE TABLE IF NOT EXISTS driver_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) NOT NULL,
  driver_id uuid REFERENCES profiles(id) NOT NULL,
  customer_id uuid REFERENCES customers(id) NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Driver location tracking
CREATE TABLE IF NOT EXISTS driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles(id) NOT NULL,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  accuracy numeric(9, 2),
  recorded_at timestamptz DEFAULT now(),
  CONSTRAINT unique_driver_location UNIQUE (driver_id, recorded_at)
);

-- Enable RLS on all tables
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_availability
CREATE POLICY "Drivers can view their own availability"
  ON driver_availability
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update their own availability"
  ON driver_availability
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Admins can manage all driver availability"
  ON driver_availability
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for driver_documents
CREATE POLICY "Drivers can view their own documents"
  ON driver_documents
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can upload their own documents"
  ON driver_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admins can manage all driver documents"
  ON driver_documents
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for driver_ratings
CREATE POLICY "Anyone can view driver ratings"
  ON driver_ratings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Customers can rate drivers for their own bookings"
  ON driver_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage driver ratings"
  ON driver_ratings
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies for driver_locations
CREATE POLICY "Drivers can update their own location"
  ON driver_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admin and driver can view driver location"
  ON driver_locations
  FOR SELECT
  TO authenticated
  USING (
    driver_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_driver_availability_updated_at
  BEFORE UPDATE ON driver_availability
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_driver_documents_updated_at
  BEFORE UPDATE ON driver_documents
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create function to calculate driver average rating
CREATE OR REPLACE FUNCTION get_driver_average_rating(driver_uuid uuid)
RETURNS numeric AS $$
DECLARE
  avg_rating numeric;
BEGIN
  SELECT AVG(rating)::numeric(3,2) INTO avg_rating
  FROM driver_ratings
  WHERE driver_id = driver_uuid;
  
  RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;