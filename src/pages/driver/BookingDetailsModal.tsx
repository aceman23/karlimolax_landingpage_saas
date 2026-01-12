import React from 'react';
import { format } from 'date-fns';

interface BookingDetailsModalProps {
  booking: any;
  onClose: () => void;
}

export default function BookingDetailsModal({ booking, onClose }: BookingDetailsModalProps) {
  const formatDateTime = (dateTime: string | Date) => {
    if (!dateTime) return 'N/A';
    try {
      return format(new Date(dateTime), 'PPpp');
    } catch {
      return 'Invalid Date';
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold mb-4">Booking Details</h2>
        
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center">
            <span className="font-semibold w-32">Booking #:</span>
            <span>{booking._id}</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold w-32">Status:</span>
            <span className={`px-2 py-1 rounded-full text-sm font-medium
              ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
                booking.status === 'confirmed' ? 'bg-cyan-100 text-cyan-800' : 
                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'}`}
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          {/* Service Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Service Details</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-medium text-gray-600 w-32">Package:</span>
                <span>{booking.packageName || 'Custom Ride'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-600 w-32">Vehicle:</span>
                <span>{booking.vehicleName || booking.vehicleId?.name || 'Not assigned'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-600 w-32">Price:</span>
                <span>${booking.price?.toFixed(2) || 'N/A'}</span>
              </div>
              {booking.gratuity && booking.gratuity.type !== 'none' && (
                <div className="flex">
                  <span className="font-medium text-gray-600 w-32">Gratuity:</span>
                  <span>
                    {booking.gratuity.type === 'percentage' && booking.gratuity.percentage ? (
                      `$${booking.gratuity.amount.toFixed(2)} (${booking.gratuity.percentage}%)`
                    ) : booking.gratuity.type === 'custom' ? (
                      `$${booking.gratuity.amount.toFixed(2)} (Custom Amount)`
                    ) : booking.gratuity.type === 'cash' ? (
                      `Cash ($${booking.gratuity.amount.toFixed(2)})`
                    ) : (
                      `$${booking.gratuity.amount.toFixed(2)}`
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Location Details</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-medium text-gray-600 w-32">Pickup:</span>
                <span>{booking.pickupLocation || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-600 w-32">Dropoff:</span>
                <span>{booking.dropoffLocation || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-600 w-32">Date/Time:</span>
                <span>{formatDateTime(booking.pickupTime)}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-600 w-32">Booked At:</span>
                <span>{formatDateTime(booking.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Additional Details</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-medium text-gray-600 w-32">Passengers:</span>
                <span>{booking.passengers || 'Not specified'}</span>
              </div>
              {booking.carSeats && booking.carSeats > 0 && (
                <div className="flex">
                  <span className="font-medium text-gray-600 w-32">Car Seats:</span>
                  <span>{booking.carSeats}</span>
                </div>
              )}
              {booking.boosterSeats && booking.boosterSeats > 0 && (
                <div className="flex">
                  <span className="font-medium text-gray-600 w-32">Booster Seats:</span>
                  <span>{booking.boosterSeats}</span>
                </div>
              )}
              <div className="flex">
                <span className="font-medium text-gray-600 w-32">Duration:</span>
                <span>{booking.hours ? `${booking.hours} hour${booking.hours !== 1 ? 's' : ''}` : 'N/A'}</span>
              </div>
              {booking.specialRequests && (
                <div className="flex">
                  <span className="font-medium text-gray-600 w-32">Special Requests:</span>
                  <span>{booking.specialRequests}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 