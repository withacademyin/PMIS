'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

const AuthContext = createContext();

/**
 * Maps a user role string to the correct dashboard route segment.
 */
function getDashboardRoute(role) {
  const r = role?.toLowerCase();
  if (r === 'learner' || r === 'student') return 'student';
  if (r === 'recruiter') return 'recruiter';
  if (r === 'admin') return 'admin';
  return 'student'; // fallback
}

export function AuthProvider({ children }) {
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read from local storage
    const storedToken = localStorage.getItem('hiring_portal_token');
    const storedUser = localStorage.getItem('hiring_portal_user');
    
    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (data.success) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('hiring_portal_token', data.token);
      localStorage.setItem('hiring_portal_user', JSON.stringify(data.user));

      const role = data.user.role?.toLowerCase();
      if ((role === 'learner' || role === 'student') && !data.user.profileCompleted) {
        router.push('/onboarding/student');
      } else {
        router.push(`/dashboard/${getDashboardRoute(data.user.role)}`);
      }
    }
    return data;
  };

  const signup = async (name, email, password, role) => {
    const data = await api.register({ name, email, password, role });
    if (data.success) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('hiring_portal_token', data.token);
      localStorage.setItem('hiring_portal_user', JSON.stringify(data.user));

      const userRole = data.user.role?.toLowerCase();
      if ((userRole === 'learner' || userRole === 'student') && !data.user.profileCompleted) {
        router.push('/onboarding/student');
      } else {
        router.push(`/dashboard/${getDashboardRoute(data.user.role)}`);
      }
    }
    return data;
  };

  const completeOnboarding = (data) => {
    // Nest the data inside studentProfile so the dashboard can read it
    const updatedUser = {
      ...user,
      profileCompleted: true,
      studentProfile: {
        ...(user.studentProfile || {}),
        fullName: user.name || user.email?.split('@')[0] || 'User',
        college: data.institute || 'University',
        skills: data.skills ? data.skills.split(',').map(s => s.trim()) : [],
        isVerified: true,
        skillScores: data.skillScores || user.studentProfile?.skillScores || {},
        lastAssessmentAt: data.lastAssessmentAt || user.studentProfile?.lastAssessmentAt || null,
      }
    };
    setUser(updatedUser);
    localStorage.setItem('hiring_portal_user', JSON.stringify(updatedUser));
    router.push(`/dashboard/${getDashboardRoute(updatedUser.role)}`);
  };

  const updateProfile = (data) => {
    // Only update memory and local storage, backend is already updated via API
    const updatedUser = {
      ...user,
      profileCompleted: true,
      studentProfile: {
        ...(user.studentProfile || {}),
        fullName: user.name || user.email?.split('@')[0] || 'User',
        college: data.institute || user.studentProfile?.college || 'University',
        skills: data.skills ? data.skills.split(',').map(s => s.trim()) : user.studentProfile?.skills || [],
        isVerified: true,
      }
    };
    setUser(updatedUser);
    localStorage.setItem('hiring_portal_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hiring_portal_user');
    localStorage.removeItem('hiring_portal_token');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, completeOnboarding, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
