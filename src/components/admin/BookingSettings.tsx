import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { API_BASE_URL } from '../../config';
import { AlertCircle } from 'lucide-react';

export default function BookingSettings() {
  const { token } = useAuth();
  const [bookingsEnabled, setBookingsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch settings:', response.status, errorText);
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      // Handle undefined, null, or missing bookingsEnabled - only default to true if truly not set
      let bookingsEnabledValue: boolean;
      if (data.bookingsEnabled !== undefined && data.bookingsEnabled !== null) {
        // Explicitly convert to boolean - true only if explicitly true
        bookingsEnabledValue = data.bookingsEnabled === true;
      } else {
        bookingsEnabledValue = true;
      }
      console.log('[FRONTEND] Fetched bookingsEnabled:', data.bookingsEnabled, 'type:', typeof data.bookingsEnabled, '-> setting to:', bookingsEnabledValue);
      setBookingsEnabled(bookingsEnabledValue);
    } catch (error) {
      console.error('Error fetching booking settings:', error);
      toast.error('Failed to load booking settings');
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
      console.log('[FRONTEND] Saving bookingsEnabled:', bookingsEnabled, 'type:', typeof bookingsEnabled);

      // Send only the bookingsEnabled value - backend will preserve other fields
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingsEnabled: bookingsEnabled === true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update booking settings');
      }

      const savedData = await response.json();
      console.log('[FRONTEND] Settings saved, response:', savedData);
      console.log('[FRONTEND] bookingsEnabled in response:', savedData.bookingsEnabled, 'type:', typeof savedData.bookingsEnabled);

      // Update local state with the saved value - handle null/undefined properly
      // Use the value from response, but if it's null/undefined, use what we tried to save
      let savedBookingsEnabled: boolean;
      if (savedData.bookingsEnabled !== undefined && savedData.bookingsEnabled !== null) {
        savedBookingsEnabled = savedData.bookingsEnabled === true;
      } else {
        // If response doesn't have it, use what we sent
        savedBookingsEnabled = bookingsEnabled;
        console.log('[FRONTEND] Response missing bookingsEnabled, using sent value:', savedBookingsEnabled);
      }
      console.log('[FRONTEND] Setting local state to:', savedBookingsEnabled);
      setBookingsEnabled(savedBookingsEnabled);

      toast.success('Booking settings saved successfully');
    } catch (error: any) {
      console.error('Error saving booking settings:', error);
      toast.error(error.message || 'Failed to save booking settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Booking Status</h2>
        
        {!bookingsEnabled && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Bookings are currently disabled</p>
              <p className="text-sm text-yellow-700 mt-1">
                Customers will not be able to create new bookings while this setting is disabled.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="bookingsEnabled"
              checked={bookingsEnabled}
              onChange={(e) => setBookingsEnabled(e.target.checked)}
              className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
            />
            <label htmlFor="bookingsEnabled" className="ml-2 block text-sm text-gray-900">
              Enable bookings
            </label>
          </div>
          
          <p className="text-sm text-gray-500">
            When disabled, customers will see a message that bookings are temporarily unavailable and will not be able to create new bookings.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-6"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
