import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, Download, Share2 } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import Button from '../components/common/Button';
import { downloadCalendarInvite } from '../services/calendar';
import { sendBookingConfirmation } from '../services/sms';
import { sendBookingConfirmationEmail } from '../services/email';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { currentBooking, resetBooking } = useBooking();
  
  // Redirect if no booking
  useEffect(() => {
    if (!currentBooking) {
      navigate('/booking');
    } else {
      // Send SMS and email confirmations
      const sendConfirmations = async () => {
        const booking = currentBooking; // Create a non-null reference
        try {
          // Send SMS confirmation
          if (booking.customerId?.phone) {
            await sendBookingConfirmation(booking);
          }
          
          // Send email confirmation
          if (booking.customerId?.email || booking.customerEmail) {
            const emailResult = await sendBookingConfirmationEmail(booking);
            if (!emailResult.success) {
              console.error('Failed to send email confirmation:', emailResult.error);
            }
          }
        } catch (error) {
          console.error('Error sending confirmations:', error);
        }
      };
      
      sendConfirmations();
    }
  }, [currentBooking, navigate]);
  
  // Handle calendar download
  const handleCalendarDownload = () => {
    if (currentBooking) {
      try {
        downloadCalendarInvite(currentBooking);
        toast.success('Calendar invite downloaded successfully');
      } catch (error) {
        console.error('Error downloading calendar invite:', error);
        toast.error('Failed to download calendar invite. Please try again.');
      }
    }
  };
  
  // Share booking details
  const handleShare = async () => {
    const vehicleDisplay = currentBooking.vehicleName || currentBooking.vehicleId?.name || 'Custom Package';
    const shareData = {
      title: 'Booking Confirmation',
      text: `Your booking has been confirmed!\n\n` +
        `Pickup Location: ${currentBooking.pickupLocation}\n` +
        `Dropoff Location: ${currentBooking.dropoffLocation}\n` +
        `Pickup Time: ${currentBooking.pickupTime}\n` +
        `Vehicle: ${vehicleDisplay}\n` +
        `Price: $${currentBooking.price.toFixed(2)}\n` +
        `Status: ${currentBooking.status}\n\n` +
        `Thank you for choosing our service!`
    };

    try {
    if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        toast.success('Booking details copied to clipboard!');
      }
    } catch (error) {
          console.error('Error sharing:', error);
              toast.error('Failed to share booking details');
    }
  };
  
  // Handle new booking
  const handleNewBooking = () => {
    resetBooking();
    navigate('/booking');
  };
  
  if (!currentBooking) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Booking Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find your booking details. Please make a booking first.</p>
          <Link to="/booking">
            <Button variant="primary">Book a Ride</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const { vehicleId, customer, id, _id } = currentBooking;
  const bookingId = id || _id; // Use either id or _id

  // Convert ISO string to Date object for pickupTime
  const pickupDate = new Date(currentBooking.pickupTime);
  const formattedPickupTime = pickupDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-4">
              Thank you for choosing our service. Your booking has been successfully confirmed.
            </p>
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-lg font-semibold text-brand-600">{bookingId}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(bookingId);
                    toast.success('Booking ID copied to clipboard');
                  }}
                  className="text-brand-500 hover:text-brand-600"
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-b border-gray-200 py-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Confirmed
                </p>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-brand-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                  <p className="font-medium">
                    {pickupDate.toLocaleDateString()} at {formattedPickupTime}
                  </p>
                </div>
              </div>
              
              {currentBooking.hours && (
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-brand-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duration</p>
                    <p className="font-medium">{currentBooking.hours} hour(s)</p>
                  </div>
                </div>
              )}
              
              {currentBooking.packageId === 'lax-special' && currentBooking.airportCode && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-brand-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Selected Airport</p>
                    <p className="font-medium">{currentBooking.airportCode}</p>
                  </div>
                </div>
              )}
              
              { (currentBooking.vehicleName || currentBooking.vehicleId?.name) && (
                <div className="flex items-start">
                  <div className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                    <p className="font-medium">{currentBooking.vehicleName || currentBooking.vehicleId?.name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-brand-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pickup Address</p>
                  <p className="font-medium">{currentBooking.pickupLocation}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-brand-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Dropoff Address</p>
                  <p className="font-medium">{currentBooking.dropoffLocation}</p>
                </div>
              </div>

              {currentBooking.stops && currentBooking.stops.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-2">Additional Stops</p>
                  <div className="space-y-2">
                    {currentBooking.stops.map((stop: any, index: number) => (
                      <div key={index} className="flex items-start">
                        <MapPin className="h-5 w-5 text-brand-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Stop {index + 1}: {stop.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-b border-gray-200 py-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Information</h2>
            {vehicleId ? (
              <div className="flex items-start">
                <div className="w-24 h-16 rounded overflow-hidden mr-4 flex-shrink-0">
                  <img 
                    src="/limo.png" 
                    alt={currentBooking.vehicleName || vehicleId.name || 'Limo'} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{currentBooking.vehicleName || vehicleId.name}</h3>
                  {currentBooking.packageId ? (
                    <p className="text-gray-600">Fixed Rate Package</p>
                  ) : (
                    <p className="text-gray-600">Price: ${(vehicleId as any).pricePerHour || currentBooking.price}/hour</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">No vehicle selected for this booking.</div>
            )}
          </div>
          
          <div className="border-b border-gray-200 py-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
            <div className="space-y-2">
              {vehicleId ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {currentBooking.packageId 
                      ? `Package: ${currentBooking.vehicleName || vehicleId.name}`
                      : `${currentBooking.vehicleName || vehicleId.name}${currentBooking.hours ? ` (${currentBooking.hours} hours)` : ''}`}
                  </span>
                  <span>${currentBooking.totalAmount || currentBooking.price}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span>${currentBooking.totalAmount || currentBooking.price}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${currentBooking.totalAmount || currentBooking.price}</span>
              </div>
              <div className="text-green-600 text-sm">
                Payment has been successfully processed.
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <Button 
              variant="secondary"
              className="flex items-center justify-center"
              onClick={handleCalendarDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
            
            <Button 
              variant="secondary"
              className="flex items-center justify-center"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Booking Details
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              A confirmation has been sent to {customer?.email || 'your email'}.<br />
              You will also receive a text reminder at {customer?.phone || 'your phone'} before your scheduled pickup.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/">
                <Button variant="primary">
                  Return to Home
                </Button>
              </Link>
              
              <Button 
                variant="secondary"
                onClick={handleNewBooking}
              >
                Book Another Ride
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}