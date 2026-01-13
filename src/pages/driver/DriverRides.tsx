import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Clock, Calendar, Car, User, AlertCircle, DollarSign, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';

interface Ride {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  customerName: string;
  vehicleType: string;
  price: number;
  distance: string;
  duration: string;
  gratuity?: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
}

export default function DriverRides() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await fetch('/api/driver/rides', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch rides');
        }

        const data = await response.json();
        setRides(data.rides);
      } catch (error) {
        console.error('Error fetching rides:', error);
        toast.error('Failed to load rides');
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  const handleStatusUpdate = async (rideId: string, newStatus: Ride['status']) => {
    try {
      const response = await fetch(`/api/driver/rides/${rideId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update ride status');
      }

      setRides(rides.map(ride => 
        ride.id === rideId ? { ...ride, status: newStatus } : ride
      ));
      toast.success('Ride status updated successfully');
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast.error('Failed to update ride status');
    }
  };

  const filteredRides = rides.filter(ride => 
    filter === 'all' ? true : ride.status === filter
  );

  const getTotalEarnings = (ride: Ride) => {
    const basePrice = ride.price || 0;
    const gratuityAmount = ride.gratuity?.amount || 0;
    return basePrice + gratuityAmount;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4">
          <h1 className="text-2xl font-bold mb-2">My Rides</h1>
          <p className="text-gray-600">View and manage your assigned rides</p>
        </div>
          
        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                filter === 'all'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Rides
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                filter === 'scheduled'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                filter === 'in-progress'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                filter === 'completed'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Rides List */}
        <div className="bg-white rounded-lg shadow">
          {filteredRides.length === 0 ? (
            <div className="p-4 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No rides found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredRides.map((ride) => (
                <div key={ride.id} className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="space-y-4">
                      {/* Locations */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">{ride.pickupLocation}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">{ride.dropoffLocation}</p>
                        </div>
                      </div>

                      {/* Ride Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{ride.duration}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Car className="h-4 w-4" />
                          <span>{ride.distance}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{ride.customerName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{ride.scheduledTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status, Pricing, and Actions */}
                    <div className="flex flex-col items-end space-y-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${ride.status === 'scheduled' ? 'bg-purple-100 text-purple-800' :
                          ride.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          ride.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'}`}>
                        {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                      </span>
                      
                      {/* Pricing Information */}
                      <div className="text-right">
                        <div className="text-lg font-bold">${getTotalEarnings(ride).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">
                          Base: ${ride.price.toFixed(2)}
                        </div>
                        {ride.gratuity && ride.gratuity.type !== 'none' && (
                          <div className="text-sm text-green-600 flex items-center justify-end space-x-1">
                            <Gift className="h-3 w-3" />
                            <span>
                              {ride.gratuity.type === 'percentage' && ride.gratuity.percentage ? (
                                `+${ride.gratuity.amount.toFixed(2)} (${ride.gratuity.percentage}%)`
                              ) : ride.gratuity.type === 'custom' ? (
                                `+${ride.gratuity.amount.toFixed(2)} (Custom)`
                              ) : ride.gratuity.type === 'cash' ? (
                                `+${ride.gratuity.amount.toFixed(2)} (Cash)`
                              ) : (
                                `+${ride.gratuity.amount.toFixed(2)}`
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      {ride.status === 'scheduled' && (
                        <div className="flex space-x-2">
                          <Button
                            variant="primary"
                            onClick={() => handleStatusUpdate(ride.id, 'in-progress')}
                          >
                            Start Ride
                          </Button>
                        </div>
                      )}
                      {ride.status === 'in-progress' && (
                        <div className="flex space-x-2">
                          <Button
                            variant="primary"
                            onClick={() => handleStatusUpdate(ride.id, 'completed')}
                          >
                            Complete Ride
                          </Button>
                        </div>
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