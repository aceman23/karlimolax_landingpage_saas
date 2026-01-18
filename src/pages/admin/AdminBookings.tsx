import React from 'react';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { assignDriverToBooking } from '../../services/booking';
import BookingActionMenu from '../../components/admin/BookingActionMenu';
import BookingDetailsModal from './BookingDetailsModal';

interface Booking {
  _id: string;
  customerId: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  customerName?: string;
  customerEmail?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  vehicleId: {
    make: string;
    model: string;
    capacity: number;
  };
  vehicleName?: string; // Add vehicle name field
  driverId?: {
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  dropoffTime?: string;
  status: string;
  price: number;
  createdAt: string;
  package?: {
    name: string;
    hours: number;
  };
  packageId?: string;
  packageName?: string;
  hours?: number;
  airportCode?: string;
  passengers?: number;
  carSeats?: number;
  boosterSeats?: number;
  gratuity?: {
    type: 'none' | 'percentage' | 'custom' | 'cash';
    percentage?: number;
    customAmount?: number;
    amount: number;
  };
}

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  capacity: number;
  pricePerHour: number;
}

export default function AdminBookings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [showEmailConfirmationModal, setShowEmailConfirmationModal] = useState(false);
  const [remainingTimes, setRemainingTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
    fetchVehicles();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const newRemainingTimes: Record<string, string> = {};
      
      bookings.forEach(booking => {
        if (booking.status === 'in_progress' && booking.pickupTime && booking.hours) {
          const pickupTime = new Date(booking.pickupTime);
          const endTime = new Date(pickupTime.getTime() + booking.hours * 60 * 60 * 1000);
          
          if (now < endTime) {
            const diff = endTime.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            newRemainingTimes[booking._id] = `${hours}h ${minutes}m remaining`;
          } else {
            newRemainingTimes[booking._id] = 'Time expired';
          }
        }
      });
      
      setRemainingTimes(newRemainingTimes);
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/profiles?role=driver');
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }
      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/public/vehicles');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    }
  };

  const handleAssignDriver = () => {
    if (!selectedBooking || !selectedDriver) {
      toast.error('Please select a driver');
      return;
    }

    // Show email confirmation modal
    setShowEmailConfirmationModal(true);
  };

  const handleConfirmAssignDriver = async (sendEmail: boolean) => {
    if (!selectedBooking || !selectedDriver) {
      toast.error('Please select a driver');
      return;
    }

    try {
      const result = await assignDriverToBooking(selectedBooking._id, selectedDriver, sendEmail);
      
      if (result.success) {
        toast.success(sendEmail 
          ? 'Driver assigned and confirmation email sent successfully' 
          : 'Driver assigned successfully');
        setShowAssignDriverModal(false);
        setShowEmailConfirmationModal(false);
        fetchBookings(); // Refresh bookings list
      } else {
        toast.error(result.error || 'Failed to assign driver');
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-brand-100 text-brand-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      if (!dateTimeStr) {
        return 'N/A';
      }
      
      const dateTime = new Date(dateTimeStr);
      
      if (isNaN(dateTime.getTime())) {
        console.log('Invalid date:', dateTimeStr);
        return dateTimeStr;
      }
      
      return dateTime.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (error) {
      console.error('Error formatting date/time:', error, dateTimeStr);
      return dateTimeStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getCustomerName = (booking: Booking) => {
    if (booking.customer?.name) {
      return booking.customer.name;
    } else if (booking.customerName) {
      return booking.customerName;
    } else if (booking.customerId) {
      return `${booking.customerId.firstName || ''} ${booking.customerId.lastName || ''}`;
    }
    return 'Unknown Customer';
  };

  const getCustomerEmail = (booking: Booking) => {
    if (booking.customer?.email) {
      return booking.customer.email;
    } else if (booking.customerEmail) {
      return booking.customerEmail;
    } else if (booking.customerId && booking.customerId.email) {
      return booking.customerId.email;
    }
    return 'No email';
  };

  const getCustomerPhone = (booking: Booking) => {
    if (booking.customer?.phone) {
      return booking.customer.phone;
    } else if (booking.customerId && booking.customerId.phone) {
      return booking.customerId.phone;
    }
    return 'No phone';
  };

  const filteredBookings = bookings.filter(booking => {
    const searchTermLower = searchTerm.toLowerCase();
    const searchMatch = 
      (booking.customerName || '').toLowerCase().includes(searchTermLower) ||
      (booking.customerEmail || '').toLowerCase().includes(searchTermLower) ||
      (booking.customerId?.firstName || '').toLowerCase().includes(searchTermLower) ||
      (booking.customerId?.lastName || '').toLowerCase().includes(searchTermLower) ||
      (booking.customerId?.email || '').toLowerCase().includes(searchTermLower) ||
      (booking.pickupLocation || '').toLowerCase().includes(searchTermLower) ||
      (booking.dropoffLocation || '').toLowerCase().includes(searchTermLower);
    
    const statusMatch = statusFilter === 'all' || booking.status === statusFilter;
    
    const dateMatch = !dateFilter || new Date(booking.pickupTime).toISOString().split('T')[0] === dateFilter;
    
    return searchMatch && statusMatch && dateMatch;
  }).sort((a, b) => {
    // Sort by createdAt in descending order (newest first)
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        <span className="ml-2">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Helmet>
        <title>Bookings Management - DapperLax</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bookings Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  placeholder="Search bookings..."
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seats
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booked At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pickup
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dropoff
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gratuity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getCustomerName(booking)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getCustomerEmail(booking)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getCustomerPhone(booking)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.vehicleName ? (
                      <>
                        <div className="text-sm text-gray-900">
                          {booking.vehicleName}
                        </div>

                      </>
                    ) : booking.vehicleId ? (
                      <>
                        <div className="text-sm text-gray-900">
                          {booking.vehicleId.make} {booking.vehicleId.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          Capacity: {booking.vehicleId.capacity}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500 italic">No vehicle</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.package ? (
                      <div className="text-sm text-gray-900">
                        {booking.package.name}
                      </div>
                    ) : booking.packageName ? (
                      <div className="text-sm text-gray-900">
                        {booking.packageName}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">Custom Ride</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.hours !== undefined && booking.hours ? (
                      <div>
                        <div>{booking.hours} hour{booking.hours !== 1 ? 's' : ''}</div>
                        {booking.status === 'in_progress' && remainingTimes[booking._id] && (
                          <div className="text-sm text-brand font-medium">
                            {remainingTimes[booking._id]}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500">N/A</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Passengers: {booking.passengers || 'Not specified'}</div>
                    {booking.carSeats && booking.carSeats > 0 && (
                      <div>Car Seats: {booking.carSeats}</div>
                    )}
                    {booking.boosterSeats && booking.boosterSeats > 0 && (
                      <div>Booster Seats: {booking.boosterSeats}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.driverId ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {booking.driverId.firstName} {booking.driverId.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.driverId.phone}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setSelectedDriver((booking.driverId as any)?._id || '');
                            setShowAssignDriverModal(true);
                          }}
                          className="mt-1 text-brand hover:text-brand-900 text-xs font-medium"
                        >
                          Change Driver
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setSelectedDriver('');
                          setShowAssignDriverModal(true);
                        }}
                        className="text-brand hover:text-brand-900 text-sm font-medium"
                      >
                        Assign Driver
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(booking.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDateTime(booking.pickupTime)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.pickupLocation}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {booking.dropoffLocation || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(booking.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.gratuity && booking.gratuity.type !== 'none' ? (
                      <div>
                        <div className="font-medium">
                          {booking.gratuity.type === 'percentage' && `${booking.gratuity.percentage}%`}
                          {booking.gratuity.type === 'custom' && 'Custom'}
                          {booking.gratuity.type === 'cash' && 'Cash'}
                        </div>
                        <div className="text-gray-600">
                          {formatCurrency(booking.gratuity.amount)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <BookingActionMenu 
                      booking={booking} 
                      drivers={drivers}
                      vehicles={vehicles}
                      onBookingUpdated={fetchBookings}
                    />
                    <button
                      className="ml-2 text-brand hover:text-brand-900 text-sm font-medium"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowBookingDetailsModal(true);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Driver Modal */}
      {showAssignDriverModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedBooking.driverId ? 'Change Driver' : 'Assign Driver to Booking'}
            </h3>
            {selectedBooking.driverId && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-1">Current Driver:</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedBooking.driverId.firstName} {selectedBooking.driverId.lastName} - {selectedBooking.driverId.phone}
                </p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                {selectedBooking.driverId ? 'Select New Driver' : 'Select Driver'}
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
              >
                <option value="">Choose a driver</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.firstName} {driver.lastName} - {driver.phone}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAssignDriverModal(false);
                  setSelectedDriver('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={!selectedDriver}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedBooking.driverId ? 'Change Driver' : 'Assign Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Confirmation Modal */}
      {showEmailConfirmationModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Send Confirmation Email?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Would you like to send a confirmation email to the customer with the driver's contact information?
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEmailConfirmationModal(false);
                  handleConfirmAssignDriver(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                Skip Email
              </button>
              <button
                onClick={() => {
                  setShowEmailConfirmationModal(false);
                  handleConfirmAssignDriver(true);
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showBookingDetailsModal && selectedBooking && (
        <BookingDetailsModal 
          booking={selectedBooking} 
          onClose={() => setShowBookingDetailsModal(false)} 
          onBookingUpdated={fetchBookings}
        />
      )}
    </div>
  );
}