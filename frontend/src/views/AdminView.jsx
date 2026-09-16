'use client';

import React, { useState, useMemo } from 'react';
import {
  Users, ShieldCheck, Clock, Search, Loader2, RefreshCw,
  TrendingUp, TrendingDown, Activity, BarChart3, ChevronRight,
  LayoutDashboard, UserCheck, Settings, FileText,
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
import { TagInput } from '@/components/ui/tag-input';
import { Check } from 'lucide-react';
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
  { icon: UserCheck, label: 'Verification' },
  { icon: FileText, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
];

export function AdminView() {
  const { user } = useAuth();
  const { students, loading, error, setError, toggleLoading, fetchStudents, handleToggleVerification } = useStudents();
  const { settings, loading: settingsLoading, saveSettings, isSaving } = useSettings();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('7D');
  const [activeNav, setActiveNav] = useState('Overview');
  
  const [localSettings, setLocalSettings] = useState({
    allowedColleges: [],
    allowedCourses: [],
    allowedEmailDomains: [],
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{activeNav}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeNav === 'Overview' && 'System administration & student verification'}
            {activeNav === 'Students' && 'Browse and manage all students'}
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
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* ──── Overview Tab ──── */}
      {activeNav === 'Overview' && (
      <>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Students" value={loading ? '—' : students.length} icon={Users} description="Registered accounts" change="+12%" trend="up" />
        <MetricCard label="Verified" value={loading ? '—' : verifiedCount} icon={ShieldCheck} description="Identity confirmed" change={`${verificationRate}% rate`} trend="up" />
        <MetricCard label="Pending Review" value={loading ? '—' : pendingCount} icon={Clock} description="Awaiting verification" change={pendingCount > 0 ? 'Action needed' : 'All clear'} trend={pendingCount > 0 ? 'down' : 'up'} />
        <MetricCard label="Avg. Processing" value="1.2d" icon={Activity} description="Verification turnaround" />
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
