'use client';

import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import RadarView from '@/views/RadarView';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function OfficerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const role = user.role?.toLowerCase();
      if (role !== 'officer' && role !== 'admin') {
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60">
      <Navbar />
      <main className="flex-1">
        <RadarView />
      </main>
    </div>
  );
}
