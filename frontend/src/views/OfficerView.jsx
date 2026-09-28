'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  Building2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Users,
  Navigation,
  MapPin,
  Compass,
  Award,
  CheckCircle2,
  Sliders,
  Filter,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Phone,
  Mail,
  Star,
  Clock,
  Send,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ContactItiModal from '@/components/ContactItiModal';

const SIDEBAR_ITEMS = [
  { id: 'requirements', icon: Briefcase, label: 'Work Requirements' },
  { id: 'itis', icon: Building2, label: 'ITI Network' },
  { id: 'shortlists', icon: Users, label: 'Shortlisted Workers' },
];

const DISTRICT_CENTROIDS = {
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Agra': { lat: 27.1767, lng: 78.0081 },
  'Varanasi': { lat: 25.3176, lng: 82.9739 },
  'Prayagraj': { lat: 25.4358, lng: 81.8463 },
  'Kanpur': { lat: 26.4499, lng: 80.3319 },
  'Kanpur Nagar': { lat: 26.4499, lng: 80.3319 },
  'Gorakhpur': { lat: 26.7606, lng: 83.3732 },
  'Meerut': { lat: 28.9845, lng: 77.7064 },
  'Bareilly': { lat: 28.3670, lng: 79.4304 },
  'Ayodhya': { lat: 26.7922, lng: 82.1998 },
  'Mathura': { lat: 27.4924, lng: 77.6737 },
  'Aligarh': { lat: 27.8974, lng: 78.0880 },
  'Ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'Gautam Buddha Nagar': { lat: 28.5355, lng: 77.3910 },
  'Jhansi': { lat: 25.4484, lng: 78.5685 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
};

const COMMON_TRADES = [
  'Electrician',
  'Fitter',
  'Welder',
  'COPA',
  'Mechanic',
  'Turner',
  'Machinist',
  'Plumber',
];

export function OfficerView() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('requirements');
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

  // Officer Location & 50km Range State
  const officerDistrict = user?.officerProfile?.district || 'Lucknow';
  const defaultCoord = DISTRICT_CENTROIDS[officerDistrict] || { lat: 26.8467, lng: 80.9462 };

  const [officerLocation, setOfficerLocation] = useState({
    name: officerDistrict,
    lat: defaultCoord.lat,
    lng: defaultCoord.lng,
    radiusKm: 50,
    isGps: false,
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [customLat, setCustomLat] = useState(defaultCoord.lat.toString());
  const [customLng, setCustomLng] = useState(defaultCoord.lng.toString());
  const [customRadius, setCustomRadius] = useState('50');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Contact ITI Modal State
  const [contactModal, setContactModal] = useState({
    isOpen: false,
    iti: null,
    requirementId: null,
    roleTitle: '',
  });

  // Active sub-tab per requirement: requirement.id -> 'applicants' | 'shortlisted' | 'rankedItis'
  const [reqSubTab, setReqSubTab] = useState({});

  // Expand AI rationale per applicant: applicant.id -> boolean
  const [expandedRationale, setExpandedRationale] = useState({});

  const handleContactIti = (iti, req = null) => {
    setContactModal({
      isOpen: true,
      iti,
      requirementId: req?.id || null,
      roleTitle: req ? `${req.title} (${req.requiredTrade})` : '',
    });
  };

  const handleUpdateApplicantStatus = async (requirementId, applicantId, status) => {
    try {
      setRequirements((prev) =>
        prev.map((r) => {
          if (r.id !== requirementId) return r;
          const updatedApplicants = (r.applicants || []).map((app) =>
            app.id === applicantId ? { ...app, status } : app
          );
          const updatedShortlisted = updatedApplicants.filter((a) =>
            ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED'].includes(a.status)
          );
          return {
            ...r,
            applicants: updatedApplicants,
            shortlisted: updatedShortlisted,
            shortlistedCount: updatedShortlisted.length,
          };
        })
      );
      await api.updateRequirementApplicantStatus(requirementId, applicantId, status);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err.message || 'Failed to update applicant status');
    }
  };

  // Nearby Top ITIs state
  const [topNearbyItis, setTopNearbyItis] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [selectedTradeFilter, setSelectedTradeFilter] = useState('');
  const [itiViewMode, setItiViewMode] = useState('nearby'); // 'nearby' | 'all'

  const fetchNearbyItis = async (loc = officerLocation, trade = selectedTradeFilter) => {
    setLoadingNearby(true);
    try {
      const res = await api.getTopNearbyITIs({
        lat: loc.lat,
        lng: loc.lng,
        radiusKm: loc.radiusKm,
        trade: trade || undefined,
        limit: 50,
      });
      if (res.success) {
        setTopNearbyItis(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load nearby ITIs:', err);
    } finally {
      setLoadingNearby(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, shortRes, itiRes] = await Promise.all([
        api.getRequirements(),
        api.getShortlists(),
        api.getITIs(),
      ]);
      if (reqRes.success) setRequirements(reqRes.data || []);
      if (shortRes.success) setShortlists(shortRes.data || []);
      if (itiRes.success) setItis(itiRes.itis || []);
      await fetchNearbyItis(officerLocation, selectedTradeFilter);
    } catch (err) {
      setError(err.message || 'Unable to load officer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDetectGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(4));
        const newLng = Number(pos.coords.longitude.toFixed(4));
        const updated = {
          ...officerLocation,
          lat: newLat,
          lng: newLng,
          name: 'My GPS Location',
          isGps: true,
        };
        setOfficerLocation(updated);
        setCustomLat(newLat.toString());
        setCustomLng(newLng.toString());
        setGpsLoading(false);
        setIsLocationModalOpen(false);
        fetchNearbyItis(updated, selectedTradeFilter);
      },
      (err) => {
        setGpsLoading(false);
        setError(`Could not access GPS location (${err.message}). Enter coordinates or choose a district.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleApplyCustomLocation = (e) => {
    e.preventDefault();
    const lat = Number(customLat);
    const lng = Number(customLng);
    const radiusKm = Number(customRadius) || 50;

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Please provide valid latitude (-90 to 90) and longitude (-180 to 180)');
      return;
    }

    const updated = {
      ...officerLocation,
      lat,
      lng,
      radiusKm,
      name: `${lat}, ${lng}`,
      isGps: false,
    };
    setOfficerLocation(updated);
    setIsLocationModalOpen(false);
    fetchNearbyItis(updated, selectedTradeFilter);
  };

  const handleDistrictSelect = (districtName) => {
    const coords = DISTRICT_CENTROIDS[districtName];
    if (!coords) return;
    const updated = {
      ...officerLocation,
      name: districtName,
      lat: coords.lat,
      lng: coords.lng,
      isGps: false,
    };
    setOfficerLocation(updated);
    setCustomLat(coords.lat.toString());
    setCustomLng(coords.lng.toString());
    setIsLocationModalOpen(false);
    fetchNearbyItis(updated, selectedTradeFilter);
  };

  const handleTradeFilterChange = (trade) => {
    setSelectedTradeFilter(trade);
    fetchNearbyItis(officerLocation, trade);
  };

  const matchITIs = async (requirement) => {
    setWorking((previous) => ({ ...previous, [requirement.id]: true }));
    setError('');
    try {
      const result = await api.matchRequirementToITIs(requirement.id, {
        lat: officerLocation.lat,
        lng: officerLocation.lng,
        radiusKm: officerLocation.radiusKm,
      });
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
    const key = recommendation.itiId || recommendation.id;
    if (workers[key]) {
      setWorkers((previous) => ({ ...previous, [key]: null }));
      return;
    }
    setWorking((previous) => ({ ...previous, [key]: true }));
    try {
      const trade = requirement?.requiredTrade || selectedTradeFilter || '';
      const reqId = requirement?.id || '';
      const result = await api.getITIWorkers(key, trade, reqId);
      if (result.success) setWorkers((previous) => ({ ...previous, [key]: result.data || [] }));
    } catch (err) {
      setError(err.message || 'Unable to load ITI candidates');
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
      setJob({ title: '', description: '', requiredTrade: '' });
      setActiveNav('requirements');
      // Re-fetch all requirements to populate generated dummy applicants and AI confidence scores
      const reqRes = await api.getRequirements();
      if (reqRes.success) setRequirements(reqRes.data || []);
      try {
        await matchITIs(result.data);
      } catch {
        setError('Requirement posted, but matching ITIs failed. Use “Match ITIs” to retry.');
      }
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
        {/* Top Header & Refresh */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ITI Network Matching & Range Finder</h1>
            <p className="mt-1 text-sm text-slate-500">
              Rank and match top vocational institutes within {officerLocation.radiusKm} km of your operational location.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={loading ? 'mr-2 h-3.5 w-3.5 animate-spin' : 'mr-2 h-3.5 w-3.5'} />
            Refresh
          </Button>
        </div>

        {/* Officer Location & Range Banner */}
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-indigo-600 p-2.5 text-white shadow-sm">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Officer Reference Origin</span>
                  {officerLocation.isGps && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                      Live GPS
                    </span>
                  )}
                </div>
                <p className="text-base font-bold text-slate-900">
                  {officerLocation.name}
                  <span className="ml-2 font-mono text-xs font-normal text-slate-500">
                    ({officerLocation.lat.toFixed(4)}° N, {officerLocation.lng.toFixed(4)}° E)
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Radius range: <strong className="text-indigo-900">{officerLocation.radiusKm} km</strong> • Top {topNearbyItis.length} ITIs ranked by proximity, trade capacity & certified talent
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetectGps}
                disabled={gpsLoading}
                className="border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
              >
                {gpsLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Navigation className="mr-1.5 h-3.5 w-3.5" />}
                Use Current Location (GPS)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLocationModalOpen(!isLocationModalOpen)}
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <Sliders className="mr-1.5 h-3.5 w-3.5" />
                Change Range / Location
              </Button>
            </div>
          </div>

          {/* Expandable Location Configuration Panel */}
          {isLocationModalOpen && (
            <div className="mt-4 border-t border-indigo-100/80 pt-4">
              <form onSubmit={handleApplyCustomLocation} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Quick Select District Node</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(DISTRICT_CENTROIDS).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDistrictSelect(d)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          officerLocation.name === d
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Latitude</label>
                    <Input
                      type="number"
                      step="any"
                      required
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      placeholder="e.g. 26.8467"
                      className="bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Longitude</label>
                    <Input
                      type="number"
                      step="any"
                      required
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      placeholder="e.g. 80.9462"
                      className="bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Range Radius</label>
                    <select
                      value={customRadius}
                      onChange={(e) => setCustomRadius(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    >
                      <option value="25">25 km (Local Metro)</option>
                      <option value="50">50 km (Standard Range)</option>
                      <option value="75">75 km (Extended District)</option>
                      <option value="100">100 km (Regional Hub)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsLocationModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                    Apply Location & Rank ITIs
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* WORK REQUIREMENTS TAB */}
        {activeNav === 'requirements' && (
          <div className="space-y-4">
            <form onSubmit={postJob} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="font-semibold text-slate-900">Post a Work Requirement</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Institutes within {officerLocation.radiusKm} km will be automatically ranked based on trade capacity and available certified candidates.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input required placeholder="Job title (e.g. Industrial Electrician Requirement)" value={job.title} onChange={(event) => setJob({ ...job, title: event.target.value })} />
                <Input required placeholder="Trade, e.g. Electrician, Fitter, Welder" value={job.requiredTrade} onChange={(event) => setJob({ ...job, requiredTrade: event.target.value })} />
              </div>
              <textarea
                required
                className="mt-3 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="Describe job scope, required certifications, experience needed..."
                value={job.description}
                onChange={(event) => setJob({ ...job, description: event.target.value })}
              />
              <div className="mt-3 flex justify-end">
                <Button type="submit" disabled={postingJob} className="bg-indigo-600 text-white hover:bg-indigo-700">
                  {postingJob ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Briefcase className="mr-2 h-3.5 w-3.5" />}
                  Post Requirement & Match Nearby ITIs
                </Button>
              </div>
            </form>

            {loading ? (
              <p className="text-sm text-slate-400">Loading requirements...</p>
            ) : requirements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
                No work requirements created yet. Post a job to match top ITIs.
              </div>
            ) : (
              requirements.map((requirement) => {
                const matches = recommendations[requirement.id] || [];
                const applicants = requirement.applicants || [];
                const shortlisted = applicants.filter((a) =>
                  ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED'].includes(a.status)
                );
                const activeTab = reqSubTab[requirement.id] || 'applicants';

                return (
                  <section key={requirement.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    {/* Job Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{requirement.title}</h3>
                          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                            {requirement.requiredTrade}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-slate-600">{requirement.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => matchITIs(requirement)}
                        disabled={working[requirement.id]}
                        className="shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"
                      >
                        {working[requirement.id] ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Compass className="mr-1.5 h-3.5 w-3.5" />}
                        Re-Rank Within {officerLocation.radiusKm} km
                      </Button>
                    </div>

                    {/* Metrics Strip */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/70 px-2.5 py-1 text-indigo-800 border border-indigo-100 font-semibold">
                        <Users className="h-3.5 w-3.5 text-indigo-600" />
                        <span>{applicants.length} Total Applicants</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50/70 px-2.5 py-1 text-amber-800 border border-amber-200/60 font-semibold">
                        <Star className="h-3.5 w-3.5 text-amber-600" />
                        <span>{shortlisted.length} Shortlisted</span>
                      </div>
                      {requirement.topConfidenceScore && (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/70 px-2.5 py-1 text-emerald-800 border border-emerald-200/60 font-semibold">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{requirement.topConfidenceScore}% Top AI Match</span>
                        </div>
                      )}
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <span>{matches.length} ITIs In 50km</span>
                      </div>
                    </div>

                    {/* Sub-Tab Navigation */}
                    <div className="mt-4 flex border-b border-slate-200">
                      <button
                        onClick={() => setReqSubTab((prev) => ({ ...prev, [requirement.id]: 'applicants' }))}
                        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
                          activeTab === 'applicants'
                            ? 'border-indigo-600 text-indigo-700'
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Users className="h-3.5 w-3.5" />
                        Applicants & AI Match ({applicants.length})
                      </button>
                      <button
                        onClick={() => setReqSubTab((prev) => ({ ...prev, [requirement.id]: 'shortlisted' }))}
                        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
                          activeTab === 'shortlisted'
                            ? 'border-indigo-600 text-indigo-700'
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Star className="h-3.5 w-3.5" />
                        Shortlisted Candidates ({shortlisted.length})
                      </button>
                      <button
                        onClick={() => setReqSubTab((prev) => ({ ...prev, [requirement.id]: 'rankedItis' }))}
                        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all ${
                          activeTab === 'rankedItis'
                            ? 'border-indigo-600 text-indigo-700'
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        Ranked ITIs ({matches.length})
                      </button>
                    </div>

                    {/* Tab 1: APPLICANTS */}
                    {activeTab === 'applicants' && (
                      <div className="mt-4 space-y-3">
                        {applicants.length === 0 ? (
                          <p className="text-xs text-slate-400 py-3">No applicants registered yet for this requirement.</p>
                        ) : (
                          <div className="grid gap-3">
                            {applicants.map((applicant) => {
                              const isShort = ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED'].includes(applicant.status);
                              const isExpanded = expandedRationale[applicant.id];

                              return (
                                <div
                                  key={applicant.id}
                                  className={`rounded-xl border p-4 transition-all ${
                                    isShort ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2.5 flex-wrap">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                          {applicant.fullName.slice(0, 2).toUpperCase()}
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900">{applicant.fullName}</h4>
                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                          {applicant.trade}
                                        </span>
                                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                          {applicant.certificationGrade}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                          {applicant.experienceYears} yrs experience
                                        </span>
                                      </div>

                                      <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                                        <span>🏛️ {applicant.iti?.name || 'Local ITI'}</span>
                                        <span>•</span>
                                        <span className="font-medium text-slate-700">📍 {applicant.distanceKm} km away</span>
                                        <span>•</span>
                                        <span>Applied {new Date(applicant.appliedAt).toLocaleDateString()}</span>
                                      </p>
                                    </div>

                                    {/* Confidence Score Pill */}
                                    <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
                                      <div
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 border text-xs font-black shadow-2xs ${
                                          applicant.confidenceScore >= 85
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                            : applicant.confidenceScore >= 75
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}
                                      >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>{applicant.confidenceScore}% AI Confidence</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedRationale((prev) => ({
                                            ...prev,
                                            [applicant.id]: !prev[applicant.id],
                                          }))
                                        }
                                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
                                      >
                                        {isExpanded ? 'Hide Match Rationale' : 'AI Match Breakdown'}
                                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Expandable AI Breakdown */}
                                  {isExpanded && (
                                    <div className="mt-3 rounded-lg bg-slate-50 p-3 border border-slate-200/70 text-xs space-y-2 animate-in fade-in">
                                      <p className="text-slate-700 font-medium leading-relaxed">
                                        💡 <strong className="text-slate-900">AI Recommendation Rationale:</strong> {applicant.aiRationale}
                                      </p>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/50 text-[11px]">
                                        <div>
                                          <span className="text-slate-400 block text-[10px]">Trade Alignment</span>
                                          <strong className="text-slate-800">{applicant.confidenceBreakdown?.tradeAlignment}%</strong>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[10px]">Skill Proficiency</span>
                                          <strong className="text-slate-800">{applicant.confidenceBreakdown?.skillProficiency}%</strong>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[10px]">Practical Test</span>
                                          <strong className="text-slate-800">{applicant.confidenceBreakdown?.practicalAssessment}%</strong>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[10px]">Proximity Pts</span>
                                          <strong className="text-slate-800">{applicant.confidenceBreakdown?.proximityScore}/25 pts</strong>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Skills pills */}
                                  <div className="mt-2.5 flex flex-wrap gap-1">
                                    {(applicant.skills || []).map((sk, sIdx) => (
                                      <span key={sIdx} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-medium">
                                        {sk}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Card Actions Footer */}
                                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-500 font-medium">Status:</span>
                                      <select
                                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                                          applicant.status === 'SELECTED'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                            : applicant.status === 'SHORTLISTED' || applicant.status === 'INTERVIEW_SCHEDULED'
                                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                            : 'bg-slate-50 text-slate-700 border-slate-200'
                                        }`}
                                        value={applicant.status}
                                        onChange={(e) => handleUpdateApplicantStatus(requirement.id, applicant.id, e.target.value)}
                                      >
                                        <option value="APPLIED">Applied</option>
                                        <option value="SHORTLISTED">Shortlisted</option>
                                        <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                                        <option value="SELECTED">Selected</option>
                                        <option value="REJECTED">Rejected</option>
                                      </select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {applicant.status === 'APPLIED' && (
                                        <Button
                                          size="sm"
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                                          onClick={() => handleUpdateApplicantStatus(requirement.id, applicant.id, 'SHORTLISTED')}
                                        >
                                          <Star className="mr-1.5 h-3.5 w-3.5" />
                                          Shortlist Candidate
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs h-8"
                                        onClick={() => handleContactIti(applicant.iti, requirement)}
                                      >
                                        <Phone className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                                        Contact ITI
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: SHORTLISTED */}
                    {activeTab === 'shortlisted' && (
                      <div className="mt-4 space-y-3">
                        {shortlisted.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                            No candidates shortlisted yet for this job. Switch to the "Applicants" tab and click "Shortlist Candidate" on top matches.
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {shortlisted.map((cand) => (
                              <div key={cand.id} className="rounded-xl border border-indigo-200 bg-indigo-50/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">{cand.fullName}</span>
                                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                                      {cand.trade}
                                    </span>
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                      🎯 {cand.confidenceScore}% Confidence
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {cand.experienceYears} yrs exp • {cand.iti?.name || 'ITI'} • 📍 {cand.distanceKm} km away
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <select
                                    className="rounded border border-indigo-200 bg-white px-2 py-1 text-xs font-semibold text-indigo-900"
                                    value={cand.status}
                                    onChange={(e) => handleUpdateApplicantStatus(requirement.id, cand.id, e.target.value)}
                                  >
                                    <option value="SHORTLISTED">Shortlisted</option>
                                    <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                                    <option value="SELECTED">Selected</option>
                                    <option value="REJECTED">Remove / Reject</option>
                                  </select>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs"
                                    onClick={() => handleContactIti(cand.iti, requirement)}
                                  >
                                    <Phone className="mr-1 h-3.5 w-3.5 text-indigo-600" />
                                    Contact ITI
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: RANKED ITIS */}
                    {activeTab === 'rankedItis' && (
                      <div className="mt-4 space-y-3">
                        {matches.length === 0 ? (
                          <div className="py-4 text-center">
                            <p className="text-xs text-slate-400">No active ITIs loaded within range yet.</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-xs border-indigo-200 text-indigo-700"
                              onClick={() => matchITIs(requirement)}
                            >
                              <Compass className="mr-1.5 h-3.5 w-3.5" />
                              Find & Match Nearby ITIs
                            </Button>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {matches.map((recommendation, idx) => (
                              <div key={recommendation.id || recommendation.itiId} className="rounded-lg border border-slate-200 p-4 transition-all hover:border-slate-300 hover:shadow-xs">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold ${
                                        idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        #{idx + 1}
                                      </span>
                                      <p className="truncate text-base font-semibold text-slate-900">{recommendation.iti?.name || 'ITI'}</p>
                                      {recommendation.iti?.isGovernment && (
                                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                                          Government
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {recommendation.iti?.code || 'No code'} • {recommendation.iti?.district}, {recommendation.iti?.state}
                                    </p>
                                    {recommendation.iti?.contacts?.tpo && (
                                      <p className="mt-1 text-[11px] text-slate-400">
                                        📞 TPO: {recommendation.iti.contacts.tpo.name} ({recommendation.iti.contacts.tpo.phone})
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700 border border-indigo-200">
                                      {Math.round(recommendation.score)}% Match
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {(recommendation.reasons || []).map((reason, rIdx) => (
                                    <span key={rIdx} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                                      {reason}
                                    </span>
                                  ))}
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-xs text-slate-500">
                                    {recommendation.iti?._count?.workers || 0} registered candidates
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"
                                      onClick={() => handleContactIti(recommendation.iti, requirement)}
                                    >
                                      <Phone className="mr-1.5 h-3.5 w-3.5" />
                                      Contact ITI
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => toggleWorkers(recommendation, requirement)} disabled={working[recommendation.itiId]}>
                                      {working[recommendation.itiId] ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="mr-1.5 h-3.5 w-3.5" />}
                                      Candidates
                                    </Button>
                                  </div>
                                </div>

                                {workers[recommendation.itiId] && (
                                  <div className="mt-3 border-t border-slate-100 pt-3">
                                    {workers[recommendation.itiId].length === 0 ? (
                                      <p className="text-xs text-slate-400">No candidates currently registered for this trade at this ITI.</p>
                                    ) : (
                                      workers[recommendation.itiId].map((worker) => (
                                        <div key={worker.id} className="flex items-center justify-between gap-3 border-b border-slate-50 py-2 text-sm last:border-0">
                                          <div>
                                            <span className="font-medium text-slate-800">{worker.fullName}</span>
                                            <span className="ml-2 text-xs text-slate-500">
                                              {worker.experienceYears || 0} yrs exp • {worker.certificationGrade || 'Grade A'}
                                            </span>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"
                                            onClick={async () => {
                                              try {
                                                await api.addToShortlist({ workerId: worker.id, requirementId: requirement.id });
                                                const result = await api.getShortlists();
                                                if (result.success) setShortlists(result.data || []);
                                              } catch (err) {
                                                setError(err.message || 'Unable to shortlist candidate');
                                              }
                                            }}
                                          >
                                            Shortlist
                                          </Button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
        )}

        {/* ITI NETWORK TAB (TOP 50KM RANKED) */}
        {activeNav === 'itis' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {itiViewMode === 'nearby'
                      ? `Top ITIs within ${officerLocation.radiusKm} km of ${officerLocation.name}`
                      : `${officerLocation.name} Registered ITIs`}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {itiViewMode === 'nearby'
                      ? `${topNearbyItis.length} institutes ranked by 4-pillar composite score (Proximity, Trade match, Active talent & Government status)`
                      : `${itis.length} total registered institutes in database`}
                  </p>
                </div>

                {/* View Mode Switcher */}
                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button
                    onClick={() => setItiViewMode('nearby')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      itiViewMode === 'nearby' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📍 Top Ranked (Within {officerLocation.radiusKm} km)
                  </button>
                  <button
                    onClick={() => setItiViewMode('all')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      itiViewMode === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏢 All Institutes ({itis.length})
                  </button>
                </div>
              </div>

              {/* Trade Filter Pills */}
              {itiViewMode === 'nearby' && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="text-xs font-medium text-slate-500 mr-2">Filter by Trade:</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleTradeFilterChange('')}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selectedTradeFilter === ''
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      All Trades
                    </button>
                    {COMMON_TRADES.map((t) => (
                      <button
                        key={t}
                        onClick={() => handleTradeFilterChange(t)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          selectedTradeFilter === t
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top Ranked Nearby ITI Cards */}
            {itiViewMode === 'nearby' ? (
              loadingNearby ? (
                <div className="flex items-center justify-center p-12 text-slate-400">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Calculating 50km distances and ranking ITIs...
                </div>
              ) : topNearbyItis.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
                  No ITIs found within {officerLocation.radiusKm} km of this location. Try expanding the radius.
                </div>
              ) : (
                <div className="grid gap-3">
                  {topNearbyItis.map((iti, index) => {
                    const isTopThree = index < 3;
                    return (
                      <div
                        key={iti.id}
                        className={`rounded-xl border bg-white p-5 transition-all hover:shadow-md ${
                          isTopThree ? 'border-indigo-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-black ${
                                  index === 0
                                    ? 'bg-amber-400 text-amber-950'
                                    : index === 1
                                    ? 'bg-slate-300 text-slate-900'
                                    : index === 2
                                    ? 'bg-amber-700 text-amber-50'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                #{index + 1}
                              </span>
                              <h3 className="text-base font-bold text-slate-900">{iti.name}</h3>
                              {iti.isGovernment ? (
                                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                  Government ITI
                                </span>
                              ) : (
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                  Private
                                </span>
                              )}
                              {iti.code && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  MIS: {iti.code}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {iti.district}, {iti.state} {iti.address ? `• ${iti.address}` : ''}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 border border-indigo-200">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                              <span className="text-sm font-black text-indigo-700">{iti.totalScore}/100</span>
                              <span className="text-[10px] font-medium text-indigo-500">Rank Score</span>
                            </div>
                            <span className="mt-1 text-xs font-semibold text-slate-700">
                              📍 {iti.distanceKm} km away
                            </span>
                          </div>
                        </div>

                        {/* Pillar Score Breakdown Bar */}
                        <div className="mt-3.5 rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Proximity</span>
                              <strong className="text-slate-800 font-semibold">{iti.scoreBreakdown?.proximity || 0}/25 pts</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Trade Relevance</span>
                              <strong className="text-slate-800 font-semibold">{iti.scoreBreakdown?.trade || 0}/35 pts</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Active Talent Pool</span>
                              <strong className="text-slate-800 font-semibold">{iti.scoreBreakdown?.talent || 0}/25 pts</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Accreditation</span>
                              <strong className="text-slate-800 font-semibold">{iti.scoreBreakdown?.institution || 0}/15 pts</strong>
                            </div>
                          </div>
                        </div>

                        {/* Ranking Reasons */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(iti.reasons || []).map((reason, rIdx) => (
                            <span key={rIdx} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 shadow-2xs">
                              {reason}
                            </span>
                          ))}
                        </div>

                        {/* Trades Offered Pills */}
                        {Array.isArray(iti.trades) && iti.trades.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Trades:</span>
                            {iti.trades.slice(0, 6).map((tr, tIdx) => (
                              <span
                                key={tIdx}
                                className={`rounded px-1.5 py-0.5 text-[10px] ${
                                  selectedTradeFilter && tr.toLowerCase().includes(selectedTradeFilter.toLowerCase())
                                    ? 'bg-indigo-600 text-white font-bold'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {tr}
                              </span>
                            ))}
                            {iti.trades.length > 6 && (
                              <span className="text-[10px] text-slate-400">+{iti.trades.length - 6} more</span>
                            )}
                          </div>
                        )}

                        {/* Actions Footer */}
                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-medium">
                              {iti.activeWorkersCount || 0} verified candidate{iti.activeWorkersCount === 1 ? '' : 's'}
                            </span>
                            {iti.contacts?.tpo && (
                              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400">
                                • TPO: {iti.contacts.tpo.name} ({iti.contacts.tpo.phone})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"
                              onClick={() => handleContactIti(iti)}
                            >
                              <Phone className="mr-1.5 h-3.5 w-3.5" />
                              Contact ITI
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toggleWorkers(iti, null)} disabled={working[iti.id]}>
                              {working[iti.id] ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="mr-1.5 h-3.5 w-3.5" />}
                              Candidates
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Candidates Drawer */}
                        {workers[iti.id] && (
                          <div className="mt-3 border-t border-slate-100 pt-3">
                            {workers[iti.id].length === 0 ? (
                              <p className="text-xs text-slate-400">No verified available candidates enrolled at this institute.</p>
                            ) : (
                              <div className="divide-y divide-slate-100">
                                {workers[iti.id].map((w) => (
                                  <div key={w.id} className="flex items-center justify-between py-2 text-sm">
                                    <div>
                                      <p className="font-semibold text-slate-800">{w.fullName}</p>
                                      <p className="text-xs text-slate-500">
                                        Trade: <span className="font-medium text-slate-700">{w.trade}</span> • {w.experienceYears || 0} yrs experience
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                      onClick={async () => {
                                        try {
                                          await api.addToShortlist({ workerId: w.id });
                                          const result = await api.getShortlists();
                                          if (result.success) setShortlists(result.data || []);
                                        } catch (err) {
                                          setError(err.message || 'Unable to shortlist candidate');
                                        }
                                      }}
                                    >
                                      Shortlist
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* All District ITIs Mode */
              <div className="grid gap-2 md:grid-cols-2">
                {itis.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.code || 'No code'} • {item.district}, {item.state}
                        </p>
                        {item.contacts?.tpo && (
                          <p className="mt-1 text-[11px] text-slate-400">
                            📞 TPO: {item.contacts.tpo.name} ({item.contacts.tpo.phone})
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {item._count?.workers || 0} candidates
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-indigo-600 hover:bg-indigo-50 px-2"
                          onClick={() => handleContactIti(item)}
                        >
                          <Phone className="mr-1 h-3 w-3" /> Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SHORTLISTS TAB */}
        {activeNav === 'shortlists' && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Shortlisted Candidates</h2>
            {shortlists.length === 0 ? (
              <p className="text-sm text-slate-400">No candidates shortlisted yet. Search top ITIs above and shortlist verified workers.</p>
            ) : (
              <div className="grid gap-3">
                {shortlists.map((short) => (
                  <div key={short.id} className="flex flex-col gap-3 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50">
                    <div>
                      <h3 className="font-semibold text-slate-900">{short.worker?.fullName}</h3>
                      <p className="text-xs text-slate-500">
                        {short.worker?.trade} • {short.worker?.iti?.name || 'ITI not listed'} • {short.requirement?.title || 'General Shortlist'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Update status for ${short.worker?.fullName || 'candidate'}`}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                        value={short.status}
                        onChange={async (event) => {
                          try {
                            const result = await api.updateShortlistStatus(short.id, event.target.value);
                            setShortlists((previous) =>
                              previous.map((item) => (item.id === short.id ? { ...item, status: result.data.status } : item))
                            );
                          } catch (err) {
                            setError(err.message || 'Unable to update candidate status');
                          }
                        }}
                      >
                        {['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'ACCEPTED', 'REJECTED'].map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 text-xs"
                        onClick={async () => {
                          try {
                            await api.removeFromShortlist(short.id);
                            setShortlists((previous) => previous.filter((item) => item.id !== short.id));
                          } catch (err) {
                            setError(err.message || 'Unable to remove candidate');
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact ITI Modal */}
      <ContactItiModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal((prev) => ({ ...prev, isOpen: false }))}
        iti={contactModal.iti}
        requirements={requirements}
        initialRequirementId={contactModal.requirementId}
        initialRoleTitle={contactModal.roleTitle}
      />
    </DashboardLayout>
  );
}

export default OfficerView;
