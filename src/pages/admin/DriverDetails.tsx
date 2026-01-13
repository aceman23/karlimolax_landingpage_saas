import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Car, 
  Mail, 
  MapPin, 
  Phone, 
  Star, 
  Calendar,
  ArrowLeft,
  Edit
} from 'lucide-react';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  driverStatus?: 'available' | 'busy' | 'offline';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  rating?: number;
  ridesCompleted?: number;
  currentRide?: string | null;
  createdAt?: string;
}

export default function DriverDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDriverDetails();
  }, [id]);

  const fetchDriverDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profiles/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch driver details');
      }

      const data = await response.json();
      setDriver(data);
    } catch (error) {
      console.error('Error fetching driver details:', error);
      setError('Failed to load driver details');
      toast.error('Failed to load driver details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Driver['driverStatus']) => {
    if (!driver) return;

    try {
      const response = await fetch(`/api/driver/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update driver status');
      }

      setDriver(prev => prev ? { ...prev, driverStatus: newStatus } : null);
      toast.success('Driver status updated successfully');
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Failed to update driver status');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading driver details..." />;
  }

  if (error || !driver) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error || 'Driver not found'}</p>
          <Button variant="outline" onClick={() => navigate('/admin/drivers')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Driver Details | Kar Limo LAX Admin</title>
      </Helmet>

      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/drivers')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Drivers
        </Button>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {driver.firstName} {driver.lastName}
                </h1>
                <p className="mt-1 text-sm text-gray-500">Driver ID: {driver._id}</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={driver.driverStatus || 'offline'}
                  onChange={(e) => handleUpdateStatus(e.target.value as Driver['driverStatus'])}
                  className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md"
                >
                  <option value="available">Available</option>
                  <option value="busy">On Ride</option>
                  <option value="offline">Offline</option>
                </select>
                <Button variant="primary">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">{driver.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">{driver.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">
                      {driver.address && `${driver.address}, `}
                      {driver.city && `${driver.city}, `}
                      {driver.state} {driver.zipCode}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Driver Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Car className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">License: {driver.licenseNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">
                      Rating: {(driver.rating || 0).toFixed(1)} ({driver.ridesCompleted || 0} rides)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">
                      Joined: {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {driver.currentRide && (
              <div className="mt-8 bg-purple-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-purple-900 mb-2">Current Ride</h2>
                <p className="text-purple-700">{driver.currentRide}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 