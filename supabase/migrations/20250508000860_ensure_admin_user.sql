/*
  # Ensure admin user exists with correct role
  
  1. Updates
    - Create admin user in auth.users if not exists
    - Create admin profile with correct role
    - Set up admin user with proper permissions
*/

-- First, ensure the admin user exists in auth.users
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

  -- Grant necessary permissions to admin user
  GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
END $$;

-- Enable RLS on all tables if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to use the is_admin function
CREATE OR REPLACE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can manage customer data"
  ON customers
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can manage all payments"
  ON payment_records
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can manage all driver documents"
  ON driver_documents
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can view all driver availability"
  ON driver_availability
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can view all ratings"
  ON driver_ratings
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can manage email templates"
  ON email_notifications
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can read all SMS logs"
  ON sms_logs
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can insert SMS logs"
  ON sms_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can read own settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_admin(auth.uid()));

CREATE OR REPLACE POLICY "Admins can update own settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_admin(auth.uid())); 