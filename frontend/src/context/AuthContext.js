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
  if (r === 'worker') return 'worker';
  if (r === 'officer') return 'officer';
  if (r === 'admin') return 'admin';
  return 'worker'; // fallback
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
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        localStorage.removeItem('hiring_portal_user');
        localStorage.removeItem('hiring_portal_token');
      }
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
      if ((role === 'worker') && !data.user.profileCompleted) {
        router.push('/onboarding/worker');
      } else {
        router.push(`/dashboard/${getDashboardRoute(data.user.role)}`);
      }
    }
    return data;
  };

  const signup = async (payload) => {
    // Accept either an object or arguments (name, email, password, role)
    const registerData = typeof payload === 'object' && !payload.preventDefault ? payload : {
      name: arguments[0],
      email: arguments[1],
      password: arguments[2],
      role: arguments[3],
    };

    const data = await api.register(registerData);
    if (data.success) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('hiring_portal_token', data.token);
      localStorage.setItem('hiring_portal_user', JSON.stringify(data.user));

      const userRole = data.user.role?.toLowerCase();
      if ((userRole === 'worker') && !data.user.profileCompleted) {
        router.push('/onboarding/worker');
      } else {
        router.push(`/dashboard/${getDashboardRoute(data.user.role)}`);
      }
    }
    return data;
  };

  const completeOnboarding = (data) => {
    const updatedUser = {
      ...user,
      profileCompleted: true,
      workerProfile: {
        ...(user.workerProfile || {}),
        fullName: user.name || user.email?.split('@')[0] || 'User',
        trade: data.trade || user.workerProfile?.trade || 'General',
        skills: data.skills ? data.skills.split(',').map(s => s.trim()) : [],
        isVerified: true,
      },
    };
    setUser(updatedUser);
    localStorage.setItem('hiring_portal_user', JSON.stringify(updatedUser));
    router.push(`/dashboard/${getDashboardRoute(updatedUser.role)}`);
  };

  const updateProfile = (data) => {
    const updatedUser = {
      ...user,
      profileCompleted: true,
      workerProfile: {
        ...(user.workerProfile || {}),
        ...data,
      },
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
