import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Trash, PlusCircle, Car, Upload, X, Image as ImageIcon, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';

// Minor edit

interface Vehicle {
  _id: string;
  name: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  vin: string;
  status: 'active' | 'maintenance' | 'inactive';
  type: string;
  color: string;
  mileage: string;
  lastMaintenance: string;
  nextMaintenance: string;
  fuelType: string;
  transmission: string;
  seatingCapacity: string;
  features: string;
  notes: string;
  imageUrl?: string;
  capacity?: number;
  pricePerHour?: number;
  description?: string;
}

const modalStyles = `
  @keyframes modalShow {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-modalShow {
    animation: modalShow 0.3s ease-out forwards;
  }
`;

const AdminVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string>('');
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    status: 'active',
    type: 'sedan',
    color: '',
    mileage: '',
    lastMaintenance: '',
    nextMaintenance: '',
    fuelType: 'gasoline',
    transmission: 'automatic',
    seatingCapacity: '',
    features: '',
    notes: '',
    capacity: '',
    pricePerHour: '',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, [token]);

  // Handle file upload and convert to base64
  const handleImageUpload = (file: File, isEdit = false) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, imageUrl: base64String });
      if (isEdit) {
        setEditImagePreview(base64String);
      } else {
        setImagePreview(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (isEdit = false) => {
    setFormData({ ...formData, imageUrl: '' });
    if (isEdit) {
      setEditImagePreview('');
    } else {
      setImagePreview('');
    }
  };

  const fetchVehicles = async () => {
    if (!token) {
      toast.error('Authentication required to fetch vehicles.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('/api/vehicles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    `${vehicle.name} ${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.licensePlate} ${vehicle.vin}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleAddNewVehicle = () => {
    setIsAddModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      licensePlate: vehicle.licensePlate || '',
      vin: vehicle.vin || '',
      status: vehicle.status || 'active',
      type: vehicle.type || 'sedan',
      color: vehicle.color || '',
      mileage: vehicle.mileage || '',
      lastMaintenance: vehicle.lastMaintenance || '',
      nextMaintenance: vehicle.nextMaintenance || '',
      fuelType: vehicle.fuelType || 'gasoline',
      transmission: vehicle.transmission || 'automatic',
      seatingCapacity: vehicle.seatingCapacity || '',
      features: Array.isArray(vehicle.features) ? vehicle.features.join(', ') : (vehicle.features || ''),
      notes: vehicle.notes || '',
      capacity: vehicle.capacity?.toString() || '',
      pricePerHour: vehicle.pricePerHour?.toString() || '',
      description: vehicle.description || '',
      imageUrl: vehicle.imageUrl || ''
    });
    setEditImagePreview(vehicle.imageUrl || '');
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();

    // Helper function to safely check if a field is empty
    const isEmpty = (value: any): boolean => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return !value.trim();
      if (typeof value === 'number') return false; // numbers are never empty
      return !String(value).trim();
    };

    // Required fields
    if (isEmpty(formData.name)) errors.name = 'Vehicle name is required';
    if (isEmpty(formData.make)) errors.make = 'Make is required';
    if (isEmpty(formData.model)) errors.model = 'Model is required';
    if (isEmpty(formData.year)) errors.year = 'Year is required';
    if (isEmpty(formData.licensePlate)) errors.licensePlate = 'License plate is required';
    if (isEmpty(formData.vin)) errors.vin = 'VIN is required';
    if (isEmpty(formData.capacity)) errors.capacity = 'Capacity is required';
    if (isEmpty(formData.pricePerHour)) errors.pricePerHour = 'Price per hour is required';

    // Year validation
    const yearNum = parseInt(String(formData.year));
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }

    // VIN validation (basic format)
    const vinString = String(formData.vin);
    if (vinString.length !== 17) {
      errors.vin = 'VIN must be exactly 17 characters';
    }

    // License plate validation
    const licensePlateString = String(formData.licensePlate);
    if (licensePlateString.length < 2) {
      errors.licensePlate = 'License plate must be at least 2 characters';
    }

    // Capacity validation
    const capacityNum = parseInt(String(formData.capacity));
    if (isNaN(capacityNum) || capacityNum <= 0) {
      errors.capacity = 'Capacity must be a positive number';
    }

    // Price per hour validation
    const priceNum = parseFloat(String(formData.pricePerHour));
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.pricePerHour = 'Price per hour must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      vin: '',
      status: 'active',
      type: 'sedan',
      color: '',
      mileage: '',
      lastMaintenance: '',
      nextMaintenance: '',
      fuelType: 'gasoline',
      transmission: 'automatic',
      seatingCapacity: '',
      features: '',
      notes: '',
      capacity: '',
      pricePerHour: '',
      description: '',
      imageUrl: ''
    });
    setImagePreview('');
    setEditImagePreview('');
    setFormErrors({});
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      const vehicleData = {
        ...formData,
        capacity: parseInt(String(formData.capacity)),
        pricePerHour: parseFloat(String(formData.pricePerHour)),
        year: parseInt(String(formData.year)),
        features: Array.isArray(formData.features) 
          ? formData.features 
          : (formData.features ? formData.features.split(',').map(f => f.trim()) : [])
      };

      const url = editingVehicle ? `/api/vehicles/${editingVehicle._id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vehicleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingVehicle ? 'update' : 'add'} vehicle`);
      }

      toast.success(`Vehicle ${editingVehicle ? 'updated' : 'added'} successfully`);
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setEditingVehicle(null);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error(`Error ${editingVehicle ? 'updating' : 'adding'} vehicle:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${editingVehicle ? 'update' : 'add'} vehicle`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!token) {
        toast.error('Authentication required.');
        return;
    }
    if (!confirm('Are you sure you want to delete this vehicle?')) {
        return;
    }
    try {
        const response = await fetch(`/api/vehicles/${vehicleId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to delete vehicle.'}));
            throw new Error(errorData.message || 'Failed to delete vehicle');
        }
        toast.success('Vehicle deleted successfully');
        fetchVehicles(); // Refresh the list
    } catch (error: unknown) {
      console.error('Error deleting vehicle:', error);
        const errorMessage = error instanceof Error ? error.message : 'Could not delete vehicle.';
        toast.error(errorMessage);
    }
  };

  const getStatusBadgeColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const VehicleForm = ({ isEdit = false }) => (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Vehicle Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
                formErrors.name ? 'border-red-500' : ''
              }`}
              placeholder="e.g., Company Car 1"
            />
            {formErrors.name && (
              <p className="text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Make *
            </label>
            <input
              type="text"
              id="make"
              name="make"
              value={formData.make}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
                formErrors.make ? 'border-red-500' : ''
              }`}
              placeholder="e.g., Toyota"
            />
            {formErrors.make && (
              <p className="text-sm text-red-500">{formErrors.make}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Model *
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
                formErrors.model ? 'border-red-500' : ''
              }`}
              placeholder="e.g., Camry"
            />
            {formErrors.model && (
              <p className="text-sm text-red-500">{formErrors.model}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Year *
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
                formErrors.year ? 'border-red-500' : ''
              }`}
              placeholder="e.g., 2024"
            />
            {formErrors.year && (
              <p className="text-sm text-red-500">{formErrors.year}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Capacity (seats) *
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
                formErrors.capacity ? 'border-red-500' : ''
              }`}
              placeholder="e.g., 4"
              min="1"
            />
            {formErrors.capacity && (
              <p className="text-sm text-red-500">{formErrors.capacity}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Price per Hour ($) *
            </label>
            <input
              type="number"
              id="pricePerHour"
              name="pricePerHour"
              value={formData.pricePerHour}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
                formErrors.pricePerHour ? 'border-red-500' : ''
              }`}
              placeholder="e.g., 50"
              min="0"
              step="0.01"
            />
            {formErrors.pricePerHour && (
              <p className="text-sm text-red-500">{formErrors.pricePerHour}</p>
            )}
          </div>
        </div>

        {/* Registration Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Registration Information</h3>
          
          <div className="space-y-2">
            <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              License Plate *
            </label>
            <input
              type="text"
              id="licensePlate"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
                formErrors.licensePlate ? 'border-red-500' : ''
              }`}
              placeholder="e.g., ABC123"
            />
            {formErrors.licensePlate && (
              <p className="text-sm text-red-500">{formErrors.licensePlate}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              VIN *
            </label>
            <input
              type="text"
              id="vin"
              name="vin"
              value={formData.vin}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
                formErrors.vin ? 'border-red-500' : ''
              }`}
              placeholder="17-character VIN"
            />
            {formErrors.vin && (
              <p className="text-sm text-red-500">{formErrors.vin}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <input
              type="text"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              placeholder="e.g., Black"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="features" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Features (comma-separated)
            </label>
            <textarea
              id="features"
              name="features"
              value={formData.features}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              placeholder="e.g., Leather Seats, WiFi, Premium Sound"
            />
          </div>
        </div>
      </div>

      {/* Vehicle Image Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Vehicle Image</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, isEdit);
              }}
              className="hidden"
              id={`image-upload-${isEdit ? 'edit' : 'new'}`}
            />
            <label
              htmlFor={`image-upload-${isEdit ? 'edit' : 'new'}`}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-brand-100 text-brand-600 rounded-md hover:bg-brand-200 transition-colors"
            >
              <Upload size={16} />
              Upload Image
            </label>
            {(formData.imageUrl || (isEdit ? editImagePreview : imagePreview)) && (
              <button
                type="button"
                onClick={() => removeImage(isEdit)}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                <X size={16} />
                Remove
              </button>
            )}
          </div>
          
          {/* Manual URL input as alternative */}
          <div>
            <input
              type="text"
              value={formData.imageUrl || ''}
              onChange={(e) => {
                setFormData({ ...formData, imageUrl: e.target.value });
                if (isEdit) {
                  setEditImagePreview(e.target.value);
                } else {
                  setImagePreview(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="Or enter image URL directly"
            />
          </div>
          
          {(formData.imageUrl || (isEdit ? editImagePreview : imagePreview)) && (
            <div className="mt-3">
              <img
                src={formData.imageUrl || (isEdit ? editImagePreview : imagePreview)}
                alt="Vehicle Preview"
                className="w-full max-w-sm h-auto rounded-lg border border-gray-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => {
            if (isEdit) {
              setIsEditModalOpen(false);
              setEditingVehicle(null);
            } else {
              setIsAddModalOpen(false);
            }
            resetForm();
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-transparent rounded-md shadow-sm hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Vehicle' : 'Add Vehicle')}
        </button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        <span className="ml-3 text-lg">Loading vehicles...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Helmet>
        <title>Vehicles | Admin Dashboard</title>
        <style>{modalStyles}</style>
      </Helmet>

      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center">
            <Car className="h-8 w-8 mr-2 text-brand-500" />
            <h1 className="text-2xl font-bold text-gray-900">Manage Vehicles</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            View, add, and edit vehicles in your fleet.
          </p>
        </div>
        <div>
          <Button onClick={handleAddNewVehicle} variant="primary">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Vehicle
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
              placeholder="Search by name, make, model, VIN, etc..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make & Model</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VIN</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.length > 0 ? filteredVehicles.map((vehicle) => (
                <tr key={vehicle._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vehicle.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {vehicle.imageUrl ? (
                        <img
                          src={vehicle.imageUrl}
                          alt={vehicle.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <ImageIcon size={16} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vehicle.make} {vehicle.model}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.licensePlate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.vin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.color || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(vehicle.status)}`}>
                      {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button 
                      variant="text" 
                      size="sm" 
                      onClick={() => handleEditVehicle(vehicle)} 
                      title="Edit Vehicle" 
                      className="text-brand-500 hover:text-brand-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="text" 
                      size="sm" 
                      onClick={() => handleDeleteVehicle(vehicle._id)} 
                      title="Delete Vehicle" 
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">
                    <Car className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    No vehicles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Add New Vehicle</h2>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <VehicleForm isEdit={false} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Edit Vehicle</h2>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingVehicle(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <VehicleForm isEdit={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVehicles;