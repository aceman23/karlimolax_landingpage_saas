-- This file can be used to seed a new database with initial data
-- It should only be run once when setting up a new environment

BEGIN;

-- Check if seed data has already been applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'seed_data_applied'
  ) THEN
    -- Create a table to track that seed data has been applied
    CREATE TABLE seed_data_applied (
      applied_at timestamptz DEFAULT now()
    );
    
    -- Insert seed vehicles
    INSERT INTO vehicles (name, description, capacity, price_per_hour, price_per_mile, image_url, features, status) 
    VALUES 
      ('Mercedes Sprinter Limo Van', 'Luxury Mercedes Sprinter perfect for airport transfers and group transportation.', 12, 120, 3.5, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg', '["Leather seating", "Premium sound system", "WiFi", "Bottled water", "Climate control"]', 'available'),
      ('Executive Sprinter Limo', 'Business class Mercedes Sprinter with executive amenities for corporate travel.', 10, 150, 4, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg', '["Business workstations", "Power outlets", "WiFi", "Premium leather", "Privacy partition"]', 'available'),
      ('Luxury Sedan', 'Elegant sedan perfect for airport transfers and individual business travel.', 3, 90, 2.5, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg', '["Leather seats", "WiFi", "Bottled water", "Phone chargers"]', 'available');
    
    -- Insert service packages
    INSERT INTO service_packages (id, name, description, rate, is_hourly, minimum_hours, vehicle_id, image_url) 
    VALUES 
      ('lax-special', 'LAX SPECIAL', 'LAX - 50 mile radius', 250, false, null, (SELECT id FROM vehicles WHERE name = 'Mercedes Sprinter Limo Van' LIMIT 1), 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg'),
      ('disney-airports', 'Disneyland Park & Hotel / Airports', 'Disney Hotels to Airports', 250, false, null, (SELECT id FROM vehicles WHERE name = 'Mercedes Sprinter Limo Van' LIMIT 1), 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg'),
      ('special-events', 'Special Events', 'Birthday Parties / Weddings / Prom / Concerts / Sporting Events / Funerals / Wine Tasting Tours / Corporate Travel', 130, true, 4, (SELECT id FROM vehicles WHERE name = 'Mercedes Sprinter Limo Van' LIMIT 1), 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg');
    
    -- Record that we've applied seed data
    INSERT INTO seed_data_applied DEFAULT VALUES;
  END IF;
END
$$;

COMMIT;