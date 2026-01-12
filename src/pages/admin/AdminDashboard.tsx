import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Calendar, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalBookings: number;
  totalCustomers: number;
  totalDrivers: number;
  totalVehicles: number;
  totalRevenue: number;
}

interface MonthlyBooking {
  month: string;
  bookings: number;
  revenue: number;
}

interface Booking {
  _id: string;
  customerId: {
    firstName: string;
    lastName: string;
    email?: string;
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
  };
  driverId: {
    firstName: string;
    lastName: string;
  };
  pickupLocation: string;
  dropoffLocation: string;
  status: string;
  price: number;
  createdAt: string;
  packageId?: string;
  packageName?: string;
  hours?: number;
  package?: {
    name: string;
  };
  airportCode?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatMonthYear = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyBookings, setMonthlyBookings] = useState<MonthlyBooking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [statsRes, bookingsRes, monthlyRes] = await Promise.all([
          fetch('/api/admin/dashboard/stats'),
          fetch('/api/admin/recent-bookings?limit=5'),
          fetch('/api/admin/dashboard/monthly-bookings')
        ]);

        if (!statsRes.ok) {
          throw new Error(`Failed to fetch stats: ${statsRes.status} ${statsRes.statusText}`);
        }
        if (!bookingsRes.ok) {
          throw new Error(`Failed to fetch bookings: ${bookingsRes.status} ${bookingsRes.statusText}`);
        }
        if (!monthlyRes.ok) {
          throw new Error(`Failed to fetch monthly stats: ${monthlyRes.status} ${monthlyRes.statusText}`);
        }

        const [statsData, bookingsData, monthlyData] = await Promise.all([
          statsRes.json(),
          bookingsRes.json(),
          monthlyRes.json()
        ]);

        setStats(statsData);
        // Make sure bookingsData is an array before setting state
        setRecentBookings(Array.isArray(bookingsData) ? bookingsData : []);
        // Make sure monthlyData is an array before setting state
        setMonthlyBookings(Array.isArray(monthlyData) ? monthlyData : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-xl mb-4">Error loading dashboard</div>
        <div className="text-gray-500">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Helmet>
        <title>Admin Dashboard - DapperLax</title>
      </Helmet>

      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Admin Tools Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Admin Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin tools content */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center">
            <Calendar className="h-8 w-8 text-cyan-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold">{stats?.totalBookings.toLocaleString() || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Monthly Statistics</h2>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBookings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonthYear}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'revenue') return formatCurrency(value);
                      return value;
                    }}
                    labelFormatter={formatMonthYear}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="#4F46E5" />
                  <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {recentBookings && recentBookings.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Customer</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Driver</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Vehicle</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Package</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Duration</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Airport</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentBookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-4 py-2 text-sm">
                          {getCustomerName(booking)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {booking.driverId ? 
                            `${booking.driverId.firstName || ''} ${booking.driverId.lastName || ''}` : 
                            'Unassigned'
                          }
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {booking.vehicleId ? 
                            `${booking.vehicleId.make || ''} ${booking.vehicleId.model || ''}` : 
                            'Not assigned'
                          }
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {booking.package?.name || booking.packageName || 'Custom Ride'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {booking.hours !== undefined && booking.hours !== null && booking.hours > 1 ? `${booking.hours} hour${booking.hours !== 1 ? 's' : ''}` : 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {booking.packageId === 'lax-special' ? (
                            booking.airportCode || 'LAX (default)'
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{formatCurrency(booking.price || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-4 text-gray-500">No recent bookings available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;