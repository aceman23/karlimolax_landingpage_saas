/*
  # Seed Data for Testing
  
  1. Creates sample data for:
    - Vehicles
    - Service Packages
    - Admin accounts (for testing)
    - Sample bookings
    
  2. Note: This is for development/testing environments only
*/

-- Sample vehicles
INSERT INTO vehicles (id, name, description, capacity, price_per_hour, price_per_mile, fixed_price, image_url, features, status) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Mercedes Sprinter Limo Van', 'Luxury Mercedes Sprinter perfect for airport transfers and group transportation.', 12, 120, 3.5, NULL, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg', '["Leather seating", "Premium sound system", "WiFi", "Bottled water", "Climate control"]', 'available'),
  ('00000000-0000-0000-0000-000000000002', 'Executive Sprinter Limo', 'Business class Mercedes Sprinter with executive amenities for corporate travel.', 10, 150, 4, NULL, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg', '["Business workstations", "Power outlets", "WiFi", "Premium leather", "Privacy partition"]', 'available'),
  ('00000000-0000-0000-0000-000000000003', 'Luxury Sedan', 'Elegant sedan perfect for airport transfers and individual business travel.', 3, 90, 2.5, NULL, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg', '["Leather seats", "WiFi", "Bottled water", "Phone chargers"]', 'available')
ON CONFLICT (id) DO NOTHING;

-- Sample service packages
INSERT INTO service_packages (id, name, description, rate, is_hourly, minimum_hours, vehicle_id, image_url) 
VALUES 
  ('lax-special', 'LAX SPECIAL', 'LAX - 50 mile radius', 250, false, null, '00000000-0000-0000-0000-000000000001', 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg'),
  ('disney-airports', 'Disneyland Park & Hotel / Airports', 'Disney Hotels to Airports', 250, false, null, '00000000-0000-0000-0000-000000000001', 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg'),
  ('special-events', 'Special Events', 'Birthday Parties / Weddings / Prom / Concerts / Sporting Events / Funerals / Wine Tasting Tours / Corporate Travel', 130, true, 4, '00000000-0000-0000-0000-000000000001', 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg')
ON CONFLICT (id) DO NOTHING;

-- Create test data function (only run this in development)
DO $$
BEGIN
  -- Only proceed if we're in a development environment
  -- You can remove/comment this condition to force execution
  IF current_database() LIKE '%dev%' OR current_database() LIKE '%test%' THEN
    -- Create admin user if doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM auth.users WHERE email = 'admin@dapperlimolax.com'
    ) THEN
      -- This would normally be done through the Auth API, not SQL
      -- For a real system, create admin users through the Supabase dashboard
      
      -- Insert profiles for demo admin/driver if they don't exist
      INSERT INTO profiles (id, first_name, last_name, email, phone, role)
      VALUES 
        ('00000000-0000-0000-0000-000000000010', 'Admin', 'User', 'admin@dapperlimolax.com', '(310) 555-1234', 'admin'),
        ('00000000-0000-0000-0000-000000000011', 'Driver', 'One', 'driver1@dapperlimolax.com', '(310) 555-5678', 'driver')
      ON CONFLICT (id) DO NOTHING;

      -- Insert admin settings
      INSERT INTO admin_settings (user_id, phone_number, receive_booking_notifications, receive_update_notifications)
      VALUES ('00000000-0000-0000-0000-000000000010', '(310) 555-1234', true, true)
      ON CONFLICT (user_id) DO NOTHING;
      
      -- Create some sample customers
      INSERT INTO customers (id, first_name, last_name, email, phone)
      VALUES 
        ('00000000-0000-0000-0000-000000000020', 'John', 'Smith', 'john.smith@example.com', '(213) 555-1234'),
        ('00000000-0000-0000-0000-000000000021', 'Emily', 'Davis', 'emily.davis@example.com', '(310) 555-5678'),
        ('00000000-0000-0000-0000-000000000022', 'Robert', 'Wilson', 'robert.wilson@example.com', '(949) 555-9012')
      ON CONFLICT (id) DO NOTHING;
      
      -- Create some sample bookings
      INSERT INTO bookings (id, customer_id, vehicle_id, driver_id, pickup_address, dropoff_address, pickup_date, pickup_time, hours, passengers, special_requests, total_amount, status, payment_status, package_id)
      VALUES
        ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '123 Main St, Los Angeles', 'LAX Airport Terminal 2', CURRENT_DATE + INTERVAL '5 days', '09:30', 4, 8, 'Please arrive 15 minutes early', 250, 'confirmed', 'paid', 'lax-special'),
        ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', NULL, 'LAX Airport Terminal 4', 'Beverly Hills Hotel', CURRENT_DATE + INTERVAL '5 days', '14:00', 3, 6, NULL, 320, 'pending', 'paid', NULL),
        ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Disneyland Resort', 'Huntington Beach', CURRENT_DATE + INTERVAL '6 days', '10:00', 5, 10, NULL, 450, 'confirmed', 'paid', 'disney-airports')
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END $$;