import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import toast from 'react-hot-toast';
import { getServicePackages, updateServicePackage, createServicePackage, getVehicles } from '../../services/database';
import { PlusCircle } from 'lucide-react';
import { ServicePackage, Vehicle } from '../../types';

export default function AdminServicePackages() {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [priceError, setPriceError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPackage, setNewPackage] = useState<Partial<ServicePackage>>({
    name: '',
    description: '',
    base_price: 0,
    is_hourly: false,
    minimum_hours: undefined,
    vehicle_id: undefined,
    is_active: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPackages();
    fetchVehicles();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await getServicePackages();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching service packages:', error);
      toast.error('Failed to load service packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    }
  };

  const handlePriceChange = (pkg: ServicePackage, amount: number) => {
    const newPrice = pkg.base_price + amount;
    if (newPrice < 0) {
      setPriceError('Price cannot be negative');
      return;
    }
    setPriceError('');
    setEditingPackage({
      ...pkg,
      base_price: newPrice
    });
  };

  const handleEditClick = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setPriceError('');
  };

  const handleSave = async () => {
    if (!editingPackage) return;
    
    if (priceError) {
      toast.error('Please fix the price error before saving');
      return;
    }

    try {
      const packageId = editingPackage._id || editingPackage.id;
      if (!packageId) {
        throw new Error('Package ID is missing');
      }
      await updateServicePackage(packageId, {
        base_price: editingPackage.base_price
      });
      toast.success('Service package updated successfully');
      setEditingPackage(null);
      fetchPackages();
    } catch (error) {
      console.error('Error updating service package:', error);
      toast.error('Failed to update service package');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newPackage.name) errors.name = 'Name is required';
    if (!newPackage.description) errors.description = 'Description is required';
    if (!newPackage.base_price || newPackage.base_price <= 0) {
      errors.base_price = 'Base price must be greater than 0';
    }
    if (newPackage.is_hourly && (!newPackage.minimum_hours || newPackage.minimum_hours <= 0)) {
      errors.minimum_hours = 'Minimum hours must be greater than 0 for hourly packages';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewPackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      await createServicePackage({
        name: newPackage.name,
        description: newPackage.description,
        base_price: newPackage.base_price,
        is_hourly: newPackage.is_hourly,
        minimum_hours: newPackage.minimum_hours,
        vehicle_id: newPackage.vehicle_id,
        is_active: newPackage.is_active
      });
      
      toast.success('Service package created successfully');
      setIsAddModalOpen(false);
      setNewPackage({
        name: '',
        description: '',
        base_price: 0,
        is_hourly: false,
        minimum_hours: undefined,
        vehicle_id: undefined,
        is_active: true
      });
      fetchPackages();
    } catch (error) {
      console.error('Error creating service package:', error);
      toast.error('Failed to create service package');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Manage Service Packages - Admin Dashboard</title>
      </Helmet>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Service Packages</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Package
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packages.map((pkg) => (
                  <tr key={pkg._id || pkg.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pkg.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{pkg.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pkg.vehicle_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pkg.is_hourly ? `${pkg.minimum_hours || 0} hours minimum` : 'Fixed rate'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingPackage?._id === pkg._id || editingPackage?.id === pkg.id ? (
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingPackage?.base_price ?? pkg.base_price}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value >= 0) {
                                  setEditingPackage({
                                    ...pkg,
                                    base_price: value
                                  });
                                  setPriceError('');
                                }
                              }}
                              className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-7"
                              placeholder="0.00"
                            />
                          </div>
                          {priceError && <p className="text-red-500 text-xs mt-1">{priceError}</p>}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">${pkg.base_price.toFixed(2)}</span>
                          <button
                            onClick={() => handleEditClick(pkg)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingPackage?._id === pkg._id || editingPackage?.id === pkg.id ? (
                        <div className="space-x-2">
                          <button
                            onClick={handleSave}
                            className="text-green-600 hover:text-green-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPackage(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(pkg)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit Price
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Package Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Service Package</h2>
            <form onSubmit={handleNewPackageSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formErrors.name ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formErrors.description ? 'border-red-500' : ''
                    }`}
                    rows={3}
                  />
                  {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle (Optional)</label>
                  <select
                    value={newPackage.vehicle_id}
                    onChange={(e) => setNewPackage({ ...newPackage, vehicle_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a vehicle (optional)</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.name} ({vehicle.make} {vehicle.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Base Price ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPackage.base_price}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          setNewPackage({ ...newPackage, base_price: value });
                          setFormErrors({ ...formErrors, base_price: '' });
                        }
                      }}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-7 ${
                        formErrors.base_price ? 'border-red-500' : ''
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {formErrors.base_price && <p className="text-red-500 text-xs mt-1">{formErrors.base_price}</p>}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newPackage.is_hourly}
                      onChange={(e) => setNewPackage({ ...newPackage, is_hourly: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Hourly Rate</span>
                  </label>
                </div>

                {newPackage.is_hourly && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Hours</label>
                    <input
                      type="number"
                      min="1"
                      value={newPackage.minimum_hours}
                      onChange={(e) => setNewPackage({ ...newPackage, minimum_hours: parseInt(e.target.value) })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        formErrors.minimum_hours ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.minimum_hours && <p className="text-red-500 text-xs mt-1">{formErrors.minimum_hours}</p>}
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newPackage.is_active}
                      onChange={(e) => setNewPackage({ ...newPackage, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}