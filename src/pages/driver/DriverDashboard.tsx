import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Car, Clock, MapPin, Calendar, DollarSign, Star, User, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DriverStats {
  totalRides: number;
  completedRides: number;
  upcomingRides: number;
  totalEarnings: number;
  baseEarnings: number;
  gratuityEarnings: number;
  rating: number;
}

interface Ride {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  customerName: string;
  vehicleType: string;
  price: number;
  gratuity?: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DriverStats>({
    totalRides: 0,
    completedRides: 0,
    upcomingRides: 0,
    totalEarnings: 0,
    baseEarnings: 0,
    gratuityEarnings: 0,
    rating: 0
  });
  const [currentRides, setCurrentRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // First, check if we have a token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Try to fetch the driver profile first
        const profileResponse = await fetch('/api/driver/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            // If profile not found, try to create one
            const createProfileResponse = await fetch('/api/driver/profile', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: 'active',
                availability: true
              })
            });

            if (!createProfileResponse.ok) {
              throw new Error('Failed to create driver profile');
            }
          } else {
            throw new Error('Failed to fetch driver profile');
          }
        }

        // Now fetch the dashboard data
        const dashboardResponse = await fetch('/api/driver/dashboard-data', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!dashboardResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await dashboardResponse.json();
        
        // Calculate earnings including gratuity
        const baseEarnings = data.performanceMetrics?.todayEarnings || 0;
        const gratuityEarnings = data.performanceMetrics?.gratuityEarnings || 0;
        const totalEarnings = baseEarnings + gratuityEarnings;
        
        // Update the stats with the correct data structure from the backend
        setStats({
          totalRides: data.pastRides?.length || 0,
          completedRides: data.pastRides?.length || 0,
          upcomingRides: data.upcomingRides?.length || 0,
          totalEarnings: totalEarnings,
          baseEarnings: baseEarnings,
          gratuityEarnings: gratuityEarnings,
          rating: data.performanceMetrics?.rating || 0
        });

        // Set current rides if available
        if (data.currentRide) {
          setCurrentRides([{
            id: data.currentRide._id,
            pickupLocation: data.currentRide.pickupLocation,
            dropoffLocation: data.currentRide.dropoffLocation,
            scheduledTime: new Date(data.currentRide.pickupTime).toLocaleString(),
            status: data.currentRide.status,
            customerName: `${data.currentRide.customerId?.firstName || ''} ${data.currentRide.customerId?.lastName || ''}`,
            vehicleType: data.currentRide.vehicleId?.name || 'Unknown Vehicle',
            price: data.currentRide.price || 0,
            gratuity: data.currentRide.gratuity
          }]);
        } else {
          setCurrentRides([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Show a more specific error message
        if (error instanceof Error) {
          if (error.message.includes('token')) {
            toast.error('Please log in again to access the dashboard');
          } else if (error.message.includes('profile')) {
            toast.error('Driver profile not found. Please contact support.');
          } else {
            toast.error('Failed to load dashboard data. Please try again later.');
          }
        } else {
          toast.error('An unexpected error occurred');
        }

        // Set default values for testing/development
        setStats({
          totalRides: 0,
          completedRides: 0,
          upcomingRides: 0,
          totalEarnings: 0,
          baseEarnings: 0,
          gratuityEarnings: 0,
          rating: 0
        });
        setCurrentRides([]);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }
  
  return (
    <div className="h-full">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.firstName || 'Driver'}!</h1>
          <p className="text-gray-600">Here's your driving activity overview</p>
        </div>
      
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rides</p>
                <p className="text-2xl font-bold">{stats.totalRides}</p>
              </div>
              <Car className="h-8 w-8 text-brand-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Rides</p>
                <p className="text-2xl font-bold">{stats.completedRides}</p>
              </div>
              <Clock className="h-8 w-8 text-brand-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Rides</p>
                <p className="text-2xl font-bold">{stats.upcomingRides}</p>
              </div>
              <Calendar className="h-8 w-8 text-brand-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                {stats.gratuityEarnings > 0 && (
                  <p className="text-xs text-green-600">
                    +${stats.gratuityEarnings.toFixed(2)} in tips
                  </p>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-brand-500" />
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        {stats.gratuityEarnings > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Today's Earnings Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Base Earnings</p>
                <p className="text-xl font-bold">${stats.baseEarnings.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Gift className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600">Gratuity</p>
                </div>
                <p className="text-xl font-bold text-green-700">${stats.gratuityEarnings.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-brand-50 rounded-lg">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
                
        {/* Current Rides */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold">Current Rides</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {currentRides.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No current rides scheduled
              </div>
            ) : (
              currentRides.map((ride) => (
                <div key={ride.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="space-y-4">
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
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{ride.customerName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Car className="h-4 w-4" />
                          <span>{ride.vehicleType}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <p className="text-sm text-gray-600">{ride.scheduledTime}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${ride.status === 'scheduled' ? 'bg-brand-100 text-brand-700' :
                          ride.status === 'in-progress' ? 'bg-brand-100 text-brand-700' :
                          ride.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'}`}>
                        {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                      </span>
                      {/* Show gratuity if available */}
                      {ride.gratuity && ride.gratuity.type !== 'none' && (
                        <div className="text-xs text-green-600 flex items-center space-x-1">
                          <Gift className="h-3 w-3" />
                          <span>
                            {ride.gratuity.type === 'percentage' && ride.gratuity.percentage ? (
                              `+$${ride.gratuity.amount.toFixed(2)} (${ride.gratuity.percentage}%)`
                            ) : ride.gratuity.type === 'custom' ? (
                              `+$${ride.gratuity.amount.toFixed(2)} (Custom)`
                            ) : ride.gratuity.type === 'cash' ? (
                              `+$${ride.gratuity.amount.toFixed(2)} (Cash)`
                            ) : (
                              `+$${ride.gratuity.amount.toFixed(2)}`
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Rating Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Your Rating</p>
              <div className="flex items-center space-x-1">
                <p className="text-2xl font-bold">{stats.rating.toFixed(1)}</p>
                <Star className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Based on {stats.completedRides} completed rides</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}