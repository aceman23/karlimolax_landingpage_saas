import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Edit, Mail, User, Save, MapPin, Phone, Building, Building2, Map, Hash } from 'lucide-react';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

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
  companyName?: string;
  billingAddress?: string;
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

export default function EditProfilePage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      setPageError('Access denied. This page is for customers only.');
      setLoading(false);
      return;
    }

    fetchCustomerProfile();
  }, [user, token, navigate]);

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      setPageError(null);

      if (!user?.id) {
        throw new Error('User ID not found. Please log in again.');
      }

      const response = await fetch(`/api/customers/by-profile/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      setProfile({
        ...data.profile,
        companyName: data.customer?.companyName || '',
        billingAddress: data.customer?.billingAddress || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setPageError(error.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (profile) {
      setProfile({
        ...profile,
        [name]: value
      });
    }
  };

  const handleSave = async () => {
    if (!user || !token || !user.id) {
      toast.error("User not authenticated.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/customer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          email: profile?.email,
          phone: profile?.phone,
          address: profile?.address,
          city: profile?.city,
          state: profile?.state,
          zipCode: profile?.zipCode,
          companyName: profile?.companyName,
          billingAddress: profile?.billingAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {pageError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="font-bold">Error</p>
            <p>{pageError}</p>
            <Button variant="secondary" onClick={fetchCustomerProfile} className="mt-2">Try Again</Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
                <div className="flex space-x-3">
                  <Button variant="secondary" onClick={() => navigate('/profile')} className="text-sm">
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave} className="text-sm" disabled={saving}>
                    {saving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-brand-50 border-b border-brand-200">
                <p className="text-brand-700">{error}</p>
              </div>
            )}

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem icon={<User />} label="Name" value={`${profile?.firstName} ${profile?.lastName}`} editMode={editMode} fieldName="firstName" secondFieldName="lastName" value2={profile?.lastName} onChange={handleChange} placeholder="First Name"/>
                <InfoItem icon={<Mail />} label="Email" value={profile?.email} editMode={editMode} fieldName="email" onChange={handleChange} placeholder="Email"/>
                <InfoItem icon={<Phone />} label="Phone" value={profile?.phone} editMode={editMode} fieldName="phone" onChange={handleChange} placeholder="Phone"/>
                <InfoItem icon={<MapPin />} label="Address" value={profile?.address} editMode={editMode} fieldName="address" onChange={handleChange} placeholder="Address"/>
                <InfoItem icon={<Building2 />} label="City" value={profile?.city} editMode={editMode} fieldName="city" onChange={handleChange} placeholder="City"/>
                <InfoItem icon={<Map />} label="State" value={profile?.state} editMode={editMode} fieldName="state" onChange={handleChange} placeholder="State"/>
                <InfoItem icon={<Hash />} label="ZIP Code" value={profile?.zipCode} editMode={editMode} fieldName="zipCode" onChange={handleChange} placeholder="ZIP Code"/>
                <InfoItem icon={<Building2 />} label="Company Name" value={profile?.companyName} editMode={editMode} fieldName="companyName" onChange={handleChange} placeholder="Company Name"/>
                <InfoItem icon={<MapPin />} label="Billing Address" value={profile?.billingAddress} editMode={editMode} fieldName="billingAddress" onChange={handleChange} placeholder="Billing Address"/>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, editMode, fieldName, secondFieldName, value2, onChange, type = 'text', placeholder }) => {
  if (editMode) {
    return (
      <div>
        <label htmlFor={fieldName} className="block text-sm font-medium text-gray-500 flex items-center">
          {icon} <span className="ml-2">{label}</span>
        </label>
        {fieldName === 'firstName' && secondFieldName ? (
          <div className="flex space-x-2">
            <input
              type={type}
              name={fieldName}
              id={fieldName}
              value={value as string}
              onChange={onChange}
              placeholder="First Name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
            />
            <input
              type={type}
              name={secondFieldName}
              id={secondFieldName}
              value={value2 || ''}
              onChange={onChange}
              placeholder="Last Name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
            />
          </div>
        ) : fieldName === 'email' ? (
          <input
            type={type}
            name={fieldName}
            id={fieldName}
            value={value as string}
            readOnly
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        ) : (
          <input
            type={type}
            name={fieldName}
            id={fieldName}
            value={value as string}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
          />
        )}
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-gray-500 flex items-center">
        {icon} <span className="ml-2">{label}</span>
      </p>
      <p className="text-lg text-gray-800 break-words">{String(value) || 'N/A'}</p>
    </div>
  );
}; 