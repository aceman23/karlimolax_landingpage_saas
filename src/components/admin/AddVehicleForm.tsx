import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';

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

interface AddVehicleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  vehicle?: Vehicle;
}

interface VehicleFormData {
  name: string;
  make: string;
  model: string;
  capacity: number;
  pricePerHour: number;
  features: string;
  description: string;
  imageUrl: string; // primary (backward compat)
  imageUrls?: string[]; // new: multiple images
}

const AddVehicleForm: React.FC<AddVehicleFormProps> = ({ onSuccess, onCancel, vehicle }) => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageList, setImageList] = useState<string[]>(vehicle && (vehicle as any).imageUrls ? (vehicle as any).imageUrls : (vehicle?.imageUrl ? [vehicle.imageUrl] : []));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<VehicleFormData>({
    name: vehicle?.name || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    capacity: vehicle?.capacity || 0,
    pricePerHour: vehicle?.pricePerHour || 0,
    features: Array.isArray(vehicle?.features) ? vehicle.features.join(', ') : '',
    description: vehicle?.description || '',
    imageUrl: vehicle?.imageUrl || '',
    imageUrls: (vehicle as any)?.imageUrls || (vehicle?.imageUrl ? [vehicle.imageUrl] : [])
  });

  useEffect(() => {
    if (vehicle && ((vehicle as any).imageUrls || vehicle.imageUrl)) {
      const list = (vehicle as any).imageUrls || (vehicle.imageUrl ? [vehicle.imageUrl] : []);
      setImageList(list);
      setImagePreview(list[0] || '');
      setFormData(prev => ({ ...prev, imageUrls: list, imageUrl: list[0] || '' }));
    }
  }, [vehicle]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file) return;

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
      const maxDimension = 1200; // Increased maximum dimension for better quality
      
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
      
      // Convert to base64 with higher quality
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8); // Increased quality to 80%
      setImagePreview(compressedBase64);
      setImageList(prev => [...prev, compressedBase64]);
      setFormData(prev => ({ ...prev, imageUrl: prev.imageUrl || compressedBase64, imageUrls: [...(prev.imageUrls || []), compressedBase64] }));
    };
    
    // Load the image
    img.src = URL.createObjectURL(file);
  };

  const removeImage = (index?: number) => {
    if (typeof index === 'number') {
      setImageList(prev => {
        const next = prev.filter((_, i) => i !== index);
        setImagePreview(next[0] || '');
        setFormData(prevForm => ({ ...prevForm, imageUrls: next, imageUrl: next[0] || '' }));
        return next;
      });
    } else {
      setImagePreview('');
      setImageList([]);
      setFormData(prev => ({ ...prev, imageUrl: '', imageUrls: [] }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Vehicle name is required';
    }
    if (!formData.make.trim()) {
      errors.make = 'Make is required';
    }
    if (!formData.model.trim()) {
      errors.model = 'Model is required';
    }
    if (!formData.capacity || Number(formData.capacity) < 1) {
      errors.capacity = 'Number of passengers must be at least 1';
    }
    if (!formData.pricePerHour || Number(formData.pricePerHour) <= 0) {
      errors.pricePerHour = 'Hourly rate must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!token) {
      toast.error('Authentication required');
      return;
    }

    setIsLoading(true);
    try {
      const vehicleData = {
        ...formData,
        capacity: parseInt(String(formData.capacity)),
        pricePerHour: parseFloat(String(formData.pricePerHour)),
        features: formData.features ? formData.features.split(",").map(f => f.trim()) : [],
        imageUrl: (imageList[0] || formData.imageUrl || ''),
        imageUrls: imageList
      };

      const url = vehicle ? `/api/vehicles/${vehicle._id}` : '/api/vehicles';
      const method = vehicle ? 'PUT' : 'POST';

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
        throw new Error(errorData.error || `Failed to ${vehicle ? 'update' : 'add'} vehicle`);
      }

      toast.success(`Vehicle ${vehicle ? 'updated' : 'added'} successfully`);
      onSuccess();
    } catch (error) {
      console.error(`Error ${vehicle ? 'updating' : 'adding'} vehicle:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${vehicle ? 'update' : 'add'} vehicle`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Basic Information</h3>
                
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
                    className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
                      formErrors.name ? 'border-red-500' : ''
                    }`}
                    placeholder="e.g., Luxury Sedan"
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
                    className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
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
                    className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
                      formErrors.model ? 'border-red-500' : ''
                    }`}
                    placeholder="e.g., Camry"
                  />
                  {formErrors.model && (
                    <p className="text-sm text-red-500">{formErrors.model}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Number of Passengers *
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
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
                    Hourly Rate ($) *
                  </label>
                  <input
                    type="number"
                    id="pricePerHour"
                    name="pricePerHour"
                    value={formData.pricePerHour}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm ${
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
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Additional Information</h3>
                
                <div className="space-y-2">
                  <label htmlFor="features" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Features (comma-separated)
                </label>
                <input
                  type="text"
                  id="features"
                  name="features"
                  value={formData.features}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                  placeholder="e.g., GPS, WiFi, Leather seats"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                  placeholder="Additional details about the vehicle..."
                />
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Vehicle Images</h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Upload vehicle images
                      </span>
                      <input
                        id="image-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          files.forEach(file => handleImageUpload(file));
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
              {imageList.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageList.map((src, idx) => (
                    <div key={idx} className="relative">
                      <img src={src} alt={`Vehicle ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? (vehicle ? 'Updating...' : 'Adding...') : (vehicle ? 'Update Vehicle' : 'Add Vehicle')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleForm; 