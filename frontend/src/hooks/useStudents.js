import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggleLoading, setToggleLoading] = useState({});

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStudents();
      if (res.success && Array.isArray(res.data)) {
        setStudents(res.data);
      } else {
        throw new Error('Failed to load students.');
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleToggleVerification = async (student) => {
    const nextStatus = !student.isVerified;
    setToggleLoading((prev) => ({ ...prev, [student.id]: true }));
    setError(null);
    try {
      const res = await api.verifyStudent(student.id, nextStatus);
      if (res.success && res.data) {
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, isVerified: res.data.isVerified } : s))
        );
      } else {
        throw new Error('Verification update failed.');
      }
    } catch (err) {
      setError(err.message || 'Could not update student verification.');
    } finally {
      setToggleLoading((prev) => ({ ...prev, [student.id]: false }));
    }
  };

  return { students, loading, error, setError, toggleLoading, fetchStudents, handleToggleVerification };
}

export default useStudents;
