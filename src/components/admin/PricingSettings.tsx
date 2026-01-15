import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { API_BASE_URL } from '../../config';
import { Plus, Trash2 } from 'lucide-react';

interface DistanceTier {
  minDistance: number;
  maxDistance: number | null | typeof Infinity;
  fee: number;
}

interface PricingSettings {
  distanceFeeEnabled: boolean;
  distanceThreshold: number;
  distanceFee: number;
  perMileFeeEnabled: boolean;
  perMileFee: number;
  minFee: number;
  maxFee: number;
  distanceTiers: DistanceTier[];
  stopPrice: number;
  carSeatPrice: number;
  boosterSeatPrice: number;
}

export default function PricingSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<PricingSettings>({
    distanceFeeEnabled: false,
    distanceThreshold: 0,
    distanceFee: 0,
    perMileFeeEnabled: false,
    perMileFee: 0,
    minFee: 0,
    maxFee: 0,
    distanceTiers: [],
    stopPrice: 25,
    carSeatPrice: 15,
    boosterSeatPrice: 10
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings/pricing`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pricing settings');
      }
      const data = await response.json();

      // Convert null maxDistance to Infinity for the UI and ensure all tiers are valid
      const formattedData = {
        ...data,
        distanceTiers: (data.distanceTiers || [])
          .filter((tier: any) => tier && (tier.minDistance !== undefined || tier.maxDistance !== undefined || tier.fee !== undefined))
          .map((tier: DistanceTier, index: number) => ({
            minDistance: typeof tier.minDistance === 'number' ? tier.minDistance : 0,
            maxDistance: tier.maxDistance === null || tier.maxDistance === undefined ? Infinity : (typeof tier.maxDistance === 'number' ? tier.maxDistance : Infinity),
            fee: typeof tier.fee === 'number' ? tier.fee : 0
          }))
      };

      console.log('[PricingSettings] Loaded distance tiers:', formattedData.distanceTiers.length, formattedData.distanceTiers);
      setSettings(formattedData);
    } catch (error) {
      console.error('Error fetching pricing settings:', error);
      toast.error('Failed to load pricing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      // Ensure distance tiers are properly formatted before saving
      const formattedSettings = {
        ...settings,
        distanceThreshold: Number(settings.distanceThreshold) || 0,
        distanceFee: Number(settings.distanceFee) || 0,
        perMileFee: Number(settings.perMileFee) || 0,
        minFee: Number(settings.minFee) || 0,
        maxFee: Number(settings.maxFee) || 0,
        stopPrice: Number(settings.stopPrice) || 0,
        distanceTiers: settings.distanceTiers.map(tier => ({
          minDistance: Number(tier.minDistance) || 0,
          maxDistance: tier.maxDistance === Infinity || tier.maxDistance === null ? null : Number(tier.maxDistance),
          fee: Number(tier.fee) || 0
        })),
        carSeatPrice: Number(settings.carSeatPrice) || 0,
        boosterSeatPrice: Number(settings.boosterSeatPrice) || 0
      };

      console.log('[PricingSettings] Saving distance tiers:', formattedSettings.distanceTiers);

      const response = await fetch(`${API_BASE_URL}/admin/settings/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formattedSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update pricing settings');
      }

      toast.success('Pricing settings saved successfully');
    } catch (error) {
      console.error('Error saving pricing settings:', error);
      toast.error('Failed to save pricing settings');
    } finally {
      setSaving(false);
    }
  };

  const addDistanceTier = () => {
    setSettings(prev => ({
      ...prev,
      distanceTiers: [
        ...prev.distanceTiers,
        { minDistance: 0, maxDistance: 0, fee: 0 }
      ]
    }));
  };

  const removeDistanceTier = (index: number) => {
    setSettings(prev => ({
      ...prev,
      distanceTiers: prev.distanceTiers.filter((_, i) => i !== index)
    }));
  };

  const updateDistanceTier = (index: number, field: keyof DistanceTier, value: number | null | typeof Infinity) => {
    setSettings(prev => ({
      ...prev,
      distanceTiers: prev.distanceTiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Distance-Based Pricing</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure fees for routes based on distance
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Enable Distance Fee</h4>
            <p className="text-sm text-gray-500">Add extra fee for routes longer than threshold</p>
          </div>
          <button
            type="button"
            className={`${
              settings.distanceFeeEnabled
                ? 'bg-brand'
                : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`}
            onClick={() => setSettings(prev => ({
              ...prev,
              distanceFeeEnabled: !prev.distanceFeeEnabled
            }))}
          >
            <span
              className={`${
                settings.distanceFeeEnabled ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        {/* Distance Tiers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Distance Tiers</h4>
              <p className="text-xs text-gray-500 mt-1">
                {settings.distanceTiers.length} tier{settings.distanceTiers.length !== 1 ? 's' : ''} configured
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addDistanceTier}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Tier
            </Button>
          </div>

          {settings.distanceTiers.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No distance tiers configured. Click "Add Tier" to create one.
            </div>
          )}
          {settings.distanceTiers.map((tier, index) => (
            <div key={`tier-${index}-${tier.minDistance}-${tier.maxDistance}`} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Distance (miles)</label>
                  <input
                  type="number"
                  value={tier.minDistance}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    updateDistanceTier(index, 'minDistance', value);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Distance (miles)</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tier.maxDistance === Infinity ? '' : tier.maxDistance}
                      onChange={(e) => {
                        const value = e.target.value === '' ? Infinity : (parseInt(e.target.value) || 0);
                        updateDistanceTier(index, 'maxDistance', value);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                      min="0"
                      disabled={tier.maxDistance === Infinity}
                      placeholder={tier.maxDistance === Infinity ? "Unlimited" : "Enter max distance"}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`unlimited-${index}`}
                      checked={tier.maxDistance === Infinity}
                      onChange={(e) => {
                        const newMaxDistance = e.target.checked ? Infinity : (tier.minDistance + 20);
                        updateDistanceTier(index, 'maxDistance', newMaxDistance);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand-500"
                    />
                    <label htmlFor={`unlimited-${index}`} className="ml-2 text-sm text-gray-600">
                      Greater than min distance
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee ($)</label>
                  <input
                  type="number"
                  value={tier.fee}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    updateDistanceTier(index, 'fee', value);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                  min="0"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDistanceTier(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900">Per-Mile Fee</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure a per-mile fee for distances beyond the threshold
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Enable Per-Mile Fee</h4>
              <p className="text-sm text-gray-500">Add a per-mile fee for distances beyond the threshold</p>
            </div>
            <button
              type="button"
              className={`${
                settings.perMileFeeEnabled
                  ? 'bg-brand'
                  : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`}
              onClick={() => setSettings(prev => ({
                ...prev,
                perMileFeeEnabled: !prev.perMileFeeEnabled
              }))}
            >
              <span
                className={`${
                  settings.perMileFeeEnabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="distanceThreshold" className="block text-sm font-medium text-gray-700">
                Mileage Threshold (miles)
              </label>
              <input
                type="number"
                id="distanceThreshold"
                value={settings.distanceThreshold}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  distanceThreshold: e.target.value === '' ? 0 : Number(e.target.value) || 0
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                min="0"
                step="0.1"
                placeholder="Enter threshold in miles"
              />
              <p className="mt-1 text-sm text-gray-500">
                Per-mile fee will start after this distance
              </p>
            </div>

            <div>
              <label htmlFor="perMileFee" className="block text-sm font-medium text-gray-700">
                Per-Mile Fee ($)
              </label>
              <input
                type="number"
                id="perMileFee"
                value={settings.perMileFee}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  perMileFee: e.target.value === '' ? 0 : Number(e.target.value) || 0
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                min="0"
                step="0.01"
              />
              <p className="mt-1 text-sm text-gray-500">
                Additional fee per mile after threshold
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900">Fee Limits</h3>
          <p className="mt-1 text-sm text-gray-500">
            Set minimum and maximum fees for all bookings
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="minFee" className="block text-sm font-medium text-gray-700">
              Minimum Fee ($)
            </label>
            <input
              type="number"
              id="minFee"
              value={settings.minFee}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                minFee: parseInt(e.target.value)
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              min="0"
            />
          </div>

          <div>
            <label htmlFor="maxFee" className="block text-sm font-medium text-gray-700">
              Maximum Fee ($)
            </label>
            <input
              type="number"
              id="maxFee"
              value={settings.maxFee}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                maxFee: parseInt(e.target.value)
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
              min="0"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Additional Stop Pricing</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure the price for each additional stop in a booking
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price per Additional Stop ($)
            </label>
            <input
              type="number"
              value={settings.stopPrice}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                stopPrice: parseFloat(e.target.value) || 0
              }))}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              This amount will be added to the total price for each additional stop in a booking.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">Car Seat and Booster Seat Pricing</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure the price for car seats and booster seats
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Car Seat Price ($)
            </label>
            <input
              type="number"
              value={settings.carSeatPrice}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                carSeatPrice: e.target.value === '' ? 0 : parseFloat(e.target.value)
              }))}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              This amount will be added to the total price for each car seat requested.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Booster Seat Price ($)
            </label>
            <input
              type="number"
              value={settings.boosterSeatPrice}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                boosterSeatPrice: e.target.value === '' ? 0 : parseFloat(e.target.value)
              }))}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              This amount will be added to the total price for each booster seat requested.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
} 