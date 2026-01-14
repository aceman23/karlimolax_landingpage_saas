import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, Database, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import NotificationSettings from '../../components/admin/NotificationSettings';
import EmailNotificationSettings from '../../components/admin/EmailNotificationSettings';
import { API_BASE_URL } from '../../config';
import { Tab } from '@headlessui/react';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiryDays: number;
}

interface DatabaseSettings {
  backupFrequency: string;
  lastBackup: string;
  retentionDays: number;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminSettings() {
  const { token } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiryDays: 90
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState({
    security: false
  });

  useEffect(() => {
    if (selectedIndex === 1) {
      fetchSecuritySettings();
    }
  }, [selectedIndex]);

  const fetchSecuritySettings = async () => {
    if (!token) return;

    setLoading(prev => ({ ...prev, security: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/security`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch security settings');
      }
      const data = await response.json();
      setSecuritySettings(data);
    } catch (error) {
      console.error('Error fetching security settings:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(prev => ({ ...prev, security: false }));
    }
  };

  const handleSecuritySave = async () => {
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/security`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(securitySettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update security settings');
      }

      toast.success('Security settings saved successfully');
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>System Settings | Admin Dashboard</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your system settings and preferences
          </p>
        </div>
        <div className="bg-white shadow rounded-lg">
          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            <Tab.List className="flex space-x-1 rounded-t-lg bg-gray-50 p-1">
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-brand-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-brand-600 shadow'
                      : 'text-gray-600 hover:bg-white/[0.12] hover:text-brand-500'
                  )
                }
              >
                Email Settings
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-2">
              <Tab.Panel
                className={classNames(
                  'rounded-xl bg-white p-3',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-brand-400 focus:outline-none focus:ring-2'
                )}
              >
                <EmailNotificationSettings />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </>
  );
}