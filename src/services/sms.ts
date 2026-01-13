import { Booking } from '../types';

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
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send SMS');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
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
  if (!booking.customerId?.phone) {
    console.error('Customer phone number not available for booking:', booking._id);
    return false;
  }

  const pickupTime = new Date(booking.pickupTime);
  
  // Get vehicle or package information
  const serviceInfo = booking.vehicleId?.name 
    ? `Vehicle: ${booking.vehicleId.name}`
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
  
  const result = await sendSMS({
    to: booking.customerId.phone,
    message,
    type: 'booking_confirmation'
  });
  return result.success;
}

// Send driver assignment notification to customer
export async function sendDriverAssignmentNotification(
  booking: Booking,
  driverName: string,
  driverPhone: string
): Promise<boolean> {
  if (!booking.customerId?.phone) {
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
    to: booking.customerId.phone,
    message,
    type: 'driver_assignment'
  });
  return result.success;
}

// Send booking reminder to customer
export async function sendReminderSms(booking: Booking): Promise<boolean> {
  if (!booking.customerId?.phone) {
    console.error('Customer phone number not available for booking:', booking._id);
    return false;
  }

  const pickupTime = new Date(booking.pickupTime);
  
  const message = `
KarLimoLax Reminder: Your limo service is scheduled for tomorrow at ${pickupTime.toLocaleTimeString()}.
Booking #${booking._id}
Pickup Location: ${booking.pickupLocation}
Any questions? Call us at (310) 555-7890.
  `.trim();
  
  const result = await sendSMS({
    to: booking.customerId.phone,
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
  const serviceInfo = booking.vehicleId?.name 
    ? `Vehicle: ${booking.vehicleId.name}`
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