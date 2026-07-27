import React, { useState, useEffect } from 'react';
import { settingsApi } from '../../api/settings';
import { Save, RefreshCw, Shield, Bell, DollarSign, Clock, Database, Globe } from 'lucide-react';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    stationDefaults: { openingTime: '08:00', closingTime: '18:00', defaultProductType: 'PMS' },
    pricing: { pmsPrice: 225, agoPrice: 185, lpgPrice: 320, dpkPrice: 150 },
    notifications: { lowStockThreshold: 30, criticalStockThreshold: 15, deliveryReminderHours: 24, autoApproveExpenseLimit: 50000 },
    security: { maxLoginAttempts: 5, sessionTimeoutMinutes: 60, requireTwoFactor: false, passwordExpiryDays: 90 },
    integration: { enableEmail: true, enableSMS: false, enablePushNotifications: true },
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try { setLoading(true); const data = await settingsApi.getSystemSettings(); if (data) setSettings(data); }
    catch (error) { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try { setSaving(true); await settingsApi.updateSystemSettings(settings); toast.success('Settings saved successfully'); }
    catch (error) { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500">Configure global system parameters</p></div>
        <div className="flex gap-3">
          <button onClick={fetchSettings} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /> Reset</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 font-medium disabled:opacity-50"><Save size={18} /> {saving ? 'Saving...' : 'Save All'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Clock size={20} className="text-gray-400" /> Station Defaults</h3>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700">Opening Time</label><input type="time" value={settings.stationDefaults.openingTime} onChange={(e) => setSettings({ ...settings, stationDefaults: { ...settings.stationDefaults, openingTime: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Closing Time</label><input type="time" value={settings.stationDefaults.closingTime} onChange={(e) => setSettings({ ...settings, stationDefaults: { ...settings.stationDefaults, closingTime: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700">Default Product Type</label><select value={settings.stationDefaults.defaultProductType} onChange={(e) => setSettings({ ...settings, stationDefaults: { ...settings.stationDefaults, defaultProductType: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="PMS">PMS (Premium)</option><option value="AGO">AGO (Diesel)</option><option value="DPK">DPK (Kerosene)</option><option value="LPG">LPG (Gas)</option></select></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign size={20} className="text-gray-400" /> Pricing</h3>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700">PMS Price (₦)</label><input type="number" value={settings.pricing.pmsPrice} onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, pmsPrice: parseFloat(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">AGO Price (₦)</label><input type="number" value={settings.pricing.agoPrice} onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, agoPrice: parseFloat(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">LPG Price (₦)</label><input type="number" value={settings.pricing.lpgPrice} onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, lpgPrice: parseFloat(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">DPK Price (₦)</label><input type="number" value={settings.pricing.dpkPrice} onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, dpkPrice: parseFloat(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Bell size={20} className="text-gray-400" /> Notifications</h3>
          <div className="mt-4 space-y-4">
            <div><label className="block text-sm font-medium text-gray-700">Low Stock Threshold (%)</label><input type="number" value={settings.notifications.lowStockThreshold} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, lowStockThreshold: parseInt(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Critical Stock Threshold (%)</label><input type="number" value={settings.notifications.criticalStockThreshold} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, criticalStockThreshold: parseInt(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Delivery Reminder Hours</label><input type="number" value={settings.notifications.deliveryReminderHours} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, deliveryReminderHours: parseInt(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Auto-Approve Expense Limit (₦)</label><input type="number" value={settings.notifications.autoApproveExpenseLimit} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, autoApproveExpenseLimit: parseFloat(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Shield size={20} className="text-gray-400" /> Security</h3>
          <div className="mt-4 space-y-4">
            <div><label className="block text-sm font-medium text-gray-700">Max Login Attempts</label><input type="number" value={settings.security.maxLoginAttempts} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Session Timeout (Minutes)</label><input type="number" value={settings.security.sessionTimeoutMinutes} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTimeoutMinutes: parseInt(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Password Expiry (Days)</label><input type="number" value={settings.security.passwordExpiryDays} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, passwordExpiryDays: parseInt(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={settings.security.requireTwoFactor} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, requireTwoFactor: e.target.checked } })} className="rounded text-petroleum-seagreen" /><label className="text-sm font-medium text-gray-700">Require Two-Factor Authentication</label></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Globe size={20} className="text-gray-400" /> Integrations</h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2"><input type="checkbox" checked={settings.integration.enableEmail} onChange={(e) => setSettings({ ...settings, integration: { ...settings.integration, enableEmail: e.target.checked } })} className="rounded text-petroleum-seagreen" /><label className="text-sm font-medium text-gray-700">Email Notifications</label></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={settings.integration.enableSMS} onChange={(e) => setSettings({ ...settings, integration: { ...settings.integration, enableSMS: e.target.checked } })} className="rounded text-petroleum-seagreen" /><label className="text-sm font-medium text-gray-700">SMS Alerts</label></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={settings.integration.enablePushNotifications} onChange={(e) => setSettings({ ...settings, integration: { ...settings.integration, enablePushNotifications: e.target.checked } })} className="rounded text-petroleum-seagreen" /><label className="text-sm font-medium text-gray-700">Push Notifications</label></div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;