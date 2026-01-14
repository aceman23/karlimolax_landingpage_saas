import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Clock, Calendar, Car, User, AlertCircle, DollarSign, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import { getDriverBookings } from '../../services/booking';

interface Booking {
  id: string;
  _id?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  scheduledTime?: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  driverName?: string;
  vehicleType?: string;
  vehicleName?: string;
  price: number;
  distance?: string;
  duration?: string;
  customerName?: string;
  customerEmail?: string;
  gratuity?: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
  stops?: Array<{
    location: string;
    order: number;
    price: number;
  }>;
}

export default function DriverBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        if (!user?.id) {
          throw new Error('User not authenticated');
          }

        const { data, error } = await getDriverBookings(user.id);

        if (error) {
          throw new Error(error.message || 'Failed to fetch bookings');
        }

        setBookings(data || []);
      } catch (error: any) {
        console.error('Error fetching bookings:', error);
        toast.error(error.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      ));
      toast.success('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter(booking => 
    filter === 'all' ? true : booking.status === filter
  );

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (error) {
      return dateString;
    }
  };

  const getTotalEarnings = (booking: Booking) => {
    const basePrice = booking.price || 0;
    const gratuityAmount = booking.gratuity?.amount || 0;
    return basePrice + gratuityAmount;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4">
          <h1 className="text-2xl font-bold mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your assigned rides</p>
        </div>
          
        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                filter === 'all'
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Bookings
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                filter === 'confirmed'
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                filter === 'in-progress'
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                filter === 'completed'
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow">
          {filteredBookings.length === 0 ? (
            <div className="p-4 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bookings found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredBookings.map((booking) => (
                <div key={booking.id || booking._id} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="space-y-4">
                      {/* Customer Info */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">
                            {booking.customerName || `${booking.customerEmail || 'Customer'}`}
                          </p>
                        </div>
                        {booking.customerEmail && (
                          <p className="text-sm text-gray-600 ml-6">{booking.customerEmail}</p>
                        )}
                      </div>

                      {/* Locations */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">{booking.pickupLocation}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">{booking.dropoffLocation}</p>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(booking.pickupTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Car className="h-4 w-4" />
                          <span>{booking.vehicleName || booking.vehicleType || 'Vehicle'}</span>
                        </div>
                        {booking.duration && (
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{booking.duration}</span>
                        </div>
                        )}
                        {booking.distance && (
                        <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{booking.distance}</span>
                        </div>
                        )}
                      </div>
                    </div>

                    {/* Status, Pricing, and Actions */}
                    <div className="flex flex-col items-end space-y-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'confirmed' ? 'bg-brand-100 text-brand-700' :
                          booking.status === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      
                      {/* Pricing Information */}
                      <div className="text-right">
                        <div className="text-lg font-bold">${getTotalEarnings(booking).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">
                          Base: ${booking.price.toFixed(2)}
                        </div>
                        {booking.gratuity && booking.gratuity.type !== 'none' && (
                          <div className="text-sm text-green-600 flex items-center justify-end space-x-1">
                            <Gift className="h-3 w-3" />
                            <span>
                              {booking.gratuity.type === 'percentage' && booking.gratuity.percentage ? (
                                `+${booking.gratuity.amount.toFixed(2)} (${booking.gratuity.percentage}%)`
                              ) : booking.gratuity.type === 'custom' ? (
                                `+${booking.gratuity.amount.toFixed(2)} (Custom)`
                              ) : booking.gratuity.type === 'cash' ? (
                                `+${booking.gratuity.amount.toFixed(2)} (Cash)`
                              ) : (
                                `+${booking.gratuity.amount.toFixed(2)}`
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stops Information */}
                      {booking.stops && booking.stops.length > 0 && (
                        <div className="text-right">
                          <div className="text-sm text-brand-500 font-medium">
                            {booking.stops.length} stop{booking.stops.length !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-600">
                            {booking.stops.slice(0, 2).map((stop, index) => (
                              <div key={index} className="truncate max-w-24">
                                {index + 1}. {stop.location}
                              </div>
                            ))}
                            {booking.stops.length > 2 && (
                              <div className="text-gray-500">
                                +{booking.stops.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      {booking.status === 'pending' && (
                        <Button
                          variant="danger"
                          onClick={() => handleCancelBooking(booking.id || booking._id || '')}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 