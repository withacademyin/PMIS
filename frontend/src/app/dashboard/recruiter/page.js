'use client';

import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import RecruiterView from '@/views/RecruiterView';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function RecruiterDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login?role=recruiter');
      } else if (user.role.toLowerCase() !== 'recruiter') {
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role.toLowerCase() !== 'recruiter') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <RecruiterView />
      </main>
    </div>
  );
}
