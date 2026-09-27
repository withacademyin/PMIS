'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Layers,
  Calendar,
  Clock,
  Building2,
  Phone,
  User,
  Printer,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  MapPin,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';

function CampPlannerContent() {
  const searchParams = useSearchParams();
  const initialPostingId = searchParams.get('postingId') || '';
  const initialInstitutionId = searchParams.get('institutionId') || '';

  const [opportunities, setOpportunities] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selectedPostingId, setSelectedPostingId] = useState(initialPostingId);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(initialInstitutionId);

  // Form Fields
  const [campName, setCampName] = useState('');
  const [proposedDate, setProposedDate] = useState('2026-10-02');
  const [proposedTime, setProposedTime] = useState('11:00 AM');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdCamp, setCreatedCamp] = useState(null);

  useEffect(() => {
    const loadMaster = async () => {
      try {
        const district = localStorage.getItem('pmis_selected_district') || 'GORAKHPUR';
        const [oppsRes, instsRes] = await Promise.all([
          api.getRadarOpportunities({ districtCode: district }),
          api.getRadarInstitutions({ districtCode: district })
        ]);

        if (oppsRes.success) {
          setOpportunities(oppsRes.data);
          if (!selectedPostingId && oppsRes.data.length > 0) {
            setSelectedPostingId(oppsRes.data[0].id);
          }
        }

        if (instsRes.success) {
          setInstitutions(instsRes.data);
          if (!selectedInstitutionId && instsRes.data.length > 0) {
            setSelectedInstitutionId(instsRes.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load master data for camp:', err);
      }
    };
    loadMaster();
  }, []);

  const selectedOpp = opportunities.find((o) => o.id === selectedPostingId);
  const selectedInst = institutions.find((i) => i.id === selectedInstitutionId);

  // Prefill when opportunity or institution changes
  useEffect(() => {
    if (selectedOpp && !campName) {
      setCampName(`PMIS Mobilisation Drive — ${selectedOpp.roleTitle}`);
    }
    if (selectedInst) {
      if (!coordinatorName) setCoordinatorName(selectedInst.contactName || 'Principal In-Charge');
      if (!coordinatorPhone) setCoordinatorPhone(selectedInst.contactPhone || '9876543210');
    }
  }, [selectedOpp, selectedInst]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPostingId || !selectedInstitutionId) return;

    try {
      setSubmitting(true);
      const res = await api.planRadarCamp({
        postingId: selectedPostingId,
        institutionId: selectedInstitutionId,
        campName,
        proposedDate: new Date(proposedDate).toISOString(),
        proposedTime,
        coordinatorName,
        coordinatorPhone,
        notes
      });

      if (res.success) {
        setCreatedCamp(res.data);
      }
    } catch (err) {
      console.error('Failed to plan camp:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            Campus Mobilisation Camp Planner
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Coordinate on-campus candidate mobilization camps and generate official event briefs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Opportunity Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Opportunity
              </label>
              <select
                value={selectedPostingId}
                onChange={(e) => setSelectedPostingId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
              >
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    [{opp.postingId}] {opp.roleTitle} ({opp.openings} openings)
                  </option>
                ))}
              </select>
            </div>

            {/* Institution Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Host Institution
              </label>
              <select
                value={selectedInstitutionId}
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.type} • {inst.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Camp Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Camp Name / Title
              </label>
              <input
                type="text"
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Electrical Maintenance Campus Recruitment Drive"
                required
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Proposed Date
                </label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Proposed Time
                </label>
                <input
                  type="text"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  placeholder="11:00 AM"
                  required
                />
              </div>
            </div>

            {/* Coordinator Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Coordinator Name
                </label>
                <input
                  type="text"
                  value={coordinatorName}
                  onChange={(e) => setCoordinatorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Coordinator Name"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Coordinator Phone
                </label>
                <input
                  type="text"
                  value={coordinatorPhone}
                  onChange={(e) => setCoordinatorPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Operational Notes / Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Set up 20 computers in Room 104 with Aadhaar biometric readers for on-spot assistance."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Recording Camp Plan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Plan & Generate Brief</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Printable Brief Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Printable Camp Brief
              </span>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print A4</span>
              </button>
            </div>

            {/* Document Preview Box */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3 text-center">
                <h4 className="font-extrabold text-sm text-white">
                  GOVERNMENT OF UTTAR PRADESH
                </h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                  PM Internship Scheme • District Opportunity Radar
                </p>
                <div className="mt-2 text-xs font-bold text-indigo-400">
                  CAMPUS MOBILISATION BRIEF
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase">Camp Title:</span>
                  <p className="font-bold text-slate-100">{campName || 'PMIS Recruitment Camp'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Date & Time:</span>
                    <p className="font-semibold text-slate-200">
                      {proposedDate} • {proposedTime}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Openings:</span>
                    <p className="font-semibold text-emerald-400">
                      {selectedOpp?.openings || 10} Openings
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase">Host Venue:</span>
                  <p className="font-semibold text-slate-200">
                    {selectedInst?.name || 'Selected Institution'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedInst?.address || selectedInst?.district}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase">Target Opportunity:</span>
                  <p className="font-semibold text-slate-200">
                    {selectedOpp?.roleTitle} ({selectedOpp?.companyName})
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Stipend: ₹{selectedOpp?.monthlySupport}/mo • Qualification: {selectedOpp?.qualification?.label}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase">Coordinator:</span>
                  <p className="font-semibold text-slate-200">
                    {coordinatorName} ({coordinatorPhone})
                  </p>
                </div>

                {notes && (
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400">
                    <strong className="text-slate-300">Notes:</strong> {notes}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 text-center">
                Candidate registrations are submitted directly on pminternship.mca.gov.in. No fee is charged.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampPlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh] text-slate-400 text-xs">
          Loading camp planner...
        </div>
      }
    >
      <CampPlannerContent />
    </Suspense>
  );
}
