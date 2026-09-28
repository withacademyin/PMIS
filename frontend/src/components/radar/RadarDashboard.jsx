'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Printer,
  ChevronDown,
  AlertTriangle,
  Clock,
  Briefcase,
  Users,
  Building2,
  Calendar,
  MapPin,
  ArrowUpRight,
  TrendingDown,
  Share2,
  FileCheck,
  CheckCircle2,
  HelpCircle,
  Compass
} from 'lucide-react';
import RadarMap from './RadarMap';
import { DISTRICT_LIST, KPI_METRICS } from '@/data/radarData';

export function RadarDashboard({
  opportunities = [],
  institutions = [],
  priorityActions = [],
  onSelectOpportunity,
  onPlanCamp,
  onShareBulletin,
  onNavigateToNav,
  globalDistrict,
  setGlobalDistrict,
  uniqueDistricts,
}) {
  const [selectedCatchment, setSelectedCatchment] = useState('60');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(KPI_METRICS.lastUpdated);

  const filteredOpportunities = globalDistrict === 'ALL' 
    ? opportunities 
    : opportunities.filter(op => op.district === globalDistrict);

  // Dynamically compute KPI metrics based on filtered opportunities
  const dynamicKPIs = {
    openOpportunities: filteredOpportunities.length,
    highRisk: filteredOpportunities.filter(op => op.risk === 'HIGH').length,
    openingsAtRisk: filteredOpportunities
      .filter(op => op.risk === 'HIGH' || op.risk === 'MEDIUM')
      .reduce((sum, op) => sum + (op.openings || 0), 0),
    closingNext7Days: filteredOpportunities.filter(op => op.daysLeft <= 7).length,
  };

  // Dynamically compute priority actions based on filtered opportunities
  const dynamicPriorityActions = filteredOpportunities
    .filter(op => op.risk === 'HIGH' || op.risk === 'MEDIUM')
    .sort((a, b) => {
      const riskRank = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      if (riskRank[a.risk] !== riskRank[b.risk]) {
        return riskRank[a.risk] - riskRank[b.risk];
      }
      return a.daysLeft - b.daysLeft;
    })
    .slice(0, 4)
    .map(op => ({
      postingId: op.id,
      roleTitle: op.roleTitle,
      company: op.company,
      location: op.address,
      openings: op.openings,
      applications: op.applications,
      daysLeft: op.daysLeft,
      risk: op.risk,
      recommendedActionTitle: op.risk === 'HIGH' ? 'Organise Job Camp' : 'Share Job Bulletin',
      recommendedActionReason: op.risk === 'HIGH' ? 'Severe applicant deficit requires immediate on-ground mobilisation.' : 'Send targeted SMS to catchment ITI candidates.',
      recommendedActionType: op.risk === 'HIGH' ? 'CAMP' : 'BULLETIN'
    }));

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* ── 5.1 Top Header (Plan.md Section 5.1) ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              DECISION-SUPPORT RADAR • DISTRICT NODAL PORTAL
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            District Opportunity Radar
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">State:</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-900">
              Uttar Pradesh
            </span>

            <span className="text-slate-300">•</span>

            <span className="font-semibold text-slate-700">District:</span>
            {/* District Selector (Plan.md Section 5.1) */}
            <select
              value={globalDistrict}
              onChange={(e) => setGlobalDistrict(e.target.value)}
              className="py-0.5 px-2 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-xs focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ALL">All Districts</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <span className="text-slate-300">•</span>

            <span className="font-semibold text-slate-700">Week Cycle:</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200">
              {KPI_METRICS.weekRange}
            </span>
          </div>
        </div>

        {/* Refresh & Print Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right text-[11px] text-slate-500 hidden sm:block">
            <span>Last Updated:</span>
            <span className="font-medium text-slate-700 block">{lastRefreshed}</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Sync PMIS & Institution Master Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── Smart Executive Pulse Summary ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="leading-snug">
            <span className="font-black text-slate-900 uppercase tracking-wide text-[11px] block">
              DNO Strategic Pulse • {selectedDistrict}
            </span>
            <span className="text-slate-600">
              <strong className="text-rose-700">High-Risk postings</strong> are closing within 7 days. Mobilising local ITIs and Polytechnics in {selectedDistrict} is highly recommended.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToNav?.('weekly-plan')}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors self-end sm:self-center"
        >
          View Action Plan →
        </button>
      </div>

      {/* ── 5.2 KPI Cards (Plan.md Section 5.2) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Open Opportunities */}
        <div
          onClick={() => onNavigateToNav?.('opportunities')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Open Opportunities
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {dynamicKPIs.openOpportunities}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>All active postings</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10.5px]">
              +4 this week
            </span>
          </div>
        </div>

        {/* Card 2: High Risk */}
        <div
          onClick={() => onNavigateToNav?.('opportunities', { risk: 'HIGH' })}
          className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs hover:border-rose-300 transition-all cursor-pointer group bg-gradient-to-br from-white to-rose-50/30"
        >
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
              High Risk
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-700 tracking-tight flex items-center gap-2">
            {dynamicKPIs.highRisk}
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-rose-700 font-medium">
            <span>Severe fill deficit</span>
            <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10.5px]">
              Urgent action
            </span>
          </div>
        </div>

        {/* Card 3: Openings At Risk */}
        <div
          onClick={() => onNavigateToNav?.('opportunities', { risk: 'AT_RISK' })}
          className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group bg-gradient-to-br from-white to-amber-50/20"
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Openings At Risk
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {dynamicKPIs.openingsAtRisk}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Across High + Med risk</span>
            <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[10.5px]">
              35% of total
            </span>
          </div>
        </div>

        {/* Card 4: Closing in Next 7 Days */}
        <div
          onClick={() => onNavigateToNav?.('opportunities', { deadline: '7' })}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Closing Next 7 Days
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-orange-600 tracking-tight">
            {dynamicKPIs.closingNext7Days}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Critical window closing</span>
            <span className="text-orange-700 font-bold bg-orange-50 px-1.5 py-0.5 rounded text-[10.5px]">
              Action due
            </span>
          </div>
        </div>
      </div>

      {/* ── 5.3 District Map (Plan.md Section 5.3) ── */}
      <RadarMap
        opportunities={filteredOpportunities}
        institutions={institutions}
        selectedCatchment={selectedCatchment}
        onSelectCatchment={setSelectedCatchment}
        onSelectOpportunity={onSelectOpportunity}
        onPlanCamp={onPlanCamp}
        onShareBulletin={onShareBulletin}
      />

      {/* ── 5.4 Priority / Action Panel ("Needs Attention") (Plan.md Section 5.4) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
              Needs Attention — Priority Action List
            </h2>
            <p className="text-xs text-slate-500">
              High-impact opportunities requiring field mobilisation and campus coordination this week.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToNav?.('opportunities')}
            className="text-xs font-bold text-slate-900 hover:text-emerald-700 transition-colors flex items-center gap-1"
          >
            <span>View All Opportunities</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid of Priority Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dynamicPriorityActions.map((item) => {
            const isHigh = item.risk === 'HIGH';

            return (
              <div
                key={item.postingId}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isHigh ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isHigh ? 'text-rose-700' : 'text-amber-700'
                        }`}
                      >
                        {item.risk} RISK
                      </span>
                    </div>

                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      Closes in {item.daysLeft} days
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.roleTitle}</h3>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{item.company}</span>
                    <span>•</span>
                    <span>{item.location}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Openings
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {item.openings} Openings
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Applications
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {item.applications} Submitted
                      </span>
                    </div>
                  </div>

                  {/* Recommended Action Box */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recommended: {item.recommendedActionTitle}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-normal">
                      {item.recommendedActionReason}
                    </p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const fullOpp = filteredOpportunities.find((o) => o.id === item.postingId);
                      if (fullOpp) onSelectOpportunity?.(fullOpp);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    View Opportunity
                  </button>

                  {item.recommendedActionType === 'CAMP' && (
                    <button
                      type="button"
                      onClick={() => {
                        const fullOpp = filteredOpportunities.find((o) => o.id === item.postingId);
                        if (fullOpp) onPlanCamp?.(fullOpp);
                      }}
                      className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Plan Camp
                    </button>
                  )}

                  {item.recommendedActionType === 'BULLETIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        const fullOpp = filteredOpportunities.find((o) => o.id === item.postingId);
                        if (fullOpp) onShareBulletin?.(fullOpp);
                      }}
                      className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Share Bulletin
                    </button>
                  )}

                  {item.recommendedActionType === 'ASSISTED_REGISTRATION' && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToNav?.('weekly-plan');
                      }}
                      className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Action Sheet
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RadarDashboard;
