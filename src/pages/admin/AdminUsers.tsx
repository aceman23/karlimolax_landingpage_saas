import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'driver' | 'customer';
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log('[AdminUsers] Users state updated. Count:', users.length);
    console.log('[AdminUsers] Current users state:', users);
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('[AdminUsers] Fetching users from /api/profiles...');
      const response = await fetch('/api/profiles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error('[AdminUsers] API response not OK:', response);
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      console.log('[AdminUsers] Data received from API:', data);
      console.log('[AdminUsers] Count of users from API:', data.length);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('[AdminUsers] Filtered users count:', filteredUsers.length);
  console.log('[AdminUsers] Current search term:', searchTerm);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'driver':
        return 'bg-purple-100 text-purple-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    if (status === 'active' || status === 'available' || status === 'on-ride') 
      return 'bg-green-100 text-green-800';
    if (status === 'inactive' || status === 'offline')
      return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const displayStatus = (user: User) => {
    if (user.role === 'driver') {
        return (user.status || 'offline').charAt(0).toUpperCase() + (user.status || 'offline').slice(1);
    }
    return (user.status || 'N/A').charAt(0).toUpperCase() + (user.status || 'N/A').slice(1);
  };

  const handleUpdateRole = async (userId: string, newRole: User['role']) => {
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }
    try {
      console.log('[AdminUsers] Updating role for user:', userId, 'to', newRole);
      const response = await fetch(`/api/profiles/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update role and parse error.' }));
        console.error('[AdminUsers] API response not OK:', response.status, errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to update role');
      }
      toast.success('User role updated successfully!');
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u._id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'An error occurred while updating the role.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-lg">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Helmet>
        <title>User Management - DapperLax</title>
      </Helmet>

      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all user accounts (admins, drivers, customers)
          </p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Search by name, email, or role..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName || 'N/A'} {user.lastName || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select
                      value={user.role}
                      onChange={(e) => {
                        const newRole = e.target.value as User['role'];
                        if (newRole !== user.role) {
                          handleUpdateRole(user._id, newRole);
                        }
                      }}
                      className={`block w-full pl-3 pr-10 py-2 text-xs border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md ${getRoleBadgeColor(user.role || '')}`}
                    >
                      <option value="customer">Customer</option>
                      <option value="driver">Driver</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(user.status || (user.role === 'driver' ? 'offline' : undefined))}`}>
                      {displayStatus(user)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button title="Delete User (Placeholder)" className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No users found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 