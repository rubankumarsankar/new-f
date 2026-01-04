'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  FiUser, 
  FiSettings, 
  FiLogOut, 
  FiChevronDown,
  FiShield
} from 'react-icons/fi';

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const getInitials = () => {
    if (!user?.username) return 'U';
    return user.username.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = () => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-700',
      admin: 'bg-blue-100 text-blue-700',
      project_manager: 'bg-green-100 text-green-700',
      employee: 'bg-gray-100 text-gray-700',
      content_editor: 'bg-orange-100 text-orange-700'
    };
    return colors[user?.role] || colors.employee;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-fast"
      >
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
          {getInitials()}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>
        <FiChevronDown 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          size={16}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 card shadow-xl z-50 fade-in-scale">
          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
                {getInitials()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{user?.username}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor()}`}>
                <FiShield className="inline mr-1" size={12} />
                {user?.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => {
                router.push('/profile');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-fast text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FiUser className="text-blue-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">My Profile</p>
                <p className="text-xs text-gray-500">View and edit profile</p>
              </div>
            </button>

            <button
              onClick={() => {
                router.push('/settings');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-fast text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <FiSettings className="text-purple-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Settings</p>
                <p className="text-xs text-gray-500">Preferences & configuration</p>
              </div>
            </button>

            <div className="my-2 border-t border-gray-200"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-fast text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200">
                <FiLogOut className="text-red-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-red-600">Logout</p>
                <p className="text-xs text-red-400">Sign out of your account</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}