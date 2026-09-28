'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Building2,
  Sparkles,
  ExternalLink,
  Clock,
  Briefcase,
  AlertTriangle,
  FileCheck,
  ChevronRight
} from 'lucide-react';

export function RadarOpportunities({ opportunities, initialFilters, onSelectOpportunity, onPlanCamp, onShareBulletin }) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState(initialFilters?.risk || 'ALL');
  const [deadlineFilter, setDeadlineFilter] = useState(initialFilters?.deadline || 'ALL'); // ALL, 7, 14, 30

  // Filter and sort opportunities (High -> Medium -> Low, then fewest days left)
  const filteredOpportunities = opportunities.filter((op) => {
    const matchesSearch =
      op.roleTitle.toLowerCase().includes(search.toLowerCase()) ||
      op.company.toLowerCase().includes(search.toLowerCase()) ||
      op.qualification.toLowerCase().includes(search.toLowerCase()) ||
      op.sector.toLowerCase().includes(search.toLowerCase());

    const matchesRisk =
      riskFilter === 'ALL'
        ? true
        : riskFilter === 'AT_RISK'
        ? op.risk === 'HIGH' || op.risk === 'MEDIUM'
        : op.risk === riskFilter;

    const matchesDeadline =
      deadlineFilter === 'ALL' || op.daysLeft <= parseInt(deadlineFilter, 10);

    return matchesSearch && matchesRisk && matchesDeadline;
  }).sort((a, b) => {
    const riskRank = { HIGH: 1, MEDIUM: 2, LOW: 3 };
    if (riskRank[a.risk] !== riskRank[b.risk]) {
      return riskRank[a.risk] - riskRank[b.risk];
    }
    return a.daysLeft - b.daysLeft;
  });

  return (
    <div className="space-y-6">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Internship Opportunities Master Table
              </h2>
              <p className="text-xs text-slate-500">
                All open PMIS internship postings available across Gorakhpur and catchment.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search role, company, trade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="py-1.5 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 w-56 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Risk Filter */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW', 'AT_RISK'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRiskFilter(r)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  riskFilter === r
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'ALL' ? 'All Risks' : r === 'AT_RISK' ? 'High + Med' : r}
              </button>
            ))}
          </div>

          {/* Deadline Filter */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            {[
              { id: 'ALL', label: 'Any Time' },
              { id: '7', label: '< 7 Days' },
              { id: '14', label: '< 14 Days' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setDeadlineFilter(id)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  deadlineFilter === id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table View (Plan.md Section 6.1) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Risk Status</th>
                <th className="py-3.5 px-4">Role Title & Company</th>
                <th className="py-3.5 px-4">Trade / Qualification</th>
                <th className="py-3.5 px-3 text-center">Openings</th>
                <th className="py-3.5 px-3 text-center">Applied</th>
                <th className="py-3.5 px-4">Closing Date</th>
                <th className="py-3.5 px-4">Recommended Action</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOpportunities.map((op) => {
                const isHigh = op.risk === 'HIGH';
                const isMed = op.risk === 'MEDIUM';

                return (
                  <tr
                    key={op.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectOpportunity?.(op)}
                  >
                    {/* Risk Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isMed
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHigh ? 'bg-rose-600 animate-pulse' : isMed ? 'bg-amber-600' : 'bg-emerald-600'
                          }`}
                        />
                        {op.risk}
                      </span>
                    </td>

                    {/* Role Title & Company */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {op.roleTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{op.company}</span>
                        <span>•</span>
                        <span className="text-slate-400">{op.sector}</span>
                      </div>
                    </td>

                    {/* Qualification */}
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-800">{op.qualification}</span>
                      <span className="block text-[10.5px] text-slate-400">{op.monthlyStipend}</span>
                    </td>

                    {/* Openings */}
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <span className="font-extrabold text-slate-900 text-sm">{op.openings}</span>
                    </td>

                    {/* Applications */}
                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <span
                        className={`font-extrabold text-sm ${
                          op.applications < op.openings ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {op.applications}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {(op.applications / op.openings).toFixed(1)}/vac
                      </span>
                    </td>

                    {/* Closing Date */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{op.closingDate}</span>
                      <span
                        className={`block text-[10.5px] font-bold ${
                          op.daysLeft <= 7 ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {op.daysLeft} days left
                      </span>
                    </td>

                    {/* Recommended Action */}
                    <td className="py-4 px-4 max-w-xs">
                      {op.recommendedAction ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            {op.recommendedAction.label}
                          </span>
                          <span className="block text-[10px] text-slate-500 truncate max-w-[200px] mt-0.5">
                            {op.recommendedAction.institution}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Action CTA */}
                    <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectOpportunity?.(op)}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] shadow-2xs"
                        >
                          Details
                        </button>

                        {op.recommendedAction?.type === 'CAMP' && (
                          <button
                            type="button"
                            onClick={() => onPlanCamp?.(op)}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] shadow-2xs"
                          >
                            Camp
                          </button>
                        )}

                        {op.recommendedAction?.type === 'BULLETIN' && (
                          <button
                            type="button"
                            onClick={() => onShareBulletin?.(op)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shadow-2xs"
                          >
                            Bulletin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RadarOpportunities;
