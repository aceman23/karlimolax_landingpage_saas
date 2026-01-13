import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import toast from 'react-hot-toast';
import { getServicePackages, updateServicePackage, createServicePackage, getVehicles, deleteServicePackage } from '../../services/database';
import { Plus, Edit, Save, X, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { ServicePackage, Vehicle } from '../../types';
import Button from '../../components/common/Button';

export default function AdminServicePackages() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ServicePackage>>({});
  const [newPackageForm, setNewPackageForm] = useState<Partial<ServicePackage>>({
    name: '',
    description: '',
    base_price: 0,
    is_hourly: false,
    minimum_hours: undefined,
    is_active: true,
    vehicle_id: '',
    image_url: ''
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [newPriceInput, setNewPriceInput] = useState<string>('0');

  useEffect(() => {
    loadData();
  }, []);

  // Handle file upload and convert to base64
  const handleImageUpload = (file: File, isEdit: boolean = false) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit) {
        setEditForm({ ...editForm, image_url: base64String });
        setEditImagePreview(base64String);
      } else {
        setNewPackageForm({ ...newPackageForm, image_url: base64String });
        setImagePreview(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove image for new package (no params)
  const removeImage = () => {
    setNewPackageForm({ ...newPackageForm, image_url: '' });
    setImagePreview('');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [packagesData, vehiclesData] = await Promise.all([
        getServicePackages(),
        getVehicles()
      ]);
      setPackages(packagesData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data. You may need to initialize the database.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (pkg: ServicePackage) => {
    setEditingId(pkg._id || pkg.id || '');
    setEditForm({ ...pkg });
    setEditImagePreview(pkg.image_url || '');
    setEditPriceInput(pkg.base_price?.toString() || '0');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setEditImagePreview('');
    setEditPriceInput('');
  };

  const saveEdit = async () => {
    const priceValue = parseFloat(editPriceInput);
    if (!editingId || !editForm.name || !editForm.description || isNaN(priceValue) || priceValue <= 0) {
      toast.error('Please fill in all required fields with valid values');
      return;
    }

    try {
      const formDataWithPrice = { 
        ...editForm, 
        base_price: priceValue,
        is_hourly: editForm.is_hourly || false,
        minimum_hours: editForm.is_hourly ? editForm.minimum_hours : undefined,
        is_active: editForm.is_active ?? true,
        airports: editForm.airports || [],
        updated_at: new Date()
      };

      console.log('Updating package with data:', formDataWithPrice); // Debug log
      const response = await updateServicePackage(editingId, formDataWithPrice);
      console.log('Package updated successfully:', response);
      
      toast.success('Package updated successfully');
      setEditingId(null);
      setEditForm({});
      setEditImagePreview('');
      setEditPriceInput('');
      loadData();
    } catch (error) {
      console.error('Error updating package:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update package';
      toast.error(errorMessage);
    }
  };

  const createPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceValue = parseFloat(newPriceInput);
    if (!newPackageForm.name || !newPackageForm.description || isNaN(priceValue) || priceValue <= 0) {
      toast.error('Please fill in all required fields with valid values');
      return;
    }

    try {
      // Create package data with all required fields
      const packageData = {
        ...newPackageForm,
        base_price: priceValue,
        duration: newPackageForm.is_hourly ? (newPackageForm.minimum_hours || 1) * 60 : 120, // Convert hours to minutes or default to 2 hours
        is_hourly: newPackageForm.is_hourly || false,
        minimum_hours: newPackageForm.is_hourly ? newPackageForm.minimum_hours : undefined,
        is_active: newPackageForm.is_active ?? true,
        airports: newPackageForm.airports || [],
        created_at: new Date(),
        updated_at: new Date()
      };

      console.log('Creating package with data:', packageData); // Debug log
      const response = await createServicePackage(packageData);
      console.log('Package created successfully:', response);
      toast.success('Package created successfully');
      setShowAddModal(false);
      setNewPackageForm({
        name: '',
        description: '',
        base_price: 0,
        is_hourly: false,
        minimum_hours: undefined,
        is_active: true,
        vehicle_id: '',
        image_url: ''
      });
      setImagePreview('');
      setNewPriceInput('0');
      loadData();
    } catch (error) {
      console.error('Error creating package:', error);
      // Display more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create package';
      toast.error(errorMessage);
    }
  };

  const getVehicleName = (vehicleId?: string) => {
    if (!vehicleId) return 'Any Vehicle';
    const vehicle = vehicles.find(v => v._id === vehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.make} ${vehicle.model})` : 'Unknown Vehicle';
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service package?')) {
      return;
    }

    try {
      await deleteServicePackage(id);
      toast.success('Service package deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting service package:', error);
      toast.error('Failed to delete service package');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading service packages...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Helmet>
        <title>Service Packages - Admin Panel</title>
      </Helmet>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Service Packages</h1>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Package
        </Button>
      </div>

      {/* Service Packages Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {packages.map((pkg) => {
                const isEditing = editingId === (pkg._id || pkg.id);
                
                return (
                  <tr key={pkg._id || pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Package name"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={2}
                          placeholder="Package description"
                        />
                      ) : (
                        <div className="text-sm text-gray-500 max-w-xs truncate">{pkg.description}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, true);
                              }}
                              className="hidden"
                              id={`image-upload-edit-${pkg._id || pkg.id}`}
                            />
                            <label
                              htmlFor={`image-upload-edit-${pkg._id || pkg.id}`}
                              className="cursor-pointer flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                            >
                              <Upload size={12} />
                              Upload
                            </label>
                            {(editForm.image_url || editImagePreview) && (
                              <button
                                type="button"
                                onClick={removeImage}
                                className="text-red-500 text-xs underline"
                              >
                                Remove Image
                              </button>
                            )}
                          </div>
                          {(editForm.image_url || editImagePreview) && (
                            <div className="w-16 h-16 rounded overflow-hidden">
                              <img
                                src={editForm.image_url || editImagePreview}
                                alt="Package preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        pkg.image_url ? (
                          <div className="w-16 h-16 rounded overflow-hidden">
                            <img
                              src={pkg.image_url}
                              alt={pkg.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          value={editForm.vehicle_id || ''}
                          onChange={(e) => setEditForm({ ...editForm, vehicle_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Any Vehicle</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle._id || vehicle.id} value={vehicle._id || vehicle.id}>
                              {vehicle.name} ({vehicle.make} {vehicle.model})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {getVehicleName(pkg.vehicle_id)}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.is_hourly || false}
                            onChange={(e) => setEditForm({ ...editForm, is_hourly: e.target.checked })}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Hourly Rate</span>
                        </label>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {pkg.is_hourly ? 'Hourly Rate' : 'Fixed Rate'}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="number"
                            min="1"
                            value={editForm.minimum_hours || ''}
                            onChange={(e) => setEditForm({ ...editForm, minimum_hours: parseInt(e.target.value) || undefined })}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Min"
                            disabled={!editForm.is_hourly}
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <div>{pkg.is_hourly && pkg.minimum_hours ? `${pkg.minimum_hours}h` : 'N/A'}</div>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editPriceInput}
                            onChange={(e) => setEditPriceInput(e.target.value)}
                            className="w-24 pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0.00"
                          />
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          ${pkg.base_price.toFixed(2)}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.is_active || false}
                            onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          pkg.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={saveEdit}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <Save size={16} />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => startEdit(pkg)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Edit size={16} />
                            Edit
                          </Button>
                          <button
                            onClick={() => {
                              const id = pkg._id || pkg.id;
                              if (id) {
                                handleDelete(id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {packages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No service packages found. Create your first package to get started.
          </div>
        )}
      </div>

      {/* Add New Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-medium text-gray-900">Add New Service Package</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form onSubmit={createPackage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    value={newPackageForm.name || ''}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter package name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={newPackageForm.description || ''}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Enter package description"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle (Optional)
                  </label>
                  <select
                    value={newPackageForm.vehicle_id || ''}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, vehicle_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Any Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id || vehicle.id} value={vehicle._id || vehicle.id}>
                        {vehicle.name} ({vehicle.make} {vehicle.model})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPriceInput}
                      onChange={(e) => setNewPriceInput(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newPackageForm.is_hourly || false}
                      onChange={(e) => setNewPackageForm({ ...newPackageForm, is_hourly: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Hourly Rate Package</span>
                  </label>
                </div>

                {newPackageForm.is_hourly && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newPackageForm.minimum_hours || ''}
                      onChange={(e) => setNewPackageForm({ ...newPackageForm, minimum_hours: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Minimum hours required"
                    />
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newPackageForm.is_active || false}
                      onChange={(e) => setNewPackageForm({ ...newPackageForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Package is active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Image</label>
                  {imagePreview ? (
                    <div className="mb-2">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded mb-2" />
                      <button type="button" onClick={removeImage} className="text-red-500 text-xs underline">Remove Image</button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0]);
                      }}
                      className="block w-full text-sm text-gray-700"
                    />
                  )}
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setImagePreview('');
                  setNewPriceInput('0');
                  setNewPackageForm({
                    name: '',
                    description: '',
                    base_price: 0,
                    is_hourly: false,
                    minimum_hours: undefined,
                    is_active: true,
                    vehicle_id: '',
                    image_url: ''
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                onClick={createPackage}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Create Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 