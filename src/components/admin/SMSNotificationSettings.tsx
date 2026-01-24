import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { API_BASE_URL } from '../../config';
import { Plus, X, Phone } from 'lucide-react';

export default function SMSNotificationSettings() {
  const { token } = useAuth();
  const [adminPhoneNumbers, setAdminPhoneNumbers] = useState<string[]>([]);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [sendBookingConfirmations, setSendBookingConfirmations] = useState(true);
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
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setAdminPhoneNumbers(data.smsNotifications?.adminPhoneNumbers || []);
      setSendBookingConfirmations(
        data.smsNotifications?.sendBookingConfirmations !== undefined 
          ? data.smsNotifications.sendBookingConfirmations 
          : true
      );
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
      toast.error('Failed to load SMS notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoneNumber = () => {
    const trimmed = newPhoneNumber.trim();
    if (!trimmed) {
      toast.error('Please enter a phone number');
      return;
    }

    // Basic phone number validation (E.164 format or US format)
    const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    if (!phoneRegex.test(trimmed) && !trimmed.startsWith('+')) {
      toast.error('Please enter a valid phone number (e.g., +1234567890 or (123) 456-7890)');
      return;
    }

    // Format to E.164 if it's a US number without country code
    let formatted = trimmed;
    if (!trimmed.startsWith('+')) {
      const digitsOnly = trimmed.replace(/\D/g, '');
      if (digitsOnly.length === 10) {
        formatted = `+1${digitsOnly}`;
      } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        formatted = `+${digitsOnly}`;
      } else {
        formatted = trimmed; // Keep as-is if it doesn't match expected formats
      }
    }

    if (adminPhoneNumbers.includes(formatted)) {
      toast.error('This phone number is already in the list');
      return;
    }

    setAdminPhoneNumbers([...adminPhoneNumbers, formatted]);
    setNewPhoneNumber('');
  };

  const handleRemovePhoneNumber = (index: number) => {
    setAdminPhoneNumbers(adminPhoneNumbers.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          smsNotifications: {
            adminPhoneNumbers,
            sendBookingConfirmations
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update SMS settings');
      }

      toast.success('SMS notification settings saved successfully');
    } catch (error: any) {
      console.error('Error saving SMS settings:', error);
      toast.error(error.message || 'Failed to save SMS notification settings');
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
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Phone className="h-5 w-5 mr-2 text-brand-500" />
          SMS Notification Settings
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send Booking Confirmation SMS
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendBookingConfirmations"
                checked={sendBookingConfirmations}
                onChange={(e) => setSendBookingConfirmations(e.target.checked)}
                className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
              />
              <label htmlFor="sendBookingConfirmations" className="ml-2 block text-sm text-gray-900">
                Send SMS notifications when a new booking is created
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Phone Numbers
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Phone numbers to receive SMS notifications when bookings are created. Use E.164 format (e.g., +1234567890).
            </p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPhoneNumber();
                  }
                }}
                placeholder="+1234567890 or (123) 456-7890"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
              />
              <Button
                onClick={handleAddPhoneNumber}
                className="px-4"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {adminPhoneNumbers.length > 0 ? (
              <div className="space-y-2">
                {adminPhoneNumbers.map((phone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm font-medium text-gray-900">{phone}</span>
                    <button
                      onClick={() => handleRemovePhoneNumber(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      aria-label="Remove phone number"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No phone numbers configured</p>
            )}
          </div>
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
