import { Booking } from '../types/index';
import { API_BASE_URL } from '../config';

interface SMSMessage {
  to: string;
  message: string;
  type: 'booking_confirmation' | 'booking_update' | 'driver_assignment' | 'reminder';
}

interface SMSResponse {
  success: boolean;
  error: any;
}

// SMS service for sending notifications
export async function sendSMS(data: SMSMessage): Promise<SMSResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({ 
      success: false, 
      error: 'Failed to parse server response' 
    }));

    if (!response.ok) {
      console.error('SMS API error:', {
        status: response.status,
        statusText: response.statusText,
        error: result.error
      });
      return { 
        success: false, 
        error: result.error || `Server error: ${response.status} ${response.statusText}` 
      };
    }

    return { success: result.success !== false, error: result.error || null };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return { 
      success: false, 
      error: error.message || 'Network error while sending SMS' 
    };
  }
}

// Helper to format phone numbers to E.164 standard
// function formatPhoneNumber(phoneNumber: string): string | null {
//   // Remove all non-digit characters
//   const digitsOnly = phoneNumber.replace(/\D/g, '');
//   
//   // For US numbers
//   if (digitsOnly.length === 10) {
//     return `+1${digitsOnly}`;
//   }
//   
//   // If already has country code (assumed to be +1 for US)
//   if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
//     return `+${digitsOnly}`;
//   }
//   
//   // If already in full international format with + (length check to avoid malformed numbers)
//   if (phoneNumber.startsWith('+') && digitsOnly.length >= 10) {
//     return phoneNumber;
//   }
//   
//   // Return null if number doesn't match expected formats
//   return null;
// }

// Send booking confirmation to customer
export async function sendBookingConfirmation(booking: Booking): Promise<boolean> {
  // Try multiple sources for customer phone number
  const customerPhone = booking.customerPhone || 
                        booking.customerId?.phone || 
                        (booking as any).customer?.phone;
  
  if (!customerPhone) {
    console.error('Customer phone number not available for booking:', booking._id);
    console.error('Booking object structure:', {
      hasCustomerPhone: !!(booking as any).customerPhone,
      hasCustomerId: !!booking.customerId,
      hasCustomerIdPhone: !!booking.customerId?.phone,
      hasCustomer: !!(booking as any).customer,
      bookingKeys: Object.keys(booking)
    });
    return false;
  }

  const pickupTime = new Date(booking.pickupTime);
  
  // Get vehicle or package information
  const serviceInfo = booking.vehicleName
    ? `Vehicle: ${booking.vehicleName}`
    : (booking.vehicleId && typeof booking.vehicleId === 'object' && (booking.vehicleId as any).name)
      ? `Vehicle: ${(booking.vehicleId as any).name}`
      : booking.packageName 
        ? `Package: ${booking.packageName}`
        : 'Service';

  // Format stops if they exist
  const stopsInfo = booking.stops && booking.stops.length > 0
    ? `\nStops:\n${booking.stops.map((stop: any, index: number) => `${index + 1}. ${stop.location}`).join('\n')}`
    : '';

  // Format price with currency
  const priceInfo = `Total Price: $${booking.totalAmount?.toFixed(2) || booking.price?.toFixed(2) || '0.00'}`;
  
  const message = `
KarLimoLax: Your booking #${booking._id} is confirmed!
${serviceInfo}
${priceInfo}
Date: ${pickupTime.toLocaleDateString()}
Time: ${pickupTime.toLocaleTimeString()}
From: ${booking.pickupLocation}
To: ${booking.dropoffLocation}${stopsInfo}
Thank you for choosing KarLimoLax!
  `.trim();
  
  try {
    const result = await sendSMS({
      to: customerPhone,
      message,
      type: 'booking_confirmation'
    });
    
    if (!result.success) {
      console.warn('[SMS] Failed to send booking confirmation SMS:', result.error);
      // Don't throw - SMS failure shouldn't break the booking flow
    }
    
    return result.success;
  } catch (error: any) {
    console.error('[SMS] Error in sendBookingConfirmation:', error);
    // Return false but don't throw - SMS is optional
    return false;
  }
}

// Send driver assignment notification to customer
export async function sendDriverAssignmentNotification(
  booking: Booking,
  driverName: string,
  driverPhone: string
): Promise<boolean> {
  // Try multiple sources for customer phone number
  const customerPhone = booking.customerPhone || 
                        booking.customerId?.phone || 
                        (booking as any).customer?.phone;
  
  if (!customerPhone) {
    console.error('Customer phone number not available for booking:', booking._id);
    return false;
  }
  
  const message = `
KarLimoLax: Your driver for booking #${booking._id} has been assigned. 
Driver: ${driverName}
Contact: ${driverPhone}
You'll receive a text when your driver is on the way.
  `.trim();
  
  const result = await sendSMS({
    to: customerPhone,
    message,
    type: 'driver_assignment'
  });
  return result.success;
}

// Send booking reminder to customer
export async function sendReminderSms(booking: Booking): Promise<boolean> {
  // Try multiple sources for customer phone number
  const customerPhone = booking.customerPhone || 
                        booking.customerId?.phone || 
                        (booking as any).customer?.phone;
  
  if (!customerPhone) {
    console.error('Customer phone number not available for booking:', booking._id);
    return false;
  }

  const pickupTime = new Date(booking.pickupTime);
  
  const message = `
KarLimoLax Reminder: Your limo service is scheduled for tomorrow at ${pickupTime.toLocaleTimeString()}.
Booking #${booking._id}
Pickup Location: ${booking.pickupLocation}
Any questions? Call us at (424) 526-0457.
  `.trim();
  
  const result = await sendSMS({
    to: customerPhone,
    message,
    type: 'reminder'
  });
  return result.success;
}

// Notify admin about new booking
export async function notifyAdminAboutBooking(
  adminPhone: string,
  booking: Booking
): Promise<boolean> {
  const pickupTime = new Date(booking.pickupTime);
  
  // Get vehicle or package information
  const serviceInfo = booking.vehicleName
    ? `Vehicle: ${booking.vehicleName}`
    : (booking.vehicleId && typeof booking.vehicleId === 'object' && (booking.vehicleId as any).name)
      ? `Vehicle: ${(booking.vehicleId as any).name}`
      : booking.packageName 
        ? `Package: ${booking.packageName}`
        : 'Service';
  
  const message = `
New Booking Alert #${booking._id}
Customer: ${booking.customerId?.firstName} ${booking.customerId?.lastName}
Date: ${pickupTime.toLocaleDateString()}
Time: ${pickupTime.toLocaleTimeString()}
${serviceInfo}
Requires assignment.
  `.trim();
  
  const result = await sendSMS({
    to: adminPhone,
    message,
    type: 'booking_confirmation'
  });
  return result.success;
}

// Notify admin about booking changes
export async function notifyAdminAboutBookingUpdate(
  adminPhone: string,
  booking: Booking,
  changeDescription: string
): Promise<boolean> {
  const message = `
Booking #${booking._id} Updated:
${changeDescription}
Please review in the admin dashboard.
  `.trim();
  
  const result = await sendSMS({
    to: adminPhone,
    message,
    type: 'booking_update'
  });
  return result.success;
}

// Notify driver about assigned ride
export async function notifyDriverAboutAssignment(
  driverPhone: string,
  booking: Booking
): Promise<boolean> {
  const pickupTime = new Date(booking.pickupTime);
  
  const message = `
KarLimoLax: New ride assigned!
Booking #${booking._id}
Customer: ${booking.customerId?.firstName} ${booking.customerId?.lastName}
Date: ${pickupTime.toLocaleDateString()}
Time: ${pickupTime.toLocaleTimeString()}
Pickup: ${booking.pickupLocation}
Please confirm in your driver dashboard.
  `.trim();
  
  const result = await sendSMS({
    to: driverPhone,
    message,
    type: 'driver_assignment'
  });
  return result.success;
}