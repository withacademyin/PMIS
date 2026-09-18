'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2, MapPin, Briefcase, Banknote, Search,
  FileText, Send, Eye, Clock, Sparkles, CalendarDays,
  ExternalLink, GraduationCap,
} from 'lucide-react';
import { MetricCard } from '@/components/shared/MetricCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssessmentModal from '@/components/AssessmentModal';
import UpdateResumeModal from '@/components/UpdateResumeModal';
import KraSubmissionModal from '@/components/KraSubmissionModal';
import { Logo } from '@/components/ui/logo';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useInternships } from '@/hooks/useInternships';

export function LearnerView() {
  const { user } = useAuth();
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
  const [expandedJobs, setExpandedJobs] = useState({});

  const toggleJobDescription = (jobId) => {
    setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };
  
  // KRA Submission Modal state
  const [isKraModalOpen, setIsKraModalOpen] = useState(false);
  const [selectedKra, setSelectedKra] = useState(null);
  const [selectedKraInternshipId, setSelectedKraInternshipId] = useState(null);
  
  const { internships, loading: loadingInternships, fetchInternships } = useInternships();

  const activeStudent = user?.studentProfile || {};
  const hasAssessment = Object.keys(user?.studentProfile?.skillScores || {}).length > 0;
  const lastAssessmentAt = user?.studentProfile?.lastAssessmentAt ? new Date(user.studentProfile.lastAssessmentAt) : null;
  const canRetake = lastAssessmentAt && (new Date() - lastAssessmentAt) >= 3 * 24 * 60 * 60 * 1000;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.getJobs().catch(() => ({ data: [] })),
        api.getStudentApplications().catch(() => ({ data: [] })),
      ]);
      if (jobsRes.data) setJobs(jobsRes.data);
      if (appsRes.data) setApplications(appsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load internship opportunities.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const appsRes = await api.getStudentApplications().catch(() => ({ data: [] }));
      if (appsRes.data) setApplications(appsRes.data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };



  const handleApplicationResponse = async (appId, status) => {
    try {
      const res = await api.updateApplicationStatus(appId, { status });
      if (res.success) {
        fetchApplications();
      }
    } catch (err) {
      console.error('Failed to update application status:', err);
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
    fetchApplications();
    fetchInternships();
  };

  const filteredJobs = jobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    
    // Hide jobs where the application was rejected
    const existingApp = applications.find(a => a.jobId === j.id);
    if (existingApp?.status === 'REJECTED') {
      return false;
    }

    return (
      (j.title || '').toLowerCase().includes(q) ||
      (j.recruiter?.companyName || '').toLowerCase().includes(q) ||
      (j.requiredSkills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  const interviewCount = applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED').length;

  const SIDEBAR_ITEMS = [
    { id: 'browse', icon: Briefcase, label: 'Browse Roles' },
    { id: 'applications', icon: FileText, label: 'Applications' },
    { id: 'internships', icon: CalendarDays, label: 'My Internships' },
  ];

  return (
    <DashboardLayout
      role="Student"
      sidebarItems={SIDEBAR_ITEMS}
      activeNav={activeTab}
      onNavChange={setActiveTab}
      profileSection={
        <>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
            <span className="text-[10px] font-semibold text-slate-500">{(activeStudent?.fullName || 'U').slice(0, 2).toUpperCase()}</span>
          </div>
          <p className="text-xs font-medium text-slate-800 truncate">{activeStudent?.fullName || 'User'}</p>
          <p className="text-[10px] text-slate-500 font-medium truncate">{activeStudent?.college || '—'}</p>
        </>
      }
      footer={
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Skills</p>
          <div className="flex flex-wrap gap-1">
            {(activeStudent.skills || []).slice(0, 5).map((sk, i) => (
              <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-100 bg-slate-50 text-slate-500">{sk}</span>
            ))}
            {(activeStudent.skills?.length || 0) > 5 && (
              <span className="text-[9px] text-slate-300 font-mono self-center">+{activeStudent.skills.length - 5}</span>
            )}
          </div>
        </div>
      }
    >
      {/* Header + Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            {activeTab === 'browse' && 'Opportunities'}
            {activeTab === 'applications' && 'My Applications'}
            {activeTab === 'internships' && 'My Internships'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeTab === 'browse' && `${loading ? '—' : filteredJobs.length} roles available`}
            {activeTab === 'applications' && `${applications.length} total · ${interviewCount} interview${interviewCount !== 1 ? 's' : ''}`}
            {activeTab === 'internships' && `${internships?.length || 0} active internships`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-7 bg-slate-100/80">
                <TabsTrigger value="browse">Roles</TabsTrigger>
                <TabsTrigger value="applications">Applied</TabsTrigger>
                <TabsTrigger value="internships">Internships</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {activeTab === 'browse' && (
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-300" />
              <Input type="text" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-7 text-xs bg-white border-slate-200 shadow-none placeholder:text-slate-300 focus-visible:ring-1 focus-visible:ring-slate-300" />
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 my-5">
        <MetricCard
          label="Roles"
          value={loading ? '—' : filteredJobs.length}
          icon={Briefcase}
          description="Available positions"
          color="subtle-blue"
        />
        <MetricCard
          label="Applications"
          value={applications.length}
          icon={FileText}
          description="Submitted roles"
          color="light-blue"
        />
        <MetricCard
          label="Interviews"
          value={interviewCount}
          icon={CalendarDays}
          description="Scheduled calls"
          change={interviewCount > 0 ? `${interviewCount} active` : undefined}
          trend={interviewCount > 0 ? 'up' : undefined}
          color="light-green"
        />
        <MetricCard
          label="Internships"
          value={loadingInternships ? '—' : (internships?.length || 0)}
          icon={GraduationCap}
          description="Active placements"
          color="light-pink"
        />
      </div>

      {/* Pending Assessment Banner */}
      {!hasAssessment && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-2.5 rounded-lg shrink-0"><Logo className="w-6 h-6" /></div>
            <div>
              <h3 className="font-semibold text-base mb-0.5">⚠️ Action Required: Pending Skill Assessment</h3>
              <p className="text-indigo-100 text-sm">You skipped the AI Skill Verification. Taking this 2-minute test will verify your skills and significantly boost your visibility to recruiters.</p>
            </div>
          </div>
          <Button onClick={() => window.location.href = '/onboarding/student'} className="bg-white text-indigo-600 hover:bg-indigo-50 shrink-0 font-semibold">Take Assessment Now</Button>
        </div>
      )}

      {/* Retake Assessment Banner */}
      {hasAssessment && canRetake && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-2.5 rounded-lg shrink-0"><Logo className="w-6 h-6" /></div>
            <div>
              <h3 className="font-semibold text-base mb-0.5">🔄 Improve Your AI Score</h3>
              <p className="text-emerald-50 text-sm">It's been 3 days since your last skill assessment! You are now eligible to retake the test to boost your scores and clear any cheating flags.</p>
            </div>
          </div>
          <Button onClick={() => window.location.href = '/onboarding/student'} className="bg-white text-emerald-700 hover:bg-emerald-50 shrink-0 font-semibold">Retake Assessment</Button>
        </div>
      )}

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* Browse Roles Tab */}
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
            <EmptyState icon={Building2} title="No roles found" subtitle="Try a different search query" />
          ) : (
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredJobs.map((job) => {
                  const breakdown = calculateSkillsBreakdown(job.requiredSkills || []);
                  const isApplying = actionLoading[job.id];
                  const existingApp = applications.find(a => a.jobId === job.id);
                  const isApplied = !!existingApp;

                  return (
                    <Card key={job.id} className="flex flex-col shadow-none border-slate-200 bg-white hover:border-slate-300 transition-colors">
                      <CardHeader className="p-4 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <CardTitle className="text-[13px] font-semibold text-slate-900 leading-tight truncate">{job.title}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1 text-slate-400 text-xs">
                              <Building2 className="h-3 w-3" /><span className="truncate">{job.recruiter?.companyName || 'Partner'}</span>
                            </CardDescription>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className={`shrink-0 font-mono text-[10px] shadow-none ${breakdown.score >= 80 ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50' : breakdown.score >= 50 ? 'border-amber-200 text-amber-700 bg-amber-50/50' : 'border-slate-200 text-slate-400'}`}>
                                {breakdown.score}%
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent><p>{breakdown.matched.length}/{breakdown.matched.length + breakdown.missing.length} skills match</p></TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-3 mt-2.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location || 'Remote'}</span>
                          <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.type || 'Internship'}</span>
                          <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{job.salary || 'Competitive'}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 pt-0 flex-1">
                        <div className="mb-3">
                          <p className={`text-xs text-slate-500 leading-relaxed ${expandedJobs[job.id] ? '' : 'line-clamp-2'}`}>
                            {job.description}
                          </p>
                          {job.description && job.description.length > 150 && (
                            <button 
                              onClick={() => toggleJobDescription(job.id)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium mt-1"
                            >
                              {expandedJobs[job.id] ? 'See less' : 'See more'}
                            </button>
                          )}
                        </div>
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
                        <Button variant="ghost" size="sm" onClick={() => setSelectedJobDetails(job)} className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-700">
                          <Eye className="w-3 h-3 mr-1" />Details
                        </Button>
                        <Button size="sm" onClick={() => handleApplyAndScreen(job)} disabled={isApplying || isApplied} className="h-6 px-3 text-[10px] bg-slate-900 hover:bg-slate-800 text-white shadow-none">
                          {isApplying ? 'Processing…' : isApplied ? 'Applied' : <><Send className="w-3 h-3 mr-1" />Apply</>}
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

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <>
          {applications.length === 0 ? (
            <EmptyState icon={FileText} title="No applications yet" subtitle="Browse roles and apply to get started" />
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
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(app.appliedAt).toLocaleDateString()}</span>
                      {app.aiScore !== null && app.aiScore !== undefined && (
                        <span className="flex items-center gap-1 font-mono"><Sparkles className="w-3 h-3" />{app.aiScore}/100</span>
                      )}
                      {app.matchScore !== null && app.matchScore !== undefined && (
                        <span className="font-mono">{app.matchScore}% match</span>
                      )}
                    </div>
                    {app.status === 'INTERVIEW_SCHEDULED' && app.interviewDate && (
                      <div className="mt-3 p-2.5 rounded-md border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] text-slate-600">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{new Date(app.interviewDate).toLocaleString()}</span>
                        </div>
                        {app.interviewLink && (
                          <a href={app.interviewLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-0.5">
                            Join <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    )}
                    {app.status === 'SHORTLISTED' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <Button size="sm" onClick={() => handleApplicationResponse(app.id, 'ACCEPTED')} className="h-7 text-[10px] bg-slate-900 text-white hover:bg-slate-800 shadow-none px-3">
                          Accept Offer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleApplicationResponse(app.id, 'REJECTED')} className="h-7 text-[10px] shadow-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-3">
                          Decline
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Internships Tab */}
      {activeTab === 'internships' && (
        <>
          {loadingInternships ? (
            <div className="grid grid-cols-1 gap-3"><div className="h-32 bg-white border border-slate-200 rounded-lg animate-pulse" /></div>
          ) : internships?.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No active internships" subtitle="When you are hired, your internships and tasks will appear here." />
          ) : (
            <div className="space-y-4">
              {internships.map(internship => (
                <div key={internship.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-white font-semibold">{internship.application?.job?.title || 'Internship'}</h2>
                      <p className="text-slate-400 text-xs mt-0.5">{internship.application?.job?.recruiter?.companyName}</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-none hover:bg-emerald-500/30">Active</Badge>
                  </div>
                  <div className="p-5 bg-slate-50 border-b border-slate-100">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Key Result Areas (KRAs)</h3>
                    {internship.kras?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No KRAs assigned yet. Your recruiter will assign tasks soon.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {internship.kras?.map(kra => (
                          <div 
                            key={kra.id} 
                            onClick={() => {
                              setSelectedKra(kra);
                              setSelectedKraInternshipId(internship.id);
                              setIsKraModalOpen(true);
                            }}
                            className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm relative group cursor-pointer hover:border-slate-300 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-slate-800 text-sm">{kra.title}</h4>
                              <StatusBadge status={kra.status || 'PENDING'} />
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{kra.description}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Due: {new Date(kra.dueDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AssessmentModal open={isAssessmentOpen} onOpenChange={setIsAssessmentOpen} application={activeApplication} job={selectedJob} onAssessmentComplete={handleAssessmentComplete} />
      <UpdateResumeModal open={isUpdateResumeOpen} onOpenChange={setIsUpdateResumeOpen} />
      <KraSubmissionModal 
        open={isKraModalOpen} 
        onOpenChange={setIsKraModalOpen} 
        kra={selectedKra} 
        internshipId={selectedKraInternshipId}
        onSubmitted={() => {
          fetchInternships();
        }}
      />

      {/* Job Details Sheet */}
      <Sheet open={!!selectedJobDetails} onOpenChange={(open) => !open && setSelectedJobDetails(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">{selectedJobDetails?.title}</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">{selectedJobDetails?.recruiter?.companyName || 'Company'}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
              <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedJobDetails?.description || 'No description provided.'}</div>
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
            {(() => {
              const sheetExistingApp = selectedJobDetails ? applications.find(a => a.jobId === selectedJobDetails.id) : null;
              const sheetIsApplied = !!sheetExistingApp;
              return (
                <Button 
                  disabled={sheetIsApplied} 
                  className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white text-xs h-8" 
                  onClick={() => { const job = selectedJobDetails; setSelectedJobDetails(null); handleApplyAndScreen(job); }}
                >
                  {sheetIsApplied ? 'Applied' : 'Apply & Take AI Screening'}
                </Button>
              );
            })()}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

export default LearnerView;
