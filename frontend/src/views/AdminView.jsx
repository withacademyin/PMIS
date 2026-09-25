'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, ShieldCheck, Clock, Search, Loader2, RefreshCw,
  Activity, BarChart3, ChevronRight, LayoutDashboard, Settings, 
  Building2, Plus, X, Eye, Trash2, Send, CheckCircle2
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
import { api } from '@/lib/api';

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview' },
  { icon: Users, label: 'Workers' },
  { icon: Building2, label: 'Districts / Nodes' },
  { icon: Settings, label: 'Settings' },
];

export function AdminView() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('Overview');
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data State
  const [workers, setWorkers] = useState([]);
  const [itis, setItis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState({});

  // Modals
  const [isItiModalOpen, setIsItiModalOpen] = useState(false);
  const [newIti, setNewIti] = useState({ name: '', district: '', state: '', address: '' });
  const [isCreatingIti, setIsCreatingIti] = useState(false);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [workersRes, itisRes] = await Promise.all([
        api.getWorkers(),
        api.getITIs()
      ]);
      if (workersRes.success) setWorkers(workersRes.workers || []);
      if (itisRes.success) setItis(itisRes.itis || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleVerification = async (worker) => {
    const nextStatus = !worker.isVerified;
    setToggleLoading((prev) => ({ ...prev, [worker.id]: true }));
    setError(null);
    try {
      const res = await api.verifyWorker(worker.id, nextStatus);
      if (res.success && res.worker) {
        setWorkers((prev) =>
          prev.map((w) => (w.id === worker.id ? { ...w, isVerified: res.worker.isVerified } : w))
        );
      } else {
        throw new Error('Verification update failed.');
      }
    } catch (err) {
      setError(err.message || 'Could not update worker verification.');
    } finally {
      setToggleLoading((prev) => ({ ...prev, [worker.id]: false }));
    }
  };

  const handleCreateIti = async (e) => {
    e.preventDefault();
    setIsCreatingIti(true);
    try {
      const res = await api.createITI(newIti);
      if (res.success) {
        setIsItiModalOpen(false);
        setNewIti({ name: '', district: '', state: '', address: '' });
        fetchData();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to create ITI');
    } finally {
      setIsCreatingIti(false);
    }
  };

  const handleDeleteIti = async (id) => {
    if (!confirm('Are you sure you want to delete this ITI?')) return;
    try {
      const res = await api.deleteITI(id);
      if (res.success) fetchData();
      else setError(res.message);
    } catch (err) {
      setError(err.message || 'Failed to delete ITI');
    }
  };

  const handleInviteOfficer = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    setError(null);
    setInviteSuccessMsg('');
    try {
      const res = await api.inviteOfficer(selectedDistrict, inviteEmail);
      if (res.success) {
        setInviteSuccessMsg(`Invite sent! Link: ${res.inviteLink}`);
        setTimeout(() => {
          setIsInviteModalOpen(false);
          setInviteEmail('');
          setInviteSuccessMsg('');
        }, 5000);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const q = searchQuery.toLowerCase();
    return (
      (w.fullName || '').toLowerCase().includes(q) ||
      (w.trade || '').toLowerCase().includes(q) ||
      (w.user?.email || '').toLowerCase().includes(q)
    );
  });

  const groupedNodes = useMemo(() => {
    const nodes = {};
    itis.forEach((iti) => {
      const d = iti.district || 'Unknown District';
      if (!nodes[d]) {
        nodes[d] = { district: d, itiCount: 0, workerCount: 0, itis: [] };
      }
      nodes[d].itis.push(iti);
      nodes[d].itiCount += 1;
      // iti._count is populated from backend (workers count)
      nodes[d].workerCount += (iti._count?.workers || 0);
    });
    return Object.values(nodes);
  }, [itis]);

  const verifiedCount = workers.filter((w) => w.isVerified).length;
  const pendingCount = workers.length - verifiedCount;
  const verificationRate = workers.length > 0 ? Math.round((verifiedCount / workers.length) * 100) : 0;

  const renderWorkerTable = (dataToRender, title, subtitle) => (
    <Card className="shadow-none border-slate-200 bg-white overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-[13px] font-semibold text-slate-800">{title}</CardTitle>
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-300" />
            <Input type="text" placeholder="Search workers…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-7 text-xs bg-slate-50/50 border-slate-200 shadow-none placeholder:text-slate-300 focus-visible:ring-1 focus-visible:ring-slate-300" />
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
                <TableHead className="h-8 text-[10px]">Worker</TableHead>
                <TableHead className="h-8 text-[10px]">Trade</TableHead>
                <TableHead className="h-8 text-[10px]">ITI</TableHead>
                <TableHead className="h-8 text-[10px] text-center">Status</TableHead>
                <TableHead className="h-8 text-[10px] text-right pr-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataToRender.map((worker) => {
                const isToggling = toggleLoading[worker.id];
                return (
                  <TableRow key={worker.id} className="border-slate-50 hover:bg-slate-50/50">
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <AvatarInitials name={worker.fullName} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{worker.fullName}</p>
                          <p className="text-[10px] text-slate-300 font-mono truncate">{worker.user?.email || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-xs text-slate-700 font-medium">{worker.trade || '—'}</span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-xs text-slate-500">{worker.iti?.name || '—'}</span>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <Badge variant="outline" className={`h-5 px-2 text-[10px] font-medium shadow-none ${worker.isVerified ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                        <span className={`w-1 h-1 rounded-full mr-1.5 ${worker.isVerified ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {worker.isVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-right pr-4">
                      <Button variant="ghost" size="sm" disabled={isToggling} onClick={() => handleToggleVerification(worker)} className={`h-6 px-2.5 text-[10px] font-medium shadow-none ${worker.isVerified ? 'text-slate-400 hover:text-red-600 hover:bg-red-50/50' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50'}`}>
                        {isToggling ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : worker.isVerified ? (
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
      footer={<p className="text-[10px] text-slate-400 font-mono">v3.0.0 ITI Portal</p>}
    >
      {/* Create ITI Modal */}
      {isItiModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Add ITI to a District Node</h2>
              <button onClick={() => setIsItiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateIti} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ITI Name *</label>
                <Input required value={newIti.name} onChange={(e) => setNewIti({...newIti, name: e.target.value})} placeholder="e.g. Government ITI Lucknow" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">District *</label>
                <Input required value={newIti.district} onChange={(e) => setNewIti({...newIti, district: e.target.value})} placeholder="Lucknow" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">State *</label>
                <Input required value={newIti.state} onChange={(e) => setNewIti({...newIti, state: e.target.value})} placeholder="Uttar Pradesh" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Address</label>
                <Input value={newIti.address} onChange={(e) => setNewIti({...newIti, address: e.target.value})} placeholder="Full address" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsItiModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreatingIti} className="bg-indigo-600 text-white hover:bg-indigo-700">
                  {isCreatingIti ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Add ITI'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Officer Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Invite Nodal Officer</h2>
              <button onClick={() => {setIsInviteModalOpen(false); setInviteSuccessMsg('');}} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {inviteSuccessMsg ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg text-sm mb-4">
                <div className="flex items-center mb-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Invitation Created
                </div>
                <p className="break-all text-xs">{inviteSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleInviteOfficer} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Target Node (District)</label>
                  <Input disabled value={selectedDistrict} className="bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Officer Email *</label>
                  <Input required type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="officer@example.com" />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isInviting} className="bg-indigo-600 text-white hover:bg-indigo-700">
                    {isInviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <><Send className="w-3.5 h-3.5 mr-1.5" /> Send Invite</>}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{activeNav}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeNav === 'Overview' && 'System administration & worker verification'}
            {activeNav === 'Workers' && 'Browse and manage all registered workers'}
            {activeNav === 'Districts / Nodes' && 'Manage District Nodes and invite Nodal Officers'}
            {activeNav === 'Settings' && 'Manage system configurations'}
          </p>
        </div>
        {activeNav === 'Overview' && (
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-7 px-2.5 text-[11px] border-slate-200 text-slate-500 hover:text-slate-800 shadow-none">
            <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        )}
        {activeNav === 'Districts / Nodes' && (
          <Button size="sm" onClick={() => setIsItiModalOpen(true)} className="h-7 px-3 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-none">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add ITI to Node
          </Button>
        )}
      </div>

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* ──── Overview Tab ──── */}
      {activeNav === 'Overview' && (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Workers" value={loading ? '—' : workers.length} icon={Users} description="Registered workers" trend="up" color="subtle-blue" />
          <MetricCard label="Verified Workers" value={loading ? '—' : verifiedCount} icon={ShieldCheck} description="Identity confirmed" change={`${verificationRate}% rate`} trend="up" color="light-blue" />
          <MetricCard label="Pending Review" value={loading ? '—' : pendingCount} icon={Clock} description="Awaiting verification" change={pendingCount > 0 ? 'Action needed' : 'All clear'} trend={pendingCount > 0 ? 'down' : 'up'} color="light-green" />
          <MetricCard label="Registered ITIs" value={loading ? '—' : itis.length} icon={Building2} description="Active nodes" color="light-pink" />
        </div>
        {renderWorkerTable(filteredWorkers, "Worker Roster", loading ? '—' : `${workers.length} records · ${verifiedCount} verified`)}
      </div>
      )}

      {/* ──── Workers Tab ──── */}
      {activeNav === 'Workers' && (
        <div className="space-y-6">
          {renderWorkerTable(filteredWorkers, "Worker Directory", loading ? '—' : `Showing ${filteredWorkers.length} of ${workers.length} workers`)}
        </div>
      )}

      {/* Districts / Nodes Tab */}
      {activeNav === 'Districts / Nodes' && (
        <div className="space-y-6">
          <Card className="shadow-none border-slate-200 bg-white overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <SkeletonRows count={4} />
              ) : groupedNodes.length === 0 ? (
                <EmptyState icon={Building2} title="No Nodes found" subtitle="Get started by adding an ITI to a district" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="h-8 text-[10px]">District (Node)</TableHead>
                      <TableHead className="h-8 text-[10px]">Total ITIs</TableHead>
                      <TableHead className="h-8 text-[10px]">Registered Workers</TableHead>
                      <TableHead className="h-8 text-[10px] text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedNodes.map((node) => (
                      <TableRow key={node.district} className="border-slate-50 hover:bg-slate-50/50">
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            <AvatarInitials name={node.district} />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-800 truncate">{node.district}</p>
                              <p className="text-[10px] text-slate-400 font-mono truncate">Nodal Center</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-slate-600">{node.itiCount}</TableCell>
                        <TableCell className="py-2.5 text-xs text-slate-600">{node.workerCount}</TableCell>
                        <TableCell className="py-2.5 text-right pr-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedDistrict(node.district);
                              setIsInviteModalOpen(true);
                            }}
                            className="h-7 text-[10px] text-indigo-600 hover:bg-indigo-50 border-indigo-100 shadow-none"
                          >
                            <Send className="w-3 h-3 mr-1.5" /> Invite Officer
                          </Button>
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

      {/* ──── Settings Tab ──── */}
      {activeNav === 'Settings' && (
        <Card className="shadow-none border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">System Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Settings have been moved to the new architecture. Admin configuration tools will be available soon.</p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}

export default AdminView;
