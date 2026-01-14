import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import { API_BASE_URL } from '@/config';

interface NotificationSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  bookingNotifications: boolean;
  driverAssignments: boolean;
  paymentNotifications: boolean;
}

export default function NotificationSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    smsEnabled: true,
    emailEnabled: true,
    bookingNotifications: true,
    driverAssignments: true,
    paymentNotifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notification settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (setting: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      toast.success('Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
            <p className="text-sm text-gray-500">Receive notifications via SMS</p>
          </div>
          <button
            type="button"
            className={`${
              settings.smsEnabled
                ? 'bg-brand-500'
                : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`}
            onClick={() => handleToggle('smsEnabled')}
          >
            <span
              className={`${
                settings.smsEnabled ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <button
            type="button"
            className={`${
              settings.emailEnabled
                ? 'bg-brand-500'
                : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`}
            onClick={() => handleToggle('emailEnabled')}
          >
            <span
              className={`${
                settings.emailEnabled ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Booking Notifications</h3>
            <p className="text-sm text-gray-500">Get notified about new bookings</p>
          </div>
          <button
            type="button"
            className={`${
              settings.bookingNotifications
                ? 'bg-brand-500'
                : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`}
            onClick={() => handleToggle('bookingNotifications')}
          >
            <span
              className={`${
                settings.bookingNotifications ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Driver Assignments</h3>
            <p className="text-sm text-gray-500">Get notified when drivers are assigned</p>
          </div>
          <button
            type="button"
            className={`${
              settings.driverAssignments
                ? 'bg-brand-500'
                : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`}
            onClick={() => handleToggle('driverAssignments')}
          >
            <span
              className={`${
                settings.driverAssignments ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Payment Notifications</h3>
            <p className="text-sm text-gray-500">Get notified about payments</p>
          </div>
          <button
            type="button"
            className={`${
              settings.paymentNotifications
                ? 'bg-brand-500'
                : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`}
            onClick={() => handleToggle('paymentNotifications')}
          >
            <span
              className={`${
                settings.paymentNotifications ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          variant="primary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}