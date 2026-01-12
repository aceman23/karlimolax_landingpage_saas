import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Trash, PlusCircle, Car, Upload, X, Image as ImageIcon, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import AddVehicleForm from "@/components/admin/AddVehicleForm";

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
  features: string[];
  notes: string;
  capacity: number;
  pricePerHour: number;
  description: string;
  imageUrl: string;
}

interface VehicleFormData {
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
  capacity: string;
  pricePerHour: string;
  description: string;
  imageUrl: string;
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  const [formData, setFormData] = useState<VehicleFormData>({
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
      return;
    }

      // Create a canvas element for image compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200; // Maximum dimension for either width or height
        
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with reduced quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setImagePreview(compressedBase64);
      };
      
      // Load the image
      img.src = URL.createObjectURL(file);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', formData.name);
    formData.append('make', formData.make);
    formData.append('model', formData.model);
    formData.append('year', formData.year);
    formData.append('licensePlate', formData.licensePlate);
    formData.append('vin', formData.vin);
    formData.append('capacity', formData.capacity);
    formData.append('pricePerHour', formData.pricePerHour);
    formData.append('features', formData.features);
    formData.append('description', formData.description);
    if (imagePreview) {
      formData.append('image', imagePreview);
    }
    if (imageUrl) {
      formData.append('imageUrl', imageUrl);
    }
    // ... rest of the submit logic ...
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
    `${vehicle.name} ${vehicle.make} ${vehicle.model} ${vehicle.year}`
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
      year: vehicle.year?.toString() || '',
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
      features: Array.isArray(vehicle.features) ? vehicle.features.join(', ') : '',
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
    
    setFormData(prevData => {
      const newData = { ...prevData };
      
      // Handle status field specifically since it has a specific type
      if (name === 'status') {
        newData.status = value as 'active' | 'maintenance' | 'inactive';
      } else {
        // For all other fields, update normally
        newData[name as keyof Omit<VehicleFormData, 'status'>] = value;
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();

    // Helper function to safely check if a field is empty
    const isEmpty = (value: any): boolean => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return !value.trim();
      if (typeof value === 'number') return false;
      return !String(value).trim();
    };

    // Required fields
    if (isEmpty(formData.name)) errors.name = 'Vehicle name is required';
    if (isEmpty(formData.make)) errors.make = 'Make is required';
    if (isEmpty(formData.model)) errors.model = 'Model is required';
    if (isEmpty(formData.year)) errors.year = 'Year is required';
    if (isEmpty(formData.capacity)) errors.capacity = 'Capacity is required';
    if (isEmpty(formData.pricePerHour)) errors.pricePerHour = 'Price per hour is required';

    // Year validation
    const yearNum = parseInt(String(formData.year));
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`;
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
    setImagePreview(null);
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
        features: Array.isArray(formData.features) ? formData.features : (formData.features ? formData.features.split(",").map(f => f.trim()) : [])
      };

      const url = editingVehicle ? `/api/vehicles/${editingVehicle._id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
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
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFormSubmit(e);
      }} 
      className="space-y-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Vehicle Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm ${
                formErrors.name ? 'border-red-500' : ''
              }`}
              placeholder="e.g., Luxury Sedan"
            />
            {formErrors.name && (
              <p className="text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">
              Make *
            </label>
            <input
              type="text"
              id="make"
              name="make"
              value={formData.make}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm ${
                formErrors.make ? 'border-red-500' : ''
              }`}
              placeholder="e.g., Mercedes-Benz"
            />
            {formErrors.make && (
              <p className="text-sm text-red-500">{formErrors.make}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              Model *
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm ${
                formErrors.model ? 'border-red-500' : ''
              }`}
              placeholder="e.g., S-Class"
            />
            {formErrors.model && (
              <p className="text-sm text-red-500">{formErrors.model}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Year *
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm ${
                formErrors.year ? 'border-red-500' : ''
              }`}
              placeholder="e.g., 2024"
            />
            {formErrors.year && (
              <p className="text-sm text-red-500">{formErrors.year}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
              Number of Passengers *
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm ${
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
            <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700">
              Hourly Rate ($) *
            </label>
            <input
              type="number"
              id="pricePerHour"
              name="pricePerHour"
              value={formData.pricePerHour}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm ${
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

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Additional Information</h3>
          
          <div className="space-y-2">
            <label htmlFor="features" className="block text-sm font-medium text-gray-700">
              Features (comma-separated)
            </label>
            <textarea
              id="features"
              name="features"
              value={formData.features}
              onChange={handleInputChange}
              rows={3}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              placeholder="e.g., Leather Seats, WiFi, Premium Sound"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              placeholder="Enter vehicle description"
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
              onChange={handleImageChange}
              onClick={(e) => e.stopPropagation()}
              className="hidden"
              id={`image-upload-${isEdit ? 'edit' : 'new'}`}
            />
            <label
              htmlFor={`image-upload-${isEdit ? 'edit' : 'new'}`}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-md hover:bg-cyan-200 transition-colors"
            >
              <Upload size={16} />
              Upload Image
            </label>
            {(formData.imageUrl || (isEdit ? editImagePreview : imagePreview)) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImagePreview(null);
                  setImageUrl('');
                }}
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
              value={imageUrl}
              onChange={handleImageUrlChange}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
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
          onClick={(e) => {
            e.stopPropagation();
            if (isEdit) {
              setIsEditModalOpen(false);
              setEditingVehicle(null);
            } else {
              setIsAddModalOpen(false);
            }
            resetForm();
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Vehicle' : 'Add Vehicle')}
        </button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
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
            <Car className="h-8 w-8 mr-2 text-cyan-600" />
            <h1 className="text-2xl font-bold text-gray-900">Manage Vehicles</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            View, add, and edit vehicles in your fleet.
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Add Vehicle
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
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              placeholder="Search by name, make, model, or year..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make & Model</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passengers</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hourly Rate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features</th>
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
                    <div className="text-sm font-medium text-gray-900">{vehicle.make} {vehicle.model}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.capacity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vehicle.pricePerHour}/hr</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">{vehicle.features.join(", ")}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button 
                      variant="text" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditVehicle(vehicle);
                      }} 
                      title="Edit Vehicle" 
                      className="text-cyan-600 hover:text-cyan-800"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVehicle(vehicle._id);
                      }} 
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash size={20} />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
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
        <AddVehicleForm
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchVehicles();
          }}
          onCancel={() => {
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* Edit Vehicle Modal */}
      {isEditModalOpen && (
        <AddVehicleForm
          vehicle={editingVehicle}
          onSuccess={() => {
                    setIsEditModalOpen(false);
                    setEditingVehicle(null);
            fetchVehicles();
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingVehicle(null);
          }}
        />
      )}
    </div>
  );
}

export default AdminVehicles;