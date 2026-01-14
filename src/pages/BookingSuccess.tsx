import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { CheckCircle } from 'lucide-react';
import Button from '../components/common/Button';

export default function BookingSuccess() {
  const navigate = useNavigate();
  const { currentBooking, resetBooking } = useBooking();

  useEffect(() => {
    // If there's no current booking, redirect to home
    if (!currentBooking) {
      navigate('/');
    }
  }, [currentBooking, navigate]);

  if (!currentBooking) {
    return null;
  }

  const formatDateTime = (dateTimeStr: string) => {
    try {
      if (!dateTimeStr) return 'N/A';
      const dateTime = new Date(dateTimeStr);
      return dateTime.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (error) {
      console.error('Error formatting date/time:', error);
      return dateTimeStr;
    }
  };

  const handleNewBooking = () => {
    resetBooking();
    navigate('/booking');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600">
              Thank you for choosing our service. Your booking has been confirmed.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Booking Reference</p>
                <p className="font-medium text-gray-900">{currentBooking._id}</p>
              </div>
              {(currentBooking.vehicleName || currentBooking.vehicleId?.name) && (
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium text-gray-900">{currentBooking.vehicleName || currentBooking.vehicleId?.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Pickup Location</p>
                <p className="font-medium text-gray-900">{currentBooking.pickupLocation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dropoff Location</p>
                <p className="font-medium text-gray-900">{currentBooking.dropoffLocation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pickup Time</p>
                <p className="font-medium text-gray-900">{formatDateTime(currentBooking.pickupTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gratuity Amount</p>
                <p className="font-medium text-gray-900">${currentBooking.gratuity.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium text-gray-900">${currentBooking.price.toFixed(2)}</p>
              </div>
            </div>

            {currentBooking.stops && currentBooking.stops.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Stops</h3>
                <div className="space-y-2">
                  {currentBooking.stops.map((stop, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div>
                        <span className="font-medium text-gray-900">{index + 1}. {stop.location}</span>
                      </div>
                      {stop.price > 0 && (
                        <span className="text-gray-600">${stop.price.toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="bg-brand-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-brand-900 mb-2">What's Next?</h3>
                <ul className="space-y-2 text-brand-700">
                  <li>• You will receive a confirmation email with all booking details</li>
                  <li>• A driver will be assigned to your booking</li>
                  <li>• You can track your booking status in your account</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                onClick={handleNewBooking}
              >
                Make Another Booking
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 