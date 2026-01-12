/*
  # SMS and Notification Systems

  1. New Tables
    - `sms_logs` - Record of all SMS messages sent
    - `admin_settings` - Admin notification preferences

  2. Security
    - Enable RLS on all tables
    - Add policies for SMS and notification access
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
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can insert SMS logs
CREATE POLICY "Admins can insert SMS logs"
  ON sms_logs
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin settings table for notification preferences
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
  USING (auth.uid() = user_id AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Admin can update their own settings
CREATE POLICY "Admins can update own settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create notification settings table for customers
CREATE TABLE IF NOT EXISTS customer_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) NOT NULL,
  receive_booking_confirmations boolean DEFAULT true,
  receive_driver_assignments boolean DEFAULT true,
  receive_ride_reminders boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on customer_notification_settings
ALTER TABLE customer_notification_settings ENABLE ROW LEVEL SECURITY;

-- Customers can view and update their own notification settings
CREATE POLICY "Customers can manage their notification settings"
  ON customer_notification_settings
  FOR ALL
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Admins can view all customer notification settings
CREATE POLICY "Admins can view customer notification settings"
  ON customer_notification_settings
  FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');