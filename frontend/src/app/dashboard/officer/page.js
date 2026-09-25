'use client';

import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import OfficerView from '@/views/OfficerView';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function OfficerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login?role=officer');
      } else if (user.role.toLowerCase() !== 'officer') {
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role.toLowerCase() !== 'officer') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <OfficerView />
      </main>
    </div>
  );
}
