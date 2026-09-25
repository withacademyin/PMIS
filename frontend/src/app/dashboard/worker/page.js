'use client';

import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import WorkerView from '@/views/WorkerView';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function WorkerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login?role=worker');
      } else if (user.role.toLowerCase() !== 'worker') {
        router.replace('/');
      } else if (!user.profileCompleted) {
        router.replace('/onboarding/worker');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role.toLowerCase() !== 'worker' || !user.profileCompleted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <WorkerView />
      </main>
    </div>
  );
}
