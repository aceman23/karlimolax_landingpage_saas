/*
  # Database Functions and Procedures

  1. Functions
    - Utility functions for reporting and data analysis
    - Trigger functions for business logic
    - Helper functions for common operations
  
  2. Stored Procedures
    - Complex business logic operations
    - Batch processing procedures
*/

-- Function to get total revenue in a given date range
CREATE OR REPLACE FUNCTION get_total_revenue(start_date date, end_date date)
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(total_amount), 0) INTO total
  FROM bookings
  WHERE pickup_date BETWEEN start_date AND end_date
  AND status != 'cancelled'
  AND payment_status = 'paid';
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to get bookings count by status
CREATE OR REPLACE FUNCTION get_bookings_count_by_status()
RETURNS TABLE (
  status text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.status::text, COUNT(*) 
  FROM bookings b
  GROUP BY b.status;
END;
$$ LANGUAGE plpgsql;

-- Function to get driver's upcoming rides
CREATE OR REPLACE FUNCTION get_driver_upcoming_rides(driver_uuid uuid)
RETURNS TABLE (
  booking_id uuid,
  pickup_date date,
  pickup_time time,
  pickup_address text,
  dropoff_address text,
  vehicle_name text,
  customer_name text,
  customer_phone text,
  total_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.pickup_date,
    b.pickup_time,
    b.pickup_address,
    b.dropoff_address,
    v.name,
    (c.first_name || ' ' || c.last_name) as customer_name,
    c.phone,
    b.total_amount
  FROM 
    bookings b
    JOIN vehicles v ON b.vehicle_id = v.id
    JOIN customers c ON b.customer_id = c.id
  WHERE 
    b.driver_id = driver_uuid
    AND b.status IN ('confirmed', 'pending')
    AND (b.pickup_date > CURRENT_DATE 
         OR (b.pickup_date = CURRENT_DATE AND b.pickup_time > CURRENT_TIME))
  ORDER BY 
    b.pickup_date ASC, b.pickup_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Procedure to assign a driver to a booking
CREATE OR REPLACE PROCEDURE assign_driver_to_booking(
  booking_uuid uuid,
  driver_uuid uuid,
  admin_uuid uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
  driver_exists boolean;
  driver_is_available boolean;
  booking_exists boolean;
BEGIN
  -- Check if driver exists and is available
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = driver_uuid AND role = 'driver'
  ) INTO driver_exists;
  
  IF NOT driver_exists THEN
    RAISE EXCEPTION 'Driver does not exist or is not a driver';
  END IF;
  
  -- Check if driver is available
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = driver_uuid AND driver_status = 'available'
  ) INTO driver_is_available;
  
  IF NOT driver_is_available THEN
    RAISE EXCEPTION 'Driver is not available';
  END IF;
  
  -- Check if booking exists and needs a driver
  SELECT EXISTS(
    SELECT 1 FROM bookings WHERE id = booking_uuid AND driver_id IS NULL
  ) INTO booking_exists;
  
  IF NOT booking_exists THEN
    RAISE EXCEPTION 'Booking does not exist or already has a driver assigned';
  END IF;
  
  -- Assign driver to booking
  UPDATE bookings
  SET driver_id = driver_uuid,
      status = 'confirmed',
      updated_at = now()
  WHERE id = booking_uuid;
  
  -- Log the assignment in status history
  INSERT INTO booking_status_history (
    booking_id,
    previous_status,
    new_status,
    changed_by
  )
  SELECT
    booking_uuid,
    status,
    'confirmed',
    admin_uuid
  FROM bookings
  WHERE id = booking_uuid;
  
  -- Update driver status
  UPDATE profiles
  SET driver_status = 'busy'
  WHERE id = driver_uuid;

  COMMIT;
END;
$$;

-- Procedure to cancel a booking
CREATE OR REPLACE PROCEDURE cancel_booking(
  booking_uuid uuid,
  cancellation_reason text,
  user_uuid uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
  is_admin boolean;
  current_status booking_status;
  driver_uuid uuid;
BEGIN
  -- Check if user is admin
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = user_uuid AND role = 'admin'
  ) INTO is_admin;
  
  -- Get current booking info
  SELECT status, driver_id INTO current_status, driver_uuid
  FROM bookings
  WHERE id = booking_uuid;
  
  -- Check if booking can be cancelled
  IF current_status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel a booking that is already % status', current_status;
  END IF;
  
  -- Update booking status
  UPDATE bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = booking_uuid;
  
  -- Log the cancellation
  INSERT INTO booking_status_history (
    booking_id,
    previous_status,
    new_status,
    changed_by,
    notes
  )
  VALUES (
    booking_uuid,
    current_status,
    'cancelled',
    user_uuid,
    cancellation_reason
  );
  
  -- If a driver was assigned, update their status
  IF driver_uuid IS NOT NULL THEN
    UPDATE profiles
    SET driver_status = 'available'
    WHERE id = driver_uuid;
  END IF;

  COMMIT;
END;
$$;

-- Function to calculate booking duration in hours
CREATE OR REPLACE FUNCTION calculate_booking_duration(
  pickup_date date,
  pickup_time time,
  hours_booked int
)
RETURNS interval AS $$
BEGIN
  RETURN (pickup_time::time + (hours_booked * interval '1 hour'))::interval;
END;
$$ LANGUAGE plpgsql;

-- Function to check if driver is available for booking time
CREATE OR REPLACE FUNCTION is_driver_available_for_booking(
  driver_uuid uuid,
  booking_date date,
  booking_time time,
  duration_hours int
)
RETURNS boolean AS $$
DECLARE
  booking_end_time time;
  conflicts_count int;
BEGIN
  -- Calculate end time
  booking_end_time := (booking_time::time + (duration_hours * interval '1 hour'))::time;
  
  -- Count booking conflicts
  SELECT COUNT(*) INTO conflicts_count
  FROM bookings 
  WHERE 
    driver_id = driver_uuid
    AND pickup_date = booking_date
    AND status IN ('confirmed', 'pending', 'in_progress')
    AND (
      (pickup_time <= booking_time AND (pickup_time + (hours * interval '1 hour'))::time > booking_time)
      OR
      (pickup_time < booking_end_time AND (pickup_time + (hours * interval '1 hour'))::time >= booking_end_time)
      OR
      (pickup_time >= booking_time AND (pickup_time + (hours * interval '1 hour'))::time <= booking_end_time)
    );
    
  RETURN conflicts_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Add additional column to booking_status_history
ALTER TABLE booking_status_history ADD COLUMN IF NOT EXISTS notes text;