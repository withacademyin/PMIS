'use client';

import React, { useState } from 'react';
import {
  Briefcase, Calendar, XCircle, Clock, ShieldCheck,
  ChevronDown, Info, Loader2, Plus, Sparkles, Users,
  BarChart3, Settings, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ScheduleModal from '@/components/ScheduleModal';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { MetricCard } from '@/components/shared/MetricCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonRows } from '@/components/shared/SkeletonRows';
import { AvatarInitials } from '@/components/shared/AvatarInitials';
import { useJobs } from '@/hooks/useJobs';
import { useApplicants } from '@/hooks/useApplicants';
import api from '@/lib/api';

const SIDEBAR_ITEMS = [
  { icon: BarChart3, label: 'Pipeline' },
  { icon: Briefcase, label: 'Jobs' },
  { icon: Users, label: 'Candidates' },
  { icon: Settings, label: 'Settings' },
];

export function RecruiterView() {
  const { user } = useAuth();
  const { jobs, loading: loadingJobs, error: jobsError, setError: setJobsError, fetchJobs } = useJobs();
  const [selectedJobId, setSelectedJobId] = useState('');
  const [activeNav, setActiveNav] = useState('Pipeline');

  // Auto-select first job when jobs load
  React.useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) setSelectedJobId(jobs[0].id);
  }, [jobs, selectedJobId]);

  const {
    applicants, loading: loadingApplicants, error: applicantsError,
    setError: setApplicantsError, actionLoading, fetchApplicants,
    handleStatusChange, updateApplicant,
  } = useApplicants(selectedJobId);

  // Combine errors from both hooks
  const error = jobsError || applicantsError;
  const clearError = () => { setJobsError(null); setApplicantsError(null); };

  // Schedule modal state
  const [activeAppToSchedule, setActiveAppToSchedule] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [viewFeedbackApp, setViewFeedbackApp] = useState(null);

  // Create job dialog state
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [newJobForm, setNewJobForm] = useState({ title: '', description: '', requiredSkills: '' });
  const [creatingJob, setCreatingJob] = useState(false);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!user?.recruiterProfile?.id) return;
    setCreatingJob(true);
    clearError();
    try {
      const payload = {
        title: newJobForm.title,
        description: newJobForm.description,
        recruiterId: user.recruiterProfile.id,
        requiredSkills: newJobForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await api.createJob(payload);
      if (res.success) {
        setIsCreateJobOpen(false);
        setNewJobForm({ title: '', description: '', requiredSkills: '' });
        fetchJobs();
      }
    } catch (err) {
      setJobsError(err.message || 'Failed to create job posting.');
    } finally {
      setCreatingJob(false);
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const shortlistedCount = applicants.filter((a) => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'ACCEPTED'].includes(a.status)).length;
  const companyName = user?.recruiterProfile?.companyName || 'Recruiter';

  const scoreBadge = (score) => {
    if (score === null || score === undefined) return <span className="text-[10px] text-slate-300">—</span>;
    return (
      <span className={`font-mono text-[11px] font-semibold ${score >= 80 ? 'text-slate-900' : score >= 50 ? 'text-slate-600' : 'text-slate-400'}`}>
        {score}%
      </span>
    );
  };

  return (
    <DashboardLayout
      role="Recruiter"
      sidebarItems={SIDEBAR_ITEMS}
      activeNav={activeNav}
      onNavChange={setActiveNav}
      profileSection={
        <>
          <AvatarInitials name={companyName} size="w-8 h-8" className="rounded-md mb-2" />
          <p className="text-xs font-medium text-slate-800 truncate">{companyName}</p>
          <p className="text-[10px] text-slate-400">{user?.email}</p>
        </>
      }
      footer={
        <p className="text-[10px] text-slate-400 font-mono">{jobs.length} active posting{jobs.length !== 1 ? 's' : ''}</p>
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Pipeline</h1>
          <p className="text-xs text-slate-400 mt-0.5">Candidate management &amp; hiring workflow</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateJobOpen(true)} className="h-7 px-3 text-[11px] bg-slate-900 hover:bg-slate-800 text-white shadow-none">
          <Plus className="h-3 w-3 mr-1" />Post Job
        </Button>
      </div>

      <ErrorBanner error={error} onDismiss={clearError} />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Postings" value={loadingJobs ? '—' : jobs.length} icon={Briefcase} />
        <MetricCard label="Applicants" value={loadingApplicants ? '—' : applicants.length} icon={Users} />
        <MetricCard label="Shortlisted" value={loadingApplicants ? '—' : shortlistedCount} icon={ShieldCheck} />
        <MetricCard
          label="Avg. AI Score"
          value={loadingApplicants || applicants.length === 0 ? '—' :
            Math.round(applicants.filter(a => a.aiScore).reduce((sum, a) => sum + a.aiScore, 0) / (applicants.filter(a => a.aiScore).length || 1))}
          icon={Sparkles}
        />
      </div>

      {/* Job Selector */}
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
                      <option key={job.id} value={job.id}>{job.title} — {job.recruiter?.companyName || companyName}</option>
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

      {/* Candidates Table */}
      <Card className="shadow-none border-slate-200 bg-white overflow-hidden">
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[13px] font-semibold text-slate-800">Candidates</CardTitle>
              <p className="text-[11px] text-slate-400 mt-0.5">Ranked by skill match &amp; AI screening</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchApplicants(selectedJobId)} disabled={loadingApplicants} className="h-7 px-2.5 text-[11px] border-slate-200 text-slate-500 hover:text-slate-800 shadow-none">
              <RefreshCw className={`h-3 w-3 mr-1 ${loadingApplicants ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-3">
          {loadingApplicants ? (
            <SkeletonRows count={3} />
          ) : applicants.length === 0 ? (
            <EmptyState icon={Users} title="No applicants yet" subtitle="Candidates will appear here after applying" />
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
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <AvatarInitials name={app.student?.fullName} />
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
                      <TableCell className="py-2.5 text-center">{scoreBadge(app.matchScore)}</TableCell>
                      <TableCell className="py-2.5 text-center">
                        {app.aiScore !== null && app.aiScore !== undefined ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-mono text-xs font-semibold text-slate-700">{app.aiScore}/100</span>
                            {app.aiFeedback && (
                              <button type="button" onClick={() => setViewFeedbackApp(app)} className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5">
                                <Info className="h-2.5 w-2.5" />Notes
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5"><StatusBadge status={app.status} /></TableCell>
                      <TableCell className="py-2.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {!['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'ACCEPTED', 'REJECTED'].includes(app.status) && (
                            <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => handleStatusChange(app.id, 'SHORTLISTED')} className="h-6 px-2 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-none">
                              Shortlist
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => { setActiveAppToSchedule(app); setIsScheduleModalOpen(true); }} className="h-6 px-2 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-none flex items-center gap-0.5">
                            <Calendar className="h-3 w-3" />Schedule
                          </Button>
                          {app.status !== 'REJECTED' && (
                            <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => handleStatusChange(app.id, 'REJECTED')} className="h-6 px-1.5 text-[10px] text-slate-300 hover:text-red-600 hover:bg-red-50/50 shadow-none" title="Reject">
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

      {/* Feedback Sheet */}
      <Sheet open={!!viewFeedbackApp} onOpenChange={(open) => !open && setViewFeedbackApp(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-slate-400" />
              <SheetTitle className="text-sm font-semibold">AI Evaluation</SheetTitle>
            </div>
            <SheetDescription className="text-xs">{viewFeedbackApp?.student?.fullName}</SheetDescription>
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
            <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white text-xs h-8" onClick={() => setViewFeedbackApp(null)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Schedule Modal */}
      <ScheduleModal open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen} application={activeAppToSchedule} onScheduled={updateApplicant} />

      {/* Create Job Dialog */}
      <Dialog open={isCreateJobOpen} onOpenChange={setIsCreateJobOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Post New Job</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateJob} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600">Job Title</label>
              <Input type="text" required value={newJobForm.title} onChange={(e) => setNewJobForm({...newJobForm, title: e.target.value})} className="h-8 text-xs shadow-none border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300" placeholder="e.g. Senior Frontend Engineer" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600">Description</label>
              <textarea required rows={4} value={newJobForm.description} onChange={(e) => setNewJobForm({...newJobForm, description: e.target.value})} className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none" placeholder="Job description and requirements…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-600">Required Skills</label>
              <Input type="text" value={newJobForm.requiredSkills} onChange={(e) => setNewJobForm({...newJobForm, requiredSkills: e.target.value})} className="h-8 text-xs font-mono shadow-none border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300" placeholder="React, TypeScript, Tailwind" />
              <p className="text-[9px] text-slate-400">Comma separated</p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateJobOpen(false)} disabled={creatingJob} className="h-7 text-[11px] shadow-none">Cancel</Button>
              <Button type="submit" size="sm" disabled={creatingJob} className="h-7 text-[11px] bg-slate-900 text-white hover:bg-slate-800 shadow-none">
                {creatingJob ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default RecruiterView;
