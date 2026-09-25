'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Briefcase, FileText, Loader2, Edit2, CheckCircle2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SIDEBAR_ITEMS = [
  { id: 'profile', icon: FileText, label: 'My Profile' },
  { id: 'opportunities', icon: Briefcase, label: 'Opportunities' },
];

export function WorkerView() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const profile = user?.workerProfile;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    trade: '',
    experienceYears: 0,
    availabilityStatus: '',
  });

  useEffect(() => {
    if (profile) {
      setEditForm({
        fullName: profile.fullName || '',
        trade: profile.trade || '',
        experienceYears: profile.experienceYears || 0,
        availabilityStatus: profile.availabilityStatus || 'AVAILABLE',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        fullName: editForm.fullName,
        trade: editForm.trade,
        experienceYears: parseInt(editForm.experienceYears, 10) || 0,
        availabilityStatus: editForm.availabilityStatus,
      };
      const res = await api.updateWorkerProfile(profile.id, payload);
      if (res.success) {
        updateProfile(payload); // Updates AuthContext
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      role="Worker"
      sidebarItems={SIDEBAR_ITEMS}
      activeNav={activeTab}
      onNavChange={setActiveTab}
      profileSection={
        <>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
            <span className="text-[10px] font-semibold text-slate-500">
              {(profile?.fullName || 'W').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-800 truncate">{profile?.fullName || 'Worker'}</p>
          <p className="text-[10px] text-slate-500 font-medium truncate">{profile?.trade || '—'}</p>
        </>
      }
    >
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold">Welcome, {profile?.fullName || 'Worker'}!</h1>
        <p className="text-slate-500">Your ITI Portal worker dashboard is being updated to the new architecture.</p>
        
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-lg border shadow-sm relative">
            {!isEditing ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-4 right-4 text-slate-500 hover:text-indigo-600"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            ) : (
              <div className="absolute top-4 right-4 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Save
                </Button>
              </div>
            )}
            
            <h2 className="text-lg font-semibold mb-6">Your Profile Details</h2>
            
            {isEditing ? (
              <div className="grid gap-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <Input 
                    value={editForm.fullName} 
                    onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Trade</label>
                  <Input 
                    value={editForm.trade} 
                    onChange={e => setEditForm({...editForm, trade: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Experience (Years)</label>
                  <Input 
                    type="number"
                    value={editForm.experienceYears} 
                    onChange={e => setEditForm({...editForm, experienceYears: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Availability</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    value={editForm.availabilityStatus}
                    onChange={e => setEditForm({...editForm, availabilityStatus: e.target.value})}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ASSIGNED">Assigned / Employed</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <p><strong>Name:</strong> {profile?.fullName}</p>
                <p><strong>Trade:</strong> {profile?.trade}</p>
                <p><strong>Experience:</strong> {profile?.experienceYears} years</p>
                <p>
                  <strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${profile?.availabilityStatus === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {profile?.availabilityStatus}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="bg-white p-6 rounded-lg border shadow-sm flex items-center justify-center h-48">
            <p className="text-slate-400">Opportunities matching your trade will appear here.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default WorkerView;
