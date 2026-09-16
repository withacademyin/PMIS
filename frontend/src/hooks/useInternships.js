import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function useInternships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchInternships = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await api.getInternships();
      if (res.success) {
        setInternships(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load internships');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  return { internships, loading, error, setError, fetchInternships };
}
