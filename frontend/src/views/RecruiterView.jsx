'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase, Calendar, XCircle, Clock, ShieldCheck, AlertCircle,
  ChevronDown, Info, Loader2, Plus, Sparkles, Users, ChevronRight,
  BarChart3, Settings, RefreshCw, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ScheduleModal from '@/components/ScheduleModal';
import api from '@/lib/api';

/* ────────────────────────────────────────────
   Sidebar navigation items
   ──────────────────────────────────────────── */
const sidebarItems = [
  { icon: BarChart3, label: 'Pipeline' },
  { icon: Briefcase, label: 'Jobs' },
  { icon: Users, label: 'Candidates' },
  { icon: Settings, label: 'Settings' },
];

export function RecruiterView() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [activeAppToSchedule, setActiveAppToSchedule] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [viewFeedbackApp, setViewFeedbackApp] = useState(null);
  const [activeNav, setActiveNav] = useState('Pipeline');

  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [newJobForm, setNewJobForm] = useState({ title: '', description: '', requiredSkills: '' });
  const [creatingJob, setCreatingJob] = useState(false);

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { if (selectedJobId) fetchApplicants(selectedJobId); }, [selectedJobId]);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    setError(null);
    try {
      const res = await api.getJobs();
      if (res.success && Array.isArray(res.data)) {
        setJobs(res.data);
        if (res.data.length > 0) setSelectedJobId(res.data[0].id);
      }
    } catch (err) {
      setError(err.message || 'Unable to load job postings.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchApplicants = async (jobId) => {
    setLoadingApplicants(true);
    setError(null);
    try {
      const res = await api.getJobApplicants(jobId);
      if (res.success && Array.isArray(res.data)) setApplicants(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load applicant pipeline.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!user?.recruiterProfile?.id) return;
    setCreatingJob(true);
    setError(null);
    try {
      const payload = {
        title: newJobForm.title,
        description: newJobForm.description,
        recruiterId: user.recruiterProfile.id,
        requiredSkills: newJobForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      };
      const res = await api.createJob(payload);
      if (res.success) {
        setIsCreateJobOpen(false);
        setNewJobForm({ title: '', description: '', requiredSkills: '' });
        fetchJobs();
      }
    } catch (err) {
      setError(err.message || 'Failed to create job posting.');
    } finally {
      setCreatingJob(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [applicationId]: true }));
    setError(null);
    try {
      const res = await api.updateApplicationStatus(applicationId, { status: newStatus });
      if (res.success && res.data) {
        setApplicants((prev) => prev.map((app) => (app.id === applicationId ? { ...app, ...res.data } : app)));
      }
    } catch (err) {
      setError(err.message || `Failed to update status to ${newStatus}.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const handleInterviewScheduled = (updatedApp) => {
    setApplicants((prev) => prev.map((app) => (app.id === updatedApp.id ? { ...app, ...updatedApp } : app)));
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const shortlistedCount = applicants.filter((a) => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW_SCHEDULED' || a.status === 'ACCEPTED').length;
  const companyName = user?.recruiterProfile?.companyName || 'Recruiter';

  /* ──── Status display ──── */
  const statusBadge = (status) => {
    const map = {
      APPLIED: { label: 'Applied', cls: 'text-slate-500 border-slate-200' },
      SHORTLISTED: { label: 'Shortlisted', cls: 'text-slate-700 border-slate-300' },
      INTERVIEW_SCHEDULED: { label: 'Interview', cls: 'text-slate-800 border-slate-400' },
      ACCEPTED: { label: 'Accepted', cls: 'text-emerald-700 border-emerald-200 bg-emerald-50/50' },
      REJECTED: { label: 'Rejected', cls: 'text-slate-400 border-slate-200 line-through' },
    };
    const d = map[status] || { label: status, cls: 'text-slate-500 border-slate-200' };
    return <Badge variant="outline" className={`font-mono text-[10px] uppercase shadow-none ${d.cls}`}>{d.label}</Badge>;
  };

  const scoreBadge = (score) => {
    if (score === null || score === undefined) return <span className="text-[10px] text-slate-300">—</span>;
    return (
      <span className={`font-mono text-[11px] font-semibold ${score >= 80 ? 'text-slate-900' : score >= 50 ? 'text-slate-600' : 'text-slate-400'}`}>
        {score}%
      </span>
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)] overflow-hidden">

      {/* ──── Sidebar ──── */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-slate-200 bg-white pt-6 pb-6 px-3 shrink-0 overflow-y-auto">
        <div className="mb-6 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Recruiter</p>
        </div>

        {/* Company */}
        <div className="px-3 mb-5">
          <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
            <span className="text-[10px] font-bold text-slate-500">{companyName.slice(0, 2).toUpperCase()}</span>
          </div>
          <p className="text-xs font-medium text-slate-800 truncate">{companyName}</p>
          <p className="text-[10px] text-slate-400">{user?.email}</p>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5">
          {sidebarItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className={`group flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] font-medium transition-colors ${
                activeNav === label
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className="w-[15px] h-[15px]" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-3 pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-mono">{jobs.length} active posting{jobs.length !== 1 ? 's' : ''}</p>
        </div>
      </aside>

      {/* ──── Main ──── */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/60">
        <div className="px-8 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Pipeline</h1>
              <p className="text-xs text-slate-400 mt-0.5">Candidate management &amp; hiring workflow</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateJobOpen(true)}
              className="h-7 px-3 text-[11px] bg-slate-900 hover:bg-slate-800 text-white shadow-none"
            >
              <Plus className="h-3 w-3 mr-1" />Post Job
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="font-medium text-red-600 hover:underline">Dismiss</button>
            </div>
          )}

          {/* ──── Metric Cards ──── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Postings', value: loadingJobs ? '—' : jobs.length, icon: Briefcase },
              { label: 'Applicants', value: loadingApplicants ? '—' : applicants.length, icon: Users },
              { label: 'Shortlisted', value: loadingApplicants ? '—' : shortlistedCount, icon: ShieldCheck },
              { label: 'Avg. AI Score', value: loadingApplicants || applicants.length === 0 ? '—' :
                Math.round(applicants.filter(a => a.aiScore).reduce((sum, a) => sum + a.aiScore, 0) / (applicants.filter(a => a.aiScore).length || 1)),
                icon: Sparkles,
              },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="shadow-none border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</span>
                    <Icon className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.75} />
                  </div>
                  <span className="text-2xl font-semibold text-slate-900 font-mono tracking-tight leading-none">{value}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ──── Job Selector ──── */}
          <Card className="shadow-none border-slate-200 bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 mb-1">Active Pipeline</p>
                    <div className="relative">
                      <select
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        disabled={loadingJobs}
                        className="appearance-none bg-white border border-slate-200 rounded-md pl-3 pr-8 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 cursor-pointer"
                      >
                        {jobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} — {job.recruiter?.companyName || companyName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-2.5 h-3 w-3 pointer-events-none text-slate-400" />
                    </div>
                  </div>
                </div>
                {selectedJob && (
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span><strong className="text-slate-600">{applicants.length}</strong> applicants</span>
                    <span className="text-slate-200">·</span>
                    <span className="font-mono">{selectedJob.requiredSkills?.join(', ')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ──── Candidates Table ──── */}
          <Card className="shadow-none border-slate-200 bg-white overflow-hidden">
            <CardHeader className="p-4 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[13px] font-semibold text-slate-800">Candidates</CardTitle>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ranked by skill match &amp; AI screening</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchApplicants(selectedJobId)}
                  disabled={loadingApplicants}
                  className="h-7 px-2.5 text-[11px] border-slate-200 text-slate-500 hover:text-slate-800 shadow-none"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loadingApplicants ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              {loadingApplicants ? (
                <div className="p-6 space-y-2.5">
                  {[1, 2, 3].map((i) => <div key={i} className="h-9 bg-slate-50 rounded animate-pulse" />)}
                </div>
              ) : applicants.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="mx-auto h-5 w-5 text-slate-200 mb-2" />
                  <p className="text-xs font-medium text-slate-400">No applicants yet</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Candidates will appear here after applying</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="h-8 text-[10px]">Candidate</TableHead>
                      <TableHead className="h-8 text-[10px]">Institution</TableHead>
                      <TableHead className="h-8 text-[10px] text-center">Match</TableHead>
                      <TableHead className="h-8 text-[10px] text-center">AI Score</TableHead>
                      <TableHead className="h-8 text-[10px]">Status</TableHead>
                      <TableHead className="h-8 text-[10px] text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicants.map((app) => {
                      const isUpdating = actionLoading[app.id];
                      return (
                        <TableRow key={app.id} className="border-slate-50 hover:bg-slate-50/50">
                          {/* Candidate */}
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                                <span className="text-[10px] font-semibold text-slate-500">
                                  {(app.student?.fullName || '??').slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="text-xs font-medium text-slate-800 truncate">{app.student?.fullName || 'Candidate'}</p>
                                  {app.student?.isVerified ? (
                                    <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Clock className="h-3 w-3 text-slate-300 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-300 font-mono truncate">{app.student?.user?.email}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Institution */}
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-slate-800 text-sm">{app.student?.fullName || app.student?.user?.name || 'Applicant'}</span>
                              {app.student?.cheatingFlags > 0 && (
                                <span title={`${app.student.cheatingFlags} Infractions Detected (Tab Switching / Pasting)`} className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-help">
                                  <AlertCircle className="w-3 h-3" /> Flagged
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">{app.student?.college || '—'}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {app.student?.skills?.slice(0, 3).map((sk, idx) => (
                                <span key={idx} className="text-[9px] font-mono px-1 py-0 rounded border border-slate-100 bg-slate-50 text-slate-400">{sk}</span>
                              ))}
                            </div>
                          </TableCell>

                          {/* Match */}
                          <TableCell className="py-2.5 text-center">{scoreBadge(app.matchScore)}</TableCell>

                          {/* AI Score */}
                          <TableCell className="py-2.5 text-center">
                            {app.aiScore !== null && app.aiScore !== undefined ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-mono text-xs font-semibold text-slate-700">{app.aiScore}/100</span>
                                {app.aiFeedback && (
                                  <button
                                    type="button"
                                    onClick={() => setViewFeedbackApp(app)}
                                    className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                                  >
                                    <Info className="h-2.5 w-2.5" />Notes
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 italic">Pending</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-2.5">{statusBadge(app.status)}</TableCell>

                          {/* Actions */}
                          <TableCell className="py-2.5 text-right pr-4">
                            <div className="flex items-center justify-end gap-1">
                              {app.status !== 'SHORTLISTED' && app.status !== 'INTERVIEW_SCHEDULED' && app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => handleStatusChange(app.id, 'SHORTLISTED')}
                                  className="h-6 px-2 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-none"
                                >
                                  Shortlist
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => { setActiveAppToSchedule(app); setIsScheduleModalOpen(true); }}
                                className="h-6 px-2 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-none flex items-center gap-0.5"
                              >
                                <Calendar className="h-3 w-3" />Schedule
                              </Button>
                              {app.status !== 'REJECTED' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => handleStatusChange(app.id, 'REJECTED')}
                                  className="h-6 px-1.5 text-[10px] text-slate-300 hover:text-red-600 hover:bg-red-50/50 shadow-none"
                                  title="Reject"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* ──── Feedback Sheet ──── */}
      <Sheet open={!!viewFeedbackApp} onOpenChange={(open) => !open && setViewFeedbackApp(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-slate-400" />
              <SheetTitle className="text-sm font-semibold">AI Evaluation</SheetTitle>
            </div>
            <SheetDescription className="text-xs">
              {viewFeedbackApp?.student?.fullName}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-slate-900 font-mono">{viewFeedbackApp?.aiScore}</span>
                <span className="text-sm text-slate-300 font-mono">/100</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Feedback</p>
              <div className="text-xs text-slate-600 leading-relaxed p-3 bg-slate-50 border border-slate-100 rounded-md whitespace-pre-wrap font-mono">
                {viewFeedbackApp?.aiFeedback || 'No feedback available.'}
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white text-xs h-8" onClick={() => setViewFeedbackApp(null)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ──── Schedule Modal ──── */}
      <ScheduleModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        application={activeAppToSchedule}
        onScheduled={handleInterviewScheduled}
      />

      {/* ──── Create Job Dialog ──── */}
      <Dialog open={isCreateJobOpen} onOpenChange={setIsCreateJobOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Post New Job</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateJob} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600">Job Title</label>
              <Input
                type="text"
                required
                value={newJobForm.title}
                onChange={(e) => setNewJobForm({...newJobForm, title: e.target.value})}
                className="h-8 text-xs shadow-none border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600">Description</label>
              <textarea
                required
                rows={4}
                value={newJobForm.description}
                onChange={(e) => setNewJobForm({...newJobForm, description: e.target.value})}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
                placeholder="Job description and requirements…"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600">Required Skills</label>
              <Input
                type="text"
                value={newJobForm.requiredSkills}
                onChange={(e) => setNewJobForm({...newJobForm, requiredSkills: e.target.value})}
                className="h-8 text-xs font-mono shadow-none border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
                placeholder="React, TypeScript, Tailwind"
              />
              <p className="text-[9px] text-slate-400">Comma separated</p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateJobOpen(false)} disabled={creatingJob} className="h-7 text-[11px] shadow-none">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creatingJob} className="h-7 text-[11px] bg-slate-900 text-white hover:bg-slate-800 shadow-none">
                {creatingJob ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RecruiterView;
