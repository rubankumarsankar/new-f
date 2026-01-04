'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { attendanceAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  FiClock, 
  FiCalendar, 
  FiCheckCircle, 
  FiXCircle, 
  FiFilter,
  FiDownload,
  FiSearch,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi';

export default function AttendancePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [allToday, setAllToday] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  });

  // Stats
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    avgWorkingHours: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [history, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const historyRes = await attendanceAPI.getHistory();
      setHistory(historyRes.data);
      setFilteredHistory(historyRes.data);

      // Only admins can see all attendance
      if (user?.role !== 'employee') {
        try {
          const allTodayRes = await attendanceAPI.getAllToday();
          setAllToday(allTodayRes.data);
        } catch (error) {
          console.log('Could not load all attendance');
        }
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(record => record.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(record => record.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(record => record.date <= filters.dateTo);
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.date.toLowerCase().includes(query) ||
        record.status.toLowerCase().includes(query)
      );
    }

    setFilteredHistory(filtered);
  };

  const calculateStats = () => {
    if (history.length === 0) {
      setStats({
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        avgWorkingHours: 0
      });
      return;
    }

    const presentDays = history.filter(r => r.status === 'present').length;
    const lateDays = history.filter(r => r.status === 'late').length;
    const absentDays = history.filter(r => r.status === 'absent').length;
    
    const totalHours = history
      .filter(r => r.working_hours)
      .reduce((sum, r) => sum + parseFloat(r.working_hours), 0);
    
    const avgWorkingHours = totalHours / (presentDays + lateDays) || 0;

    setStats({
      totalDays: history.length,
      presentDays,
      lateDays,
      absentDays,
      avgWorkingHours: avgWorkingHours.toFixed(1)
    });
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      searchQuery: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Check In', 'Check Out', 'Working Hours', 'Status'];
    const rows = filteredHistory.map(record => [
      record.date,
      record.check_in_time || '-',
      record.check_out_time || '-',
      record.working_hours ? `${record.working_hours}h` : '-',
      record.status
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const isAdmin = user?.role !== 'employee';

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading attendance...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600 mt-2">Track and manage attendance records</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatsCard
              icon={FiCalendar}
              label="Total Days"
              value={stats.totalDays}
              gradient="gradient-primary"
            />
            <StatsCard
              icon={FiCheckCircle}
              label="Present"
              value={stats.presentDays}
              gradient="gradient-success"
            />
            <StatsCard
              icon={FiClock}
              label="Late"
              value={stats.lateDays}
              gradient="gradient-warning"
            />
            <StatsCard
              icon={FiXCircle}
              label="Absent"
              value={stats.absentDays}
              gradient="gradient-error"
            />
            <StatsCard
              icon={FiTrendingUp}
              label="Avg Hours"
              value={stats.avgWorkingHours}
              gradient="gradient-purple"
            />
          </div>

          {/* Today's Attendance Summary (Admin Only) */}
          {isAdmin && allToday.length > 0 && (
            <div className="card card-hover mb-8 fade-in">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 gradient-primary rounded-lg">
                      <FiUsers className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Today's Attendance</h2>
                      <p className="text-sm text-gray-600">Real-time attendance overview</p>
                    </div>
                  </div>
                  <button
                    onClick={loadData}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-fast"
                    title="Refresh"
                  >
                    <FiRefreshCw size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <StatBox
                    label="Total Present"
                    value={allToday.filter(a => a.status === 'present' || a.status === 'late').length}
                    color="green"
                    icon={FiCheckCircle}
                  />
                  <StatBox
                    label="On Time"
                    value={allToday.filter(a => a.status === 'present').length}
                    color="blue"
                    icon={FiCheckCircle}
                  />
                  <StatBox
                    label="Late Arrivals"
                    value={allToday.filter(a => a.status === 'late').length}
                    color="orange"
                    icon={FiClock}
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check Out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allToday.map((record, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-fast">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {record.employee_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.check_in_time || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.check_out_time || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.working_hours ? `${record.working_hours}h` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={record.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Actions */}
          <div className="card mb-6 fade-in">
            <div className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                {/* Search */}
                <div className="flex-1 min-w-[200px] max-w-md">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by date or status..."
                      value={filters.searchQuery}
                      onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-fast"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-fast ${
                      showFilters 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <FiFilter size={18} />
                    Filters
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-fast"
                  >
                    <FiDownload size={18} />
                    Export
                  </button>
                  <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-fast"
                  >
                    <FiRefreshCw size={18} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                      <option value="half_day">Half Day</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={resetFilters}
                      className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-fast"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attendance History */}
          <div className="card fade-in">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {isAdmin ? 'Your Attendance History' : 'My Attendance History'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredHistory.length} of {history.length} records
              </p>
            </div>
            
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiCalendar className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="font-medium">No attendance records found</p>
                <p className="text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Working Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-fast">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiCalendar className="text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiClock className="mr-2 text-green-500" />
                            {record.check_in_time || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiClock className="mr-2 text-red-500" />
                            {record.check_out_time || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {record.working_hours ? `${record.working_hours} hours` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="card card-hover p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${gradient} p-3 rounded-lg`}>
          <Icon className="text-white" size={20} />
        </div>
      </div>
    </div>
  );
}

// Stat Box Component
function StatBox({ label, value, color, icon: Icon }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-800 border-green-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    orange: 'bg-orange-50 text-orange-800 border-orange-200',
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-4 transition-smooth hover-lift`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{label}</div>
        <Icon size={20} />
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const statusConfig = {
    present: {
      label: 'Present',
      icon: FiCheckCircle,
      classes: 'bg-green-100 text-green-800 border border-green-200'
    },
    late: {
      label: 'Late',
      icon: FiClock,
      classes: 'bg-orange-100 text-orange-800 border border-orange-200'
    },
    absent: {
      label: 'Absent',
      icon: FiXCircle,
      classes: 'bg-red-100 text-red-800 border border-red-200'
    },
    half_day: {
      label: 'Half Day',
      icon: FiClock,
      classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    }
  };

  const config = statusConfig[status] || statusConfig.absent;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.classes}`}>
      <Icon className="mr-1.5" size={14} />
      {config.label}
    </span>
  );
}