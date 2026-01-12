import { Booking } from '../types';

interface EmailResponse {
  success: boolean;
  error?: string;
}

// Send booking confirmation email
export async function sendBookingConfirmationEmail(booking: Booking): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/bookings/send-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId: booking.id || booking._id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send confirmation email');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending booking confirmation email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send confirmation email' 
    };
  }
} 