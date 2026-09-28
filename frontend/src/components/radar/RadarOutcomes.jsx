'use client';

import React from 'react';
import {
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Users,
  Target,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { OUTCOMES_DATA } from '@/data/radarData';

export function RadarOutcomes() {
  const { metrics, cohortInfo } = OUTCOMES_DATA;

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Mobilisation Outcomes & Impact
              </h2>
              <p className="text-xs text-slate-500">
                Evaluating fill performance: Targeted Opportunities (with DNO Action) vs Similar Untargeted Openings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Cohort: {cohortInfo.cohortPeriod}
            </span>
          </div>
        </div>
      </div>

      {/* ── Key Comparative Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {metrics.map((metric, i) => {
          const targetedWidth = (metric.targetedValue / metric.maxScale) * 100;
          const untargetedWidth = (metric.untargetedValue / metric.maxScale) * 100;

          return (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{metric.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{metric.description}</p>
                </div>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {metric.liftPercent} Lift
                </span>
              </div>

              {/* Comparative Visual Bars */}
              <div className="space-y-3 pt-2 text-xs">
                {/* Targeted Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Targeted (With DNO Mobilisation)
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {metric.targetedValue}
                      {metric.unit}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, targetedWidth)}%` }}
                    />
                  </div>
                </div>

                {/* Untargeted Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      Untargeted (Similar Baseline)
                    </span>
                    <span className="text-sm font-bold text-slate-600">
                      {metric.untargetedValue}
                      {metric.unit}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, untargetedWidth)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Summary & Official Methodology Disclaimer ── */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">Methodology & Attribution Notice:</p>
          <p className="text-slate-600 leading-relaxed">
            {cohortInfo.note} Sample includes {cohortInfo.targetedCount} targeted openings across
            Gorakhpur industrial corridors compared with {cohortInfo.untargetedCount} similar openings
            in adjacent non-mobilised districts.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RadarOutcomes;
