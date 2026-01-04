'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  FiUser, 
  FiSettings, 
  FiLogOut, 
  FiChevronDown,
  FiShield,
  FiBell,
  FiSearch,
  FiMenu,
  FiX
} from 'react-icons/fi';

export default function TopBar({ onMenuClick, isMobileMenuOpen }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  // Get page title based on current route
  const getPageTitle = () => {
    const routes = {
      '/dashboard': 'Dashboard',
      '/employees': 'Employees',
      '/attendance': 'Attendance',
      '/projects': 'Projects',
      '/tasks': 'Tasks',
      '/blogs': 'Blogs',
      '/profile': 'My Profile',
      '/settings': 'Settings'
    };
    return routes[pathname] || 'Phase-1 System';
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
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

  // Mock notifications (replace with real data)
  const notifications = [
    { id: 1, title: 'New task assigned', message: 'You have been assigned a new task', time: '5 min ago', unread: true },
    { id: 2, title: 'Meeting reminder', message: 'Team meeting starts in 30 minutes', time: '25 min ago', unread: true },
    { id: 3, title: 'Project update', message: 'Project Alpha has been completed', time: '1 hour ago', unread: false }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section - Mobile Menu + Title */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-fast"
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Page Title */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Right Section - Search, Notifications, User */}
        <div className="flex items-center gap-3">
          {/* Search Bar (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-150 transition-fast max-w-xs">
            <FiSearch className="text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-fast"
            >
              <FiBell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Menu */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 card shadow-xl z-50 fade-in-scale max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs text-blue-600 font-medium">{unreadCount} new</span>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-fast ${
                          notification.unread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.unread ? 'bg-blue-600' : 'bg-gray-300'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <FiBell className="mx-auto mb-2" size={32} />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200">
                    <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {/* User Button */}
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-fast"
            >
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold shadow-md">
                {getInitials()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <FiChevronDown 
                className={`hidden md:block text-gray-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} 
                size={16}
              />
            </button>

            {/* User Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 card shadow-xl z-50 fade-in-scale">
                {/* User Info */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-md">
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
                      setIsUserDropdownOpen(false);
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
                      setIsUserDropdownOpen(false);
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
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-fast">
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
        </div>
      </div>
    </div>
  );
}