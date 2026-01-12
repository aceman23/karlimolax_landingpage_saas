import React, { useState } from 'react';
import Button from '../../components/common/Button';

interface BookingCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Booking {
  _id: string;
  customerId: BookingCustomer;
  customerName?: string;
  customerEmail?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  vehicleId?: {
    name?: string;
    make: string;
    model: string;
    capacity: number;
  };
  vehicleName?: string; // Add vehicle name field
  driverId?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  pickupDate?: string;
  status: string;
  price: number;
  notes?: string;
  packageName?: string;
  packageId?: string;
  airportCode?: string;
  hours?: number;
  passengers?: number;
  package?: {
    name: string;
    hours: number;
  };
  stops?: {
    location: string;
    price: number;
  }[];
  createdAt: string;
  carSeats?: number;
  boosterSeats?: number;
  gratuity?: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
}

export default function BookingDetailsModal({ booking, onClose }: { booking: Booking, onClose: () => void }) {
  // Format datetime for display from ISO string
  const formatDateTime = (dateTimeStr: string) => {
    try {
      if (!dateTimeStr) {
        return 'N/A';
      }

      const dateTime = new Date(dateTimeStr);
      
      if (isNaN(dateTime.getTime())) {
        console.log('Invalid date:', dateTimeStr);
        return dateTimeStr;
      }
      
      return dateTime.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (error) {
      console.error('Error formatting date/time:', error, dateTimeStr);
      return dateTimeStr;
    }
  };

  console.log('booking', booking);
  if (!booking) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">✕</button>
        <h2 className="text-2xl font-bold mb-4">Booking Details</h2>
        
        {/* Main booking details */}
        <div className="space-y-2 overflow-y-auto flex-1 pr-2">
          <div><span className="font-semibold">Booking #:</span> {booking._id}</div>
          <div><span className="font-semibold">Status:</span> {booking.status}</div>
          
          {/* Driver information */}
          {/* <div><span className="font-semibold">Driver:</span> {booking.driverId ? 
            `${booking.driverId.firstName || ''} ${booking.driverId.lastName || ''} (${booking.driverId.phone || 'No phone'})` : 'Unassigned'}</div> */}
          
          {/* Vehicle information */}
          <div><span className="font-semibold">Vehicle:</span> {booking.vehicleName || booking.vehicleId?.name || `${booking.vehicleId?.make} ${booking.vehicleId?.model}` || 'Not assigned'}</div>
          
          {/* Service details */}
          <div><span className="font-semibold">Package:</span> {booking.package?.name || booking.packageName || 'Custom Ride'}</div>
          {booking.packageId === 'lax-special' && booking.airportCode && (
            <div><span className="font-semibold">Airport:</span> {booking.airportCode}</div>
          )}
          <div>
            <span className="font-semibold">Duration:</span> 
            {booking.hours ? (
              <span>{booking.hours} hour{booking.hours !== 1 ? 's' : ''}</span>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </div>
          <div><span className="font-semibold">Passengers:</span> {booking.passengers || 'Not specified'}</div>
          {booking.carSeats && booking.carSeats > 0 && (
            <div><span className="font-semibold">Car Seats:</span> {booking.carSeats}</div>
          )}
          {booking.boosterSeats && booking.boosterSeats > 0 && (
            <div><span className="font-semibold">Booster Seats:</span> {booking.boosterSeats}</div>
          )}
          
          {/* Location details */}
          <div><span className="font-semibold">Pickup:</span> {booking.pickupLocation}</div>
          <div><span className="font-semibold">Dropoff:</span> {booking.dropoffLocation}</div>
          <div><span className="font-semibold">Pickup Date/Time:</span> {formatDateTime(booking.pickupTime)}</div>
          <div><span className="font-semibold">Booked At:</span> {formatDateTime(booking.createdAt)}</div>
          
          {/* Stops */}
          {booking.stops && booking.stops.length > 0 && (
            <div>
              <span className="font-semibold">Additional Stops:</span>
              <div className="mt-2 space-y-2">
                {booking.stops.map((stop, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          Stop {index + 1}: {stop.location}
                        </div>
                        {stop.price > 0 && (
                          <div className="text-sm text-gray-600 mt-1">
                            Additional cost: ${stop.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-sm text-gray-600 mt-2">
                  Total stops: {booking.stops.length}
                </div>
              </div>
            </div>
          )}
          
          {/* Pricing */}
          <div><span className="font-semibold">Price:</span> ${booking.price}</div>
          
          {/* Gratuity */}
          {booking.gratuity && booking.gratuity.type !== 'none' && (
            <div>
              <span className="font-semibold">Gratuity:</span> 
              {booking.gratuity.type === 'percentage' && booking.gratuity.percentage ? (
                <span> ${booking.gratuity.amount.toFixed(2)} ({booking.gratuity.percentage}%)</span>
              ) : booking.gratuity.type === 'custom' ? (
                <span> ${booking.gratuity.amount.toFixed(2)} (Custom Amount)</span>
              ) : booking.gratuity.type === 'cash' ? (
                <span> Cash (${booking.gratuity.amount.toFixed(2)})</span>
              ) : (
                <span> ${booking.gratuity.amount.toFixed(2)}</span>
              )}
            </div>
          )}
          
          {/* Notes */}
          <div><span className="font-semibold">Notes:</span> {booking.notes || '—'}</div>
        </div>
        
        <div className="mt-6 text-right border-t pt-4">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
} 