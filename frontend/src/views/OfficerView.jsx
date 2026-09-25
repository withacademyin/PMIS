'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Users, Briefcase } from 'lucide-react';
import api from '@/lib/api';

const SIDEBAR_ITEMS = [
  { id: 'requirements', icon: Briefcase, label: 'Work Requirements' },
  { id: 'shortlists', icon: Users, label: 'Shortlisted Workers' },
];

export function OfficerView() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('requirements');
  const [requirements, setRequirements] = useState([]);
  const [shortlists, setShortlists] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reqRes = await api.getRequirements();
        if (reqRes.success) setRequirements(reqRes.data);
        
        const shortRes = await api.getShortlists();
        if (shortRes.success) setShortlists(shortRes.data);
      } catch (err) {
        console.error('Error fetching officer data', err);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout
      role="Nodal Officer"
      sidebarItems={SIDEBAR_ITEMS}
      activeNav={activeNav}
      onNavChange={setActiveNav}
      profileSection={
        <>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
            <span className="text-[10px] font-semibold text-slate-500">O</span>
          </div>
          <p className="text-xs font-medium text-slate-800 truncate">{user?.officerProfile?.name || 'Officer'}</p>
          <p className="text-[10px] text-slate-500 font-medium truncate">{user?.officerProfile?.district || '—'}</p>
        </>
      }
    >
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold">Nodal Officer Dashboard</h1>
        <p className="text-slate-500">Manage work requirements and shortlisted ITI workers.</p>
        
        {activeNav === 'requirements' && (
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Your Work Requirements</h2>
            {requirements.length === 0 ? (
              <p className="text-slate-400">No work requirements created yet.</p>
            ) : (
              <div className="grid gap-4">
                {requirements.map(req => (
                  <div key={req.id} className="p-4 border rounded">
                    <h3 className="font-semibold">{req.title}</h3>
                    <p className="text-sm text-slate-500">Trade: {req.requiredTrade}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeNav === 'shortlists' && (
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Shortlisted Workers</h2>
            {shortlists.length === 0 ? (
              <p className="text-slate-400">No workers shortlisted yet.</p>
            ) : (
              <div className="grid gap-4">
                {shortlists.map(short => (
                  <div key={short.id} className="p-4 border rounded">
                    <h3 className="font-semibold">{short.worker?.fullName}</h3>
                    <p className="text-sm text-slate-500">Status: {short.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default OfficerView;
