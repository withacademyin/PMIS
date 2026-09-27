'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function OpportunitiesPage() {
  const [districtCode, setDistrictCode] = useState('GORAKHPUR');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedSector, setSelectedSector] = useState('');
  const [closingFilter, setClosingFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('risk_desc');

  const fetchOpportunities = async (code) => {
    try {
      setLoading(true);
      const params = {
        districtCode: code || districtCode,
        sort: sortBy
      };
      if (selectedRisk !== 'ALL') params.risk = selectedRisk;
      if (selectedSector) params.sector = selectedSector;
      if (closingFilter) params.closingWithinDays = closingFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getRadarOpportunities(params);
      if (res.success) {
        setOpportunities(res.data);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('pmis_selected_district') || 'GORAKHPUR';
    setDistrictCode(saved);
    fetchOpportunities(saved);

    const handleDistrictChange = (e) => {
      if (e.detail) {
        setDistrictCode(e.detail);
        fetchOpportunities(e.detail);
      }
    };

    window.addEventListener('radar_district_changed', handleDistrictChange);
    return () => window.removeEventListener('radar_district_changed', handleDistrictChange);
  }, [selectedRisk, selectedSector, closingFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOpportunities(districtCode);
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <span className="w-2 h-2 bg-amber-500 rotate-45 rounded-[1px] shrink-0"></span>
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <span className="w-2 h-2 bg-emerald-500 rounded-[1px] shrink-0"></span>
            LOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
            CLOSED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            Internship Opportunities
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Active PMIS opportunities with computed fill risk, application coverage, and catchment matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
            Total: <strong className="text-white">{opportunities.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role, company name, or PMIS ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Risk filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>

            {/* Closing filter */}
            <select
              value={closingFilter}
              onChange={(e) => setClosingFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Any Closing Date</option>
              <option value="7">Closes in &le; 7 Days</option>
              <option value="14">Closes in &le; 14 Days</option>
              <option value="30">Closes in &le; 30 Days</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="risk_desc">Sort: Highest Risk First</option>
              <option value="days_asc">Sort: Closing Soonest</option>
              <option value="openings_desc">Sort: Most Openings</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-indigo-600/20"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Opportunities Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">No opportunities found matching filters</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the risk or sector filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Risk Status</th>
                  <th className="py-3.5 px-4">Opportunity & ID</th>
                  <th className="py-3.5 px-4">Company & Sector</th>
                  <th className="py-3.5 px-4">Qualification</th>
                  <th className="py-3.5 px-4 text-center">Openings</th>
                  <th className="py-3.5 px-4 text-center">Applications</th>
                  <th className="py-3.5 px-4">Closing In</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {opportunities.map((opp) => {
                  const risk = opp.risk;
                  return (
                    <tr
                      key={opp.id}
                      className="hover:bg-slate-900/50 transition group"
                    >
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getRiskBadge(risk.riskLevel)}
                      </td>

                      <td className="py-4 px-4">
                        <Link
                          href={`/dashboard/radar/opportunities/${opp.id}`}
                          className="font-semibold text-slate-100 hover:text-indigo-400 transition block"
                        >
                          {opp.roleTitle}
                        </Link>
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          {opp.postingId}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-200">{opp.companyName}</p>
                        <span className="text-[11px] text-slate-400">{opp.sector}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700/80 text-[11px]">
                          {opp.qualification?.label || opp.qualificationCode}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-100">
                        {opp.openings}
                      </td>

                      <td className="py-4 px-4 text-center font-medium">
                        <span
                          className={
                            opp.applications === 0
                              ? 'text-rose-400 font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {opp.applications}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          target: {risk.targetApplications}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            risk.daysLeft <= 7
                              ? 'text-rose-400'
                              : risk.daysLeft <= 14
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {risk.daysLeft < 0 ? 'Closed' : `${risk.daysLeft} days`}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {new Date(opp.windowCloseDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/dashboard/radar/opportunities/${opp.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium transition border border-slate-700 hover:border-indigo-500"
                        >
                          <span>Radar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
