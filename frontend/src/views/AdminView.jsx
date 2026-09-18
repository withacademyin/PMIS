'use client';

import React, { useState, useMemo } from 'react';
import {
  Users, ShieldCheck, Clock, Search, Loader2, RefreshCw,
  TrendingUp, TrendingDown, Activity, BarChart3, ChevronRight,
  LayoutDashboard, UserCheck, Settings, FileText, Building2, Plus, X, Send,
  MoreHorizontal, Download, Filter, Edit3, Check, Mail, Building, Briefcase, Eye, Trash2
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { MetricCard } from '@/components/shared/MetricCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonRows } from '@/components/shared/SkeletonRows';
import { AvatarInitials } from '@/components/shared/AvatarInitials';
import { useStudents } from '@/hooks/useStudents';
import { useSettings } from '@/hooks/useSettings';
import { useCompanies } from '@/hooks/useCompanies';
import { TagInput } from '@/components/ui/tag-input';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/* Real time-series data generator from students array */
const getRealChartData = (range, students) => {
  const now = new Date();
  let points, intervalMs, formatLabel;
  
  if (range === '24H') {
    points = 24;
    intervalMs = 60 * 60 * 1000;
    formatLabel = (date) => `${String(date.getHours()).padStart(2, '0')}:00`;
  } else if (range === '7D') {
    points = 7;
    intervalMs = 24 * 60 * 60 * 1000;
    formatLabel = (date) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  } else {
    points = 30;
    intervalMs = 24 * 60 * 60 * 1000;
    formatLabel = (date) => `${date.getMonth() + 1}/${date.getDate()}`;
  }

  // Pre-fill buckets
  const buckets = Array.from({ length: points }, (_, i) => {
    const d = new Date(now.getTime() - (points - 1 - i) * intervalMs);
    return {
      label: formatLabel(d),
      startTime: d.getTime(),
      endTime: d.getTime() + intervalMs,
      registrations: 0,
      verifications: 0,
    };
  });

  // Assign students to buckets
  students.forEach(student => {
    if (!student.user?.createdAt) return;
    const createdAt = new Date(student.user.createdAt).getTime();
    
    // Find bucket
    const bucket = buckets.find(b => createdAt >= b.startTime && createdAt < b.endTime);
    if (bucket) {
      bucket.registrations += 1;
      if (student.isVerified) {
        bucket.verifications += 1; // Simplification: assume verified same day
      }
    }
  });

  return buckets;
};

/* Custom minimal recharts tooltip */
const MinimalTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500 capitalize">{entry.dataKey}</span>
          <span className="ml-auto font-mono font-semibold text-slate-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview' },
  { icon: Users, label: 'Students' },
  { icon: Building2, label: 'Companies' },
  { icon: UserCheck, label: 'Verification' },
  { icon: FileText, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
];

export function AdminView() {
  const { user } = useAuth();
  const { students, loading, error: studentError, setError: setStudentError, toggleLoading, fetchStudents, handleToggleVerification } = useStudents();
  const { settings, loading: settingsLoading, saveSettings, isSaving } = useSettings();
  const { companies, loading: companiesLoading, error: companiesError, fetchCompanies, createCompany, deleteCompany } = useCompanies();
  
  // Combine errors
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('7D');
  const [activeNav, setActiveNav] = useState('Overview');
  
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', website: '', industry: '', location: '', description: '', size: '' });
  const [companyCreating, setCompanyCreating] = useState(false);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [inviting, setInviting] = useState(false);

  // View Recruiters Modal state
  const [isViewRecruitersModalOpen, setIsViewRecruitersModalOpen] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loadingCompanyDetails, setLoadingCompanyDetails] = useState(false);

  // Delete Company Modal state
  const [isDeleteCompanyModalOpen, setIsDeleteCompanyModalOpen] = useState(false);
  const [consentText, setConsentText] = useState('');
  const [deletingCompany, setDeletingCompany] = useState(false);
  
  const [localSettings, setLocalSettings] = useState({
    allowedColleges: [],
    allowedCourses: [],
    allowedEmailDomains: [],
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (studentError || companiesError) {
      setError(studentError || companiesError);
    }
  }, [studentError, companiesError]);

  React.useEffect(() => {
    if (settings && !settingsLoading) {
      setLocalSettings({
        allowedColleges: settings.allowedColleges || [],
        allowedCourses: settings.allowedCourses || [],
        allowedEmailDomains: settings.allowedEmailDomains || [],
      });
      setHasUnsavedChanges(false);
      setSaveSuccess(false);
    }
  }, [settings, settingsLoading]);

  // Deep comparison to detect changes
  React.useEffect(() => {
    if (!settings) return;
    const isDifferent = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
    if (
      isDifferent(localSettings.allowedColleges, settings.allowedColleges || []) ||
      isDifferent(localSettings.allowedCourses, settings.allowedCourses || []) ||
      isDifferent(localSettings.allowedEmailDomains, settings.allowedEmailDomains || [])
    ) {
      setHasUnsavedChanges(true);
      setSaveSuccess(false);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [localSettings, settings]);

  const handleCancelSettings = () => {
    if (settings) {
      setLocalSettings({
        allowedColleges: settings.allowedColleges || [],
        allowedCourses: settings.allowedCourses || [],
        allowedEmailDomains: settings.allowedEmailDomains || [],
      });
      setHasUnsavedChanges(false);
      setSaveSuccess(false);
      setError(null);
    }
  };

  const handleSaveSettings = async () => {
    const success = await saveSettings(localSettings);
    if (success) {
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setError("Unable to save configuration. Please try again.");
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setCompanyCreating(true);
    const res = await createCompany(newCompany);
    if (res.success) {
      setIsCompanyModalOpen(false);
      setNewCompany({ name: '', website: '', industry: '', location: '', description: '', size: '' });
      fetchCompanies();
    } else {
      setError(res.message);
    }
    setCompanyCreating(false);
  };

  const handleInviteRecruiter = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const token = localStorage.getItem('hiring_portal_token');
      const res = await fetch(`/api/v1/companies/${selectedCompanyId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await res.json();
      if (data.success) {
        setIsInviteModalOpen(false);
        setInviteEmail('');
        fetchCompanies();
      } else {
        setError(data.message || 'Failed to send invite.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send invite.');
    } finally {
      setInviting(false);
    }
  };

  const handleViewRecruiters = async (companyId) => {
    setSelectedCompanyId(companyId);
    setIsViewRecruitersModalOpen(true);
    setLoadingCompanyDetails(true);
    try {
      const token = localStorage.getItem('hiring_portal_token');
      const res = await fetch(`/api/v1/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setCompanyDetails(data.company);
      } else {
        setError(data.message || 'Failed to fetch company details');
      }
    } catch (err) {
      setError('Failed to fetch company details');
    } finally {
      setLoadingCompanyDetails(false);
    }
  };

  const handleDeleteCompanyClick = (company) => {
    setSelectedCompanyId(company.id);
    setCompanyDetails(company);
    setConsentText('');
    setIsDeleteCompanyModalOpen(true);
  };

  const handleConfirmDeleteCompany = async (e) => {
    e.preventDefault();
    if (consentText !== 'I UNDERSTAND') return;
    setDeletingCompany(true);
    const res = await deleteCompany(selectedCompanyId);
    if (res.success) {
      setIsDeleteCompanyModalOpen(false);
      fetchCompanies();
    } else {
      setError(res.message);
    }
    setDeletingCompany(false);
  };

  const chartData = useMemo(() => getRealChartData(timeRange, students), [timeRange, students]);

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.college || '').toLowerCase().includes(q) ||
      (s.user?.email || '').toLowerCase().includes(q)
    );
  });

  const verifiedCount = students.filter((s) => s.isVerified).length;
  const pendingCount = students.length - verifiedCount;
  const verificationRate = students.length > 0 ? Math.round((verifiedCount / students.length) * 100) : 0;

  const renderStudentTable = (dataToRender, title, subtitle) => (
    <Card className="shadow-none border-slate-200 bg-white overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[13px] font-semibold text-slate-800">{title}</CardTitle>
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-300" />
            <Input type="text" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-7 text-xs bg-slate-50/50 border-slate-200 shadow-none placeholder:text-slate-300 focus-visible:ring-1 focus-visible:ring-slate-300" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-3">
        {loading ? (
          <SkeletonRows count={4} />
        ) : dataToRender.length === 0 ? (
          <EmptyState icon={Users} title="No results" subtitle="Try a different search query" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="h-8 text-[10px]">Student</TableHead>
                <TableHead className="h-8 text-[10px]">Institution</TableHead>
                <TableHead className="h-8 text-[10px]">Skills</TableHead>
                <TableHead className="h-8 text-[10px] text-center">Status</TableHead>
                <TableHead className="h-8 text-[10px] text-right pr-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataToRender.map((student) => {
                const isToggling = toggleLoading[student.id];
                return (
                  <TableRow key={student.id} className="border-slate-50 hover:bg-slate-50/50">
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <AvatarInitials name={student.fullName} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{student.fullName}</p>
                          <p className="text-[10px] text-slate-300 font-mono truncate">{student.user?.email || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-xs text-slate-700 font-medium">{student.college || '—'}</span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(student.skills || []).slice(0, 3).map((sk, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[9px] px-1.5 py-0 font-mono font-normal bg-slate-50 text-slate-500 border border-slate-100 rounded shadow-none">{sk}</Badge>
                        ))}
                        {(student.skills?.length || 0) > 3 && (
                          <span className="text-[9px] text-slate-300 font-mono self-center">+{student.skills.length - 3}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <Badge variant="outline" className={`h-5 px-2 text-[10px] font-medium shadow-none ${student.isVerified ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                        <span className={`w-1 h-1 rounded-full mr-1.5 ${student.isVerified ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {student.isVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-right pr-4">
                      <Button variant="ghost" size="sm" disabled={isToggling} onClick={() => handleToggleVerification(student)} className={`h-6 px-2.5 text-[10px] font-medium shadow-none ${student.isVerified ? 'text-slate-400 hover:text-red-600 hover:bg-red-50/50' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50'}`}>
                        {isToggling ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : student.isVerified ? (
                          'Revoke'
                        ) : (
                          <>Verify<ChevronRight className="w-3 h-3 ml-0.5" /></>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout
      role="Admin"
      sidebarItems={SIDEBAR_ITEMS}
      activeNav={activeNav}
      onNavChange={setActiveNav}
      footer={<p className="text-[10px] text-slate-400 font-mono">v2.4.0</p>}
    >
      {/* Create Company Modal */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Create New Company</h2>
              <button onClick={() => setIsCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name *</label>
                <Input required value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})} placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Website</label>
                <Input value={newCompany.website} onChange={(e) => setNewCompany({...newCompany, website: e.target.value})} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Industry</label>
                  <Input value={newCompany.industry} onChange={(e) => setNewCompany({...newCompany, industry: e.target.value})} placeholder="Technology" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Company Size</label>
                  <Input value={newCompany.size} onChange={(e) => setNewCompany({...newCompany, size: e.target.value})} placeholder="100-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Location</label>
                <Input value={newCompany.location} onChange={(e) => setNewCompany({...newCompany, location: e.target.value})} placeholder="City, Country" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsCompanyModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={companyCreating} className="bg-black text-white hover:bg-slate-800">
                  {companyCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Create Company'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Recruiter Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Invite Recruiter</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInviteRecruiter} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Recruiter Email *</label>
                <Input required type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="recruiter@example.com" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={inviting} className="bg-indigo-600 text-white hover:bg-indigo-700">
                  {inviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <><Send className="w-3.5 h-3.5 mr-1.5" /> Send Invite</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Company Modal */}
      {isDeleteCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <Trash2 className="w-5 h-5 text-red-500 mr-2" /> Delete Company
              </h2>
              <button onClick={() => setIsDeleteCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              You are about to delete <strong>{companyDetails?.name}</strong>. This action will delete pending invitations and disable dashboard access for its recruiters. This action cannot be undone.
            </p>
            <form onSubmit={handleConfirmDeleteCompany} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Type "I UNDERSTAND" to confirm</label>
                <Input required value={consentText} onChange={(e) => setConsentText(e.target.value)} placeholder="I UNDERSTAND" className="h-8 text-xs border-red-200 focus:border-red-500 focus:ring-red-500" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsDeleteCompanyModalOpen(false)} className="h-8 text-xs shadow-none">Cancel</Button>
                <Button type="submit" disabled={deletingCompany || consentText !== 'I UNDERSTAND'} className="h-8 text-xs bg-red-600 text-white hover:bg-red-700 shadow-none">
                  {deletingCompany ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : 'Delete Company'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Recruiters Modal */}
      {isViewRecruitersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{companyDetails?.name} Recruiters</h2>
                <p className="text-xs text-slate-500">Active recruiters and pending invitations</p>
              </div>
              <button onClick={() => setIsViewRecruitersModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingCompanyDetails ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>
              ) : (
                <div className="space-y-6">
                  {/* Active Recruiters */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Active Accounts</h3>
                    {companyDetails?.recruiters?.length > 0 ? (
                      <div className="border border-slate-100 rounded-md overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="h-8 text-[10px]">Email</TableHead>
                              <TableHead className="h-8 text-[10px]">Joined</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {companyDetails.recruiters.map((rec) => (
                              <TableRow key={rec.id} className="hover:bg-slate-50/50">
                                <TableCell className="py-2 text-xs text-slate-800">{rec.user.email}</TableCell>
                                <TableCell className="py-2 text-xs text-slate-500">{new Date(rec.user.createdAt).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No active recruiters.</p>
                    )}
                  </div>

                  {/* Pending Invitations */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Pending Invitations</h3>
                    {companyDetails?.invitations?.length > 0 ? (
                      <div className="border border-slate-100 rounded-md overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="h-8 text-[10px]">Email</TableHead>
                              <TableHead className="h-8 text-[10px]">Status</TableHead>
                              <TableHead className="h-8 text-[10px]">Sent</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {companyDetails.invitations.map((inv) => (
                              <TableRow key={inv.id} className="hover:bg-slate-50/50">
                                <TableCell className="py-2 text-xs text-slate-800">{inv.email}</TableCell>
                                <TableCell className="py-2">
                                  <Badge variant="outline" className={`h-4 px-1.5 text-[9px] shadow-none ${inv.status === 'ACCEPTED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{inv.status}</Badge>
                                </TableCell>
                                <TableCell className="py-2 text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No invitations.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <Button variant="outline" onClick={() => setIsViewRecruitersModalOpen(false)} className="h-8 text-xs shadow-none">Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{activeNav}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeNav === 'Overview' && 'System administration & student verification'}
            {activeNav === 'Students' && 'Browse and manage all students'}
            {activeNav === 'Companies' && 'Manage participating companies on the platform'}
            {activeNav === 'Verification' && 'Review pending verifications'}
            {activeNav === 'Reports' && 'Analytics and exports'}
            {activeNav === 'Settings' && 'Manage how the platform handles student onboarding and verification.'}
          </p>
        </div>
        {activeNav === 'Overview' && (
          <Button variant="outline" size="sm" onClick={fetchStudents} disabled={loading} className="h-7 px-2.5 text-[11px] border-slate-200 text-slate-500 hover:text-slate-800 shadow-none">
            <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        )}
        {activeNav === 'Companies' && (
          <Button size="sm" onClick={() => setIsCompanyModalOpen(true)} className="h-7 px-3 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-none">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Company
          </Button>
        )}
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* ──── Overview Tab ──── */}
      {activeNav === 'Overview' && (
      <>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Students"
          value={loading ? '—' : students.length}
          icon={Users}
          description="Registered accounts"
          change="+12%"
          trend="up"
          color="subtle-blue"
        />
        <MetricCard
          label="Verified"
          value={loading ? '—' : verifiedCount}
          icon={ShieldCheck}
          description="Identity confirmed"
          change={`${verificationRate}% rate`}
          trend="up"
          color="light-blue"
        />
        <MetricCard
          label="Pending Review"
          value={loading ? '—' : pendingCount}
          icon={Clock}
          description="Awaiting verification"
          change={pendingCount > 0 ? 'Action needed' : 'All clear'}
          trend={pendingCount > 0 ? 'down' : 'up'}
          color="light-green"
        />
        <MetricCard
          label="Avg. Processing"
          value="1.2d"
          icon={Activity}
          description="Verification turnaround"
          color="light-pink"
        />
      </div>

      {/* Chart Section */}
      <Card className="shadow-none border-slate-200 bg-white">
        <CardHeader className="pb-0 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <CardTitle className="text-[13px] font-semibold text-slate-800">Activity</CardTitle>
            </div>
            <Tabs defaultValue="7D" onValueChange={setTimeRange}>
              <TabsList className="bg-slate-100/80 h-7">
                <TabsTrigger value="24H">24H</TabsTrigger>
                <TabsTrigger value="7D">7D</TabsTrigger>
                <TabsTrigger value="30D">30D</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillVer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#334155" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'ui-monospace, monospace' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'ui-monospace, monospace' }} />
                <Tooltip content={<MinimalTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="registrations" stroke="#94a3b8" strokeWidth={1.5} fill="url(#fillReg)" dot={false} activeDot={{ r: 3, fill: '#64748b', stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="verifications" stroke="#334155" strokeWidth={1.5} fill="url(#fillVer)" dot={false} activeDot={{ r: 3, fill: '#1e293b', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="w-2 h-[2px] rounded-full bg-slate-400" />Registrations
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="w-2 h-[2px] rounded-full bg-slate-800" />Verifications
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {renderStudentTable(
        filteredStudents, 
        "Student Roster", 
        loading ? '—' : `${students.length} records · ${verifiedCount} verified`
      )}
      </>
      )}

      {/* ──── Students Tab ──── */}
      {activeNav === 'Students' && (
        <div className="pt-2">
          {renderStudentTable(
            filteredStudents, 
            "Student Directory", 
            loading ? '—' : `Showing ${filteredStudents.length} of ${students.length} students`
          )}
        </div>
      )}

      {/* ──── Companies Tab ──── */}
      {activeNav === 'Companies' && (
        <div className="pt-2">
          <Card className="shadow-none border-slate-200 bg-white overflow-hidden">
            <CardContent className="p-0">
              {companiesLoading ? (
                <SkeletonRows count={4} />
              ) : companies.length === 0 ? (
                <EmptyState icon={Building2} title="No companies found" subtitle="Get started by creating a new company" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="h-8 text-[10px]">Company</TableHead>
                      <TableHead className="h-8 text-[10px]">Industry</TableHead>
                      <TableHead className="h-8 text-[10px]">Location</TableHead>
                      <TableHead className="h-8 text-[10px] text-center">Recruiters</TableHead>
                      <TableHead className="h-8 text-[10px] text-center">Status</TableHead>
                      <TableHead className="h-8 text-[10px] text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id} className="border-slate-50 hover:bg-slate-50/50">
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            <AvatarInitials name={company.name} />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-800 truncate">{company.name}</p>
                              {company.website && (
                                <p className="text-[10px] text-slate-400 font-mono truncate">{company.website}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-slate-600">{company.industry || '—'}</TableCell>
                        <TableCell className="py-2.5 text-xs text-slate-600">{company.location || '—'}</TableCell>
                        <TableCell className="py-2.5 text-center text-xs text-slate-600 font-medium">{company._count?.recruiters || 0}</TableCell>
                        <TableCell className="py-2.5 text-center">
                          <Badge variant="outline" className={`h-5 px-2 text-[10px] font-medium shadow-none border-emerald-200 bg-emerald-50/60 text-emerald-700`}>
                            {company.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 text-right pr-4">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewRecruiters(company.id)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 shadow-none"
                              title="View Recruiters"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSelectedCompanyId(company.id);
                                setIsInviteModalOpen(true);
                              }}
                              className="h-6 w-6 p-0 text-indigo-500 hover:text-indigo-700 shadow-none"
                              title="Invite Recruiter"
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteCompanyClick(company)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 shadow-none"
                              title="Delete Company"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ──── Verification Tab ──── */}
      {activeNav === 'Verification' && (
        <div className="pt-2">
          {renderStudentTable(
            filteredStudents.filter(s => !s.isVerified), 
            "Verification Queue", 
            loading ? '—' : `${pendingCount} students awaiting verification`
          )}
        </div>
      )}

      {/* ──── Reports Tab ──── */}
      {activeNav === 'Reports' && (
        <EmptyState icon={FileText} title="Reports" subtitle="Analytics and export tools coming soon" />
      )}

      {/* ──── Settings Tab ──── */}
      {activeNav === 'Settings' && (
        <div className="max-w-3xl mt-4 space-y-5 pb-8">
          
          {/* STUDENT ONBOARDING SECTION */}
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-semibold text-slate-900">Student Onboarding</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Control which colleges and programs students can select during onboarding.</p>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {settingsLoading ? (
                <SkeletonRows count={2} />
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Allowed Colleges</label>
                    <p className="text-[11px] text-slate-500 mb-1.5">Colleges available in the student onboarding form.</p>
                    <TagInput 
                      value={localSettings.allowedColleges}
                      onChange={val => setLocalSettings(prev => ({ ...prev, allowedColleges: val }))}
                      placeholder="Type a college and press Enter"
                      itemName="college"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Allowed Courses / Degrees</label>
                    <p className="text-[11px] text-slate-500 mb-1.5">Programs available in the student onboarding form.</p>
                    <TagInput 
                      value={localSettings.allowedCourses}
                      onChange={val => setLocalSettings(prev => ({ ...prev, allowedCourses: val }))}
                      placeholder="Type a course or degree and press Enter"
                      itemName="program"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* VERIFICATION SECTION */}
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-semibold text-slate-900">Verification</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Configure information used for future student verification.</p>
            </CardHeader>
            <CardContent className="p-5">
              {settingsLoading ? (
                <SkeletonRows count={1} />
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Allowed College Email Domains</label>
                  <p className="text-[11px] text-slate-500 mb-1.5">Domains that can be used for college email validation.</p>
                  <TagInput 
                    value={localSettings.allowedEmailDomains}
                    onChange={val => setLocalSettings(prev => ({ ...prev, allowedEmailDomains: val }))}
                    placeholder="Type an email domain and press Enter"
                    validate={(domain) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)}
                    itemName="domain"
                    invalidMessage="Enter a valid email domain."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* SAVE ACTIONS */}
          {!settingsLoading && (
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-1">
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving || (!hasUnsavedChanges && !saveSuccess)}
                className={`h-9 px-5 text-xs font-medium shadow-none transition-colors w-full sm:w-auto ${
                  saveSuccess 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-100' 
                    : hasUnsavedChanges 
                      ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isSaving ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Saving...</>
                ) : saveSuccess ? (
                  <><Check className="h-3.5 w-3.5 mr-2" /> Configuration saved</>
                ) : (
                  'Save changes'
                )}
              </Button>
              
              {hasUnsavedChanges && !isSaving && (
                <Button 
                  variant="ghost" 
                  onClick={handleCancelSettings}
                  className="h-9 px-4 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 w-full sm:w-auto"
                >
                  Cancel
                </Button>
              )}

              {hasUnsavedChanges && (
                <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md sm:ml-auto self-start sm:self-center">
                  Unsaved changes
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminView;
