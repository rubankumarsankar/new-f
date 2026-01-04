'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { settingsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FiSettings, FiSave } from 'react-icons/fi';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      await settingsAPI.update(key, value);
      alert('Setting updated successfully');
      loadSettings();
    } catch (error) {
      alert('Failed to update setting');
    } finally {
      setSaving(false);
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

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FiSettings /> Settings
            </h1>
            <p className="text-gray-600 mt-2">Configure system settings</p>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedSettings).map(([category, categorySettings]) => (
              <div key={category} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 capitalize">
                  {category} Settings
                </h2>
                <div className="space-y-4">
                  {categorySettings.map((setting) => (
                    <SettingItem
                      key={setting.id}
                      setting={setting}
                      onSave={handleSave}
                      saving={saving}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingItem({ setting, onSave, saving }) {
  const [value, setValue] = useState(setting.value);

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-900">
          {setting.key.replace(/_/g, ' ').toUpperCase()}
        </label>
        {setting.description && (
          <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 w-48"
        />
        <button
          onClick={() => onSave(setting.key, value)}
          disabled={saving || value === setting.value}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FiSave size={16} />
          Save
        </button>
      </div>
    </div>
  );
}