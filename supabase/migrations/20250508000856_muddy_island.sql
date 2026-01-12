/*
  # Seed users for testing login functionality
  
  1. New Function
    - `create_test_users()`: Creates admin and driver users for testing with secure passwords
  
  2. Purpose
    - This migration creates test accounts that can be used to log in to the admin and driver portals
    - Creates both an admin user and a driver user with predefined credentials
    - Also creates corresponding entries in the profiles table with the correct roles
*/

-- Function to create test users in auth.users and corresponding profile entries
CREATE OR REPLACE FUNCTION create_test_users()
RETURNS void AS $$
DECLARE
  admin_id uuid;
  driver_id uuid;
BEGIN
  -- Create admin user (using create_user from Supabase auth.api)
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
    updated_at,
    confirmation_token,
    email_change_token_new,
    recovery_token
  ) 
  VALUES (
    gen_random_uuid(), -- id
    '00000000-0000-0000-0000-000000000000', -- instance_id
    'admin@dapperlimolax.com', -- email
    now(), -- email_confirmed_at
    crypt('admin123', gen_salt('bf')), -- encrypted_password (replace with your actual password)
    'authenticated', -- aud
    'authenticated', -- role
    '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
    '{"name":"Admin User"}', -- raw_user_meta_data
    now(), -- created_at
    now(), -- updated_at
    '', -- confirmation_token
    '', -- email_change_token_new
    '' -- recovery_token
  )
  RETURNING id INTO admin_id;

  -- Create driver user
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
    updated_at,
    confirmation_token,
    email_change_token_new,
    recovery_token
  ) 
  VALUES (
    gen_random_uuid(), -- id
    '00000000-0000-0000-0000-000000000000', -- instance_id
    'driver@dapperlimolax.com', -- email
    now(), -- email_confirmed_at
    crypt('driver123', gen_salt('bf')), -- encrypted_password
    'authenticated', -- aud
    'authenticated', -- role
    '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
    '{"name":"Driver User"}', -- raw_user_meta_data
    now(), -- created_at
    now(), -- updated_at
    '', -- confirmation_token
    '', -- email_change_token_new
    '' -- recovery_token
  )
  RETURNING id INTO driver_id;

  -- Create admin profile
  INSERT INTO profiles (
    id, 
    first_name, 
    last_name, 
    email, 
    phone, 
    role,
    updated_at
  ) 
  VALUES (
    admin_id,
    'Admin',
    'User',
    'admin@dapperlimolax.com',
    '(310) 555-1234',
    'admin',
    now()
  );

  -- Create driver profile
  INSERT INTO profiles (
    id, 
    first_name, 
    last_name, 
    email, 
    phone, 
    role,
    updated_at
  ) 
  VALUES (
    driver_id,
    'Driver',
    'User',
    'driver@dapperlimolax.com',
    '(310) 555-5678',
    'driver',
    now()
  );

  -- Add admin settings for the admin user
  INSERT INTO admin_settings (
    user_id,
    phone_number,
    receive_booking_notifications,
    receive_update_notifications
  )
  VALUES (
    admin_id,
    '(310) 555-1234',
    true,
    true
  );

  RAISE NOTICE 'Created test users with the following credentials:';
  RAISE NOTICE 'Admin: email=admin@dapperlimolax.com password=admin123';
  RAISE NOTICE 'Driver: email=driver@dapperlimolax.com password=driver123';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create the test users
DO $$
BEGIN
  PERFORM create_test_users();
END $$;

-- Drop the function as it's only needed once
DROP FUNCTION create_test_users();

-- Insert some sample vehicle data for testing
INSERT INTO vehicles (name, description, capacity, price_per_hour, price_per_mile, image_url, features, status)
VALUES
  ('Mercedes Sprinter Limo Van', 'Luxury Mercedes Sprinter perfect for airport transfers and group transportation.', 
   12, 120, 3.5, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg', 
   '["Leather seating", "Premium sound system", "WiFi", "Bottled water", "Climate control"]', 'available'),
  ('Executive Sprinter Limo', 'Business class Mercedes Sprinter with executive amenities for corporate travel.', 
   10, 150, 4, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg', 
   '["Business workstations", "Power outlets", "WiFi", "Premium leather", "Privacy partition"]', 'available');

-- Insert service packages
INSERT INTO service_packages (name, description, base_price, is_hourly, minimum_hours, image_url)
VALUES
  ('LAX SPECIAL', 'LAX - 50 mile radius', 250, false, null, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg'),
  ('Disneyland Park & Hotel / Airports', 'Disney Hotels to Airports', 250, false, null, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg'),
  ('Special Events', 'Birthday Parties / Weddings / Prom / Concerts / Sporting Events / Funerals / Wine Tasting Tours / Corporate Travel', 
   130, true, 4, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg');

-- IMPORTANT NOTE: Credentials for testing:
-- Admin: email=admin@dapperlimolax.com password=admin123
-- Driver: email=driver@dapperlimolax.com password=driver123