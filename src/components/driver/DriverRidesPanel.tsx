import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, User, Phone, Plane, Users, DollarSign, Gift } from 'lucide-react';
import { getDriverBookings } from '../../services/booking';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  customerId: {
    profileId: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  };
  vehicleId: {
    make: string;
    model: string;
    licensePlate: string;
  };
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  status: string;
  price: number;
  packageId?: string;
  packageName?: string;
  airportCode?: string;
  passengers?: number;
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

interface DriverRidesPanelProps {
  driverId: string;
}

export default function DriverRidesPanel({ driverId }: DriverRidesPanelProps) {
  const [loading, setLoading] = useState(true);
  const [currentRide, setCurrentRide] = useState<Booking | null>(null);
  const [upcomingRides, setUpcomingRides] = useState<Booking[]>([]);
  const [pastRides, setPastRides] = useState<Booking[]>([]);

  useEffect(() => {
    fetchDriverBookings();
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(fetchDriverBookings, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [driverId]);

  const fetchDriverBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await getDriverBookings(driverId);
      
      if (error) {
        throw error;
      }

      if (data) {
        // Sort bookings into categories
        const current = data.find((booking: Booking) => booking.status === 'in-progress');
        const upcoming = data.filter((booking: Booking) => 
          booking.status === 'confirmed' && new Date(booking.pickupTime) > new Date()
        ).sort((a: Booking, b: Booking) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime());
        const past = data.filter((booking: Booking) => 
          ['completed', 'cancelled'].includes(booking.status)
        ).sort((a: Booking, b: Booking) => new Date(b.pickupTime).getTime() - new Date(a.pickupTime).getTime());

        setCurrentRide(current || null);
        setUpcomingRides(upcoming);
        setPastRides(past);
      }
    } catch (error) {
      console.error('Error fetching driver bookings:', error);
      toast.error('Failed to load your rides');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalEarnings = (booking: Booking) => {
    const basePrice = booking.price || 0;
    const gratuityAmount = booking.gratuity?.amount || 0;
    return basePrice + gratuityAmount;
  };

  const RideCard = ({ booking }: { booking: Booking }) => {
    const totalEarnings = getTotalEarnings(booking);
    const hasGratuity = booking.gratuity && booking.gratuity.type !== 'none';

    return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold">
            {booking.vehicleId.make} {booking.vehicleId.model}
          </h3>
          <p className="text-sm text-gray-500">
            License: {booking.vehicleId.licensePlate}
          </p>
        </div>
          <div className="text-right">
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(booking.status)}`}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
            {/* Earnings Display */}
            <div className="mt-2">
              <div className="text-lg font-bold text-gray-900">
                ${totalEarnings.toFixed(2)}
              </div>
              {hasGratuity && (
                <div className="text-xs text-green-600 flex items-center justify-center space-x-1">
                  <Gift className="h-3 w-3" />
                  <span>
                    {booking.gratuity!.type === 'percentage' && booking.gratuity!.percentage ? (
                      `+$${booking.gratuity!.amount.toFixed(2)} (${booking.gratuity!.percentage}%)`
                    ) : booking.gratuity!.type === 'custom' ? (
                      `+$${booking.gratuity!.amount.toFixed(2)} (Custom)`
                    ) : booking.gratuity!.type === 'cash' ? (
                      `+$${booking.gratuity!.amount.toFixed(2)} (Cash)`
                    ) : (
                      `+$${booking.gratuity!.amount.toFixed(2)}`
                    )}
                  </span>
                </div>
              )}
              <div className="text-xs text-gray-500">
                Base: ${booking.price.toFixed(2)}
              </div>
            </div>
          </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 mr-2 text-gray-500" />
          {formatDateTime(booking.pickupTime)}
        </div>

          {/* Location details */}
        <div className="flex items-center text-sm">
          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
          {booking.pickupLocation}
        </div>

          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            {booking.dropoffLocation}
          </div>

          {/* Additional Stops */}
          {booking.stops && booking.stops.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-gray-600 font-medium">
                  Additional Stops ({booking.stops.length}):
                </span>
              </div>
              {booking.stops.slice(0, 3).map((stop, index) => (
                <div key={index} className="ml-6 text-sm text-gray-600">
                  {index + 1}. {stop.location}
                  {stop.price > 0 && (
                    <span className="text-gray-500 ml-2">(+${stop.price.toFixed(2)})</span>
                  )}
                </div>
              ))}
              {booking.stops.length > 3 && (
                <div className="ml-6 text-sm text-gray-500">
                  +{booking.stops.length - 3} more stops
                </div>
              )}
            </div>
          )}

          {booking.packageId === 'lax-special' && (
          <div className="flex items-center text-sm">
            <Plane className="h-4 w-4 mr-2 text-gray-500" />
            Airport: {booking.airportCode || 'LAX (default)'}
          </div>
        )}

        <div className="flex items-center text-sm">
          <User className="h-4 w-4 mr-2 text-gray-500" />
          {booking.customerId.profileId.firstName} {booking.customerId.profileId.lastName}
        </div>

        <div className="flex items-center text-sm">
          <Phone className="h-4 w-4 mr-2 text-gray-500" />
          {booking.customerId.profileId.phone}
        </div>

        <div className="flex items-center text-sm">
          <Users className="h-4 w-4 mr-2 text-gray-500" />
          {booking.passengers ? `${booking.passengers} passenger${booking.passengers !== 1 ? 's' : ''}` : 'Passengers not specified'}
          </div>

          {/* Gratuity Information for Past Rides */}
          {booking.status === 'completed' && hasGratuity && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <Gift className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Gratuity Received</span>
              </div>
              <div className="mt-1 text-sm text-green-700">
                {booking.gratuity!.type === 'percentage' && booking.gratuity!.percentage ? (
                  `${booking.gratuity!.percentage}% tip - $${booking.gratuity!.amount.toFixed(2)}`
                ) : booking.gratuity!.type === 'custom' ? (
                  `Custom tip - $${booking.gratuity!.amount.toFixed(2)}`
                ) : booking.gratuity!.type === 'cash' ? (
                  `Cash tip - $${booking.gratuity!.amount.toFixed(2)}`
                ) : (
                  `Tip - $${booking.gratuity!.amount.toFixed(2)}`
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentRide && (
        <section>
          <h2 className="text-xl font-bold mb-4">Current Ride</h2>
          <RideCard booking={currentRide} />
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold mb-4">Upcoming Rides</h2>
        {upcomingRides.length > 0 ? (
          upcomingRides.map(booking => (
            <RideCard key={booking._id} booking={booking} />
          ))
        ) : (
          <p className="text-gray-500">No upcoming rides</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Past Rides</h2>
        {pastRides.length > 0 ? (
          pastRides.map(booking => (
            <RideCard key={booking._id} booking={booking} />
          ))
        ) : (
          <p className="text-gray-500">No past rides</p>
        )}
      </section>
    </div>
  );
} 