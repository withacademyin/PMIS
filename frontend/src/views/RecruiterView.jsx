'use client';
import React, { useState } from 'react';
import {
  Briefcase, BriefcaseBusiness, Calendar, XCircle, Clock, ShieldCheck,
  ChevronDown, Info, Loader2, Plus, Sparkles, Users, UserCheck,
  BarChart3, Settings, RefreshCw, AlertCircle, BrainCircuit, GraduationCap
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
import { useInternships } from '@/hooks/useInternships';
import { useMyCompany } from '@/hooks/useMyCompany';
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar';
import HireModal from '@/components/HireModal';
import KraModal from '@/components/KraModal';
import api from '@/lib/api';

const SIDEBAR_ITEMS = [
  { icon: BarChart3, label: 'Active Candidates' },
  { icon: Briefcase, label: 'Jobs' },
  { icon: Users, label: 'Candidates' },
  { icon: GraduationCap, label: 'Interns' },
  { icon: Settings, label: 'Settings' },
];

export function RecruiterView() {
  const { user } = useAuth();
  const { jobs, loading: loadingJobs, error: jobsError, setError: setJobsError, fetchJobs } = useJobs();
  const [selectedJobId, setSelectedJobId] = useState('');
  const [activeNav, setActiveNav] = useState('Active Candidates');

  // Auto-select first job when jobs load
  React.useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) setSelectedJobId(jobs[0].id);
  }, [jobs, selectedJobId]);

  const {
    applicants, loading: loadingApplicants, error: applicantsError,
    setError: setApplicantsError, actionLoading, fetchApplicants,
    handleStatusChange, updateApplicant,
  } = useApplicants(selectedJobId);

  const [candidateView, setCandidateView] = useState('applied');
  const [topCandidates, setTopCandidates] = useState([]);
  const [loadingTopCandidates, setLoadingTopCandidates] = useState(false);

  const fetchTopCandidates = async (jobId) => {
    if (!jobId) return;
    setLoadingTopCandidates(true);
    try {
      const res = await api.getTopCandidates(jobId);
      if (res.success) setTopCandidates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTopCandidates(false);
    }
  };

  const handleShortlistTopCandidate = async (studentId) => {
    try {
      const res = await api.shortlistTopCandidate(selectedJobId, studentId);
      if (res.success) {
        setTopCandidates(prev => prev.filter(c => c.student.id !== studentId));
        fetchApplicants(selectedJobId);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error shortlisting candidate');
    }
  };

  React.useEffect(() => {
    if (selectedJobId && candidateView === 'sourcing') {
      fetchTopCandidates(selectedJobId);
    }
  }, [selectedJobId, candidateView]);

  const {
    applicants: allApplicants, loading: loadingAllApplicants, error: allApplicantsError,
    fetchApplicants: fetchAllApplicants, handleStatusChange: handleAllStatusChange,
  } = useApplicants('all');

  const {
    internships, loading: loadingInternships, error: internshipsError,
    setError: setInternshipsError, fetchInternships
  } = useInternships();

  const { company, loading: loadingCompany, error: companyError, updateMyCompany } = useMyCompany();

  // Combine errors from both hooks
  const error = jobsError || applicantsError || allApplicantsError || internshipsError || companyError;
  const clearError = () => { setJobsError(null); setApplicantsError(null); setInternshipsError(null); };

  // Schedule modal state
  const [activeAppToSchedule, setActiveAppToSchedule] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [viewFeedbackApp, setViewFeedbackApp] = useState(null);

  // Hire modal state
  const [activeAppToHire, setActiveAppToHire] = useState(null);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);

  // KRA modal state
  const [isKraModalOpen, setIsKraModalOpen] = useState(false);
  const [kraSelectedDate, setKraSelectedDate] = useState(null);

  // Create job dialog state
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [newJobForm, setNewJobForm] = useState({ 
    title: '', 
    description: '', 
    requiredSkills: '',
    jdMode: 'write', // 'write' or 'upload'
    jdText: '',
    jdFile: null
  });
  const [creatingJob, setCreatingJob] = useState(false);
  const [isParsingJd, setIsParsingJd] = useState(false);

  const handleParseJD = async (mode, content) => {
    try {
      setIsParsingJd(true);
      const formData = new FormData();
      if (mode === 'upload' && content) {
        formData.append('jdFile', content);
      } else if (mode === 'write' && content) {
        formData.append('jdText', content);
      } else {
        setIsParsingJd(false);
        return;
      }
      
      const res = await api.parseJD(formData);
      if (res.success && res.data) {
        setNewJobForm(prev => ({
          ...prev,
          title: res.data.title || prev.title,
          description: res.data.description || prev.description,
           requiredSkills: (res.data.requiredSkills || []).join(', '),
          jdText: res.data.jdText || prev.jdText
        }));
      }
    } catch (err) {
      console.error('Failed to parse JD:', err);
    } finally {
      setIsParsingJd(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!user?.recruiterProfile?.id) return;
    setCreatingJob(true);
    clearError();
    try {
      const formData = new FormData();
      formData.append('title', newJobForm.title);
      formData.append('description', newJobForm.description);
      formData.append('recruiterId', user.recruiterProfile.id);
      formData.append('requiredSkills', newJobForm.requiredSkills);
      
      if (newJobForm.jdMode === 'write' && newJobForm.jdText) {
        formData.append('jdText', newJobForm.jdText);
      } else if (newJobForm.jdMode === 'upload' && newJobForm.jdFile) {
        formData.append('jdFile', newJobForm.jdFile);
      }

      const res = await api.createJob(formData);
      if (res.success) {
        setIsCreateJobOpen(false);
        setNewJobForm({ title: '', description: '', requiredSkills: '', jdMode: 'write', jdText: '', jdFile: null });
        fetchJobs();
      }
    } catch (err) {
      setJobsError(err.message || 'Failed to create job posting.');
    } finally {
      setCreatingJob(false);
    }
  };

  const [companyForm, setCompanyForm] = useState({ name: '', website: '', industry: '', location: '', description: '', size: '' });
  const [updatingCompany, setUpdatingCompany] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.name || '',
        website: company.website || '',
        industry: company.industry || '',
        location: company.location || '',
        description: company.description || '',
        size: company.size || ''
      });
    }
  }, [company]);

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setUpdatingCompany(true);
    const res = await updateMyCompany(companyForm);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setUpdatingCompany(false);
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
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{activeNav}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeNav === 'Active Candidates' && 'Candidate management & hiring workflow'}
            {activeNav === 'Jobs' && 'Manage your job postings'}
            {activeNav === 'Candidates' && 'All candidates across positions'}
            {activeNav === 'Interns' && 'Manage active internships and key result areas'}
            {activeNav === 'Settings' && 'Account & preferences'}
          </p>
        </div>
        {activeNav === 'Active Candidates' && (
          <Button size="sm" onClick={() => setIsCreateJobOpen(true)} className="h-7 px-3 text-[11px] bg-slate-900 hover:bg-slate-800 text-white shadow-none">
            <Plus className="h-3 w-3 mr-1" />Post Job
          </Button>
        )}
      </div>

      <ErrorBanner error={error} onDismiss={clearError} />

      {/* ──── Active Candidates Tab ──── */}
      {activeNav === 'Active Candidates' && (
      <>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Postings"
          value={loadingJobs ? '—' : jobs.length}
          icon={BriefcaseBusiness}
          description="Active positions"
          color="subtle-blue"
        />
        <MetricCard
          label="Applicants"
          value={loadingApplicants ? '—' : applicants.length}
          icon={Users}
          description="Total candidates"
          change={applicants.length > 0 ? `${applicants.length} received` : undefined}
          color="light-blue"
        />
        <MetricCard
          label="Shortlisted"
          value={loadingApplicants ? '—' : shortlistedCount}
          icon={UserCheck}
          description="Moved forward"
          change={shortlistedCount > 0 ? `${shortlistedCount} qualified` : undefined}
          trend={shortlistedCount > 0 ? 'up' : undefined}
          color="light-green"
        />
        <MetricCard
          label="Avg. AI Score"
          value={loadingApplicants || applicants.length === 0 ? '—' :
            Math.round(applicants.filter(a => a.aiScore).reduce((sum, a) => sum + a.aiScore, 0) / (applicants.filter(a => a.aiScore).length || 1))}
          icon={BrainCircuit}
          description="Automated screening"
          color="light-pink"
        />
      </div>

      {/* Job Selector */}
      <Card className="shadow-none border-slate-200 bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 mb-1">Active Candidates</p>
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
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  onClick={() => setCandidateView('applied')}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${candidateView === 'applied' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                >
                  Applied Candidates
                </button>
                <button
                  onClick={() => setCandidateView('sourcing')}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${candidateView === 'sourcing' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                >
                  Top Matches
                </button>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchApplicants(selectedJobId)} disabled={loadingApplicants} className="h-7 px-2.5 text-[11px] border-slate-200 text-slate-500 hover:text-slate-800 shadow-none">
              <RefreshCw className={`h-3 w-3 mr-1 ${loadingApplicants ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-3">
          {candidateView === 'applied' && (
            loadingApplicants ? (
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
                        <span className="text-xs text-slate-700 font-medium">{app.student?.college || '—'}</span>
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
                          {!['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'ACCEPTED', 'REJECTED', 'SELECTED'].includes(app.status) && (
                            <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => handleStatusChange(app.id, 'SHORTLISTED')} className="h-6 px-2 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-none">
                              Shortlist
                            </Button>
                          )}
                          {!['REJECTED', 'SELECTED'].includes(app.status) && (
                            <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => { 
                              if (app.status === 'SHORTLISTED') {
                                alert("This candidate hasn't accepted the shortlist yet.");
                                return;
                              }
                              if (app.status === 'APPLIED' || app.status === 'UNDER_REVIEW') {
                                if (!window.confirm("This candidate hasn't been shortlisted or accepted yet. Schedule anyway?")) {
                                  return;
                                }
                              }
                              setActiveAppToSchedule(app); 
                              setIsScheduleModalOpen(true); 
                            }} className="h-6 px-2 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-none flex items-center gap-0.5">
                              <Calendar className="h-3 w-3" />Schedule
                            </Button>
                          )}
                          {!['REJECTED', 'SELECTED'].includes(app.status) && (
                            <Button variant="ghost" size="sm" disabled={isUpdating} onClick={() => { setActiveAppToHire(app); setIsHireModalOpen(true); }} className="h-6 px-2 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shadow-none flex items-center gap-0.5">
                              <BriefcaseBusiness className="h-3 w-3" />Hire
                            </Button>
                          )}
                          {app.status !== 'REJECTED' && app.status !== 'SELECTED' && (
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
          ))}
          {candidateView === 'sourcing' && (
            loadingTopCandidates ? (
              <SkeletonRows count={3} />
            ) : topCandidates.length === 0 ? (
              <EmptyState icon={Sparkles} title="No top matches found" subtitle="Expand your job's required skills" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="h-8 text-[10px]">Candidate</TableHead>
                    <TableHead className="h-8 text-[10px]">Institution</TableHead>
                    <TableHead className="h-8 text-[10px] text-center">Match</TableHead>
                    <TableHead className="h-8 text-[10px] text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCandidates.map((c) => {
                    return (
                      <TableRow key={c.student.id} className="border-slate-50 hover:bg-slate-50/50">
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            <AvatarInitials name={c.student.fullName} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-xs font-medium text-slate-800 truncate">{c.student.fullName}</p>
                              </div>
                              <p className="text-[10px] text-slate-300 font-mono truncate">{c.student.user?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="text-xs text-slate-700 font-medium">{c.student.college || '—'}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.student.skills?.slice(0, 3).map((sk, idx) => (
                              <span key={idx} className="text-[9px] font-mono px-1 py-0 rounded border border-slate-100 bg-slate-50 text-slate-400">{sk}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-center">{scoreBadge(c.skillBreakdown?.score || 0)}</TableCell>
                        <TableCell className="py-2.5 text-right pr-4">
                          <Button variant="ghost" size="sm" onClick={() => handleShortlistTopCandidate(c.student.id)} className="h-6 px-2 text-[10px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 shadow-none">
                            <Plus className="h-3 w-3 mr-1" />Shortlist
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          )}

        </CardContent>
      </Card>
      </>
      )}

      {/* ──── Jobs Tab ──── */}
      {activeNav === 'Jobs' && (
        <Card className="shadow-none border-slate-200 bg-white">
          <CardContent className="p-4">
            <div className="space-y-3">
              {loadingJobs ? (
                <SkeletonRows count={3} />
              ) : jobs.length === 0 ? (
                <EmptyState icon={BriefcaseBusiness} title="No job postings" subtitle="Create your first job posting to get started" />
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-md border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{job.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span>{job.recruiter?.companyName || companyName}</span>
                        <span className="text-slate-200">·</span>
                        <span className="font-mono">{job.requiredSkills?.length || 0} skills</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedJobId(job.id); setActiveNav('Active Candidates'); }} className="h-6 px-2 text-[10px] text-slate-500 hover:text-slate-800 shadow-none">
                      View Candidates
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ──── Candidates Tab ──── */}
      {activeNav === 'Candidates' && (
        <Card className="shadow-none border-slate-200 bg-white overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[13px] font-semibold text-slate-800">All Candidates</CardTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">Across all active postings</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchAllApplicants('all')} disabled={loadingAllApplicants} className="h-7 px-2.5 text-[11px] border-slate-200 text-slate-500 hover:text-slate-800 shadow-none">
                <RefreshCw className={`h-3 w-3 mr-1 ${loadingAllApplicants ? 'animate-spin' : ''}`} />Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-3">
            {loadingAllApplicants ? (
              <SkeletonRows count={3} />
            ) : allApplicants.length === 0 ? (
              <EmptyState icon={Users} title="No candidates found" subtitle="When people apply, they will show up here" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="h-8 text-[10px]">Candidate</TableHead>
                    <TableHead className="h-8 text-[10px]">Role</TableHead>
                    <TableHead className="h-8 text-[10px] text-center">Match</TableHead>
                    <TableHead className="h-8 text-[10px] text-center">AI Score</TableHead>
                    <TableHead className="h-8 text-[10px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allApplicants.map((app) => (
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
                        <span className="font-semibold text-slate-800 text-xs">{app.job?.title}</span>
                        <p className="text-[10px] text-slate-400 truncate">{new Date(app.appliedAt).toLocaleDateString()}</p>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ──── Interns Tab ──── */}
      {activeNav === 'Interns' && (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          {(() => {
            const calendarDataMap = {};
            internships?.forEach(internship => {
              internship.kras?.forEach(kra => {
                const dayKey = kra.dueDate.substring(0, 10);
                if (!calendarDataMap[dayKey]) {
                  calendarDataMap[dayKey] = { day: new Date(dayKey), events: [] };
                }
                const internName = internship.application?.student?.fullName || internship.application?.student?.user?.name || 'Intern';
                calendarDataMap[dayKey].events.push({
                  id: kra.id,
                  name: `${internName}: ${kra.title}`,
                  time: new Date(kra.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  datetime: kra.dueDate
                });
              });
            });
            const calendarData = Object.values(calendarDataMap);

            if (loadingInternships) {
              return <div className="p-8 w-full flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
            }
            if (internships.length === 0) {
              return <div className="p-8 w-full"><EmptyState icon={GraduationCap} title="No active internships" subtitle="Hire a candidate to start planning their KRAs" /></div>;
            }
            return <FullScreenCalendar data={calendarData} onAddEvent={(date) => { setKraSelectedDate(date); setIsKraModalOpen(true); }} />;
          })()}
        </div>
      )}

      {/* ──── Settings Tab ──── */}
      {activeNav === 'Settings' && (
        <Card className="shadow-none border-slate-200 bg-white">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-[13px] font-semibold text-slate-800">Company Profile</CardTitle>
            <p className="text-[11px] text-slate-400 mt-0.5">Update details about {company?.name || companyName}</p>
          </CardHeader>
          <CardContent className="p-4">
            {loadingCompany ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleUpdateCompany} className="max-w-2xl space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Company Name</label>
                  <Input required value={companyForm.name} onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})} className="h-8 text-xs shadow-none border-slate-200" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Website</label>
                  <Input value={companyForm.website} onChange={(e) => setCompanyForm({...companyForm, website: e.target.value})} className="h-8 text-xs shadow-none border-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">Industry</label>
                    <Input value={companyForm.industry} onChange={(e) => setCompanyForm({...companyForm, industry: e.target.value})} className="h-8 text-xs shadow-none border-slate-200" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">Company Size</label>
                    <Input value={companyForm.size} onChange={(e) => setCompanyForm({...companyForm, size: e.target.value})} className="h-8 text-xs shadow-none border-slate-200" placeholder="e.g. 50-200 employees" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Location</label>
                  <Input value={companyForm.location} onChange={(e) => setCompanyForm({...companyForm, location: e.target.value})} className="h-8 text-xs shadow-none border-slate-200" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Description</label>
                  <textarea rows={4} value={companyForm.description} onChange={(e) => setCompanyForm({...companyForm, description: e.target.value})} className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none" />
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <Button type="submit" disabled={updatingCompany} className="h-8 px-4 text-xs bg-slate-900 text-white hover:bg-slate-800 shadow-none">
                    {updatingCompany ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : 'Save Changes'}
                  </Button>
                  {saveSuccess && <span className="text-xs text-emerald-600 flex items-center"><ShieldCheck className="w-3 h-3 mr-1" />Saved</span>}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Hire Modal */}
      <HireModal 
        open={isHireModalOpen} 
        onOpenChange={setIsHireModalOpen} 
        application={activeAppToHire} 
        onHired={() => {
          fetchApplicants(selectedJobId);
          fetchInternships();
        }} 
      />

      {/* KRA Modal */}
      <KraModal 
        open={isKraModalOpen} 
        onOpenChange={setIsKraModalOpen}
        internships={internships}
        selectedDate={kraSelectedDate}
        onCreated={() => {
          fetchInternships();
        }}
      />

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
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-medium text-slate-600">Job Description</label>
                <div className="flex bg-slate-100 rounded-md p-0.5">
                  <button type="button" onClick={() => setNewJobForm({...newJobForm, jdMode: 'write', jdFile: null})} className={`px-2 py-1 text-[10px] rounded-sm font-medium ${newJobForm.jdMode === 'write' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Write JD</button>
                  <button type="button" onClick={() => setNewJobForm({...newJobForm, jdMode: 'upload', jdText: ''})} className={`px-2 py-1 text-[10px] rounded-sm font-medium ${newJobForm.jdMode === 'upload' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Upload JD</button>
                </div>
              </div>
              
              {newJobForm.jdMode === 'write' ? (
                <div className="relative">
                  <textarea required rows={6} value={newJobForm.jdText} onChange={(e) => setNewJobForm({...newJobForm, jdText: e.target.value})} className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none" placeholder="Paste or write the complete Job Description here..." />
                  {newJobForm.jdText && (
                    <div className="absolute bottom-2 right-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleParseJD('write', newJobForm.jdText)} disabled={isParsingJd} className="h-6 text-[10px] px-2 shadow-sm">
                        {isParsingJd ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Auto-Fill from Text
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-md p-4 flex flex-col items-center justify-center text-center">
                  {newJobForm.jdFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700">{newJobForm.jdFile.name}</span>
                        <button type="button" onClick={() => setNewJobForm({...newJobForm, jdFile: null})} className="text-red-500 hover:text-red-700 text-xs font-medium" disabled={isParsingJd}>Remove</button>
                      </div>
                      {isParsingJd && <span className="text-[10px] text-slate-500 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" /> Analyzing document...</span>}
                    </div>
                  ) : (
                    <>
                      <input type="file" id="jdUpload" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setNewJobForm({...newJobForm, jdFile: file});
                          handleParseJD('upload', file);
                        }
                      }} disabled={isParsingJd} />
                      <label htmlFor="jdUpload" className={`cursor-pointer text-xs font-medium ${isParsingJd ? 'text-slate-400' : 'text-indigo-600 hover:text-indigo-700'}`}>Click to select PDF/DOC/DOCX file</label>
                    </>
                  )}
                </div>
              )}
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
