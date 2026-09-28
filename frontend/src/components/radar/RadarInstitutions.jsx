'use client';

import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  GraduationCap,
  Users,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Sparkles,
  CalendarCheck
} from 'lucide-react';
import { INSTITUTIONS } from '@/data/radarData';

export function RadarInstitutions({ opportunities, globalDistrict, setGlobalDistrict, uniqueDistricts, onPlanCamp, onSelectOpportunity }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, ITI, Polytechnic, College

  const validInstitutions = globalDistrict === 'ALL'
    ? INSTITUTIONS
    : INSTITUTIONS.filter(inst => inst.district === globalDistrict);

  const [selectedInstitution, setSelectedInstitution] = useState(validInstitutions[0] || INSTITUTIONS[0]);

  const filteredInstitutions = validInstitutions.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.location.toLowerCase().includes(search.toLowerCase()) ||
      inst.programmes.some((p) => p.trade.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || inst.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate matching open opportunities for selected institution
  const getMatchingOpportunities = (inst) => {
    if (!inst) return [];
    return (opportunities || []).filter((op) => {
      return inst.programmes.some((p) => {
        const t = p.trade.toLowerCase();
        const q = op.qualification.toLowerCase();
        return q.includes(t) || t.includes(q.split(' ')[0]);
      });
    });
  };

  const matchingOpps = getMatchingOpportunities(selectedInstitution);

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Institutions & Talent Network
              </h2>
              <p className="text-xs text-slate-500">
                Colleges, Polytechnics, and ITIs available in Gorakhpur and catchment.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* District Filter */}
          <select
            value={globalDistrict}
            onChange={(e) => setGlobalDistrict(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 bg-emerald-50 text-emerald-800 font-bold focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Districts</option>
            {uniqueDistricts?.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trade, ITI, or area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="py-1.5 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 w-52 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            {['ALL', 'ITI', 'Polytechnic', 'College'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  typeFilter === t
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Layout: Institutions List (7 cols) + Detail Panel (5 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List of Institutions */}
        <div className="lg:col-span-7 space-y-3">
          {filteredInstitutions.map((inst) => {
            const isSelected = selectedInstitution?.id === inst.id;

            return (
              <div
                key={inst.id}
                onClick={() => setSelectedInstitution(inst)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inst.type === 'ITI'
                            ? 'bg-blue-100 text-blue-800'
                            : inst.type === 'Polytechnic'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {inst.type}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {inst.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{inst.name}</h3>

                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{inst.location}</span>
                      <span>•</span>
                      <span>{inst.travelTimeMin} min travel</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 block">
                      {inst.totalSeats} Seats
                    </span>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      {inst.matchableOpportunitiesCount} Matchable Openings
                    </span>
                  </div>
                </div>

                {/* Trade Pills */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {inst.programmes.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10.5px] font-medium"
                    >
                      {p.trade} ({p.seats})
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Institution Detail & Reverse Opportunities Match (5 cols) */}
        <div className="lg:col-span-5">
          {selectedInstitution ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 sticky top-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  INSTITUTION PROFILE
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedInstitution.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedInstitution.address}</p>
              </div>

              {/* Contact Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Head of Institution:</span>
                  <span className="font-bold text-slate-800">
                    {selectedInstitution.contactPerson} ({selectedInstitution.designation})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Direct Phone:</span>
                  <span className="font-bold text-slate-800">{selectedInstitution.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Official Email:</span>
                  <span className="font-medium text-slate-700">{selectedInstitution.email}</span>
                </div>
              </div>

              {/* Reverse View (Plan.md Section 8.1):
                  "If I visit this ITI, which internships can I discuss?" */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Matching Open Opportunities
                  </h4>
                  <span className="text-[11px] text-slate-400">Reverse Match View</span>
                </div>

                <div className="space-y-2">
                  {matchingOpps.length > 0 ? (
                    matchingOpps.map((op) => (
                      <div
                        key={op.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{op.roleTitle}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                op.risk === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {op.risk}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {op.company} • {op.openings} Openings • Closes in {op.daysLeft}d
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectOpportunity?.(op)}
                          className="px-2.5 py-1 rounded bg-slate-900 text-white font-semibold text-[10.5px] hover:bg-slate-800"
                        >
                          View
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                      No direct trade matches currently active.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onPlanCamp?.({ targetInstitution: selectedInstitution })}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span>Plan Mobilisation Camp at this Venue</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default RadarInstitutions;
