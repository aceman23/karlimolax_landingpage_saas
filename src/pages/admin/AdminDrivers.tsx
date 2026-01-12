import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Edit, 
  ExternalLink, 
  Mail,
  MapPin, 
  Phone, 
  Plus, 
  Search, 
  Star, 
  UserPlus, 
  Calendar
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

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  license?: string;
  password?: string;
  confirmPassword?: string;
  formSubmit?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  [key: string]: string | undefined;
}

export default function AdminDrivers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [newDriver, setNewDriver] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    license: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    status: 'available',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profiles?role=driver');
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }
      
      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (driverId: string, newStatus: Driver['driverStatus']) => {
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

      setDrivers(prevDrivers => 
        prevDrivers.map(driver => 
          driver._id === driverId 
            ? { ...driver, driverStatus: newStatus }
            : driver
        )
      );

      toast.success('Driver status updated successfully');
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Failed to update driver status');
    }
  };

  const handleAddDriver = () => {
    setShowAddDriverModal(true);
    setNewDriver({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      license: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      status: 'available',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  const validateDriver = () => {
    const newErrors: FormErrors = {};

    if (!newDriver.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!newDriver.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!newDriver.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newDriver.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!newDriver.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!newDriver.license.trim()) newErrors.license = 'Driver license is required';
    
    if (!newDriver.address.trim()) newErrors.address = 'Street address is required';
    if (!newDriver.city.trim()) newErrors.city = 'City is required';
    if (!newDriver.state.trim()) newErrors.state = 'State is required';
    if (!newDriver.zipCode.trim()) newErrors.zipCode = 'Zip code is required';

    if (!newDriver.password) {
      newErrors.password = 'Password is required';
    } else if (newDriver.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    if (newDriver.password !== newDriver.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitDriver = async () => {
    if (!validateDriver()) return;

    try {
      const { confirmPassword, license, status, ...restOfDriverData } = newDriver;

      const payload = {
        ...restOfDriverData,
        licenseNumber: license,
        driverStatus: status,
        role: 'driver',
      };

      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const message = errorData.error || (errorData.message || 'Failed to create driver. Please check server logs.');
        throw new Error(message);
      }

      fetchDrivers();
      setShowAddDriverModal(false);
      toast.success('Driver added successfully!');
    } catch (error: any) {
      console.error('Error adding driver:', error);
      toast.error(error.message || 'Failed to add driver. Please try again.');
      setErrors((prev: FormErrors) => ({...prev, formSubmit: error.message || 'An unexpected error occurred.'}));
    }
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setShowEditDriverModal(true);
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver) return;

    try {
      const response = await fetch(`/api/profiles/${editingDriver._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(editingDriver),
      });

      if (!response.ok) {
        throw new Error('Failed to update driver');
      }

      setDrivers(prevDrivers =>
        prevDrivers.map(driver =>
          driver._id === editingDriver._id ? editingDriver : driver
        )
      );

      setShowEditDriverModal(false);
      toast.success('Driver updated successfully');
    } catch (error) {
      console.error('Error updating driver:', error);
      toast.error('Failed to update driver');
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const searchRegex = new RegExp(searchTerm, 'i');
    return (
      searchRegex.test(driver.firstName) ||
      searchRegex.test(driver.lastName) ||
      searchRegex.test(driver.email) ||
      (driver.phone && searchRegex.test(driver.phone)) ||
      (driver.licenseNumber && searchRegex.test(driver.licenseNumber))
    );
  });

  const getStatusBadge = (status?: Driver['driverStatus']) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="h-2 w-2 mr-1 bg-green-400 rounded-full"></span>
            Available
          </span>
        );
      case 'busy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
            <span className="h-2 w-2 mr-1 bg-cyan-400 rounded-full"></span>
            On Ride
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="h-2 w-2 mr-1 bg-gray-400 rounded-full"></span>
            Offline
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading drivers..." />;
  }

  return (
    <div>
      <Helmet>
        <title>Manage Drivers | Dapper Limo LAX Admin</title>
      </Helmet>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Drivers</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage your driver team</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="primary" onClick={handleAddDriver}>
            <UserPlus className="h-5 w-5 mr-2" />
            Add New Driver
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 bg-white p-4 shadow rounded-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search drivers by name, email, phone..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Driver Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDrivers.map((driver) => (
          <div key={driver._id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center text-xl font-semibold text-cyan-700">
                  {driver.firstName[0]}{driver.lastName[0]}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {driver.firstName} {driver.lastName}
                  </h3>
                  <div className="mt-1 flex items-center">
                    <Star className="h-4 w-4 text-cyan-500" />
                    <span className="ml-1 text-sm text-gray-500">
                      {(driver.rating || 0).toFixed(1)} Rating ({driver.ridesCompleted || 0} rides)
                    </span>
                  </div>
                </div>
                <div>
                  {getStatusBadge(driver.driverStatus)}
                </div>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  {driver.phone || 'N/A'}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  {driver.email}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Car className="h-4 w-4 text-gray-400 mr-2" />
                  License: {driver.licenseNumber || 'N/A'}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  {driver.city && driver.state ? `${driver.city}, ${driver.state}` : (driver.address || 'N/A')}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  Joined: {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              {driver.currentRide && (
                <div className="mt-4 bg-cyan-50 p-3 rounded-md">
                  <div className="text-sm font-medium text-cyan-800">Currently on ride: {driver.currentRide}</div>
                </div>
              )}

              <div className="mt-4 flex justify-between items-center">
                <select
                  value={driver.driverStatus || 'offline'}
                  onChange={(e) => handleUpdateStatus(driver._id, e.target.value as Driver['driverStatus'])}
                  className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 rounded-md"
                >
                  <option value="available">Available</option>
                  <option value="busy">On Ride</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button 
                  onClick={() => handleEditDriver(driver)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-cyan-700 bg-cyan-100 hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button 
                  onClick={() => navigate(`/admin/drivers/${driver._id}`)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Driver Modal */}
      {showEditDriverModal && editingDriver && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-cyan-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Edit className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Edit Driver
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Update driver information
                      </p>
                    </div>

                    <form className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="editFirstName" className="block text-sm font-medium text-gray-700">
                            First Name
                          </label>
                          <input
                            type="text"
                            id="editFirstName"
                            value={editingDriver.firstName}
                            onChange={(e) => setEditingDriver({...editingDriver, firstName: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="editLastName" className="block text-sm font-medium text-gray-700">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="editLastName"
                            value={editingDriver.lastName}
                            onChange={(e) => setEditingDriver({...editingDriver, lastName: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          id="editEmail"
                          value={editingDriver.email}
                          onChange={(e) => setEditingDriver({...editingDriver, email: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="editPhone" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          id="editPhone"
                          value={editingDriver.phone || ''}
                          onChange={(e) => setEditingDriver({...editingDriver, phone: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="editLicense" className="block text-sm font-medium text-gray-700">
                          Driver License
                        </label>
                        <input
                          type="text"
                          id="editLicense"
                          value={editingDriver.licenseNumber || ''}
                          onChange={(e) => setEditingDriver({...editingDriver, licenseNumber: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="editAddress" className="block text-sm font-medium text-gray-700">
                          Street Address
                        </label>
                        <input
                          type="text"
                          id="editAddress"
                          value={editingDriver.address || ''}
                          onChange={(e) => setEditingDriver({...editingDriver, address: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="editCity" className="block text-sm font-medium text-gray-700">
                            City
                          </label>
                          <input
                            type="text"
                            id="editCity"
                            value={editingDriver.city || ''}
                            onChange={(e) => setEditingDriver({...editingDriver, city: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="editState" className="block text-sm font-medium text-gray-700">
                            State
                          </label>
                          <input
                            type="text"
                            id="editState"
                            value={editingDriver.state || ''}
                            onChange={(e) => setEditingDriver({...editingDriver, state: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="editZipCode" className="block text-sm font-medium text-gray-700">
                            Zip Code
                          </label>
                          <input
                            type="text"
                            id="editZipCode"
                            value={editingDriver.zipCode || ''}
                            onChange={(e) => setEditingDriver({...editingDriver, zipCode: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleUpdateDriver}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowEditDriverModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddDriverModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all opacity-100 scale-100 sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-cyan-100 sm:mx-0 sm:h-10 sm:w-10">
                    <UserPlus className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Add New Driver
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Fill in the details to add a new driver to your team.
                      </p>
                    </div>

                    <form className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                            First Name
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={newDriver.firstName}
                            onChange={(e) => setNewDriver({...newDriver, firstName: e.target.value})}
                            className={`mt-1 block w-full border ${errors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={newDriver.lastName}
                            onChange={(e) => setNewDriver({...newDriver, lastName: e.target.value})}
                            className={`mt-1 block w-full border ${errors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                          />
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={newDriver.email}
                          onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                          className={`mt-1 block w-full border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={newDriver.phone}
                          onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                          className={`mt-1 block w-full border ${errors.phone ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                          placeholder="(XXX) XXX-XXXX"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="license" className="block text-sm font-medium text-gray-700">
                          Driver License
                        </label>
                        <input
                          type="text"
                          id="license"
                          name="license"
                          value={newDriver.license}
                          onChange={(e) => setNewDriver({...newDriver, license: e.target.value})}
                          className={`mt-1 block w-full border ${errors.license ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                        />
                        {errors.license && (
                          <p className="mt-1 text-sm text-red-600">{errors.license}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={newDriver.status}
                          onChange={(e) => setNewDriver({...newDriver, status: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        >
                          <option value="available">Available</option>
                          <option value="offline">Offline</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Street Address</label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={newDriver.address}
                          onChange={(e) => setNewDriver({...newDriver, address: e.target.value})}
                          className={`mt-1 block w-full border ${errors.address ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                        />
                        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={newDriver.city}
                            onChange={(e) => setNewDriver({...newDriver, city: e.target.value})}
                            className={`mt-1 block w-full border ${errors.city ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                          />
                          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            value={newDriver.state}
                            onChange={(e) => setNewDriver({...newDriver, state: e.target.value})}
                            className={`mt-1 block w-full border ${errors.state ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                          />
                          {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                        </div>
                        <div>
                          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">Zip Code</label>
                          <input
                            type="text"
                            id="zipCode"
                            name="zipCode"
                            value={newDriver.zipCode}
                            onChange={(e) => setNewDriver({...newDriver, zipCode: e.target.value})}
                            className={`mt-1 block w-full border ${errors.zipCode ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                          />
                          {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={newDriver.password}
                          onChange={(e) => setNewDriver({...newDriver, password: e.target.value})}
                          className={`mt-1 block w-full border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                        />
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={newDriver.confirmPassword}
                          onChange={(e) => setNewDriver({...newDriver, confirmPassword: e.target.value})}
                          className={`mt-1 block w-full border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm`}
                        />
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleSubmitDriver}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Driver
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddDriverModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}