import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCustomerByProfileId } from '../../services/customer';
import { getCustomerBookings, updateBooking } from '../../services/booking';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import BookingDetailsModal from './BookingDetailsModal';
import GratuityModal from './GratuityModal';
import Button from '../../components/common/Button';
import { Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Define interfaces locally to avoid import issues
interface Booking {
  id: string;
  _id?: string;
  customerId?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  customerName?: string;
  customerEmail?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  vehicleId?: string | {
    name: string;
    make?: string;
    model?: string;
    capacity?: number;
  };
  vehicleName?: string;
  vehicle?: {
    name: string;
    make?: string;
    model?: string;
    capacity?: number;
  };
  driverId?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  dropoffTime?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  totalAmount: number;
  notes?: string;
  packageName?: string;
  packageId?: string;
  airportCode?: string;
  hours?: number;
  passengers?: number;
  carSeats?: number;
  boosterSeats?: number;
  package?: {
    name: string;
    hours: number;
  };
  stops?: Array<{
    location: string;
    order: number;
    price: number;
  }>;
  additionalStops?: string[];
  createdAt?: string;
  updatedAt?: string;
  bookingDetails?: {
    pickupAddress?: string;
    dropoffAddress?: string;
    pickupDate?: Date;
    pickupTime?: string;
    packageId?: string;
    specialRequests?: string;
    stops?: Array<{
      location: string;
      order: number;
      price: number;
    }>;
  };
  gratuity?: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
}

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'driver' | 'customer';
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  driverStatus?: 'available' | 'offline' | 'on-ride';
  licenseNumber?: string;
}

// The CustomerData can now be simpler if CustomerProfileResponse.customer is used directly
// Or we can keep it to represent the customer part of the response
interface CustomerSpecificData { // Renamed from CustomerData for clarity
  _id: string; // This is the Customer document ID
  profileId: string; // This is Profile._id
  companyName?: string;
  billingAddress?: string;
  createdAt?: string;
  // other fields from Customer schema...
}

export default function CustomerProfilePage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [customerSpecificData, setCustomerSpecificData] = useState<CustomerSpecificData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedBookingForGratuity, setSelectedBookingForGratuity] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      setError('Access denied. This page is for customers only.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setBookingsError(null);

        if (!user.id) {
          throw new Error('User ID not found. Please log in again.');
        }

        const apiResponse = await getCustomerByProfileId(user.id, token);
        
        if (apiResponse.error || !apiResponse.data) {
          let errorMessage = 'Failed to fetch profile data.';
          if (apiResponse.error) {
            if (typeof apiResponse.error === 'object' && apiResponse.error !== null && typeof (apiResponse.error as any).message === 'string') {
              errorMessage = (apiResponse.error as any).message;
            } else if (typeof apiResponse.error === 'string') {
              errorMessage = apiResponse.error;
            } else {
              const errorString = String(apiResponse.error);
              errorMessage = errorString !== '[object Object]' ? errorString : 'An unknown error occurred.';
            }
          }
          if (errorMessage.includes('Customer record not found')) {
            console.warn(errorMessage);
            setProfileData(apiResponse.data?.profile || user);
            setCustomerSpecificData(null);
            setBookings([]);
          } else {
            throw new Error(errorMessage);
          }
        } else {
          setProfileData(apiResponse.data.profile);
          setCustomerSpecificData(apiResponse.data.customer as CustomerSpecificData | null);

          if (apiResponse.data.profile.email) {
            setLoadingBookings(true);
            const bookingsResult = await getCustomerBookings(apiResponse.data.profile.email);
            if (bookingsResult.error || !bookingsResult.data) {
              let bookingsErrorMessage = 'Failed to fetch bookings.';
              if (bookingsResult.error) {
                if (typeof bookingsResult.error === 'object' && bookingsResult.error !== null && typeof (bookingsResult.error as any).message === 'string') {
                  bookingsErrorMessage = (bookingsResult.error as any).message;
                } else if (typeof bookingsResult.error === 'string') {
                  bookingsErrorMessage = bookingsResult.error;
                } else {
                  const errorString = String(bookingsResult.error);
                  bookingsErrorMessage = errorString !== '[object Object]' ? errorString : 'An unknown error occurred.';
                }
              }
              console.error(bookingsErrorMessage);
              setBookingsError(bookingsErrorMessage);
              setBookings([]);
            } else {
              setBookings(bookingsResult.data as Booking[]);
            }
          } else {
            setBookings([]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching customer profile data:', err);
        setError(err.message || 'An error occurred while loading your profile.');
        if (!profileData && user) setProfileData(user as Profile);
      } finally {
        setLoading(false);
        setLoadingBookings(false);
      }
    };

    fetchData();
  }, [user, token, navigate]);

  // Display loading spinner while profile data is explicitly being fetched and not yet available.
  // If profileData is available (even from context as fallback), we can show parts of the page.
  if (loading && !profileData) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  // If there's a hard error AND no profile data could be established (even from context)
  if (error && !profileData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700">{error}</p>
        <Link to="/" className="mt-4 inline-block px-6 py-2 bg-brand-500 text-white rounded hover:bg-brand-600">Go to Homepage</Link>
      </div>
    );
  }
  
  // Use profileData if available, otherwise fallback to user from context (which should be similar to ProfileType)
  const displayProfile = profileData || (user as Profile | null);

  // If after loading, displayProfile is still null (e.g. user not logged in, or context issue, and API failed hard)
  if (!displayProfile) {
    // This case implies user is null from context, and API calls failed or didn't run.
    // Should have been caught by initial user/token check, but as a safeguard:
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-xl font-semibold text-gray-700 mb-4">Profile Not Available</h1>
            <p className="text-gray-600">Please log in to view your profile.</p>
            <Link to="/login" className="mt-4 mr-2 inline-block px-6 py-2 bg-brand-500 text-white rounded hover:bg-brand-600">Login</Link>
        </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) { 
      toast.error("Passwords do not match."); 
      return; 
    }
    if (!newPassword || newPassword.length < 6) { 
      toast.error("Password must be at least 6 characters long."); 
      return; 
    }
    if (!currentPassword) { 
      toast.error("Current password is required."); 
      return; 
    }
    if (!user || !token || !user.id) { 
      toast.error("User not authenticated."); 
      return; 
    }
    setPasswordSaving(true);
    try {
      const response = await fetch(`/api/customer/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          currentPassword,
          newPassword 
        }),
      });
      setPasswordSaving(false);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to change password');
      }
      toast.success('Password changed successfully!');
      setNewPassword(''); 
      setConfirmNewPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      setPasswordSaving(false);
      toast.error(error.message || 'Error changing password.');
    }
  };

  const handleGratuityUpdate = async (bookingId: string, gratuityData: any) => {
    try {
      const response = await updateBooking(bookingId, { gratuity: gratuityData });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to update gratuity');
      }

      // Update the booking in the local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, gratuity: gratuityData }
          : booking
      ));

      toast.success('Gratuity updated successfully');
      setSelectedBookingForGratuity(null);
    } catch (error: any) {
      console.error('Error updating gratuity:', error);
      toast.error(error.message || 'Failed to update gratuity');
    }
  };

  return (
    <>
      <Helmet>
        <title>My Profile | Kar Limo LAX</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            ← Back to Home
          </Link>
        </div>
        {error && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
            <p className="font-bold">Notice</p>
            <p>{error}</p>
          </div>
        )}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-gray-600 mb-6">Manage your information and view your booking history.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Personal Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium">{displayProfile.firstName} {displayProfile.lastName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{displayProfile.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{displayProfile.phone || 'Not provided'}</p>
                </div>
                {customerSpecificData && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">Company</label>
                      <p className="font-medium">{customerSpecificData.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Billing Address</label>
                      <p className="font-medium">{customerSpecificData.billingAddress || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Account Settings</h2>
              <div className="space-y-4">
                <Link 
                  to="/edit-profile" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                >
                  Edit Profile
                </Link>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        id="currentPassword" 
                        name="currentPassword" 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" 
                        placeholder="Enter current password" 
                        required 
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input 
                        type="password" 
                        id="newPassword" 
                        name="newPassword" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" 
                        placeholder="Min. 6 chars" 
                        required 
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        id="confirmNewPassword" 
                        name="confirmNewPassword" 
                        value={confirmNewPassword} 
                        onChange={(e) => setConfirmNewPassword(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" 
                        placeholder="Confirm password" 
                        required 
                      />
                    </div>
                    <Button type="submit" disabled={passwordSaving} className="w-full md:w-auto">
                      {passwordSaving ? 'Changing Password...' : <><Lock className="mr-2 h-4 w-4" /> Change Password</>}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
            <Link 
              to="/booking" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            >
              Book New Ride
            </Link>
          </div>

          {loadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              <span className="ml-3 text-gray-600">Loading bookings...</span>
            </div>
          ) : bookingsError ? (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p className="font-bold">Error</p>
              <p>{bookingsError}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You have no bookings yet.</p>
              <Link 
                to="/booking" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                Book Your First Ride
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gratuity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stops</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.createdAt ? format(new Date(booking.createdAt), 'PPpp') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.pickupTime ? format(new Date(booking.pickupTime), 'PPpp') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.packageName ? booking.packageName : 'Custom Ride'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.vehicleName || (typeof booking.vehicleId === 'object' && booking.vehicleId ? booking.vehicleId.name : 'N/A') || 'N/A'} 
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>Passengers: {booking.passengers || 'Not specified'}</div>
                        {booking.carSeats && booking.carSeats > 0 && (
                          <div>Car Seats: {booking.carSeats}</div>
                        )}
                        {booking.boosterSeats && booking.boosterSeats > 0 && (
                          <div>Booster Seats: {booking.boosterSeats}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            booking.status === 'confirmed' ? 'bg-brand-100 text-brand-700' : 
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                        `}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">${booking.price.toFixed(2) || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.gratuity && booking.gratuity.type !== 'none' ? (
                          <div className="text-sm">
                            {booking.gratuity.type === 'percentage' && booking.gratuity.percentage ? (
                              <span>${booking.gratuity.amount.toFixed(2)} ({booking.gratuity.percentage}%)</span>
                            ) : booking.gratuity.type === 'custom' ? (
                              <span>${booking.gratuity.amount.toFixed(2)} (Custom)</span>
                            ) : booking.gratuity.type === 'cash' ? (
                              <span>Cash (${booking.gratuity.amount.toFixed(2)})</span>
                            ) : (
                              <span>${booking.gratuity.amount.toFixed(2)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.stops && booking.stops.length > 0 ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{booking.stops.length} stop{booking.stops.length !== 1 ? 's' : ''}</div>
                            <div className="text-gray-600 mt-1">
                              {booking.stops.slice(0, 2).map((stop, index) => (
                                <div key={index} className="truncate max-w-32">
                                  {index + 1}. {stop.location}
                                </div>
                              ))}
                              {booking.stops.length > 2 && (
                                <div className="text-gray-500 text-xs">
                                  +{booking.stops.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <button 
                            onClick={() => setSelectedBooking(booking)}
                            className="text-brand-500 hover:text-brand-600 font-medium"
                          >
                            View Details
                          </button>
                          {booking.status === 'completed' && (
                            <button 
                              onClick={() => setSelectedBookingForGratuity(booking)}
                              className="text-green-600 hover:text-green-700 font-medium"
                            >
                              {booking.gratuity && booking.gratuity.type !== 'none' ? 'Update Gratuity' : 'Add Gratuity'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
      {selectedBookingForGratuity && (
        <GratuityModal
          booking={selectedBookingForGratuity}
          onClose={() => setSelectedBookingForGratuity(null)}
          onUpdate={(gratuityData) => handleGratuityUpdate(selectedBookingForGratuity.id, gratuityData)}
        />
      )}
    </>
  );
} 