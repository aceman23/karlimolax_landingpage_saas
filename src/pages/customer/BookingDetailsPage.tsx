import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getBooking } from '../../services/booking';
import { Booking as BookingType } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [booking, setBooking] = useState<BookingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        if (!id) {
          throw new Error('Missing booking ID');
        }

        setLoading(true);
        setError(null);

        const response = await getBooking(id);
        
        if (response.error || !response.data) {
          throw new Error(response.error?.message || 'Failed to fetch booking details');
        }

        setBooking(response.data);
      } catch (err: any) {
        console.error('Error fetching booking details:', err);
        setError(err.message || 'An error occurred while loading booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="Loading booking details..." />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{error || 'Booking not found'}</p>
        </div>
        <Link 
          to="/profile" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          Back to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Booking Details</h1>
          <Link 
            to="/profile" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            Back to Profile
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          {/* Status Badge */}
          <div className="mb-6">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
              ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
                booking.status === 'confirmed' ? 'bg-cyan-100 text-cyan-800' : 
                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
            `}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          {/* Service Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Service Type</p>
                <p className="font-medium">
                  {booking.bookingDetails?.packageId ? 
                    `Package: ${booking.bookingDetails.packageId}` : 
                    'Custom Ride'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {booking.bookingDetails?.pickupDate ? 
                    format(new Date(booking.bookingDetails.pickupDate), 'PPpp') : 
                    'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pickup Location</p>
                <p className="font-medium">{booking.bookingDetails?.pickupAddress || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dropoff Location</p>
                <p className="font-medium">{booking.bookingDetails?.dropoffAddress || 'N/A'}</p>
              </div>
              {booking.bookingDetails?.stops && booking.bookingDetails.stops.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Additional Stops</p>
                  <div className="mt-1 space-y-1">
                    {booking.bookingDetails.stops.map((stop: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-gray-700">
                        <div>
                          <span className="font-medium mr-2">{index + 1}.</span>
                          <span>{stop.location}</span>
                        </div>
                        {stop.price > 0 && (
                          <span className="text-gray-500">${stop.price.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-medium">{booking.vehicleName || booking.vehicle?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehicle Type</p>
                <p className="font-medium">{booking.vehicle?.make} {booking.vehicle?.model}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Payment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Base Price</p>
                <p className="font-medium">${booking.price?.toFixed(2) || 'N/A'}</p>
              </div>
              {booking.bookingDetails?.stops && booking.bookingDetails.stops.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Additional Stops Fee</p>
                  <p className="font-medium">
                    ${booking.bookingDetails.stops.reduce((sum, stop) => sum + (stop.price || 0), 0).toFixed(2)}
                  </p>
                </div>
              )}
              {booking.gratuity && booking.gratuity.type !== 'none' && (
                <div>
                  <p className="text-sm text-gray-500">Gratuity</p>
                  <p className="font-medium">
                    {booking.gratuity.type === 'percentage' && booking.gratuity.percentage ? (
                      `$${booking.gratuity.amount.toFixed(2)} (${booking.gratuity.percentage}%)`
                    ) : booking.gratuity.type === 'custom' ? (
                      `$${booking.gratuity.amount.toFixed(2)} (Custom Amount)`
                    ) : booking.gratuity.type === 'cash' ? (
                      `Cash ($${booking.gratuity.amount.toFixed(2)})`
                    ) : (
                      `$${booking.gratuity.amount.toFixed(2)}`
                    )}
                  </p>
                </div>
              )}
              <div className="col-span-2 border-t pt-4 mt-2">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium text-lg">
                  ${(booking.price + (booking.bookingDetails?.stops?.reduce((sum, stop) => sum + (stop.price || 0), 0) || 0) + (booking.gratuity?.amount || 0)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className="font-medium">
                  {booking.status === 'pending' ? 'Pending' : 'Paid'}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {booking.bookingDetails?.specialRequests && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Additional Information</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">{booking.bookingDetails.specialRequests}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 