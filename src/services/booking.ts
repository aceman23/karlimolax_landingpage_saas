import { toast } from 'react-hot-toast';
import { sendBookingConfirmation, sendDriverAssignmentNotification, notifyDriverAboutAssignment } from './sms';

// Updated BookingData interface to match new backend expectations
export interface BookingRequestPayload {
  // Required fields
  vehicleId?: string;
  vehicleName?: string; // Add vehicle name field
  paymentStatus: 'paid' | 'pending' | 'failed';
  totalAmount: number;
  
  // Customer details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Booking details
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  price: number;
  notes?: string;
  hours?: number;
  testMode?: boolean;
  
  // Package details
  packageId?: string;
  packageName?: string;
  airportCode?: string;
  passengers?: number;
  carSeats?: number;
  boosterSeats?: number;
  
  // Additional details
  stops?: Array<{
    location: string;
    order: number;
    price: number;
  }>;
  
  // Gratuity
  gratuity?: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
}

// Create a new booking in MongoDB
// The function now accepts a single payload object
export async function createBooking(payload: BookingRequestPayload): Promise<{ data: any | null; error: any }> {
  try {
    // Ensure passengers is explicitly set as a number
    const modifiedPayload = {
      ...payload,
      passengers: typeof payload.passengers === 'number' ? 
        payload.passengers : 
        (payload.passengers ? Number(payload.passengers) : 1) // Default to 1 passenger
    };
    
    console.log("Sending booking payload:", modifiedPayload);
    
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modifiedPayload),
    });

    // First try to parse as JSON
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If JSON parsing fails, read as text
      const text = await response.text();
      console.error('Failed to parse response as JSON:', text);
      throw new Error('Server returned invalid response format');
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Failed to create booking (status ${response.status})`);
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    toast.error(error.message || 'Could not create booking. Please try again.');
    return { data: null, error };
  }
}

export async function getBooking(bookingId: string) {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch booking' }));
      throw new Error(errorData.message || 'Failed to fetch booking');
    }
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching booking:', error);
    return { data: null, error };
  }
}

export async function updateBooking(bookingId: string, updates: Partial<BookingRequestPayload>) {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update booking');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error updating booking:', error);
    return { data: null, error };
  }
}

export async function getCustomerBookings(email: string) {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Extract the email from the JWT token
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const userEmail = decodedToken.email;

    console.log('Fetching bookings for email:', userEmail); // Add logging

    const response = await fetch(`/api/bookings?email=${encodeURIComponent(userEmail)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch customer bookings' }));
      console.error('Bookings fetch error:', errorData); // Add logging
      throw new Error(errorData.message || 'Failed to fetch customer bookings');
    }

    const data = await response.json();
    console.log('Bookings response:', data); // Add logging

    // Ensure we're returning an array
    if (!Array.isArray(data)) {
      console.warn('Bookings response is not an array:', data);
      return { data: [], error: null };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return { data: null, error };
  }
}

export async function getDriverBookings(driverId: string) {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Extract the actual driver ID from the JWT token
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const actualDriverId = decodedToken.userId;

    const response = await fetch(`/api/bookings?driverId=${actualDriverId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch driver bookings' }));
      throw new Error(errorData.message || 'Failed to fetch driver bookings');
    }
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    return { data: null, error };
  }
}

export async function getTomorrowBookings() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0];
    
    const response = await fetch(`/api/bookings?date=${formattedDate}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tomorrow\'s bookings');
    }
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching tomorrow\'s bookings:', error);
    return { data: null, error };
  }
}

// Assign a driver to a booking
export async function assignDriverToBooking(
  bookingId: string, 
  driverId: string
): Promise<{ success: boolean; booking?: any; error?: string }> {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Update booking with driver assignment
    const response = await fetch(`/api/bookings/${bookingId}/assign-driver`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ driverId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to assign driver');
    }

    const bookingData = await response.json();
    
    // Get driver information
    const driverResponse = await fetch(`/api/profiles/${driverId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!driverResponse.ok) {
      throw new Error('Failed to fetch driver information');
    }
    const driverData = await driverResponse.json();

    // Only send notifications if we have valid phone numbers and required data
    try {
      // Send customer notification if customer phone exists
      if (bookingData?.customerId?.phone && 
          driverData?.firstName && 
          driverData?.lastName && 
          driverData?.phone) {
        await sendDriverAssignmentNotification(
          bookingData,
          `${driverData.firstName} ${driverData.lastName}`,
          driverData.phone
        );
      }

      // Send driver notification if driver phone exists
      if (driverData?.phone && bookingData) {
        await notifyDriverAboutAssignment(
          driverData.phone,
          bookingData
        );
      }
    } catch (notificationError) {
      // Log notification error but don't fail the assignment
      console.warn('Failed to send notifications:', notificationError);
    }

    return { success: true, booking: bookingData };
  } catch (error: any) {
    console.error('Error in assignDriverToBooking:', error);
    return { success: false, error: error.message };
  }
}

// Schedule SMS reminders for upcoming bookings
export async function scheduleBookingReminders(): Promise<void> {
  try {
    // Get bookings that are scheduled for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    const response = await fetch(`/api/bookings/reminders?date=${tomorrowDate}`);
    if (!response.ok) {
      throw new Error('Failed to fetch bookings for reminders');
    }

    const bookings = await response.json();
    
    // Send reminder for each booking
    for (const booking of bookings) {
      if (booking.customerId?.phone) {
        await sendBookingConfirmation(booking);
      }
    }
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
}

// Update booking assignments (driver and/or vehicle)
export async function updateBookingAssignments(
  bookingId: string,
  updates: { driverId?: string; vehicleId?: string }
): Promise<{ success: boolean; booking?: any; error?: string }> {
  try {
    const response = await fetch(`/api/bookings/${bookingId}/update-assignments`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update assignments');
    }

    const bookingData = await response.json();

    // Send notifications if driver was changed
    if (updates.driverId) {
      try {
        const driverResponse = await fetch(`/api/profiles/${updates.driverId}`);
        if (!driverResponse.ok) {
          throw new Error('Failed to fetch driver information');
        }
        const driverData = await driverResponse.json();

        // Send customer notification
        if (bookingData?.customerId?.phone && 
            driverData?.firstName && 
            driverData?.lastName && 
            driverData?.phone) {
          await sendDriverAssignmentNotification(
            bookingData,
            `${driverData.firstName} ${driverData.lastName}`,
            driverData.phone
          );
        }

        // Send driver notification
        if (driverData?.phone && bookingData) {
          await notifyDriverAboutAssignment(
            driverData.phone,
            bookingData
          );
        }
      } catch (notificationError) {
        console.warn('Failed to send notifications:', notificationError);
      }
    }

    return { success: true, booking: bookingData };
  } catch (error: any) {
    console.error('Error in updateBookingAssignments:', error);
    return { success: false, error: error.message };
  }
}