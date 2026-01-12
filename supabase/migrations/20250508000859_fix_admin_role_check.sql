/*
  # Fix admin role checking in RLS policies
  
  1. Updates
    - Update RLS policies to properly check admin role in profiles table
    - Fix role checking for all admin-related policies
*/

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all customers" ON customers;
DROP POLICY IF EXISTS "Admins can manage customer data" ON customers;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payment_records;
DROP POLICY IF EXISTS "Admins can manage all driver documents" ON driver_documents;
DROP POLICY IF EXISTS "Admins can view all driver availability" ON driver_availability;
DROP POLICY IF EXISTS "Admins can view all ratings" ON driver_ratings;
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_notifications;
DROP POLICY IF EXISTS "Admins can read all SMS logs" ON sms_logs;
DROP POLICY IF EXISTS "Admins can insert SMS logs" ON sms_logs;
DROP POLICY IF EXISTS "Admins can read own settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can update own settings" ON admin_settings;

-- Create new admin policies with proper role checking
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage customer data"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all payments"
  ON payment_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all driver documents"
  ON driver_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all driver availability"
  ON driver_availability
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all ratings"
  ON driver_ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage email templates"
  ON email_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can read all SMS logs"
  ON sms_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert SMS logs"
  ON sms_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can read own settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update own settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Ensure admin user exists with correct role
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Check if admin user exists in auth.users
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'admin@dapperlimolax.com';

  IF admin_id IS NULL THEN
    -- Create admin user if it doesn't exist
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      email_confirmed_at,
      encrypted_password,
      aud,
      role,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@dapperlimolax.com',
      now(),
      crypt('admin123', gen_salt('bf')),
      'authenticated',
      'authenticated',
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin User"}',
      now(),
      now()
    )
    RETURNING id INTO admin_id;
  END IF;

  -- Ensure admin profile exists with correct role
  INSERT INTO profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    updated_at
  ) VALUES (
    admin_id,
    'Admin',
    'User',
    'admin@dapperlimolax.com',
    'admin',
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      updated_at = now();
END $$; 