'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

import { employeeAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiBriefcase,
  FiEdit,
  FiSave,
  FiX,
  FiShield,
  FiMapPin
} from 'react-icons/fi';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    date_of_joining: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Assuming you have an endpoint to get current user's employee data
      const response = await employeeAPI.getById(user?.id);
      setProfileData(response.data);
      setFormData({
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        department: response.data.department || '',
        designation: response.data.designation || '',
        date_of_joining: response.data.date_of_joining || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const cleanedData = {
        ...formData,
        phone: formData.phone || null,
        date_of_joining: formData.date_of_joining || null
      };

      await employeeAPI.update(user?.id, cleanedData);
      
      // Update local storage user data
      const updatedUser = {
        ...user,
        username: `${formData.first_name} ${formData.last_name}`,
        email: formData.email
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setIsEditing(false);
      await loadProfile();
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      first_name: profileData?.first_name || '',
      last_name: profileData?.last_name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      department: profileData?.department || '',
      designation: profileData?.designation || '',
      date_of_joining: profileData?.date_of_joining || ''
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your personal information</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="card card-hover p-6 text-center fade-in">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center text-white text-3xl font-bold">
                  {profileData?.first_name?.charAt(0)}{profileData?.last_name?.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {profileData?.first_name} {profileData?.last_name}
                </h2>
                <p className="text-gray-600 mb-4">{profileData?.email}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                  <FiShield size={14} />
                  {profileData?.role?.replace('_', ' ').toUpperCase()}
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full mt-6 gradient-primary text-white px-6 py-3 rounded-lg font-semibold transition hover-scale btn-glow flex items-center justify-center gap-2"
                  >
                    <FiEdit size={18} />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="card card-hover p-6 mt-6 fade-in">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <FiBriefcase className="text-gray-400" />
                    <span className="text-gray-600">Employee Code:</span>
                    <span className="font-semibold text-gray-900">{profileData?.employee_code}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FiCalendar className="text-gray-400" />
                    <span className="text-gray-600">Joined:</span>
                    <span className="font-semibold text-gray-900">
                      {profileData?.date_of_joining 
                        ? new Date(profileData.date_of_joining).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2">
              <div className="card p-6 fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Profile Details</h3>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="gradient-success text-white px-4 py-2 rounded-lg font-semibold transition hover-scale flex items-center gap-2"
                      >
                        <FiSave size={16} />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-fast flex items-center gap-2"
                      >
                        <FiX size={16} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <FiUser className="text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full border rounded-lg px-4 py-2 transition-fast ${
                            isEditing 
                              ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' 
                              : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          } ${errors.first_name ? 'border-red-500' : ''}`}
                        />
                        {errors.first_name && (
                          <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full border rounded-lg px-4 py-2 transition-fast ${
                            isEditing 
                              ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' 
                              : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          } ${errors.last_name ? 'border-red-500' : ''}`}
                        />
                        {errors.last_name && (
                          <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <FiMail className="text-green-600" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full border rounded-lg px-4 py-2 transition-fast ${
                            isEditing 
                              ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' 
                              : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          } ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full border rounded-lg px-4 py-2 transition-fast ${
                            isEditing 
                              ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' 
                              : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <FiBriefcase className="text-purple-600" />
                      Work Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full border rounded-lg px-4 py-2 transition-fast ${
                            isEditing 
                              ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' 
                              : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Designation
                        </label>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full border rounded-lg px-4 py-2 transition-fast ${
                            isEditing 
                              ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' 
                              : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Joining
                        </label>
                        <input
                          type="date"
                          name="date_of_joining"
                          value={formData.date_of_joining}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`w-full border rounded-lg px-4 py-2 transition-fast ${
                            isEditing 
                              ? 'border-gray-300 focus:ring-2 focus:ring-blue-500' 
                              : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}