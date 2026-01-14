import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button'; // Corrected import style and path
import { useAuth } from '../../context/AuthContext';

export default function AddDriverPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    licenseNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    toast.dismiss(); // Dismiss any existing toasts

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('All fields are required.');
      setIsLoading(false);
      return;
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Invalid email format.');
      setIsLoading(false);
      return;
    }
    
    // Basic password strength (example: min 6 chars)
    if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ...formData, 
          role: 'driver',
          driverStatus: 'available'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add driver');
      }

      toast.success('Driver added successfully!');
      navigate('/admin/drivers');
    } catch (error) {
      console.error('Error adding driver:', error);
      toast.error((error as Error).message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Helmet>
        <title>Add New Driver - Admin Panel</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Driver</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the details to create a new driver account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow rounded-lg">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
            placeholder="John"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
            placeholder="Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
            placeholder="john.doe@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
            placeholder="••••••••"
          />
           <p className="mt-1 text-xs text-gray-500">
            Minimum 6 characters. The driver can change this later.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/users')}
                disabled={isLoading}
            >
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding Driver...' : 'Add Driver'}
            </Button>
        </div>
      </form>
    </div>
  );
} 