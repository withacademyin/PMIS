'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Clock,
  Users,
  Building2,
  TrendingDown,
  ArrowRight,
  Sparkles,
  MapPin,
  ExternalLink,
  Layers,
  Megaphone,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';

export default function RadarDashboardPage() {
  const [districtCode, setDistrictCode] = useState('GORAKHPUR');
  const [data, setData] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (code) => {
    try {
      setRefreshing(true);
      const [summaryRes, mapRes] = await Promise.all([
        api.getRadarDashboard(code),
        api.getRadarMap(code)
      ]);

      if (summaryRes.success) setData(summaryRes.data);
      if (mapRes.success) setMapData(mapRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('pmis_selected_district') || 'GORAKHPUR';
    setDistrictCode(saved);
    loadData(saved);

    const handleDistrictChange = (e) => {
      if (e.detail) {
        setDistrictCode(e.detail);
        loadData(e.detail);
      }
    };

    window.addEventListener('radar_district_changed', handleDistrictChange);
    return () => window.removeEventListener('radar_district_changed', handleDistrictChange);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading District Opportunity Radar...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {
    openOpportunities: 0,
    highRisk: 0,
    openingsAtRisk: 0,
    closingInNext7Days: 0
  };

  const priorityActions = data?.priorityActions || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title & Refresh Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Decision Support & Catchment Engine
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {data?.district?.name || 'Gorakhpur'} District Opportunity Radar
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Fill-risk analysis, catchment institution matching, and active field mobilisation priorities.
          </p>
        </div>

        <button
          onClick={() => loadData(districtCode)}
          disabled={refreshing}
          className="self-start md:self-auto flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Opportunities */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Open Opportunities</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {kpis.openOpportunities}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Active PMIS job listings</p>
          </div>
        </div>

        {/* High Risk (Color + Shape Accessible Indicator) */}
        <div className="bg-slate-950/70 border border-rose-900/40 p-5 rounded-xl shadow-lg relative overflow-hidden group hover:border-rose-700/60 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-xs font-medium text-rose-300">High Risk</span>
            </div>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {kpis.highRisk}
            </span>
            <p className="text-[11px] text-rose-300/80 mt-1">0 applications or coverage &lt; 50%</p>
          </div>
        </div>

        {/* Openings At Risk */}
        <div className="bg-slate-950/70 border border-amber-900/40 p-5 rounded-xl shadow-lg relative overflow-hidden group hover:border-amber-700/60 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rotate-45 rounded-[1px]"></span>
              <span className="text-xs font-medium text-amber-300">Openings At Risk</span>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {kpis.openingsAtRisk}
            </span>
            <p className="text-[11px] text-amber-300/80 mt-1">Across High + Medium risk postings</p>
          </div>
        </div>

        {/* Closing Next 7 Days */}
        <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Closing in 7 Days</span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {kpis.closingInNext7Days}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Urgent intervention required</p>
          </div>
        </div>
      </div>

      {/* Priority Action Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Immediate Attention: High-Risk Opportunities
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Opportunities needing district mobilization action this week.
            </p>
          </div>
          <Link
            href="/dashboard/radar/opportunities?risk=HIGH"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
          >
            <span>View All ({kpis.highRisk})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {priorityActions.map((post) => {
            const rec = post.recommendation;
            const topInst = post.topInstitution;

            return (
              <div
                key={post.id}
                className="bg-slate-950 border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg"
              >
                <div>
                  {/* Card Header with Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      HIGH RISK
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {post.daysLeft} days left
                    </span>
                  </div>

                  {/* Title & Employer */}
                  <h4 className="font-semibold text-slate-100 text-sm line-clamp-1">
                    {post.roleTitle}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{post.companyName}</p>

                  {/* Openings vs Applications bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Openings:</span>
                      <p className="font-bold text-slate-200">{post.openings}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Applications:</span>
                      <p className="font-bold text-rose-400">{post.applications}</p>
                    </div>
                  </div>

                  {/* Recommendation Callout */}
                  <div className="mt-4 p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-lg">
                    <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-semibold">
                      {rec.actionKey === 'CAMPUS_CAMP' ? (
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span>Action: {rec.actionLabel}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                      {rec.reason}
                    </p>
                    {topInst && (
                      <p className="text-[10px] text-indigo-300/80 mt-1 font-medium truncate">
                        📍 {topInst.name} ({topInst.travelMinutes}m away)
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/radar/opportunities/${post.id}`}
                    className="flex-1 text-center py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition shadow-md shadow-indigo-600/20"
                  >
                    Open Catchment
                  </Link>
                  {rec.actionKey === 'CAMPUS_CAMP' ? (
                    <Link
                      href={`/dashboard/radar/mobilisation/camps?postingId=${post.id}`}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                    >
                      Plan Camp
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/radar/mobilisation/bulletins?postingId=${post.id}`}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                    >
                      Bulletin
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* District Spatial Distribution Map Component */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              District Catchment Map ({data?.district?.name || 'Gorakhpur'})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live spatial plot of PMIS internship postings and verified training institutions.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              High Risk Posting
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Medium Risk
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500"></span>
              Institution
            </span>
          </div>
        </div>

        {/* Visual Simulated Map Display with accurate relative Gorakhpur bounds */}
        <div className="w-full h-80 bg-slate-900/90 border border-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
          {/* Subtle grid backdrop */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Plotting points */}
          <div className="relative w-full h-full">
            {mapData?.opportunities?.map((opp, idx) => {
              // Normalize lat/lng to percentage bounds
              const minLat = 26.2, maxLat = 27.5;
              const minLng = 83.0, maxLng = 84.2;
              const top = 100 - ((opp.latitude - minLat) / (maxLat - minLat)) * 100;
              const left = ((opp.longitude - minLng) / (maxLng - minLng)) * 100;

              const isHigh = opp.riskLevel === 'HIGH';

              return (
                <Link
                  key={opp.id}
                  href={`/dashboard/radar/opportunities/${opp.id}`}
                  style={{ top: `${Math.min(90, Math.max(10, top))}%`, left: `${Math.min(90, Math.max(10, left))}%` }}
                  title={`${opp.roleTitle} (${opp.companyName}) - ${opp.riskLevel} RISK`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition transform hover:scale-150 z-20`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-md ${
                      isHigh ? 'bg-rose-500 shadow-rose-500/50' : 'bg-amber-500 shadow-amber-500/50'
                    }`}
                  />
                  <div className="hidden group-hover:block absolute left-4 top-0 bg-slate-950 text-white text-[10px] px-2 py-1 rounded border border-slate-700 whitespace-nowrap shadow-xl z-50">
                    <p className="font-bold">{opp.roleTitle}</p>
                    <p className="text-slate-400">{opp.companyName} • {opp.openings} openings</p>
                  </div>
                </Link>
              );
            })}

            {/* Plot institutions */}
            {mapData?.institutions?.map((inst) => {
              const minLat = 26.2, maxLat = 27.5;
              const minLng = 83.0, maxLng = 84.2;
              const top = 100 - ((inst.latitude - minLat) / (maxLat - minLat)) * 100;
              const left = ((inst.longitude - minLng) / (maxLng - minLng)) * 100;

              return (
                <Link
                  key={inst.id}
                  href={`/dashboard/radar/institutions/${inst.id}`}
                  style={{ top: `${Math.min(90, Math.max(10, top))}%`, left: `${Math.min(90, Math.max(10, left))}%` }}
                  title={`${inst.name} (${inst.type})`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition transform hover:scale-150 z-10"
                >
                  <div className="w-2.5 h-2.5 rounded bg-indigo-500 border border-slate-950 shadow-sm" />
                  <div className="hidden group-hover:block absolute left-3 top-0 bg-slate-950 text-white text-[10px] px-2 py-1 rounded border border-slate-700 whitespace-nowrap shadow-xl z-50">
                    <p className="font-bold">{inst.name}</p>
                    <p className="text-indigo-400">{inst.type} • {inst.district}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 text-[11px] text-slate-400 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span>Covering: Gorakhpur, Deoria, Maharajganj, Sant Kabir Nagar, Kushinagar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
