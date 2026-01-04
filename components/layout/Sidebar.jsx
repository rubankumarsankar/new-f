'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, FiUsers, FiClock, FiFolderPlus, FiCheckSquare, 
  FiFileText, FiBell, FiSettings, FiLogOut 
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  const menuItems = [
    { href: '/dashboard', icon: FiHome, label: 'Dashboard', permission: null },
    { href: '/employees', icon: FiUsers, label: 'Employees', permission: 'manage_employees' },
    { href: '/attendance', icon: FiClock, label: 'Attendance', permission: null },
    { href: '/projects', icon: FiFolderPlus, label: 'Projects', permission: null },
    { href: '/tasks', icon: FiCheckSquare, label: 'Tasks', permission: null },
    { href: '/blogs', icon: FiFileText, label: 'Blogs', permission: null },
    { href: '/notifications', icon: FiBell, label: 'Notifications', permission: null },
    { href: '/settings', icon: FiSettings, label: 'Settings', permission: 'manage_employees' },
    { href: '/profile', icon: FiSettings, label: 'Profile', permission: null },
  ];

  const filteredMenu = menuItems.filter(
    item => !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Phase-1 System</h1>
        <p className="text-sm text-gray-400 mt-1 capitalize">
          {user?.role?.replace('_', ' ')}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="mb-3 px-4 py-2">
          <p className="text-sm font-medium text-white">{user?.username}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}