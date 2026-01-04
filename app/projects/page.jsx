'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { projectAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiFolder } from 'react-icons/fi';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'planning',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await projectAPI.update(editingProject.id, formData);
      } else {
        await projectAPI.create(formData);
      }
      setShowModal(false);
      setEditingProject(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        status: 'planning',
        start_date: '',
        end_date: ''
      });
      loadProjects();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save project');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await projectAPI.delete(id);
        loadProjects();
      } catch (error) {
        alert('Failed to delete project');
      }
    }
  };

  const canManage = user?.role !== 'employee';

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
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-2">Manage your projects</p>
            </div>
            {canManage && (
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition"
              >
                <FiPlus /> New Project
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FiFolder className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => {
                    setEditingProject(project);
                    setFormData({
                      name: project.name,
                      code: project.code,
                      description: project.description || '',
                      status: project.status,
                      start_date: project.start_date || '',
                      end_date: project.end_date || ''
                    });
                    setShowModal(true);
                  }}
                  onDelete={handleDelete}
                  canManage={canManage}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Project Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!!editingProject}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                >
                  {editingProject ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition"
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

function ProjectCard({ project, onEdit, onDelete, canManage }) {
  const statusColors = {
    planning: 'bg-gray-200 text-gray-800',
    active: 'bg-green-200 text-green-800',
    on_hold: 'bg-yellow-200 text-yellow-800',
    completed: 'bg-blue-200 text-blue-800',
    cancelled: 'bg-red-200 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FiFolder className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{project.name}</h3>
            <p className="text-sm text-gray-600">{project.code}</p>
          </div>
        </div>
      </div>
      
      {project.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs px-3 py-1 rounded-full ${statusColors[project.status]}`}>
          {project.status.replace('_', ' ').toUpperCase()}
        </span>
         {project.manager_name && (<span className="text-xs text-gray-600">
        PM: {project.manager_name}
      </span>
    )}
  </div>
  
  {project.start_date && (
    <p className="text-xs text-gray-500 mb-4">
      {project.start_date} {project.end_date && `- ${project.end_date}`}
    </p>
  )}
  
  {canManage && (
    <div className="flex gap-2 pt-4 border-t border-gray-200">
      <button
        onClick={() => onEdit(project)}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
      >
        <FiEdit size={16} /> Edit
      </button>
      <button
        onClick={() => onDelete(project.id)}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
      >
        <FiTrash2 size={16} />
      </button>
    </div>
  )}
</div>
);
}

