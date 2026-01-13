import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, MapPin, Building2, Map, Hash, Save } from 'lucide-react';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface ProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  licenseNumber?: string;
  driverStatus?: 'available' | 'busy' | 'offline';
  createdAt?: string;
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  editMode: boolean;
  fieldName: string;
  secondFieldName?: string;
  value2?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, editMode, fieldName, secondFieldName, value2, onChange, type = 'text', placeholder }) => {
  if (editMode) {
    if (secondFieldName) {
      return (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">{icon}</div>
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                type={type}
                name={fieldName}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
              <input
                type={type}
                name={secondFieldName}
                value={value2 || ''}
                onChange={onChange}
                placeholder={placeholder}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <input
            type={type}
            name={fieldName}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <p className="mt-1 text-sm text-gray-900">{value || 'Not provided'}</p>
      </div>
    </div>
  );
};

export default function EditDriverProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/driver/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (profile) {
      setProfile({
        ...profile,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setError('Profile updated successfully');
      setTimeout(() => setError(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {pageError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="font-bold">Error</p>
            <p>{pageError}</p>
            <Button variant="secondary" onClick={fetchDriverProfile} className="mt-2">Try Again</Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
                <div className="flex space-x-3">
                  <Button variant="secondary" onClick={() => navigate('/driver/profile')} className="text-sm">
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave} className="text-sm" disabled={saving}>
                    {saving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-purple-50 border-b border-purple-200">
                <p className="text-purple-800">{error}</p>
              </div>
            )}

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem icon={<User />} label="Name" value={`${profile?.firstName} ${profile?.lastName}`} editMode={true} fieldName="firstName" secondFieldName="lastName" value2={profile?.lastName} onChange={handleChange} placeholder="First Name"/>
                <InfoItem icon={<Mail />} label="Email" value={profile?.email} editMode={true} fieldName="email" onChange={handleChange} placeholder="Email"/>
                <InfoItem icon={<Phone />} label="Phone" value={profile?.phone} editMode={true} fieldName="phone" onChange={handleChange} placeholder="Phone"/>
                <InfoItem icon={<MapPin />} label="Address" value={profile?.address} editMode={true} fieldName="address" onChange={handleChange} placeholder="Address"/>
                <InfoItem icon={<Building2 />} label="City" value={profile?.city} editMode={true} fieldName="city" onChange={handleChange} placeholder="City"/>
                <InfoItem icon={<Map />} label="State" value={profile?.state} editMode={true} fieldName="state" onChange={handleChange} placeholder="State"/>
                <InfoItem icon={<Hash />} label="ZIP Code" value={profile?.zipCode} editMode={true} fieldName="zipCode" onChange={handleChange} placeholder="ZIP Code"/>
                <InfoItem icon={<Hash />} label="License Number" value={profile?.licenseNumber} editMode={true} fieldName="licenseNumber" onChange={handleChange} placeholder="License Number"/>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 