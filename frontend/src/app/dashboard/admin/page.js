'use client';

import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AdminView from '@/views/AdminView';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login?role=admin');
      } else if (user.role.toLowerCase() !== 'admin') {
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role.toLowerCase() !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <AdminView />
      </main>
    </div>
  );
}
