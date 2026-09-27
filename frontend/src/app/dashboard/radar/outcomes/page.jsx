'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Users,
  Target,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function OutcomesPage() {
  const [districtCode, setDistrictCode] = useState('GORAKHPUR');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutcomes = async () => {
      try {
        setLoading(true);
        const district = localStorage.getItem('pmis_selected_district') || 'GORAKHPUR';
        setDistrictCode(district);
        const res = await api.getRadarOutcomes(district);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load outcomes data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOutcomes();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading outcome observation data...</p>
      </div>
    );
  }

  const metrics = data?.metrics || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Mobilisation Outcomes & Impact Radar
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Comparative performance analysis: DNO Targeted Opportunities vs Similar Untargeted Opportunities.
          </p>
        </div>
      </div>

      {/* Prominent Illustrative Disclaimer Alert */}
      <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-200">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">
            Benchmark Observation Model — Illustrative Comparative Analysis
          </p>
          <p className="text-amber-200/90 leading-relaxed">
            The metrics displayed below illustrate candidate flow differences between postings with active DNO mobilization (camp drives, targeted bulletins) versus untargeted postings. These observations serve as a decision-support guide and should be interpreted as an association view rather than formal statistical proof of causation.
          </p>
        </div>
      </div>

      {/* Comparative Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((m, idx) => {
          const targetedVal = Number(m.targeted) || 0;
          const untargetedVal = Number(m.untargeted) || 0;
          const maxVal = Math.max(targetedVal, untargetedVal, 1);

          const targetedPercent = Math.min(100, Math.round((targetedVal / (m.unit === '%' ? 100 : maxVal * 1.2)) * 100));
          const untargetedPercent = Math.min(100, Math.round((untargetedVal / (m.unit === '%' ? 100 : maxVal * 1.2)) * 100));

          return (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">{m.metricName}</h4>
                  <span className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    {m.unit}
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Targeted Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Targeted Opportunities
                      </span>
                      <span className="font-bold text-white text-sm">
                        {targetedVal}
                        {m.unit === '%' ? '%' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${targetedPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Untargeted Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                        Untargeted Baseline
                      </span>
                      <span className="font-semibold text-slate-300">
                        {untargetedVal}
                        {m.unit === '%' ? '%' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="bg-slate-600 h-full rounded-full transition-all duration-700"
                        style={{ width: `${untargetedPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lift Factor Badge */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Relative Lift:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{Math.round(((targetedVal - untargetedVal) / Math.max(0.1, untargetedVal)) * 100)}%
                  Higher
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory Methodology Card */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Field Mobilisation Key Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
          <p>
            • <strong>Catchment Localization:</strong> Postings supported with institution-specific bulletins and campus drives demonstrate significantly higher candidate retention and application volume from within the 60-minute travel radius.
          </p>
          <p>
            • <strong>Joining Reliability:</strong> Candidate interview attendance and offer conversion increase when mobilization is conducted in direct coordination with ITI and Polytechnic placement coordinators.
          </p>
        </div>
      </div>
    </div>
  );
}
