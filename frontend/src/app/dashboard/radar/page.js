'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import RadarView from '@/views/RadarView';

export default function RadarPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60">
      <Navbar />
      <div className="flex-1">
        <RadarView />
      </div>
    </div>
  );
}
