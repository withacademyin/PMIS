import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';

export function useMyCompany() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchMyCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMyCompany();
      if (res.success) {
        setCompany(res.company);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch company details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCompany();
  }, [fetchMyCompany]);

  const updateMyCompany = async (data) => {
    try {
      const res = await api.updateMyCompany(data);
      if (res.success) {
        setCompany(res.company);
        return { success: true, company: res.company };
      }
      return { success: false, message: res.message || 'Failed to update company' };
    } catch (err) {
      return { success: false, message: err.message || 'Error updating company' };
    }
  };

  return {
    company,
    loading,
    error,
    setError,
    fetchMyCompany,
    updateMyCompany,
  };
}
