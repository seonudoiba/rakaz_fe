import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { settingsApi } from '../../api/settings';
import {
  Save, RefreshCw, Globe, Moon, Sun,
  Bell, Mail, Lock, User, Shield,
  Smartphone, Monitor, Database
} from 'lucide-react';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const GeneralSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    privacy: {
      shareAnalytics: true,
      showOnlineStatus: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsApi.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
          <p className="text-gray-500">Customize your application preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appearance */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    settings.theme === 'light'
                      ? 'border-petroleum-seagreen bg-petroleum-seagreen/10 text-petroleum-seagreen'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Sun size={18} />
                  Light
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    settings.theme === 'dark'
                      ? 'border-petroleum-seagreen bg-petroleum-seagreen/10 text-petroleum-seagreen'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Moon size={18} />
                  Dark
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              >
                <option value="en">English</option>
                <option value="ha">Hausa</option>
                <option value="yo">Yoruba</option>
                <option value="ig">Igbo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              >
                <option value="Africa/Lagos">Africa/Lagos (UTC+1)</option>
                <option value="Africa/Abidjan">Africa/Abidjan (UTC+0)</option>
                <option value="Africa/Cairo">Africa/Cairo (UTC+2)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (UTC+2)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="flex items-center gap-3 w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Shield size={18} className="text-gray-400" />
              <span className="text-sm">Security Settings</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Bell size={18} className="text-gray-400" />
              <span className="text-sm">Notification Preferences</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Database size={18} className="text-gray-400" />
              <span className="text-sm">Data Management</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <User size={18} className="text-gray-400" />
              <span className="text-sm">Profile Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;