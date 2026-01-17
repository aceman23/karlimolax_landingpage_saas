import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Trash2, UserPlus, X, Edit2 } from 'lucide-react';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'admin' | 'driver' | 'customer',
  });
  const [editUser, setEditUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'customer' as 'admin' | 'driver' | 'customer',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});
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
        return 'bg-brand-100 text-brand-700';
      case 'driver':
        return 'bg-brand-100 text-brand-700';
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

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUser({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'customer',
      newPassword: '',
      confirmPassword: '',
    });
    setEditErrors({});
    setShowPasswordFields(false);
    setShowEditModal(true);
  };

  const validateEditUser = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!editUser.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!editUser.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!editUser.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editUser.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate password if password fields are shown and filled
    if (showPasswordFields) {
      if (editUser.newPassword && editUser.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      if (editUser.newPassword && editUser.newPassword !== editUser.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (editUser.newPassword && !editUser.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm the new password';
      }
    }
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateUser = async () => {
    if (!validateEditUser() || !editingUser) {
      return;
    }
    
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    setIsUpdating(true);
    try {
      const updateData: any = {
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        email: editUser.email,
        role: editUser.role,
      };

      // Include password reset if admin is changing password (no current password required for admin)
      if (showPasswordFields && editUser.newPassword) {
        updateData.newPassword = editUser.newPassword;
        updateData.adminPasswordReset = true; // Flag to bypass current password check
      }

      const response = await fetch(`/api/profiles/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update user' }));
        throw new Error(errorData.error || errorData.message || 'Failed to update user');
      }

      toast.success('User updated successfully!');
      setShowEditModal(false);
      setEditingUser(null);
      setEditErrors({});
      setShowPasswordFields(false);
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    try {
      console.log('[AdminUsers] Deleting user:', { userId, userEmail });
      const response = await fetch(`/api/profiles/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AdminUsers] Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete user' }));
        console.error('[AdminUsers] Delete error:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to delete user: ${response.status}`);
      }

      const result = await response.json();
      console.log('[AdminUsers] Delete success:', result);
      toast.success('User deleted successfully!');
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error.message || 'Failed to delete user. Please check console for details.';
      toast.error(errorMessage);
    }
  };

  const validateNewUser = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!newUser.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!newUser.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!newUser.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!newUser.password) {
      newErrors.password = 'Password is required';
    } else if (newUser.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (newUser.password !== newUser.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateNewUser()) {
      return;
    }
    
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create user' }));
        throw new Error(errorData.error || errorData.message || 'Failed to create user');
      }

      toast.success('User account created successfully!');
      setShowCreateModal(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'customer',
      });
      setErrors({});
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user account');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
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
        <div className="mt-4 sm:mt-0">
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Create New User
          </Button>
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
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
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
                      className={`block w-full pl-3 pr-10 py-2 text-xs border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 rounded-md ${getRoleBadgeColor(user.role || '')}`}
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
                    <button
                      onClick={() => handleEditUser(user)}
                      title="Edit User"
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100 mr-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id, user.email || '')}
                      title="Delete User"
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100"
                    >
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'customer',
                  });
                  setErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-brand-500 focus:border-brand-500`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-brand-500 focus:border-brand-500`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-brand-500 focus:border-brand-500`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'driver' | 'customer' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-brand-500 focus:border-brand-500`}
                    placeholder="Enter password (min 6 characters)"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-brand-500 focus:border-brand-500`}
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'customer',
                  });
                  setErrors({});
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateUser}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setEditErrors({});
                  setShowPasswordFields(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label htmlFor="editFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="editFirstName"
                    type="text"
                    value={editUser.firstName}
                    onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      editErrors.firstName ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-brand-500 focus:border-brand-500`}
                    placeholder="Enter first name"
                  />
                  {editErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="editLastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="editLastName"
                    type="text"
                    value={editUser.lastName}
                    onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      editErrors.lastName ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-brand-500 focus:border-brand-500`}
                    placeholder="Enter last name"
                  />
                  {editErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.lastName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    id="editEmail"
                    type="email"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${
                      editErrors.email ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-brand-500 focus:border-brand-500`}
                    placeholder="Enter email address"
                  />
                  {editErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{editErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="editRole" className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    id="editRole"
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value as 'admin' | 'driver' | 'customer' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordFields(!showPasswordFields);
                        if (showPasswordFields) {
                          setEditUser({ ...editUser, newPassword: '', confirmPassword: '' });
                          setEditErrors({ ...editErrors, newPassword: '', confirmPassword: '' });
                        }
                      }}
                      className="text-sm text-brand hover:text-brand-600"
                    >
                      {showPasswordFields ? 'Cancel Password Change' : 'Change Password'}
                    </button>
                  </div>

                  {showPasswordFields && (
                    <>
                      <div className="mb-3">
                        <label htmlFor="editNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          New Password *
                        </label>
                        <input
                          id="editNewPassword"
                          type="password"
                          value={editUser.newPassword}
                          onChange={(e) => setEditUser({ ...editUser, newPassword: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-md ${
                            editErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                          } focus:outline-none focus:ring-brand-500 focus:border-brand-500`}
                          placeholder="Enter new password (min 6 characters)"
                        />
                        {editErrors.newPassword && (
                          <p className="mt-1 text-sm text-red-600">{editErrors.newPassword}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="editConfirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password *
                        </label>
                        <input
                          id="editConfirmPassword"
                          type="password"
                          value={editUser.confirmPassword}
                          onChange={(e) => setEditUser({ ...editUser, confirmPassword: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-md ${
                            editErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                          } focus:outline-none focus:ring-brand-500 focus:border-brand-500`}
                          placeholder="Confirm new password"
                        />
                        {editErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{editErrors.confirmPassword}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setEditErrors({});
                  setShowPasswordFields(false);
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateUser}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 