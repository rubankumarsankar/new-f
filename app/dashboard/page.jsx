'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { dashboardAPI, attendanceAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  FiUsers, 
  FiFolder, 
  FiCheckSquare, 
  FiClock, 
  FiAlertCircle,
  FiHome,
  FiMapPin,
  FiTrendingUp,
  FiCalendar,
  FiActivity
} from 'react-icons/fi';
import TopBar from '@/components/layout/TopBar';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workLocation, setWorkLocation] = useState('office'); // 'office', 'remote', 'wfh'
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    // Check if user is authenticated before loading data
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    
    loadData();

    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const [statsRes, attendanceRes] = await Promise.all([
        user?.role === 'employee' 
          ? dashboardAPI.getEmployeeStats()
          : dashboardAPI.getStats(),
        attendanceAPI.getToday()
      ]);
      
      setStats(statsRes.data);
      setTodayAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setShowLocationModal(true);
  };

  const confirmCheckIn = async () => {
    try {
      // In a real app, you'd send workLocation to the backend
      await attendanceAPI.checkIn();
      setShowLocationModal(false);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceAPI.checkOut();
      await loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to check out');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWorkingDuration = () => {
    if (!todayAttendance?.check_in_time) return '0h 0m';
    
    const checkIn = new Date(`2000-01-01 ${todayAttendance.check_in_time}`);
    const now = todayAttendance.check_out_time 
      ? new Date(`2000-01-01 ${todayAttendance.check_out_time}`)
      : new Date();
    
    const diff = now - checkIn;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        {/* <TopBar /> */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
                {/* <TopBar /> */}

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FiAlertCircle className="text-red-500 mx-auto mb-4" size={48} />
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="gradient-primary text-white px-6 py-2 rounded-lg hover-scale"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
                      {/* <TopBar /> */}

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header with Live Clock */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.username}! 👋
                </h1>
                <p className="text-gray-600">{formatDate(currentTime)}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-gradient mb-1">
                  {formatTime(currentTime)}
                </div>
                <p className="text-sm text-gray-600">Live Clock</p>
              </div>
            </div>
          </div>

          {/* Attendance Card with Location */}
          <div className="card card-hover mb-8 fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 gradient-primary rounded-lg animate-pulse">
                    <FiClock className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Today's Attendance</h2>
                    <p className="text-sm text-gray-600">Track your work hours</p>
                  </div>
                </div>
                {todayAttendance?.check_in_time && !todayAttendance?.check_out_time && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">Active</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Check In/Out Status */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-700 font-medium">Check In</span>
                    <FiClock className="text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {todayAttendance?.check_in_time || '--:--'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-purple-700 font-medium">Check Out</span>
                    <FiClock className="text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {todayAttendance?.check_out_time || '--:--'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-green-700 font-medium">Duration</span>
                    <FiActivity className="text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {getWorkingDuration()}
                  </p>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  {todayAttendance?.check_in_time ? (
                    <>
                      <StatusBadge status={todayAttendance.status} />
                      {todayAttendance.working_hours > 0 && (
                        <span className="text-sm text-gray-600">
                          Total: <span className="font-semibold">{todayAttendance.working_hours}h</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500">Not checked in yet</span>
                  )}
                </div>

                <div className="flex gap-3">
                  {!todayAttendance?.check_in_time && (
                    <button
                      onClick={handleCheckIn}
                      className="gradient-success text-white px-6 py-3 rounded-lg font-semibold transition hover-scale btn-glow flex items-center gap-2"
                    >
                      <FiClock /> Check In
                    </button>
                  )}
                  {todayAttendance?.check_in_time && !todayAttendance?.check_out_time && (
                    <button
                      onClick={handleCheckOut}
                      className="gradient-error text-white px-6 py-3 rounded-lg font-semibold transition hover-scale btn-glow flex items-center gap-2"
                    >
                      <FiClock /> Check Out
                    </button>
                  )}
                  {todayAttendance?.check_in_time && todayAttendance?.check_out_time && (
                    <div className="flex items-center gap-2 text-green-600 font-semibold px-4 py-2 bg-green-50 rounded-lg">
                      <FiCheckSquare /> Day Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {user?.role !== 'employee' && (
                <>
                  <StatCard
                    icon={FiUsers}
                    title="Total Employees"
                    value={stats.total_employees || 0}
                    gradient="gradient-blue"
                    trend="+5%"
                  />
                  <StatCard
                    icon={FiClock}
                    title="Present Today"
                    value={stats.present_today || 0}
                    gradient="gradient-success"
                    trend="+12%"
                  />
                </>
              )}
              <StatCard
                icon={FiFolder}
                title="Active Projects"
                value={stats.active_projects || 0}
                gradient="gradient-purple"
                trend="+8%"
              />
              <StatCard
                icon={FiCheckSquare}
                title="Pending Tasks"
                value={stats.pending_tasks || 0}
                gradient="gradient-warning"
                trend="-3%"
              />
              {stats.overdue_tasks > 0 && (
                <StatCard
                  icon={FiAlertCircle}
                  title="Overdue Tasks"
                  value={stats.overdue_tasks}
                  gradient="gradient-error"
                  urgent
                />
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="card card-hover p-6 fade-in">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiActivity className="text-blue-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickActionCard
                title="View Tasks"
                description="Check your assigned tasks"
                href="/tasks"
                icon={FiCheckSquare}
                gradient="gradient-blue"
              />
              <QuickActionCard
                title="Projects"
                description="Browse active projects"
                href="/projects"
                icon={FiFolder}
                gradient="gradient-purple"
              />
              <QuickActionCard
                title="Attendance History"
                description="View your attendance records"
                href="/attendance"
                icon={FiCalendar}
                gradient="gradient-success"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Work Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-custom">
          <div className="card max-w-md w-full fade-in-scale">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Select Work Location</h3>
              <p className="text-sm text-gray-600 mt-1">Where are you working from today?</p>
            </div>
            <div className="p-6 space-y-3">
              <LocationOption
                icon={FiMapPin}
                title="Office"
                description="Working from office"
                selected={workLocation === 'office'}
                onClick={() => setWorkLocation('office')}
                color="blue"
              />
              <LocationOption
                icon={FiHome}
                title="Work From Home"
                description="Working remotely from home"
                selected={workLocation === 'wfh'}
                onClick={() => setWorkLocation('wfh')}
                color="green"
              />
              <LocationOption
                icon={FiActivity}
                title="Remote"
                description="Working from another location"
                selected={workLocation === 'remote'}
                onClick={() => setWorkLocation('remote')}
                color="purple"
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={confirmCheckIn}
                className="flex-1 gradient-primary text-white py-3 rounded-lg font-semibold transition hover-scale"
              >
                Confirm Check In
              </button>
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-fast"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, title, value, gradient, trend, urgent }) {
  return (
    <div className={`card card-interactive p-6 ${urgent ? 'border-2 border-red-500' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${gradient} p-3 rounded-lg`}>
          <Icon className="text-white" size={24} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function QuickActionCard({ title, description, href, icon: Icon, gradient }) {
  return (
    <a
      href={href}
      className="card card-hover p-4 transition-smooth group"
    >
      <div className="flex items-start gap-3">
        <div className={`${gradient} p-3 rounded-lg group-hover:scale-110 transition-smooth`}>
          <Icon className="text-white" size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-smooth">
            {title}
          </h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </a>
  );
}

function LocationOption({ icon: Icon, title, description, selected, onClick, color }) {
  const colorClasses = {
    blue: selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
    green: selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
    purple: selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300',
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full border-2 rounded-lg p-4 transition-fast text-left ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${selected ? 'bg-white' : 'bg-gray-50'}`}>
          <Icon className={iconColors[color]} size={24} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {selected && (
          <FiCheckSquare className={iconColors[color]} size={20} />
        )}
      </div>
    </button>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    present: {
      label: 'On Time',
      classes: 'bg-green-100 text-green-800 border-green-200'
    },
    late: {
      label: 'Late',
      classes: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    absent: {
      label: 'Absent',
      classes: 'bg-red-100 text-red-800 border-red-200'
    }
  };

  const config = statusConfig[status] || statusConfig.present;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.classes}`}>
      {config.label}
    </span>
  );
}