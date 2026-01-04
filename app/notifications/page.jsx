'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { notificationAPI } from '@/lib/api';
import { FiBell, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">Stay updated with your activities</p>
            </div>
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FiBell className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">You're all caught up!</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification, onMarkAsRead }) {
  const typeIcons = {
    task_assigned: FiCheckCircle,
    task_overdue: FiAlertCircle,
    attendance_late: FiAlertCircle,
    attendance_missed: FiAlertCircle,
    blog_review: FiInfo,
    blog_published: FiCheckCircle,
    general: FiInfo,
  };

  const typeColors = {
    task_assigned: 'text-blue-600 bg-blue-100',
    task_overdue: 'text-red-600 bg-red-100',
    attendance_late: 'text-orange-600 bg-orange-100',
    attendance_missed: 'text-red-600 bg-red-100',
    blog_review: 'text-yellow-600 bg-yellow-100',
    blog_published: 'text-green-600 bg-green-100',
    general: 'text-gray-600 bg-gray-100',
  };

  const Icon = typeIcons[notification.type] || FiInfo;
  const colorClass = typeColors[notification.type] || 'text-gray-600 bg-gray-100';

  return (
    <div
      className={`p-6 hover:bg-gray-50 transition cursor-pointer ${
        !notification.is_read ? 'bg-blue-50' : ''
      }`}
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-4">
        <div className={`${colorClass} p-3 rounded-lg`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            </div>
            {!notification.is_read && (
              <span className="ml-4 h-2 w-2 bg-blue-600 rounded-full"></span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}