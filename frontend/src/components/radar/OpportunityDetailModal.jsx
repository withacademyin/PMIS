'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { matchOpportunityInstitutions } from '@/lib/opportunityMatcher';
import {
  X,
  AlertTriangle,
  Building2,
  Clock,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronRight,
  FileCheck,
  Megaphone,
  CheckCircle2,
  IndianRupee,
  Share2
} from 'lucide-react';

export function OpportunityDetailModal({
  opportunity,
  isOpen,
  onClose,
  onPlanCamp,
  onShareBulletin,
}) {
  const [catchmentTime, setCatchmentTime] = useState('60');
  const [asyncInstitutions, setAsyncInstitutions] = useState(null);

  useEffect(() => {
    if (!isOpen || !opportunity) return;
    const existing =
      opportunity.catchmentInstitutions?.[catchmentTime] ||
      opportunity.catchmentInstitutions?.['60'];

    if (!existing || existing.length === 0) {
      const oppDistrict = opportunity.district || 'Gorakhpur';
      api.getITIs({ district: oppDistrict })
        .then((res) => {
          if (res?.success && Array.isArray(res.itis) && res.itis.length > 0) {
            const matchResult = matchOpportunityInstitutions(opportunity, res.itis);
            setAsyncInstitutions(matchResult.catchmentInstitutions);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, opportunity, catchmentTime]);

  if (!isOpen || !opportunity) return null;

  const matchedInstitutions =
    opportunity.catchmentInstitutions?.[catchmentTime] ||
    opportunity.catchmentInstitutions?.['60'] ||
    asyncInstitutions?.[catchmentTime] ||
    asyncInstitutions?.['60'] ||
    [];

  const isHigh = opportunity.risk === 'HIGH';
  const isMed = opportunity.risk === 'MEDIUM';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* ── Modal Header ── */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/80">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isHigh
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : isMed
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHigh ? 'bg-rose-600 animate-pulse' : isMed ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                />
                {opportunity.risk} FILL RISK
              </span>

              <span className="text-xs text-slate-400">ID: {opportunity.id}</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">{opportunity.sector}</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {opportunity.roleTitle}
            </h2>
            <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{opportunity.company}</span>
              <span className="text-slate-300">•</span>
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{opportunity.address}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <div className="p-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Openings
              </span>
              <span className="text-2xl font-extrabold text-slate-900">{opportunity.openings}</span>
              <span className="text-[11px] text-slate-500 block">Vacancies</span>
            </div>

            <div className="p-2 border-l border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Applications
              </span>
              <span className="text-2xl font-extrabold text-slate-900">
                {opportunity.applications}
              </span>
              <span className="text-[11px] text-rose-600 font-semibold block">
                {(opportunity.applications / opportunity.openings).toFixed(2)} apps / opening
              </span>
            </div>

            <div className="p-2 border-l border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Closing Deadline
              </span>
              <span className="text-2xl font-extrabold text-rose-600">{opportunity.daysLeft}d</span>
              <span className="text-[11px] text-slate-500 block">{opportunity.closingDate}</span>
            </div>

            <div className="p-2 border-l border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Monthly Stipend
              </span>
              <span className="text-xl font-bold text-emerald-700">
                {opportunity.monthlyStipend || '₹5,000 / mo'}
              </span>
              <span className="text-[11px] text-slate-500 block">PMIS Govt Scheme</span>
            </div>
          </div>

          {/* Risk Cause Statement */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isHigh
                ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                : 'bg-amber-50/60 border-amber-200 text-amber-900'
            }`}
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Risk Engine Diagnosis
              </h4>
              <p className="text-sm font-medium mt-0.5">{opportunity.riskReason}</p>
            </div>
          </div>

          {/* 7.4 Recommended Action Card */}
          {opportunity.recommendedAction && (
            <div className="p-5 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                      <Sparkles className="w-3.5 h-3.5" />
                      RECOMMENDED ACTION
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {opportunity.recommendedAction.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl">
                    <span className="font-semibold text-slate-700">Target:</span>{' '}
                    {opportunity.recommendedAction.institution}
                    <br />
                    <span className="font-semibold text-slate-700">Rationale:</span>{' '}
                    {opportunity.recommendedAction.rationale}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {opportunity.recommendedAction.type === 'CAMP' && (
                    <button
                      type="button"
                      onClick={() => {
                        onPlanCamp?.(opportunity);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition-colors shadow-sm"
                    >
                      Plan Campus Camp
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onShareBulletin?.(opportunity);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Generate Bulletin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 7.2 Catchment & 7.3 Matching Institutions Ranking */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  Matching Institutions within Travel Catchment
                </h3>
                <p className="text-xs text-slate-500">
                  Institutions ranked by trade match, travel time, and available seat capacity.
                </p>
              </div>

              {/* Catchment Toggle: 30 / 45 / 60 min */}
              <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                {['30', '45', '60'].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setCatchmentTime(mins)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      catchmentTime === mins
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mins} min catchment
                  </button>
                ))}
              </div>
            </div>

            {/* Institutions List (Top Ranked) */}
            <div className="space-y-2.5">
              {matchedInstitutions.length > 0 ? (
                matchedInstitutions.map((inst, index) => (
                  <div
                    key={inst.id || index}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        #{index + 1}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{inst.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inst.matchStrength === 'EXACT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {inst.matchStrength} MATCH
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-0.5">
                          <span className="font-semibold text-slate-700">Why:</span> {inst.why}
                        </p>

                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {inst.travelTimeMin} min away
                          </span>
                          <span>•</span>
                          <span>
                            Available Seats: <strong className="text-slate-900">{inst.availableSeats}</strong>
                          </span>
                          <span>•</span>
                          <span>Trade: {inst.matchTrade}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          onPlanCamp?.({ ...opportunity, targetInstitution: inst });
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-xs transition-colors"
                      >
                        Plan Camp Here
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500">
                    No institutions found within {catchmentTime} minutes travel radius.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCatchmentTime('60')}
                    className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    Widen Catchment to 60 minutes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Qualification required: <span className="font-semibold text-slate-800">{opportunity.qualification}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpportunityDetailModal;
