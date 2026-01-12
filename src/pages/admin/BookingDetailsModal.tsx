import React from 'react';
import { useState } from 'react';
import Button from '../../components/common/Button';
import EditBookingModal from './EditBookingModal';

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
  pickupTime: string; // ISO format date
  pickupDate?: string; // Might not be present from API
  status: string;
  price: number;
  notes?: string;
  packageName?: string;
  packageId?: string;
  airportCode?: string; // Airport code for Airport Special package
  hours?: number;
  passengers?: number; // Number of passengers
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

export default function BookingDetailsModal({ booking, onClose, onBookingUpdated }: { booking: Booking, onClose: () => void, onBookingUpdated?: () => void }) {
  const [showEdit, setShowEdit] = useState(false);

  const handleSave = async (updated: any) => {
    // Call backend to update booking
    await fetch(`/api/bookings/${booking._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    setShowEdit(false);
    if (onBookingUpdated) onBookingUpdated();
    onClose();
  };

  // Format datetime for display from ISO string
  const formatDateTime = (dateTimeStr: string) => {
    try {
      if (!dateTimeStr) {
        return 'N/A';
      }

      // Parse the ISO date string
      const dateTime = new Date(dateTimeStr);
      
      // Check if the date is valid
      if (isNaN(dateTime.getTime())) {
        console.log('Invalid date:', dateTimeStr);
        return dateTimeStr; // Return the original string if invalid
      }
      
      // Format the date using toLocaleString
      return dateTime.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (error) {
      console.error('Error formatting date/time:', error, dateTimeStr);
      return dateTimeStr; // Return the original string on error
    }
  };

  // Determine customer name from either direct field or customerId
  const getCustomerName = () => {
    if (booking.customer?.name) {
      return booking.customer.name;
    } else if (booking.customerName) {
      return booking.customerName;
    } else if (booking.customerId) {
      return `${booking.customerId.firstName || ''} ${booking.customerId.lastName || ''}`;
    }
    return 'Unknown Customer';
  };

  // Determine customer email from either direct field or customerId
  const getCustomerEmail = () => {
    if (booking.customer?.email) {
      return booking.customer.email;
    } else if (booking.customerEmail) {
      return booking.customerEmail;
    } else if (booking.customerId && booking.customerId.email) {
      return booking.customerId.email;
    }
    return 'No email';
  };

  // Get customer phone from customerId (no direct field for phone yet)
  const getCustomerPhone = () => {
    if (booking.customer?.phone) {
      return booking.customer.phone;
    } else if (booking.customerId && booking.customerId.phone) {
      return booking.customerId.phone;
    }
    return 'No phone';
  };

  if (!booking) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative max-h-[90vh] flex flex-col">
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">✕</button>
          <h2 className="text-2xl font-bold mb-4">Booking Details</h2>
          
          {/* Main booking details */}
          <div className="space-y-2 overflow-y-auto flex-1 pr-2">
            <div><span className="font-semibold">Booking #:</span> {booking._id}</div>
            <div><span className="font-semibold">Status:</span> {booking.status}</div>
            
            {/* Customer section with comprehensive info - using helper methods */}
            <div className="bg-gray-50 p-3 rounded-md mt-4 mb-2">
              <h3 className="font-semibold text-gray-700 mb-2">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><span className="font-medium text-gray-600">Name:</span> {getCustomerName()}</div>
                <div><span className="font-medium text-gray-600">Email:</span> {getCustomerEmail()}</div>
                <div><span className="font-medium text-gray-600">Phone:</span> {getCustomerPhone()}</div>
              </div>
            </div>
            
            {/* Driver information */}
            <div><span className="font-semibold">Driver:</span> {booking.driverId ? 
              `${booking.driverId.firstName || ''} ${booking.driverId.lastName || ''} (${booking.driverId.phone || 'No phone'})` : 'Unassigned'}</div>
            
            {/* Vehicle information */}
            <div><span className="font-semibold">Vehicle:</span> {booking.vehicleName ? 
              `${booking.vehicleName}${booking.vehicleId ? ` (${booking.vehicleId.make} ${booking.vehicleId.model}, ${booking.vehicleId.capacity} seats)` : ''}` : 
              booking.vehicleId ? 
              `${booking.vehicleId.make} ${booking.vehicleId.model} (${booking.vehicleId.capacity} seats)` : 
              'Not assigned'}</div>
            
            {/* Service details */}
            <div><span className="font-semibold">Package:</span> {booking.package?.name || booking.packageName || 'Custom Ride'}</div>
            {booking.packageId === 'lax-special' && booking.airportCode && (
              <div><span className="font-semibold">Airport:</span> {booking.airportCode}</div>
            )}
            <div>
              <span className="font-semibold">Duration:</span> 
              {booking.hours ? (
                <span>{booking.hours} hour{booking.hours !== 0 ? 's' : ''}</span>
              ) : (
                <span className="text-gray-500">N/A</span>
              )}
            </div>
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
            
            {/* Location details */}
            <div><span className="font-semibold">Pickup:</span> {booking.pickupLocation}</div>
            <div><span className="font-semibold">Dropoff:</span> {booking.dropoffLocation}</div>
            <div><span className="font-semibold">Pickup Date/Time:</span> {formatDateTime(booking.pickupTime)}</div>
            <div><span className="font-semibold">Booked At:</span> {formatDateTime(booking.createdAt)}</div>
            
            {/* Stops */}
            {booking.stops && booking.stops.length > 0 && (
              <div>
                <span className="font-semibold">Additional Stops:</span>
                <ul className="list-disc list-inside mt-1">
                  {booking.stops.map((stop, index) => (
                    <li key={index} className="text-gray-700">
                      {index + 1}. {stop.location}
                      {stop.price > 0 && <span className="text-gray-500 ml-2">(${stop.price})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Pricing */}
            <div><span className="font-semibold">Price:</span> ${booking.price}</div>
            <div><span className="font-semibold">Gratuity:</span> {booking.gratuity && booking.gratuity.type !== 'none' ? 
              `$${booking.gratuity.amount} (${booking.gratuity.type === 'percentage' ? `${booking.gratuity.percentage}%` : booking.gratuity.type === 'custom' ? 'Custom Amount' : 'Cash'})` : 
              'None'}</div>
            
            {/* Notes */}
            <div><span className="font-semibold">Notes:</span> {booking.notes || '—'}</div>
          </div>
          
          <div className="mt-6 text-right space-x-2 border-t pt-4">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="primary" onClick={() => setShowEdit(true)}>Edit</Button>
          </div>
        </div>
      </div>
      {showEdit && (
        <EditBookingModal 
          booking={booking} 
          onSave={handleSave} 
          onClose={() => setShowEdit(false)} 
        />
      )}
    </>
  );
} 