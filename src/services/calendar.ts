import { Booking } from '../types';
import { format } from 'date-fns';

// Generate iCalendar file (.ics) content
export function generateCalendarInvite(booking: Booking): string {
  const { bookingDetails, vehicle } = booking;
  const startDate = new Date(bookingDetails.pickupDate);
  
  // Safely handle pickupTime
  const pickupTime = bookingDetails.pickupTime || '00:00';
  const [hours, minutes] = pickupTime.split(':');
  startDate.setHours(Number(hours), Number(minutes));
  
  const endDate = new Date(startDate);
  
  // Safely handle hours (duration)
  const duration = bookingDetails.hours ?? 1; // Default to 1 hour if undefined
  endDate.setHours(endDate.getHours() + duration);
  
  const startDateFormatted = format(startDate, "yyyyMMdd'T'HHmmss");
  const endDateFormatted = format(endDate, "yyyyMMdd'T'HHmmss");
  const createdDateFormatted = format(new Date(), "yyyyMMdd'T'HHmmss");
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LuxLimo//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:${startDateFormatted}
DTEND:${endDateFormatted}
DTSTAMP:${createdDateFormatted}
ORGANIZER;CN=LuxLimo:mailto:bookings@luxlimo.example.com
UID:${booking.id}@luxlimo.example.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${booking.customer.firstName} ${booking.customer.lastName}:mailto:${booking.customer.email}
SUMMARY:Limo Reservation: ${vehicle.name}
DESCRIPTION:Your limo reservation details:\\n\\nVehicle: ${vehicle.name}\\nPickup: ${bookingDetails.pickupAddress}\\nDropoff: ${bookingDetails.dropoffAddress}\\nDate: ${format(startDate, 'MMMM dd, yyyy')}\\nTime: ${bookingDetails.pickupTime}\\nDuration: ${bookingDetails.hours} hours\\n\\nBooking ID: ${booking.id}
LOCATION:${bookingDetails.pickupAddress}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: Your limo will arrive in 1 hour
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

export function downloadCalendarInvite(booking: Booking): void {
  const icsContent = generateCalendarInvite(booking);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `limo-booking-${booking.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}