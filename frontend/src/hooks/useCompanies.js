import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';

export function useCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCompanies();
      if (res.success) {
        setCompanies(res.companies || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const createCompany = async (data) => {
    try {
      const res = await api.createCompany(data);
      if (res.success) {
        await fetchCompanies();
        return { success: true, company: res.company };
      }
      return { success: false, message: res.message || 'Failed to create company' };
    } catch (err) {
      return { success: false, message: err.message || 'Error creating company' };
    }
  };

  const deleteCompany = async (id) => {
    try {
      const res = await api.deleteCompany(id);
      if (res.success) {
        setCompanies((prev) => prev.filter((c) => c.id !== id));
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to delete company' };
    } catch (err) {
      return { success: false, message: err.message || 'Error deleting company' };
    }
  };

  return {
    companies,
    loading,
    error,
    setError,
    fetchCompanies,
    createCompany,
    deleteCompany
  };
}
