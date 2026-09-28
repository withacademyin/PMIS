'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Building2,
  User,
  Phone,
  Briefcase,
  FileCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  MapPin,
  Users,
  AlertCircle
} from 'lucide-react';

export function RadarCampPlans({
  opportunities = [],
  institutions = [],
  globalDistrict,
  setGlobalDistrict,
  uniqueDistricts,
  preselectedOpportunity,
  nodalOfficer,
}) {
  const filteredOpportunities = globalDistrict === 'ALL' 
    ? opportunities 
    : opportunities.filter(op => op.district === globalDistrict);

  const defaultOpp = preselectedOpportunity || filteredOpportunities[0] || opportunities[0];
  const [selectedOppId, setSelectedOppId] = useState(defaultOpp?.id || 'DEMO-0007');
  const activeOpp = filteredOpportunities.find((o) => o.id === selectedOppId) || filteredOpportunities[0] || opportunities[0];

  const defaultInst =
    institutions.find((i) => i.id === 'INST-001') || institutions[0];

  const [formData, setFormData] = useState({
    campName: `${activeOpp?.roleTitle || 'Internship'} Mobilisation Camp`,
    date: '2026-10-05',
    time: '11:00 AM',
    institutionId: defaultInst?.id || '',
    coordinatorName: nodalOfficer?.name || 'Rahul Sharma',
    coordinatorPhone: nodalOfficer?.phone || '+91 98391 23401',
    targetCandidates: 120,
    venueRoom: 'Main Auditorium & Computer Lab 1',
    logisticsChecklist: {
      soundSystem: true,
      pmisAssistanceDesks: true,
      employerPanelSeating: true,
      wifiHotspot: true,
    },
  });

  const [briefGenerated, setBriefGenerated] = useState(false);

  const selectedInst =
    institutions.find((i) => i.id === formData.institutionId) || defaultInst;

  const handleGenerate = (e) => {
    e.preventDefault();
    setBriefGenerated(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Mobilisation Camp Planner
              </h2>
              <p className="text-xs text-slate-500">
                Organize on-campus recruitment and PMIS registration drives at high-match institutions.
              </p>
            </div>
          </div>
        </div>

        {briefGenerated && (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Camp Brief</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left: Camp Configuration Form (5 cols) ── */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Camp Details & Logistics
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            {/* District Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select District
              </label>
              <select
                value={globalDistrict}
                onChange={(e) => setGlobalDistrict(e.target.value)}
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-emerald-50 text-emerald-800 focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">All Districts</option>
                {uniqueDistricts?.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Linked Internship */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Linked PMIS Opportunity
              </label>
              <select
                value={selectedOppId}
                onChange={(e) => {
                  setSelectedOppId(e.target.value);
                  const op = filteredOpportunities.find((o) => o.id === e.target.value);
                  if (op) {
                    setFormData((prev) => ({
                      ...prev,
                      campName: `${op.roleTitle} Mobilisation Camp`,
                    }));
                  }
                }}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:ring-1 focus:ring-slate-900"
              >
                {filteredOpportunities.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.roleTitle} ({op.openings} Openings · {op.company})
                  </option>
                ))}
              </select>
            </div>

            {/* Camp Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Camp Name / Title
              </label>
              <input
                type="text"
                value={formData.campName}
                onChange={(e) => setFormData({ ...formData, campName: e.target.value })}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Time
                </label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>
            </div>

            {/* Venue Institution */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Venue Institution
              </label>
              <select
                value={formData.institutionId}
                onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:ring-1 focus:ring-slate-900"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.totalSeats} seats)
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Hall / Room */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campus Venue Specifics
              </label>
              <input
                type="text"
                value={formData.venueRoom}
                onChange={(e) => setFormData({ ...formData, venueRoom: e.target.value })}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Nodal Coordinator */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coordinator Name
                </label>
                <input
                  type="text"
                  value={formData.coordinatorName}
                  onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coordinator Phone
                </label>
                <input
                  type="text"
                  value={formData.coordinatorPhone}
                  onChange={(e) => setFormData({ ...formData, coordinatorPhone: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors mt-2"
            >
              Generate Official Camp Brief
            </button>
          </form>
        </div>

        {/* ── Right: Official Camp Brief Document (7 cols) ── */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                DISTRICT NODAL OFFICER • PURVANCHAL REGION
              </span>
              <h3 className="text-xl font-black text-slate-900 uppercase">
                Official Mobilisation Camp Brief
              </h3>
              <p className="text-xs text-slate-500">
                Authorized under PM Internship Scheme District Framework • Ref: GKP/PMIS/2026/CAMP-04
              </p>
            </div>

            {/* Camp Summary Table */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-500">Camp Title:</span>
                <span className="col-span-2 font-black text-slate-900">{formData.campName}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-500">Scheduled Date & Time:</span>
                <span className="col-span-2 font-bold text-emerald-700">
                  {formData.date} at {formData.time}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-500">Host Institution:</span>
                <span className="col-span-2 font-semibold text-slate-900">
                  {selectedInst?.name}
                  <span className="block text-[11px] text-slate-500">{selectedInst?.address}</span>
                  <span className="block text-[11px] text-slate-500">
                    Room / Area: {formData.venueRoom}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-500">Linked Opportunity:</span>
                <span className="col-span-2">
                  <strong className="text-slate-900">{activeOpp.roleTitle}</strong> ({activeOpp.company})
                  <span className="block text-[11px] text-slate-500">
                    {activeOpp.openings} Openings • Qualification: {activeOpp.qualification}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-500">Lead Coordinator:</span>
                <span className="col-span-2 font-semibold text-slate-900">
                  {formData.coordinatorName} (District Nodal Officer) • {formData.coordinatorPhone}
                </span>
              </div>
            </div>

            {/* Action Directives */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Pre-Camp Action Directives:
              </h4>
              <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                <li>
                  Institution Principal to notify all final-year & passout batches in{' '}
                  <strong className="text-slate-900">{activeOpp.qualification}</strong>.
                </li>
                <li>
                  Setup 4 internet-enabled verification kiosks for spot PMIS registration assistance.
                </li>
                <li>
                  Employer recruitment reps to arrive at 10:30 AM for brief orientation with DNO.
                </li>
              </ul>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Authorized By:</p>
                <p className="font-bold text-slate-900 mt-1">Rahul Sharma</p>
                <p className="text-[11px] text-slate-500">District Nodal Officer, Gorakhpur</p>
              </div>

              <div className="text-right">
                <div className="inline-block border-2 border-emerald-600 rounded-lg px-3 py-1 text-emerald-700 font-mono font-bold text-[10px] tracking-wider uppercase">
                  DNO OFFICIAL DISPATCH
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RadarCampPlans;
