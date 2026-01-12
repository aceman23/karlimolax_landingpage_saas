/*
  # SMS Notification System

  1. New Tables
    - `sms_logs` - Stores all SMS messages sent from the system
    - `admin_settings` - Stores notification preferences for admin users
  
  2. Security
    - Enable RLS on new tables
    - Add appropriate policies for admin access
    
  3. Changes
    - Add phone number field to profiles table if it doesn't exist
*/

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

-- Add phone number field to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;