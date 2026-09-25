'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Building2, Briefcase, ChevronDown, Loader2, RefreshCw, Users } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SIDEBAR_ITEMS = [
  { id: 'requirements', icon: Briefcase, label: 'Work Requirements' },
  { id: 'itis', icon: Building2, label: 'ITI Network' },
  { id: 'shortlists', icon: Users, label: 'Shortlisted Workers' },
];

export function OfficerView() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('itis');
  const [requirements, setRequirements] = useState([]);
  const [itis, setItis] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [recommendations, setRecommendations] = useState({});
  const [workers, setWorkers] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState({});
  const [error, setError] = useState('');
  const [job, setJob] = useState({ title: '', description: '', requiredTrade: '' });
  const [postingJob, setPostingJob] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const reqRes = await api.getRequirements();
        if (reqRes.success) setRequirements(reqRes.data || []);
        
        const shortRes = await api.getShortlists();
        if (shortRes.success) setShortlists(shortRes.data || []);
        const itiRes = await api.getITIs();
        if (itiRes.success) setItis(itiRes.itis || []);
      } catch (err) {
        setError(err.message || 'Unable to load officer data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const matchITIs = async (requirement) => {
    setWorking((previous) => ({ ...previous, [requirement.id]: true }));
    setError('');
    try {
      const result = await api.matchRequirementToITIs(requirement.id);
      if (result.success) setRecommendations((previous) => ({ ...previous, [requirement.id]: result.data || [] }));
      else setError(result.message || 'Unable to match ITIs');
    } catch (err) {
      setError(err.message || 'Unable to match ITIs');
    } finally {
      setWorking((previous) => ({ ...previous, [requirement.id]: false }));
    }
  };

  const loadRecommendations = async (requirement) => {
    try {
      const result = await api.getRequirementITIs(requirement.id);
      if (result.success) setRecommendations((previous) => ({ ...previous, [requirement.id]: result.data || [] }));
    } catch (err) {
      setError(err.message || 'Unable to load ITI recommendations');
    }
  };

  const toggleWorkers = async (recommendation, requirement) => {
    const key = recommendation.itiId;
    if (workers[key]) {
      setWorkers((previous) => ({ ...previous, [key]: null }));
      return;
    }
    setWorking((previous) => ({ ...previous, [key]: true }));
    try {
      const result = await api.getITIWorkers(key, requirement.requiredTrade);
      if (result.success) setWorkers((previous) => ({ ...previous, [key]: result.data || [] }));
    } catch (err) {
      setError(err.message || 'Unable to load ITI workers');
    } finally {
      setWorking((previous) => ({ ...previous, [key]: false }));
    }
  };

  const postJob = async (event) => {
    event.preventDefault();
    setPostingJob(true);
    setError('');
    try {
      const result = await api.createRequirement(job);
      if (!result.success) throw new Error(result.message || 'Unable to post job');
      const postedJob = result.data;
      setRequirements((previous) => [postedJob, ...previous]);
      setJob({ title: '', description: '', requiredTrade: '' });
      await matchITIs(postedJob);
      setActiveNav('requirements');
    } catch (err) {
      setError(err.message || 'Unable to post job');
    } finally {
      setPostingJob(false);
    }
  };

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
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ITI network matching</h1>
            <p className="mt-1 text-sm text-slate-500">Match work requirements with ITIs in {user?.officerProfile?.district || 'your district'}.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={loading}>
            <RefreshCw className={loading ? 'mr-2 h-3.5 w-3.5 animate-spin' : 'mr-2 h-3.5 w-3.5'} />Refresh
          </Button>
        </div>

        {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        
        {activeNav === 'requirements' && (
          <div className="space-y-4">
            <form onSubmit={postJob} className="border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="font-semibold text-slate-900">Post a job</h2>
                <p className="mt-1 text-sm text-slate-500">We will find district ITIs that teach the required trade.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input required placeholder="Job title" value={job.title} onChange={(event) => setJob({ ...job, title: event.target.value })} />
                <Input required placeholder="Trade, e.g. Electrician or Fitter" value={job.requiredTrade} onChange={(event) => setJob({ ...job, requiredTrade: event.target.value })} />
              </div>
              <textarea required className="mt-3 min-h-24 w-full border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" placeholder="Describe the work, skills, and hiring need" value={job.description} onChange={(event) => setJob({ ...job, description: event.target.value })} />
              <div className="mt-3 flex justify-end">
                <Button type="submit" disabled={postingJob}>{postingJob ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Briefcase className="mr-2 h-3.5 w-3.5" />}Post job and find ITIs</Button>
              </div>
            </form>
            {loading ? <p className="text-sm text-slate-400">Loading requirements...</p> : requirements.length === 0 ? (
              <div className="border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">No work requirements created yet.</div>
            ) : (
              requirements.map((requirement) => {
                const matches = recommendations[requirement.id] || [];
                return (
                  <section key={requirement.id} className="border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-semibold text-slate-900">{requirement.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{requirement.description}</p>
                        <span className="mt-3 inline-block border border-slate-200 px-2 py-1 text-xs text-slate-600">Trade: {requirement.requiredTrade}</span>
                      </div>
                      <Button size="sm" onClick={() => matchITIs(requirement)} disabled={working[requirement.id]}>
                        {working[requirement.id] ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Building2 className="mr-2 h-3.5 w-3.5" />}
                        Match ITIs
                      </Button>
                    </div>

                    {matches.length > 0 && (
                      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recommended ITIs</p>
                        {matches.map((recommendation) => (
                          <div key={recommendation.id || recommendation.itiId} className="border border-slate-200 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">{recommendation.iti?.name || 'ITI'}</p>
                                <p className="text-xs text-slate-500">{recommendation.iti?.code} · {recommendation.iti?.district} · {recommendation.iti?._count?.workers || 0} registered workers</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => toggleWorkers(recommendation, requirement)} disabled={working[recommendation.itiId]}>
                                {working[recommendation.itiId] ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="mr-1.5 h-3.5 w-3.5" />}
                                Workers
                              </Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {(recommendation.reasons || []).map((reason) => <span key={reason} className="border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">{reason}</span>)}
                            </div>
                            {workers[recommendation.itiId] && (
                              <div className="mt-3 border-t border-slate-100 pt-3">
                                {workers[recommendation.itiId].length === 0 ? <p className="text-xs text-slate-400">No workers registered for this trade at this ITI.</p> : workers[recommendation.itiId].map((worker) => (
                                  <div key={worker.id} className="flex items-center justify-between border-b border-slate-50 py-2 text-sm last:border-0">
                                    <span className="text-slate-700">{worker.fullName}</span>
                                    <span className="text-xs text-slate-500">{worker.isVerified ? 'Verified' : 'Pending'} · {worker.availabilityStatus}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {!matches.length && recommendations[requirement.id] && <p className="mt-4 text-sm text-slate-400">No active ITIs found in the assigned district.</p>}
                    {!recommendations[requirement.id] && <button className="mt-4 text-xs text-slate-400 underline" onClick={() => loadRecommendations(requirement)}>Load previous matches</button>}
                  </section>
                );
              })
            )}
          </div>
        )}
        {activeNav === 'itis' && (
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{user?.officerProfile?.district || 'District'} ITI Network</h2>
                <p className="mt-1 text-sm text-slate-500">{itis.length} registered institutes available for requirement matching.</p>
              </div>
              <Building2 className="h-5 w-5 text-slate-400" />
            </div>
            {loading ? <p className="text-sm text-slate-400">Loading ITIs...</p> : itis.length === 0 ? (
              <p className="text-sm text-slate-400">No ITIs are registered in this district.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {itis.map((iti) => (
                  <div key={iti.id} className="border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{iti.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{iti.code || 'No code'} · {iti.state}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-500">{iti._count?.workers || 0} workers</span>
                    </div>
                    {iti.description && <p className="mt-2 line-clamp-2 whitespace-pre-line text-xs text-slate-400">{iti.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeNav === 'shortlists' && (
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Shortlisted Workers</h2>
            {shortlists.length === 0 ? (
              <p className="text-sm text-slate-400">No workers shortlisted yet. Select an ITI first, then shortlist workers.</p>
            ) : (
              <div className="grid gap-4">
                {shortlists.map(short => (
                  <div key={short.id} className="border-b border-slate-100 py-3">
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
