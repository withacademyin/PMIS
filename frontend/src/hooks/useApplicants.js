import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useApplicants(jobId) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchApplicants = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      let res;
      if (id === 'all') {
        res = await api.getAllApplicants();
      } else {
        res = await api.getJobApplicants(id);
      }
      if (res.success && Array.isArray(res.data)) setApplicants(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load applicant pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (jobId) fetchApplicants(jobId); }, [jobId]);

  const handleStatusChange = async (applicationId, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [applicationId]: true }));
    setError(null);
    try {
      const res = await api.updateApplicationStatus(applicationId, { status: newStatus });
      if (res.success && res.data) {
        setApplicants((prev) => prev.map((app) => (app.id === applicationId ? { ...app, ...res.data } : app)));
      }
    } catch (err) {
      setError(err.message || `Failed to update status to ${newStatus}.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const updateApplicant = (updatedApp) => {
    setApplicants((prev) => prev.map((app) => (app.id === updatedApp.id ? { ...app, ...updatedApp } : app)));
  };

  return { applicants, loading, error, setError, actionLoading, fetchApplicants, handleStatusChange, updateApplicant };
}

export default useApplicants;
