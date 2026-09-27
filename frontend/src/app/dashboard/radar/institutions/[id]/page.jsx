'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  MapPin,
  Phone,
  ArrowLeft,
  Briefcase,
  Users,
  GraduationCap,
  Calendar,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function InstitutionDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.getRadarInstitutionDetail(id);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load institution detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading institution details...</p>
      </div>
    );
  }

  const institution = data?.institution;
  const reverseMatchingOpportunities = data?.reverseMatchingOpportunities || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/radar/institutions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Institutions</span>
        </Link>
      </div>

      {/* Institution Info Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {institution?.type}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {institution?.code}
              </span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                Verified Location
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {institution?.name}
            </h1>

            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {institution?.address || `${institution?.district}, Uttar Pradesh`}
            </p>
          </div>

          {/* Official Contact Box */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-[260px] space-y-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Institutional Contact
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {institution?.contactName || 'Principal In-Charge'}
              </p>
              <p className="text-[11px] text-slate-400">
                {institution?.contactRole || 'Head of Institution'}
              </p>
            </div>
            {institution?.contactPhone && (
              <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 pt-1">
                <Phone className="w-3.5 h-3.5" />
                {institution.contactPhone}
              </p>
            )}
          </div>
        </div>

        {/* Programmes & Capacities */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Offered Programmes & Approved Seats
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {institution?.programmes?.map((prog) => (
              <div
                key={prog.id}
                className="bg-slate-900/70 border border-slate-800 p-3 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-xs text-slate-200">{prog.programmeName}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {prog.programmeCode}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-indigo-400">{prog.seats}</span>
                  <span className="text-[10px] text-slate-400 block uppercase">Seats</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reverse-Matched Open Opportunities */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Reverse-Matched Open Opportunities ({reverseMatchingOpportunities.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Internships currently active in the catchment that align with this institution&apos;s trade capacities.
          </p>
        </div>

        {reverseMatchingOpportunities.length === 0 ? (
          <div className="text-center p-8 text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
            <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No active matching opportunities in the immediate catchment.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {reverseMatchingOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/30 px-2 rounded-lg transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {opp.riskLevel === 'HIGH' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        HIGH RISK
                      </span>
                    )}
                    {opp.riskLevel === 'MEDIUM' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full">
                        <span className="w-1.5 h-1.5 bg-amber-500 rotate-45 rounded-[1px]"></span>
                        MEDIUM RISK
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">{opp.postingId}</span>
                  </div>

                  <Link
                    href={`/dashboard/radar/opportunities/${opp.id}`}
                    className="font-bold text-sm text-slate-100 hover:text-indigo-400 transition block"
                  >
                    {opp.roleTitle}
                  </Link>

                  <p className="text-xs text-slate-400">
                    {opp.companyName} • <strong className="text-slate-300">{opp.openings} openings</strong> ({opp.applications} applied)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/radar/mobilisation/camps?postingId=${opp.id}&institutionId=${institution?.id}`}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-md shadow-indigo-600/20"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Plan Camp Here</span>
                  </Link>
                  <Link
                    href={`/dashboard/radar/opportunities/${opp.id}`}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                    title="View Opportunity Catchment"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
