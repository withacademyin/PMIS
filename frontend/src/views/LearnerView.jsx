'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2, AlertCircle, MapPin, Briefcase, Banknote, Search,
  GraduationCap, ChevronRight, FileText, Send, Eye, Clock,
  Sparkles, CalendarDays, ExternalLink, BrainCircuit
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { evaluateSkills } from '@/lib/matchingService';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AssessmentModal from '@/components/AssessmentModal';
import UpdateResumeModal from '@/components/UpdateResumeModal';
import { Logo } from '@/components/ui/logo';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function LearnerView() {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [activeApplication, setActiveApplication] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isUpdateResumeOpen, setIsUpdateResumeOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState('browse');

  const activeStudent = user?.studentProfile || {};
  const hasAssessment = Object.keys(user?.studentProfile?.skillScores || {}).length > 0;
  const lastAssessmentAt = user?.studentProfile?.lastAssessmentAt ? new Date(user.studentProfile.lastAssessmentAt) : null;
  const canRetake = lastAssessmentAt && (new Date() - lastAssessmentAt) >= 3 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.getJobs().catch(() => ({ data: [] })),
        api.getStudentApplications().catch(() => ({ data: [] }))
      ]);
      if (jobsRes.data) setJobs(jobsRes.data);
      if (appsRes.data) setApplications(appsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load internship opportunities.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSkillsBreakdown = (requiredSkills = []) => {
    if (!requiredSkills.length) return { score: 100, matched: [], missing: [] };
    const studentSkillSet = new Set((activeStudent.skills || []).map((s) => s.toLowerCase().trim()));
    const matched = requiredSkills.filter((s) => studentSkillSet.has(s.toLowerCase().trim()));
    const missing = requiredSkills.filter((s) => !studentSkillSet.has(s.toLowerCase().trim()));
    const score = Math.round((matched.length / requiredSkills.length) * 100);
    return { score, matched, missing };
  };

  const handleApplyAndScreen = async (job) => {
    if (!activeStudent?.id) {
      setError('Student profile not detected. Please verify database seeding.');
      return;
    }
    setActionLoading((prev) => ({ ...prev, [job.id]: true }));
    setError(null);
    try {
      let appData;
      try {
        const res = await api.applyToJob({ studentId: activeStudent.id, jobId: job.id });
        appData = res.data;
      } catch (err) {
        if (err.status === 409 || err.message?.includes('already applied')) {
          const applicantsRes = await api.getJobApplicants(job.id);
          const found = applicantsRes.data?.find((a) => a.studentId === activeStudent.id);
          if (found) appData = found;
          else throw err;
        } else throw err;
      }
      setSelectedJob(job);
      setActiveApplication(appData);
      setIsAssessmentOpen(true);
    } catch (err) {
      setError(err.message || 'Could not process application.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [job.id]: false }));
    }
  };

  const handleAssessmentComplete = (updatedApp) => {
    setActiveApplication(updatedApp);
  };

  const filteredJobs = jobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    return (
      (j.title || '').toLowerCase().includes(q) ||
      (j.recruiter?.companyName || '').toLowerCase().includes(q) ||
      (j.requiredSkills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  const interviewCount = applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED').length;

  /* ──── Status badge helper ──── */
  const statusDisplay = (status) => {
    const map = {
      APPLIED: { label: 'Applied', cls: 'border-slate-200 text-slate-500 bg-white' },
      UNDER_REVIEW: { label: 'Under Review', cls: 'border-amber-200 text-amber-600 bg-amber-50/50' },
      SHORTLISTED: { label: 'Shortlisted', cls: 'border-slate-300 text-slate-700 bg-slate-50' },
      INTERVIEW_SCHEDULED: { label: 'Interview', cls: 'border-slate-400 text-slate-800 bg-slate-50' },
      ACCEPTED: { label: 'Accepted', cls: 'border-emerald-200 text-emerald-700 bg-emerald-50/50' },
      REJECTED: { label: 'Rejected', cls: 'border-slate-200 text-slate-400 bg-white line-through' },
    };
    const d = map[status] || { label: status, cls: 'border-slate-200 text-slate-500' };
    return (
      <Badge variant="outline" className={`font-mono text-[10px] uppercase shadow-none ${d.cls}`}>
        {d.label}
      </Badge>
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)] overflow-hidden">

      {/* ──── Sidebar ──── */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-slate-200 bg-white pt-6 pb-6 px-3 shrink-0 overflow-y-auto">
        <div className="mb-6 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Student</p>
        </div>

        {/* Profile summary */}
        <div className="px-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
            <span className="text-[10px] font-semibold text-slate-500">
              {(activeStudent?.fullName || 'U').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-800 truncate">{activeStudent?.fullName || 'User'}</p>
          <p className="text-[10px] text-slate-400 truncate">{activeStudent?.college || '—'}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5">
          {[
            { id: 'browse', icon: Briefcase, label: 'Browse Roles' },
            { id: 'applications', icon: FileText, label: 'Applications' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`group flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] font-medium transition-colors ${
                activeTab === id
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className="w-[15px] h-[15px]" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </nav>

        {/* Skills */}
        <div className="mt-auto px-3 pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Skills</p>
          <div className="flex flex-wrap gap-1">
            {(activeStudent.skills || []).slice(0, 5).map((sk, i) => (
              <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-100 bg-slate-50 text-slate-500">
                {sk}
              </span>
            ))}
            {(activeStudent.skills?.length || 0) > 5 && (
              <span className="text-[9px] text-slate-300 font-mono self-center">+{activeStudent.skills.length - 5}</span>
            )}
          </div>
        </div>
      </aside>

      {/* ──── Main Content ──── */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/60">
        <div className="px-8 py-6 space-y-6">

          {/* Header + Metrics */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                {activeTab === 'browse' ? 'Opportunities' : 'My Applications'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'browse'
                  ? `${loading ? '—' : filteredJobs.length} roles available`
                  : `${applications.length} total · ${interviewCount} interview${interviewCount !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile tab switcher */}
              <div className="lg:hidden">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-7 bg-slate-100/80">
                    <TabsTrigger value="browse">Roles</TabsTrigger>
                    <TabsTrigger value="applications">Applied</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {activeTab === 'browse' && (
                <div className="relative w-52">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-300" />
                  <Input
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-7 text-xs bg-white border-slate-200 shadow-none placeholder:text-slate-300 focus-visible:ring-1 focus-visible:ring-slate-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pending Assessment Banner */}
          {!hasAssessment && (
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
                  <Logo className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-0.5">⚠️ Action Required: Pending Skill Assessment</h3>
                  <p className="text-indigo-100 text-sm">
                    You skipped the AI Skill Verification. Taking this 2-minute test will verify your skills and significantly boost your visibility to recruiters.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = '/onboarding/student'} 
                className="bg-white text-indigo-600 hover:bg-indigo-50 shrink-0 font-semibold"
              >
                Take Assessment Now
              </Button>
            </div>
          )}

          {/* Retake Assessment Banner */}
          {hasAssessment && canRetake && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
                  <Logo className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-0.5">🔄 Improve Your AI Score</h3>
                  <p className="text-emerald-50 text-sm">
                    It's been 3 days since your last skill assessment! You are now eligible to retake the test to boost your scores and clear any cheating flags.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = '/onboarding/student'} 
                className="bg-white text-emerald-700 hover:bg-emerald-50 shrink-0 font-semibold"
              >
                Retake Assessment
              </Button>
            </div>
          )}

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

          {/* ──── Browse Roles Tab ──── */}
          {activeTab === 'browse' && (
            <>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="rounded-lg border border-slate-200 bg-white p-5 space-y-3 animate-pulse">
                      <div className="h-4 w-44 bg-slate-100 rounded" />
                      <div className="h-3 w-28 bg-slate-50 rounded" />
                      <div className="h-12 bg-slate-50 rounded" />
                      <div className="h-7 bg-slate-100 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="py-16 text-center">
                  <Building2 className="mx-auto h-5 w-5 text-slate-200 mb-2" />
                  <p className="text-xs font-medium text-slate-400">No roles found</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Try a different search query</p>
                </div>
              ) : (
                <TooltipProvider>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredJobs.map((job) => {
                      const breakdown = calculateSkillsBreakdown(job.requiredSkills || []);
                      const isApplying = actionLoading[job.id];

                      return (
                        <Card key={job.id} className="flex flex-col shadow-none border-slate-200 bg-white hover:border-slate-300 transition-colors">
                          <CardHeader className="p-4 pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <CardTitle className="text-[13px] font-semibold text-slate-900 leading-tight truncate">{job.title}</CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-1 text-slate-400 text-xs">
                                  <Building2 className="h-3 w-3" />
                                  <span className="truncate">{job.recruiter?.companyName || 'Partner'}</span>
                                </CardDescription>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className={`shrink-0 font-mono text-[10px] shadow-none ${
                                      breakdown.score >= 80
                                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50'
                                        : breakdown.score >= 50
                                          ? 'border-amber-200 text-amber-700 bg-amber-50/50'
                                          : 'border-slate-200 text-slate-400'
                                    }`}
                                  >
                                    {breakdown.score}%
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{breakdown.matched.length}/{breakdown.matched.length + breakdown.missing.length} skills match</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 mt-2.5 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location || 'Remote'}</span>
                              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.type || 'Internship'}</span>
                              <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{job.salary || 'Competitive'}</span>
                            </div>
                          </CardHeader>

                          <CardContent className="px-4 pb-3 pt-0 flex-1">
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{job.description}</p>
                            {/* Skills */}
                            <div className="flex flex-wrap gap-1">
                              {breakdown.matched.map((s, i) => (
                                <span key={`m-${i}`} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600">{s}</span>
                              ))}
                              {breakdown.missing.map((s, i) => (
                                <span key={`x-${i}`} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-100 bg-slate-50/50 text-slate-300">{s}</span>
                              ))}
                            </div>
                          </CardContent>

                          <CardFooter className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedJobDetails(job)}
                              className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-700"
                            >
                              <Eye className="w-3 h-3 mr-1" />Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApplyAndScreen(job)}
                              disabled={isApplying}
                              className="h-6 px-3 text-[10px] bg-slate-900 hover:bg-slate-800 text-white shadow-none"
                            >
                              {isApplying ? 'Processing…' : <><Send className="w-3 h-3 mr-1" />Apply</>}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </TooltipProvider>
              )}
            </>
          )}

          {/* ──── Applications Tab ──── */}
          {activeTab === 'applications' && (
            <>
              {applications.length === 0 ? (
                <div className="py-16 text-center">
                  <FileText className="mx-auto h-5 w-5 text-slate-200 mb-2" />
                  <p className="text-xs font-medium text-slate-400">No applications yet</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Browse roles and apply to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.map((app) => (
                    <Card key={app.id} className="shadow-none border-slate-200 bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800 truncate">{app.job?.title || 'Untitled'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{app.job?.recruiter?.companyName || '—'}</p>
                          </div>
                          {statusDisplay(app.status)}
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                          {app.aiScore !== null && app.aiScore !== undefined && (
                            <span className="flex items-center gap-1 font-mono">
                              <Sparkles className="w-3 h-3" />
                              {app.aiScore}/100
                            </span>
                          )}
                          {app.matchScore !== null && app.matchScore !== undefined && (
                            <span className="font-mono">{app.matchScore}% match</span>
                          )}
                        </div>

                        {/* Interview card */}
                        {app.status === 'INTERVIEW_SCHEDULED' && app.interviewDate && (
                          <div className="mt-3 p-2.5 rounded-md border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] text-slate-600">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium">{new Date(app.interviewDate).toLocaleString()}</span>
                            </div>
                            {app.interviewLink && (
                              <a
                                href={app.interviewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                              >
                                Join <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ──── Modals ──── */}
      <AssessmentModal
        open={isAssessmentOpen}
        onOpenChange={setIsAssessmentOpen}
        application={activeApplication}
        job={selectedJob}
        onAssessmentComplete={handleAssessmentComplete}
      />
      <UpdateResumeModal open={isUpdateResumeOpen} onOpenChange={setIsUpdateResumeOpen} />

      {/* Job Details Sheet */}
      <Sheet open={!!selectedJobDetails} onOpenChange={(open) => !open && setSelectedJobDetails(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">{selectedJobDetails?.title}</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              {selectedJobDetails?.recruiter?.companyName || 'Company'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
              <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {selectedJobDetails?.description || 'No description provided.'}
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedJobDetails?.requiredSkills?.map((skill, idx) => (
                  <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">{skill}</span>
                ))}
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button
              className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white text-xs h-8"
              onClick={() => {
                const job = selectedJobDetails;
                setSelectedJobDetails(null);
                handleApplyAndScreen(job);
              }}
            >
              Apply & Take AI Screening
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default LearnerView;
