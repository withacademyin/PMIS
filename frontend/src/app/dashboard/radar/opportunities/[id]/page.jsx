'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Compass,
  ArrowLeft,
  Megaphone,
  Layers,
  Phone,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [catchmentMinutes, setCatchmentMinutes] = useState(60);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async (minutes) => {
    try {
      setLoading(true);
      const res = await api.getRadarOpportunityDetail(id, minutes);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load opportunity detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail(catchmentMinutes);
  }, [id, catchmentMinutes]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading Opportunity Radar...</p>
      </div>
    );
  }

  const posting = data?.posting;
  const risk = posting?.risk;
  const rankedInstitutions = data?.rankedInstitutions || [];
  const recommendedAction = data?.recommendedAction;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/radar/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Opportunities</span>
        </Link>
      </div>

      {/* Main Opportunity Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-indigo-400 font-semibold bg-indigo-950/60 border border-indigo-800/80 px-2 py-0.5 rounded">
                {posting?.postingId}
              </span>
              <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">
                Sector: {posting?.sector}
              </span>
              <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">
                Duration: {posting?.durationMonths} Months
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {posting?.roleTitle}
            </h1>
            <p className="text-sm text-slate-300 font-medium flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              {posting?.companyName}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {posting?.address}
            </p>
          </div>

          {/* Fill Risk Evaluation Badge & Summary */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col justify-between shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 font-medium">Fill-Risk Status</span>
              {risk?.riskLevel === 'HIGH' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  HIGH RISK
                </span>
              )}
              {risk?.riskLevel === 'MEDIUM' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <span className="w-2 h-2 bg-amber-500 rotate-45 rounded-[1px]"></span>
                  MEDIUM RISK
                </span>
              )}
              {risk?.riskLevel === 'LOW' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-2 h-2 bg-emerald-500 rounded-[1px]"></span>
                  LOW RISK
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center border-t border-slate-800/80 pt-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Openings</span>
                <span className="text-base font-bold text-white">{posting?.openings}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Apps</span>
                <span className="text-base font-bold text-indigo-400">{posting?.applications}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Days Left</span>
                <span
                  className={`text-base font-bold ${
                    risk?.daysLeft <= 7 ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {risk?.daysLeft}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 bg-slate-950 p-2 rounded border border-slate-800/80 italic">
              &ldquo;{risk?.reason}&rdquo;
            </p>
          </div>
        </div>

        {/* Opportunity Details strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Required Qualification</span>
            <p className="font-semibold text-slate-200 mt-0.5">
              {posting?.qualification?.label || posting?.qualificationCode}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Monthly Support</span>
            <p className="font-semibold text-emerald-400 mt-0.5">
              ₹{posting?.monthlySupport} / month
            </p>
          </div>
          <div>
            <span className="text-slate-400">Window Closes</span>
            <p className="font-semibold text-slate-200 mt-0.5">
              {new Date(posting?.windowCloseDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Official Portal Link</span>
            <a
              href={posting?.portalLink}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-semibold mt-0.5 flex items-center gap-1 transition"
            >
              <span>PMIS Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Recommended Mobilisation Action Waterfall Banner */}
      {recommendedAction && (
        <div className="bg-gradient-to-r from-indigo-950/70 via-slate-950 to-slate-900 border border-indigo-800/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Recommended District Action (Strict Precedence Engine)
              </span>
              <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {recommendedAction.actionLabel}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {recommendedAction.reason}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={`/dashboard/radar/mobilisation/bulletins?postingId=${posting?.id}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
              >
                <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Create Bulletin</span>
              </Link>
              <Link
                href={`/dashboard/radar/mobilisation/camps?postingId=${posting?.id}&institutionId=${recommendedAction.primaryTargetInstitution?.id || ''}`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Plan Camp Brief</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Catchment Radius Selector & Ranked Institutions */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              Catchment Matching Radar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Institutions ranked by trade match, road travel time, programme capacity, and responsiveness.
            </p>
          </div>

          {/* Catchment Time Slider / Toggle */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl self-start sm:self-auto">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Catchment:</span>
            {[30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setCatchmentMinutes(mins)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  catchmentMinutes === mins
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Institutions Ranking Table */}
        {rankedInstitutions.length === 0 ? (
          <div className="text-center p-8 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">
              No matching institutions within {catchmentMinutes} minutes
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try switching to the 60-minute catchment radius or initiating employer follow-up.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankedInstitutions.map((inst, index) => {
              const score = inst.rankScore;
              return (
                <div
                  key={inst.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Rank Badge */}
                    <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      #{index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/radar/institutions/${inst.id}`}
                          className="font-bold text-sm text-slate-100 hover:text-indigo-400 transition"
                        >
                          {inst.name}
                        </Link>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {inst.type}
                        </span>
                        {inst.matchStrength === 'EXACT' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            EXACT MATCH
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            RELATED MATCH
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-indigo-300/90 font-medium">
                        {inst.whyThisInstitution}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span>📍 {inst.district}</span>
                        <span>⏱ {inst.travelMinutes} mins travel</span>
                        {inst.contactName && (
                          <span>
                            👤 {inst.contactRole || 'Principal'}: {inst.contactName}
                          </span>
                        )}
                        {inst.contactPhone && (
                          <span className="text-slate-300 font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3 text-indigo-400" />
                            {inst.contactPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Normalized Score Badge */}
                  <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Match Score</span>
                      <span className="text-lg font-extrabold text-white">
                        {score}
                        <span className="text-xs font-normal text-slate-400">/100</span>
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/radar/mobilisation/camps?postingId=${posting?.id}&institutionId=${inst.id}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium transition border border-slate-700"
                    >
                      Plan Camp
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Provenance Footer */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            {data?.provenance?.travelTimeSource ||
              'Precomputed travel network and geodesic distance estimates.'}
          </span>
        </div>
      </div>
    </div>
  );
}
