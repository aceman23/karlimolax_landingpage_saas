import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function PricingSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState({
    distanceFeeEnabled: true,
    distanceThreshold: 40,
    distanceFee: 20,
    perMileFeeEnabled: false,
    perMileFee: 2,
    minFee: 0,
    maxFee: 1000,
    stopPrice: 25, // Default price per additional stop
    carSeatPrice: 15,
    boosterSeatPrice: 10
  });

  useEffect(() => {
    if (token) {
      fetchPricingSettings();
    }
  }, [token]);

  const fetchPricingSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/pricing`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pricing settings');
      }

      const data = await response.json();
      setSettings({
        ...data,
        distanceFeeEnabled: data.distanceFeeEnabled ?? true,
        distanceThreshold: data.distanceThreshold ?? 40,
        distanceFee: data.distanceFee ?? 20,
        perMileFeeEnabled: data.perMileFeeEnabled ?? false,
        perMileFee: data.perMileFee ?? 2,
        minFee: data.minFee ?? 0,
        maxFee: data.maxFee ?? 1000,
        stopPrice: data.stopPrice ?? 25,
        carSeatPrice: data.carSeatPrice ?? 15,
        boosterSeatPrice: data.boosterSeatPrice ?? 10
      });
    } catch (error) {
      console.error('Error fetching pricing settings:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update pricing settings');
      }

      toast.success('Pricing settings updated successfully');
    } catch (error) {
      console.error('Error updating pricing settings:', error);
      toast.error('Failed to update pricing settings');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pricing Settings</h1>
      
      <div className="space-y-6">
        {/* Distance Fee Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Distance Fee Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="distanceFeeEnabled"
                name="distanceFeeEnabled"
                checked={settings.distanceFeeEnabled}
                onChange={handleChange}
                className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
              />
              <label htmlFor="distanceFeeEnabled" className="ml-2 block text-sm text-gray-900">
                Enable Distance Fee
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Distance Threshold (miles)
              </label>
              <input
                type="number"
                name="distanceThreshold"
                value={settings.distanceThreshold}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Distance Fee ($)
              </label>
              <input
                type="number"
                name="distanceFee"
                value={settings.distanceFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Per Mile Fee Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Per Mile Fee Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="perMileFeeEnabled"
                name="perMileFeeEnabled"
                checked={settings.perMileFeeEnabled}
                onChange={handleChange}
                className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
              />
              <label htmlFor="perMileFeeEnabled" className="ml-2 block text-sm text-gray-900">
                Enable Per Mile Fee
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Per Mile Fee ($)
              </label>
              <input
                type="number"
                name="perMileFee"
                value={settings.perMileFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Stop Pricing */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Additional Stop Pricing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price per Additional Stop ($)
              </label>
              <input
                type="number"
                name="stopPrice"
                value={settings.stopPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                This amount will be added to the total price for each additional stop in a booking.
              </p>
            </div>
          </div>
        </div>

        {/* Car Seat and Booster Seat Pricing */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Car Seat and Booster Seat Pricing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Car Seat Price ($)
              </label>
              <input
                type="number"
                name="carSeatPrice"
                value={settings.carSeatPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Booster Seat Price ($)
              </label>
              <input
                type="number"
                name="boosterSeatPrice"
                value={settings.boosterSeatPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Fee Limits */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Fee Limits</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Fee ($)
              </label>
              <input
                type="number"
                name="minFee"
                value={settings.minFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Fee ($)
              </label>
              <input
                type="number"
                name="maxFee"
                value={settings.maxFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
} 