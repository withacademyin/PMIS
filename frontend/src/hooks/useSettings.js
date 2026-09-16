import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useSettings() {
  const [settings, setSettings] = useState({
    allowedColleges: [],
    allowedCourses: [],
    allowedEmailDomains: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSystemSettings();
      if (res.success && res.data) {
        setSettings({
          allowedColleges: res.data.allowedColleges || [],
          allowedCourses: res.data.allowedCourses || [],
          allowedEmailDomains: res.data.allowedEmailDomains || [],
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async (newSettings) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await api.updateSystemSettings(newSettings);
      if (res.success && res.data) {
        setSettings({
          allowedColleges: res.data.allowedColleges || [],
          allowedCourses: res.data.allowedCourses || [],
          allowedEmailDomains: res.data.allowedEmailDomains || [],
        });
        return true;
      }
      throw new Error('Failed to save settings.');
    } catch (err) {
      setError(err.message || 'Could not update settings.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    loading,
    error,
    isSaving,
    fetchSettings,
    saveSettings,
  };
}
