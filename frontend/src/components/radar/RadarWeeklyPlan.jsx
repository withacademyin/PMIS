'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Circle,
  Printer,
  Calendar,
  AlertTriangle,
  Building2,
  Clock,
  Sparkles,
  Phone,
  Edit3,
  Save,
  Check
} from 'lucide-react';
import { WEEKLY_ACTION_ITEMS } from '@/data/radarData';

export function RadarWeeklyPlan() {
  const [items, setItems] = useState(WEEKLY_ACTION_ITEMS);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [tempNote, setTempNote] = useState('');

  const toggleDone = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const startEditNote = (item) => {
    setEditingNoteId(item.id);
    setTempNote(item.notes || '');
  };

  const saveNote = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes: tempNote } : item))
    );
    setEditingNoteId(null);
  };

  const completedCount = items.filter((i) => i.done).length;

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Weekly Action Plan
              </h2>
              <p className="text-xs text-slate-500">
                District: <strong className="text-slate-800">Gorakhpur</strong> • Week: <strong className="text-slate-800">28 Sep – 04 Oct 2026</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-slate-400 font-medium">Progress: </span>
            <span className="font-bold text-slate-900">
              {completedCount} of {items.length} Completed
            </span>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print A4 Action Sheet</span>
          </button>
        </div>
      </div>

      {/* ── Action Items List ── */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const isHigh = item.risk === 'HIGH';

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                item.done
                  ? 'bg-slate-50/80 border-slate-200 opacity-80'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Done Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleDone(item.id)}
                  className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    item.done
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border-2 border-slate-300 hover:border-slate-400 text-transparent'
                  }`}
                  title={item.done ? 'Mark as Pending' : 'Mark as Done'}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>

                {/* Main Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <h3
                        className={`text-base font-bold ${
                          item.done ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {item.roleTitle}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.risk} RISK
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>{item.openings} Openings</span>
                      <span>•</span>
                      <span>{item.applications} Applications</span>
                      <span>•</span>
                      <span className="text-rose-600 font-bold">{item.daysLeft} days left</span>
                    </div>
                  </div>

                  {/* Recommended Action Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10.5px] uppercase font-bold text-slate-400 block">
                        Assigned Mobilisation Action
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{item.action}</span>
                      <span className="block text-slate-500 mt-0.5">{item.institution}</span>
                    </div>

                    <div>
                      <span className="text-[10.5px] uppercase font-bold text-slate-400 block">
                        Key Point of Contact
                      </span>
                      <span className="font-medium text-slate-800">{item.contact}</span>
                    </div>
                  </div>

                  {/* Notes Field */}
                  <div className="pt-1">
                    {editingNoteId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-slate-900"
                          placeholder="Enter field notes, appointment times, or follow-up status..."
                        />
                        <button
                          type="button"
                          onClick={() => saveNote(item.id)}
                          className="py-1.5 px-3 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50">
                        <span className="italic">
                          <strong className="text-amber-900 font-semibold not-italic">Notes: </strong>
                          {item.notes || 'No notes added yet.'}
                        </span>
                        <button
                          type="button"
                          onClick={() => startEditNote(item)}
                          className="text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1 ml-2 shrink-0 text-[11px]"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RadarWeeklyPlan;
