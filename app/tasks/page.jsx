'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { taskAPI, projectAPI, employeeAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiCheck, 
  FiUser,
  FiUsers,
  FiFilter,
  FiSearch,
  FiClock,
  FiAlertCircle,
  FiX,
  FiMessageSquare
} from 'react-icons/fi';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    project: 'all',
    priority: 'all',
    assignee: 'all',
    search: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium',
    due_date: '',
    assigned_to_id: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const loadData = async () => {
    try {
      const [tasksRes, projectsRes, employeesRes] = await Promise.all([
        user?.role === 'employee' ? taskAPI.getMyTasks() : taskAPI.getAll(),
        projectAPI.getAll(),
        employeeAPI.getAll().catch(() => ({ data: [] }))
      ]);
      setTasks(tasksRes.data);
      setFilteredTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (filters.project !== 'all') {
      filtered = filtered.filter(t => t.project_id === parseInt(filters.project));
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    if (filters.assignee !== 'all') {
      if (filters.assignee === 'unassigned') {
        filtered = filtered.filter(t => !t.assigned_to_id);
      } else {
        filtered = filtered.filter(t => t.assigned_to_id === parseInt(filters.assignee));
      }
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  const resetFilters = () => {
    setFilters({
      project: 'all',
      priority: 'all',
      assignee: 'all',
      search: ''
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.project_id) newErrors.project_id = 'Project is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const cleanedData = {
        title: formData.title,
        description: formData.description || null,
        project_id: parseInt(formData.project_id),
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_to_id: formData.assigned_to_id ? parseInt(formData.assigned_to_id) : null
      };

      if (editingTask) {
        await taskAPI.update(editingTask.id, cleanedData);
      } else {
        await taskAPI.create(cleanedData);
      }
      
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Task save error:', error);
      alert(error.response?.data?.detail || 'Failed to save task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      loadData();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.delete(taskId);
        loadData();
      } catch (error) {
        alert('Failed to delete task');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      project_id: '',
      priority: 'medium',
      due_date: '',
      assigned_to_id: ''
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

  const canManageTasks = user?.role !== 'employee';

  // Calculate stats
  const stats = {
    total: filteredTasks.length,
    todo: filteredTasks.filter(t => t.status === 'todo').length,
    in_progress: filteredTasks.filter(t => t.status === 'in_progress').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    myTasks: filteredTasks.filter(t => t.assigned_to_id === user?.id).length
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading tasks...</div>
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="text-gray-600 mt-2">Manage and track team tasks</p>
            </div>
            {canManageTasks && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowModal(true);
                }}
                className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 transition hover-scale btn-glow"
              >
                <FiPlus /> New Task
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatsCard label="Total" value={stats.total} color="blue" />
            <StatsCard label="To Do" value={stats.todo} color="gray" />
            <StatsCard label="In Progress" value={stats.in_progress} color="orange" />
            <StatsCard label="Completed" value={stats.completed} color="green" />
            <StatsCard label="My Tasks" value={stats.myTasks} color="purple" />
          </div>

          {/* Filters */}
          <div className="card mb-6 fade-in">
            <div className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="flex-1 min-w-[200px] max-w-md">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-fast"
                    />
                  </div>
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-fast ${
                    showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <FiFilter size={18} />
                  Filters
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                    <select
                      value={filters.project}
                      onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Projects</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                    <select
                      value={filters.assignee}
                      onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Assignees</option>
                      <option value="unassigned">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={resetFilters}
                      className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-fast"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Task Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['todo', 'in_progress', 'completed'].map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={filteredTasks.filter((t) => t.status === status)}
                employees={employees}
                onStatusChange={handleStatusChange}
                onEdit={(task) => {
                  setEditingTask(task);
                  setFormData({
                    title: task.title,
                    description: task.description || '',
                    project_id: task.project_id || '',
                    priority: task.priority,
                    due_date: task.due_date || '',
                    assigned_to_id: task.assigned_to_id || ''
                  });
                  setShowModal(true);
                }}
                onDelete={handleDelete}
                canManage={canManageTasks}
                currentUser={user}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-custom">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto fade-in-scale">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-fast p-2 hover:bg-gray-100 rounded-full"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-fast ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter task title"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-fast"
                  rows="3"
                  placeholder="Describe the task..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-fast ${
                      errors.project_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {errors.project_id && <p className="text-red-500 text-xs mt-1">{errors.project_id}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-fast"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-fast"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  <select
                    name="assigned_to_id"
                    value={formData.assigned_to_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-fast"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.designation}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 gradient-primary text-white py-3 rounded-lg font-semibold transition hover-scale btn-glow"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-fast"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({ label, value, color }) {
  const colors = {
    blue: 'gradient-blue',
    gray: 'bg-gray-100 text-gray-700',
    orange: 'gradient-warning',
    green: 'gradient-success',
    purple: 'gradient-purple'
  };

  return (
    <div className="card card-hover p-4 text-center">
      <div className={`text-3xl font-bold mb-1 ${colors[color]}`}>
        {value}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function TaskColumn({ status, tasks, employees, onStatusChange, onEdit, onDelete, canManage, currentUser }) {
  const statusConfig = {
    todo: { 
      title: 'To Do', 
      gradient: 'gradient-from-gray-100 to-gray-200',
      icon: FiClock,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50'
    },
    in_progress: { 
      title: 'In Progress', 
      gradient: 'gradient-from-blue-100 to-blue-200',
      icon: FiUsers,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    completed: { 
      title: 'Completed', 
      gradient: 'gradient-from-green-100 to-green-200',
      icon: FiCheck,
      color: 'text-green-700',
      bgColor: 'bg-green-50'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="card">
      <div className={`${config.bgColor} px-4 py-3 flex items-center justify-between border-b border-gray-200`}>
        <div className="flex items-center gap-2">
          <Icon className={config.color} size={18} />
          <span className={`font-semibold ${config.color}`}>
            {config.title}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.color} ${config.bgColor}`}>
          {tasks.length}
        </span>
      </div>
      <div className="p-4 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            employees={employees}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
            canManage={canManage}
            currentUser={currentUser}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Icon size={48} className="mx-auto mb-2" />
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, employees, onStatusChange, onEdit, onDelete, canManage, currentUser }) {
  const priorityConfig = {
    low: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    urgent: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
  };

  const priority = priorityConfig[task.priority];
  const assignedEmployee = employees.find(e => e.id === task.assigned_to_id);
  const isMyTask = task.assigned_to_id === currentUser?.id;

  return (
    <div className="card-hover bg-white border border-gray-200 rounded-lg p-4 transition-smooth">
      {/* Task Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex-1 line-clamp-2">{task.title}</h3>
        {isMyTask && (
          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
            My Task
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${priority.bg} ${priority.text} ${priority.border}`}>
          {task.priority.toUpperCase()}
        </span>
        {task.due_date && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300 font-medium flex items-center gap-1">
            <FiClock size={12} />
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Project & Assignee */}
      <div className="space-y-2 mb-3 pb-3 border-b border-gray-200">
        {task.project_name && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <FiFolder size={12} />
            {task.project_name}
          </div>
        )}
        {assignedEmployee && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
              <FiUser className="text-white" size={12} />
            </div>
            <span className="text-xs text-gray-700 font-medium">
              {assignedEmployee.first_name} {assignedEmployee.last_name}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {task.status !== 'completed' && (isMyTask || canManage) && (
          <button
            onClick={() => onStatusChange(task.id, 
              task.status === 'todo' ? 'in_progress' : 'completed'
            )}
            className="flex-1 gradient-success text-white px-3 py-2 rounded-lg transition hover-scale text-sm font-medium flex items-center justify-center gap-1"
          >
            <FiCheck size={14} />
            {task.status === 'todo' ? 'Start' : 'Complete'}
          </button>
        )}
        {canManage && (
          <>
            <button
              onClick={() => onEdit(task)}
              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-fast"
              title="Edit"
            >
              <FiEdit size={14} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-fast"
              title="Delete"
            >
              <FiTrash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Missing FiFolder import, add it at the top
import { FiFolder } from 'react-icons/fi';