import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Edit, Lock, Mail, User, Save, MapPin, Phone, Calendar, X } from 'lucide-react';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

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
  createdAt?: string;
}

interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export default function AdminProfilePage() {
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const initialProfileState: ProfileData = {
    _id: user?.id || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    role: user?.role || 'admin',
    createdAt: '',
  };
  const [profile, setProfile] = useState<ProfileData>(initialProfileState);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fetchAdminProfile = useCallback(async () => {
    if (!token || !user || !user.id) {
      setPageError('User not authenticated or ID missing. Please log in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setPageError(null);

    try {
      const profileResponse = await fetch(`/api/profiles/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!profileResponse.ok) {
        if (profileResponse.status === 401 || profileResponse.status === 403) logout();
        const errData = await profileResponse.json();
        throw new Error(errData.error || 'Failed to fetch admin profile data');
      }
      const profileData = await profileResponse.json();

      if (profileData) {
        setProfile({
          _id: profileData._id,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone || '',
          role: profileData.role,
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          zipCode: profileData.zipCode || '',
          createdAt: profileData.createdAt,
        });
        toast.success('Admin profile data loaded');
      } else {
        throw new Error('Admin profile data not found in API response');
      }
    } catch (err: any) {
      console.error('Error fetching admin profile:', err);
      setPageError(err.message || 'An unexpected error occurred.');
      toast.error(err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, [token, user, logout]);

  useEffect(() => {
    fetchAdminProfile();
  }, [fetchAdminProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user || !token || !user.id) {
      toast.error("User not authenticated.");
      return;
    }
    setSaving(true);
    try {
      const payload: ProfileUpdatePayload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
      };
      const response = await fetch(`/api/profiles/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      setSaving(false);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update profile');
      }
      const updatedProfileData = await response.json();
      setProfile(prev => ({ ...prev, ...updatedProfileData, createdAt: updatedProfileData.createdAt || prev.createdAt }));
      setShowEditModal(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error updating profile.');
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) { toast.error("Passwords do not match."); return; }
    if (!newPassword || newPassword.length < 6) { toast.error("Password < 6 chars."); return; }
    if (!currentPassword) { toast.error("Current password is required."); return; }
    if (!user || !token || !user.id) { toast.error("User not authenticated."); return; }
    setPasswordSaving(true);
    try {
      const response = await fetch(`/api/profiles/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          currentPassword,
          newPassword 
        }),
      });
      setPasswordSaving(false);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to change password');
      }
      toast.success('Password changed successfully!');
      setNewPassword(''); 
      setConfirmNewPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      setPasswordSaving(false);
      toast.error(error.message || 'Error changing password.');
    }
  };

  const formatDate = (isoDate?: string | Date) => {
    if (!isoDate) return 'N/A';
    try {
      return format(new Date(isoDate), 'PPpp');
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading && !profile._id) {
    return <LoadingSpinner size="lg" message="Loading profile..." />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Admin Profile | Kar Limo LAX</title>
      </Helmet>

      {pageError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{pageError}</p>
          <Button variant="secondary" onClick={fetchAdminProfile} className="mt-2">Try Again</Button>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">My Admin Profile</h1>
            <Button variant="primary" onClick={() => setShowEditModal(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
            <InfoItem icon={<User />} label="Name" value={`${profile.firstName} ${profile.lastName}`} />
            <InfoItem icon={<Mail />} label="Email" value={profile.email} />
            <InfoItem icon={<Phone />} label="Phone" value={profile.phone || 'N/A'} />
            <InfoItem icon={<MapPin />} label="Address" value={profile.address || 'N/A'} />
            <InfoItem icon={<MapPin />} label="City" value={profile.city || 'N/A'} />
            <InfoItem icon={<MapPin />} label="State" value={profile.state || 'N/A'} />
            <InfoItem icon={<MapPin />} label="Zip Code" value={profile.zipCode || 'N/A'} />
            <div>
              <p className="text-sm text-gray-500 flex items-center"><User className="mr-2 h-4 w-4 text-gray-400" /> Role</p>
              <p className="text-lg text-gray-800 capitalize">{profile.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center"><Calendar className="mr-2 h-4 w-4 text-gray-400" /> Member Since</p>
              <p className="text-lg text-gray-800">{formatDate(profile.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={profile.lastName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      placeholder="e.g. (555) 123-4567"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={profile.address}
                      onChange={handleChange}
                      placeholder="123 Main St"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={profile.city}
                      onChange={handleChange}
                      placeholder="Los Angeles"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={profile.state}
                      onChange={handleChange}
                      placeholder="CA"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={profile.zipCode}
                      onChange={handleChange}
                      placeholder="90001"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave} isLoading={saving}>
                    <Save className="mr-2 h-5 w-5" /> Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Section */}
        <div className="border-t border-gray-200 px-6 py-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input 
                type="password" 
                id="currentPassword" 
                name="currentPassword" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" 
                placeholder="Enter current password" 
                required 
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" id="newPassword" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="Min. 6 chars" required />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" id="confirmNewPassword" name="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="Confirm password" required />
            </div>
            <Button type="submit" isLoading={passwordSaving} className="w-full md:w-auto">
              <Lock className="mr-2 h-4 w-4" /> Change Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => {
  return (
    <div>
      <p className="text-sm text-gray-500 flex items-center">
        {icon} <span className="ml-2">{label}</span>
      </p>
      <p className="text-lg text-gray-800 break-words">{String(value) || 'N/A'}</p>
    </div>
  );
}; 