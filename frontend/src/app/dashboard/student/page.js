'use client';

import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LearnerView from '@/views/LearnerView';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login?role=learner');
      } else if (user.role.toLowerCase() !== 'learner' && user.role.toLowerCase() !== 'student') {
        router.replace('/');
      } else if (!user.profileCompleted) {
        router.replace('/onboarding/student');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role.toLowerCase() !== 'learner' && user.role.toLowerCase() !== 'student') || !user.profileCompleted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <LearnerView />
      </main>
    </div>
  );
}
