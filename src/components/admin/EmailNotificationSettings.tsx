import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { API_BASE_URL } from '../../config';

interface EmailNotificationSettings {
  sendToCustomer: boolean;
  sendToAdmin: boolean;
  sendToDriver: boolean;
  adminEmails: string[];
  customTemplates: {
    customer: string;
    admin: string;
    driver: string;
  };
}

export default function EmailNotificationSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<EmailNotificationSettings>({
    sendToCustomer: true,
    sendToAdmin: true,
    sendToDriver: true,
    adminEmails: [],
    customTemplates: {
      customer: '',
      admin: '',
      driver: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings/email`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email settings');
      }

      const data = await response.json();
      setSettings(data.emailNotifications);
    } catch (error) {
      console.error('Error fetching email settings:', error);
      toast.error('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof EmailNotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    setHasChanges(true);
  };

  const handleAddEmail = () => {
    if (!newEmail || settings.adminEmails.includes(newEmail)) {
      return;
    }
    setSettings(prev => ({
      ...prev,
      adminEmails: [...prev.adminEmails, newEmail]
    }));
    setNewEmail('');
    setHasChanges(true);
  };

  const handleRemoveEmail = (email: string) => {
    setSettings(prev => ({
      ...prev,
      adminEmails: prev.adminEmails.filter(e => e !== email)
    }));
    setHasChanges(true);
  };

  const handleTemplateChange = (type: keyof EmailNotificationSettings['customTemplates'], value: string) => {
    setSettings(prev => ({
      ...prev,
      customTemplates: {
        ...prev.customTemplates,
        [type]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Create the settings object with the correct nested structure
      const settingsToSave = {
        emailNotifications: {
          sendToCustomer: Boolean(settings.sendToCustomer),
          sendToAdmin: Boolean(settings.sendToAdmin),
          sendToDriver: Boolean(settings.sendToDriver),
          adminEmails: Array.isArray(settings.adminEmails) ? settings.adminEmails : [],
          customTemplates: {
            customer: String(settings.customTemplates?.customer || ''),
            admin: String(settings.customTemplates?.admin || ''),
            driver: String(settings.customTemplates?.driver || '')
          }
        }
      };

      console.log('Saving settings:', settingsToSave);
      console.log('API URL:', `${API_BASE_URL}/admin/settings/email`);

      const response = await fetch(`${API_BASE_URL}/admin/settings/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsToSave)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        const errorMessage = data.error || data.details || 'Failed to update email settings';
        console.error('Server error:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.emailNotifications) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      setSettings(data.emailNotifications);
      setHasChanges(false);
      toast.success('Email notification settings saved successfully');
    } catch (error) {
      console.error('Error saving email notification settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save email notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-2 sm:p-4">
      {/* Admin Emails */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-sm font-medium text-gray-900">Admin Email Recipients</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter admin email"
            className="w-full sm:flex-1 rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-base sm:text-sm px-3 py-2"
          />
          <Button onClick={handleAddEmail} variant="secondary" className="w-full sm:w-auto">
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {settings.adminEmails.map((email) => (
            <div key={email} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-3 sm:p-2 rounded">
              <span className="text-base sm:text-sm text-gray-900 break-all">{email}</span>
              <button
                onClick={() => handleRemoveEmail(email)}
                className="mt-2 sm:mt-0 text-red-600 hover:text-red-800 text-base sm:text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          variant="primary"
          className="w-full sm:w-auto"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}