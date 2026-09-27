'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle2,
  Circle,
  Plus,
  Printer,
  Calendar,
  Phone,
  MessageSquare,
  AlertCircle,
  ChevronDown,
  Building2,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function WeeklyActionPlanPage() {
  const [districtCode, setDistrictCode] = useState('GORAKHPUR');
  const [weekIdentifier, setWeekIdentifier] = useState('2026-W40');
  const [actionData, setActionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Note dialog state
  const [activeItemId, setActiveItemId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const fetchActionPlan = async (code, week) => {
    try {
      setLoading(true);
      const res = await api.getRadarActionPlan(code || districtCode, week || weekIdentifier);
      if (res.success) {
        setActionData(res.data);
      }
    } catch (err) {
      console.error('Failed to load action plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('pmis_selected_district') || 'GORAKHPUR';
    setDistrictCode(saved);
    fetchActionPlan(saved, weekIdentifier);

    const handleDistrictChange = (e) => {
      if (e.detail) {
        setDistrictCode(e.detail);
        fetchActionPlan(e.detail, weekIdentifier);
      }
    };

    window.addEventListener('radar_district_changed', handleDistrictChange);
    return () => window.removeEventListener('radar_district_changed', handleDistrictChange);
  }, [weekIdentifier]);

  const handleToggleDone = async (itemId) => {
    try {
      const res = await api.toggleRadarActionPlanItem(itemId);
      if (res.success) {
        // Update local state
        setActionData((prev) => {
          if (!prev) return prev;
          const items = prev.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  isDone: res.data.isDone,
                  completedAt: res.data.completedAt,
                  completedBy: res.data.completedBy
                }
              : i
          );
          return {
            ...prev,
            items,
            completedCount: items.filter((i) => i.isDone).length
          };
        });
      }
    } catch (err) {
      console.error('Failed to toggle action item:', err);
    }
  };

  const handleAddNote = async (itemId) => {
    if (!noteText.trim()) return;

    try {
      setAddingNote(true);
      const res = await api.addRadarActionPlanNote(itemId, noteText.trim());
      if (res.success) {
        setActionData((prev) => {
          if (!prev) return prev;
          const items = prev.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  notes: [res.data, ...(i.notes || [])]
                }
              : i
          );
          return { ...prev, items };
        });
        setNoteText('');
        setActiveItemId(null);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const items = actionData?.items || [];
  const completedCount = actionData?.completedCount || 0;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-400" />
            Weekly Field Mobilisation Action Plan
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Prescribed DNO actions for {districtCode} • Week: 28 Sep – 04 Oct 2026.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Action Sheet</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Weekly Execution Progress
          </span>
          <p className="text-base font-bold text-white">
            {completedCount} of {items.length} Mobilisation Actions Completed
          </p>
        </div>

        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Completion</span>
            <span className="font-bold text-indigo-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Items List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading weekly action sheet...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
          <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">No action items recorded for this week</p>
          <p className="text-xs text-slate-500 mt-1">Actions are generated automatically from High-Risk opportunities</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const opp = item.posting;
            const targetInsts = Array.isArray(item.targetInstitutions) ? item.targetInstitutions : [];
            const isDone = item.isDone;

            return (
              <div
                key={item.id}
                className={`bg-slate-950 border rounded-xl p-5 shadow-lg transition ${
                  isDone ? 'border-emerald-900/40 bg-slate-950/70' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Checkbox and Priority Index */}
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => handleToggleDone(item.id)}
                      className="mt-1 p-0.5 text-slate-400 hover:text-emerald-400 transition"
                      title={isDone ? 'Mark as Not Done' : 'Mark as Done'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">
                          #{index + 1}
                        </span>
                        <span className="font-bold text-sm text-slate-100">
                          {opp?.roleTitle}
                        </span>
                        <span className="text-xs text-slate-400">
                          • {opp?.companyName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          HIGH RISK
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">
                        <strong className="text-slate-200">{opp?.openings} openings</strong> • {opp?.applications} applications • Closes in {opp?.risk?.daysLeft} days
                      </p>

                      {/* Prescribed Action Callout */}
                      <div className="mt-3 p-3 bg-indigo-950/30 border border-indigo-900/50 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Prescribed Action: {item.recommendedAction}</span>
                        </div>

                        {targetInsts.length > 0 && (
                          <div className="text-xs text-slate-300 space-y-1 pt-1">
                            <span className="text-slate-400 text-[11px]">Target Institution(s):</span>
                            {targetInsts.map((inst, i) => (
                              <div key={i} className="flex items-center gap-2 pl-2">
                                <span className="text-indigo-400 font-semibold">• {inst.name}</span>
                                {inst.phone && (
                                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-500" />
                                    {inst.phone}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Completed Stamping */}
                      {isDone && item.completedAt && (
                        <p className="text-[11px] text-emerald-400 pt-1 font-medium">
                          ✓ Completed on {new Date(item.completedAt).toLocaleString('en-IN')} by {item.completedBy}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => setActiveItemId(activeItemId === item.id ? null : item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-800 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Note</span>
                    </button>

                    <Link
                      href={`/dashboard/radar/opportunities/${opp?.id}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      View Radar
                    </Link>
                  </div>
                </div>

                {/* Inline Add Note Form */}
                {activeItemId === item.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add field progress note (e.g. Spoke with Principal; scheduled WhatsApp blast)..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleAddNote(item.id)}
                      disabled={addingNote || !noteText.trim()}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
                    >
                      {addingNote ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                )}

                {/* Existing Notes List */}
                {item.notes && item.notes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Field Notes:
                    </span>
                    {item.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2 bg-slate-900/60 border border-slate-800 rounded text-xs text-slate-300 flex items-start justify-between gap-2"
                      >
                        <p className="leading-relaxed">&ldquo;{note.noteText}&rdquo;</p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {note.authorName} • {new Date(note.createdAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
