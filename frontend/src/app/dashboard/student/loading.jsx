import React from 'react';
import Navbar from '@/components/Navbar';
import { MorphingInfinity } from '@/components/ui/morphing-infinity';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center py-6 mb-4">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur border border-slate-200 shadow-xs px-5 py-2.5 rounded-full">
              <MorphingInfinity className="w-6 h-6 text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Loading Student Dashboard...</span>
            </div>
          </div>
          <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
                <div className="flex-1 space-y-3 mt-1">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  <div className="flex gap-2 mt-2">
                    <div className="h-5 w-16 bg-slate-200 rounded"></div>
                    <div className="h-5 w-16 bg-slate-200 rounded"></div>
                    <div className="h-5 w-16 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-slate-200 rounded"></div>
                <div className="h-10 w-24 bg-slate-200 rounded"></div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Main Content Area */}
              <div className="flex-1 space-y-6">
                <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="bg-white border border-slate-200 rounded-xl p-5 h-48 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        <div className="flex gap-2">
                          <div className="h-5 w-20 bg-slate-200 rounded"></div>
                          <div className="h-5 w-20 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                      <div className="h-10 bg-slate-200 rounded w-full mt-4"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Area */}
              <div className="w-full md:w-80 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-5 h-64 space-y-4">
                  <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
