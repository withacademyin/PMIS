import React from 'react';
import { Calculator, AlertTriangle, TrendingUp, Compass, MapPin } from 'lucide-react';

export default function RadarMethodology() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Decision-Support Engine
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Calculator className="w-6 h-6 text-indigo-600" />
          Methodology & Mathematical Rules
        </h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Simple explanations of the mathematical logic used to match opportunities, evaluate risks, and determine institutional catchments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Section 1: Catchment Radius & Distance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Catchment Radius (Haversine)
            </h2>
          </div>
          <div className="text-sm text-slate-600 space-y-3">
            <p>
              To find nearby institutions for an opportunity, we use the <strong>Haversine Formula</strong> to calculate the exact distance over the Earth's surface.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs text-slate-700">
              d = 2 * R * arcsin(√a)<br/>
              where a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlong/2)
            </div>
            <p>
              In simple words: We draw a circle (e.g., 20km or 50km radius) around the opportunity's location and identify all ITIs and Polytechnics inside that circle.
            </p>
          </div>
        </div>

        {/* Section 2: Trade & Sector Matching */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Trade Compatibility Score
            </h2>
          </div>
          <div className="text-sm text-slate-600 space-y-3">
            <p>
              Not all institutions can supply candidates for every role. We calculate a compatibility score.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs text-slate-700">
              Score = (Matching Trades / Required Trades) * 100
            </div>
            <p>
              In simple words: An institution scores higher if they teach the exact trades (like Fitter or Electrician) required by the job opportunity. Only institutions with a > 0 score are shown in the catchment.
            </p>
          </div>
        </div>

        {/* Section 3: Risk Classification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Opportunity Risk Assessment
            </h2>
          </div>
          <div className="text-sm text-slate-600 space-y-3">
            <p>
              Opportunities are classified into HIGH, MEDIUM, and LOW risk based on two primary factors: Fill Rate and Time Remaining.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs text-slate-700">
              Fill Rate = (Applications / Openings) * 100<br/>
              Urgency = Days Left to Close
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>HIGH Risk:</strong> Fill rate &lt; 30% AND Days Left &lt; 7</li>
              <li><strong>MEDIUM Risk:</strong> Fill rate &lt; 60% OR Days Left &lt; 14</li>
              <li><strong>LOW Risk:</strong> Fill rate &ge; 60% AND Days Left &ge; 14</li>
            </ul>
          </div>
        </div>

        {/* Section 4: Supply Deficit Calculation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Supply Deficit Modeling
            </h2>
          </div>
          <div className="text-sm text-slate-600 space-y-3">
            <p>
              To alert officers on potential shortages, we project the final application count using the current application velocity.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs text-slate-700">
              Velocity = Applications / Days Active<br/>
              Projected Total = Applications + (Velocity * Days Left)
            </div>
            <p>
              In simple words: If the Projected Total is less than the Openings, a Supply Deficit Warning is triggered, signaling the need for an immediate Camp or Job Fair.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
