'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, ShieldCheck, Clock, Search, Loader2, AlertCircle, RefreshCw,
  TrendingUp, TrendingDown, Activity, BarChart3, ChevronRight,
  LayoutDashboard, UserCheck, Settings, FileText,
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

/* ────────────────────────────────────────────────────────────
   Mock time-series data generators (replace with real API)
   ──────────────────────────────────────────────────────────── */
const generateChartData = (range) => {
  const now = new Date();
  const points = range === '24H' ? 24 : range === '7D' ? 7 : 30;
  return Array.from({ length: points }, (_, i) => {
    const label =
      range === '24H'
        ? `${String(points - 1 - i).padStart(2, '0')}:00`
        : range === '7D'
          ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(now.getDay() - points + 1 + i + 7) % 7]
          : `Day ${i + 1}`;
    return {
      label,
      registrations: Math.floor(Math.random() * 12) + 1,
      verifications: Math.floor(Math.random() * 8),
    };
  });
};

/* ────────────────────────────────────────────────────────────
   Custom minimal recharts tooltip
   ──────────────────────────────────────────────────────────── */
const MinimalTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500 capitalize">{entry.dataKey}</span>
          <span className="ml-auto font-mono font-semibold text-slate-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Sidebar Navigation Items
   ──────────────────────────────────────────────────────────── */
const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: Users, label: 'Students', active: false },
  { icon: UserCheck, label: 'Verification', active: false },
  { icon: FileText, label: 'Reports', active: false },
  { icon: Settings, label: 'Settings', active: false },
];

/* ────────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────────── */
export function AdminView() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toggleLoading, setToggleLoading] = useState({});
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7D');
  const [activeNav, setActiveNav] = useState('Overview');

  const chartData = useMemo(() => generateChartData(timeRange), [timeRange]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStudents();
      if (res.success && Array.isArray(res.data)) {
        setStudents(res.data);
      } else {
        throw new Error('Failed to load students.');
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve students.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (student) => {
    const nextStatus = !student.isVerified;
    setToggleLoading((prev) => ({ ...prev, [student.id]: true }));
    setError(null);

    try {
      const res = await api.verifyStudent(student.id, nextStatus);
      if (res.success && res.data) {
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, isVerified: res.data.isVerified } : s))
        );
      } else {
        throw new Error('Verification update failed.');
      }
    } catch (err) {
      setError(err.message || 'Could not update student verification.');
    } finally {
      setToggleLoading((prev) => ({ ...prev, [student.id]: false }));
    }
  };

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

  /* ──────────────── Metric Cards Data ──────────────── */
  const metrics = [
    {
      label: 'Total Students',
      value: loading ? '—' : students.length,
      change: '+12%',
      trend: 'up',
      icon: Users,
    },
    {
      label: 'Verified',
      value: loading ? '—' : verifiedCount,
      change: `${verificationRate}%`,
      trend: 'up',
      icon: ShieldCheck,
    },
    {
      label: 'Pending Review',
      value: loading ? '—' : pendingCount,
      change: pendingCount > 0 ? 'Action needed' : 'Clear',
      trend: pendingCount > 0 ? 'down' : 'up',
      icon: Clock,
    },
    {
      label: 'Avg. Processing',
      value: '1.2d',
      change: '-8%',
      trend: 'up',
      icon: Activity,
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-57px)] overflow-hidden">

      {/* ──────────── Sidebar ──────────── */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-slate-200 bg-white pt-6 pb-6 px-3 shrink-0 overflow-y-auto">
        <div className="mb-6 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Admin</p>
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
          <p className="text-[10px] text-slate-400 font-mono">v2.4.0</p>
        </div>
      </aside>

      {/* ──────────── Main Content ──────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/60">
        <div className="px-8 py-6 space-y-6">

          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Overview</h1>
              <p className="text-xs text-slate-400 mt-0.5">System administration &amp; student verification</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStudents}
              disabled={loading}
              className="h-7 px-2.5 text-[11px] border-slate-200 text-slate-500 hover:text-slate-800 shadow-none"
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="font-medium text-red-600 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ──────────── Metric Cards ──────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.map(({ label, value, change, trend, icon: Icon }) => (
              <Card key={label} className="shadow-none border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</span>
                    <Icon className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.75} />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-semibold text-slate-900 font-mono tracking-tight leading-none">
                      {value}
                    </span>
                    <span
                      className={`text-[10px] font-medium flex items-center gap-0.5 mb-0.5 ${
                        trend === 'up' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {trend === 'up' ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      {change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ──────────── Chart Section ──────────── */}
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
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}
                    />
                    <Tooltip content={<MinimalTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
                    <Area
                      type="monotone"
                      dataKey="registrations"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      fill="url(#fillReg)"
                      dot={false}
                      activeDot={{ r: 3, fill: '#64748b', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="verifications"
                      stroke="#334155"
                      strokeWidth={1.5}
                      fill="url(#fillVer)"
                      dot={false}
                      activeDot={{ r: 3, fill: '#1e293b', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-2 h-[2px] rounded-full bg-slate-400" />
                  Registrations
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-2 h-[2px] rounded-full bg-slate-800" />
                  Verifications
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ──────────── Data Table ──────────── */}
          <Card className="shadow-none border-slate-200 bg-white overflow-hidden">
            <CardHeader className="p-4 pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-[13px] font-semibold text-slate-800">Student Roster</CardTitle>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {loading ? '—' : `${students.length} records`}
                    {' · '}
                    {loading ? '—' : `${verifiedCount} verified`}
                  </p>
                </div>
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-300" />
                  <Input
                    type="text"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-7 text-xs bg-slate-50/50 border-slate-200 shadow-none placeholder:text-slate-300 focus-visible:ring-1 focus-visible:ring-slate-300"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              {loading ? (
                <div className="p-6 space-y-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 bg-slate-50 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="mx-auto h-5 w-5 text-slate-200 mb-2" />
                  <p className="text-xs font-medium text-slate-400">No results</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">Try a different search query</p>
                </div>
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
                    {filteredStudents.map((student) => {
                      const isToggling = toggleLoading[student.id];
                      return (
                        <TableRow key={student.id} className="border-slate-50 hover:bg-slate-50/50">
                          {/* Identity */}
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                                <span className="text-[10px] font-semibold text-slate-500">
                                  {(student.fullName || '??').slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-800 truncate">{student.fullName}</p>
                                <p className="text-[10px] text-slate-300 font-mono truncate">{student.user?.email || '—'}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Institution */}
                          <TableCell className="py-2.5">
                            <span className="text-xs text-slate-500">{student.college || '—'}</span>
                          </TableCell>

                          {/* Skills */}
                          <TableCell className="py-2.5">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {(student.skills || []).slice(0, 3).map((sk, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 font-mono font-normal bg-slate-50 text-slate-500 border border-slate-100 rounded shadow-none"
                                >
                                  {sk}
                                </Badge>
                              ))}
                              {(student.skills?.length || 0) > 3 && (
                                <span className="text-[9px] text-slate-300 font-mono self-center">
                                  +{student.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-2.5 text-center">
                            <Badge
                              variant="outline"
                              className={`h-5 px-2 text-[10px] font-medium shadow-none ${
                                student.isVerified
                                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700'
                                  : 'border-slate-200 bg-slate-50 text-slate-400'
                              }`}
                            >
                              <span
                                className={`w-1 h-1 rounded-full mr-1.5 ${
                                  student.isVerified ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              />
                              {student.isVerified ? 'Verified' : 'Pending'}
                            </Badge>
                          </TableCell>

                          {/* Action */}
                          <TableCell className="py-2.5 text-right pr-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isToggling}
                              onClick={() => handleToggleVerification(student)}
                              className={`h-6 px-2.5 text-[10px] font-medium shadow-none ${
                                student.isVerified
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50/50'
                                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50'
                              }`}
                            >
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
        </div>
      </main>
    </div>
  );
}

export default AdminView;
