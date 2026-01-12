/*
  # SMS integration and notification system

  1. New Tables
    - `sms_logs` - Stores records of SMS messages sent through the system
    - `admin_settings` - Stores notification preferences for admin users
    - `profiles` - Creates a profiles table for user information including phone numbers

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access to SMS logs
    - Add policies for users to manage their own settings
*/

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

-- SMS Logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  message_type text NOT NULL,
  message_body text NOT NULL,
  message_sid text,
  status text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on sms_logs
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all SMS logs
CREATE POLICY "Admins can read all SMS logs"
  ON sms_logs
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Admin can insert SMS logs
CREATE POLICY "Admins can insert SMS logs"
  ON sms_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  phone_number text,
  receive_booking_notifications boolean DEFAULT true,
  receive_update_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read their own settings
CREATE POLICY "Admins can read own settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND auth.jwt() ->> 'role' = 'admin');

-- Admin can update their own settings
CREATE POLICY "Admins can update own settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND auth.jwt() ->> 'role' = 'admin');