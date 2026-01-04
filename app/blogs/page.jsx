'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { blogAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiFileText, FiEye } from 'react-icons/fi';

export default function BlogsPage() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
  });

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const response = await blogAPI.getAll();
      setBlogs(response.data);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBlog) {
        await blogAPI.update(editingBlog.id, formData);
      } else {
        await blogAPI.create(formData);
      }
      setShowModal(false);
      setEditingBlog(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
      });
      loadBlogs();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save blog');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await blogAPI.updateStatus(id, status);
      loadBlogs();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this blog?')) {
      try {
        await blogAPI.delete(id);
        loadBlogs();
      } catch (error) {
        alert('Failed to delete blog');
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
              <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
              <p className="text-gray-600 mt-2">Manage blog posts and content</p>
            </div>
            {canManage && (
              <button
                onClick={() => {
                  setEditingBlog(null);
                  setShowModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition"
              >
                <FiPlus /> New Blog
              </button>
            )}
          </div>

          {blogs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FiFileText className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No blogs yet</h3>
              <p className="text-gray-600">Create your first blog post</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  onEdit={() => {
                    setEditingBlog(blog);
                    setFormData({
                      title: blog.title,
                      slug: blog.slug,
                      content: blog.content,
                      excerpt: blog.excerpt || '',
                    });
                    setShowModal(true);
                  }}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  canManage={canManage}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Blog Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingBlog ? 'Edit Blog' : 'New Blog'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editingBlog}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  rows="10"
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                >
                  {editingBlog ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBlog(null);
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

function BlogCard({ blog, onEdit, onDelete, onStatusChange, canManage }) {
  const statusColors = {
    draft: 'bg-gray-200 text-gray-800',
    review: 'bg-yellow-200 text-yellow-800',
    published: 'bg-green-200 text-green-800',
    archived: 'bg-red-200 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-3">
        <FiFileText className="text-blue-600" size={24} />
        <span className={`text-xs px-3 py-1 rounded-full ${statusColors[blog.status]}`}>
          {blog.status.toUpperCase()}
        </span>
      </div>
      
      <h3 className="font-bold text-gray-900 mb-2">{blog.title}</h3>
      
      {blog.excerpt && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{blog.excerpt}</p>
      )}
      
      <div className="text-xs text-gray-500 mb-4">
        By {blog.author_name} • {new Date(blog.created_at).toLocaleDateString()}
      </div>
      
      {canManage && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => onEdit(blog)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <FiEdit size={16} /> Edit
          </button>
          {blog.status === 'draft' && (
            <button
              onClick={() => onStatusChange(blog.id, 'review')}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg transition"
            >
              Review
            </button>
          )}
          {blog.status === 'review' && user?.role !== 'content_editor' && (
            <button
              onClick={() => onStatusChange(blog.id, 'published')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition"
            >
              Publish
            </button>
          )}
          <button
            onClick={() => onDelete(blog.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            <FiTrash2 size={16}
            />
</button>
</div>
)}
</div>
);
}