/*
  # Fix admin access issues
  
  1. Updates
    - Drop and recreate RLS policies for profiles table
    - Ensure admin user exists with correct role
    - Add proper policies for admin access
*/

-- Drop existing policies for profiles table
DROP POLICY IF EXISTS "Users can read own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Recreate policies with proper access control
CREATE POLICY "Users can read own profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

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