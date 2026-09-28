'use client';

import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Building2,
  MapPin,
  Mail,
  Phone,
  Bell,
  CheckCircle2,
  Sliders,
  Clock,
  Sparkles,
  Save,
  Radio
} from 'lucide-react';
import { NODAL_OFFICER_PROFILE } from '@/data/radarData';

export function RadarProfile({ officerProfile }) {
  const [profile, setProfile] = useState(officerProfile || NODAL_OFFICER_PROFILE);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* ── Top Bar ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-slate-100 text-slate-800">
            <User className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Profile & Nodal Settings
            </h2>
            <p className="text-xs text-slate-500">
              Manage DNO jurisdiction, notification alerts, and radar preferences.
            </p>
          </div>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Changes Saved Successfully
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Officer Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-center">
          <div className="relative inline-block mx-auto">
            <div className="w-20 h-20 rounded-full bg-slate-900 text-amber-300 font-extrabold text-2xl flex items-center justify-center border-4 border-slate-50 shadow-md">
              RS
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">{profile.name}</h3>
            <p className="text-xs font-semibold text-emerald-700">{profile.roleTitle}</p>
            <p className="text-xs text-slate-500 mt-1">{profile.department}</p>
          </div>

          <div className="pt-3 border-t border-slate-100 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Employee Code:</span>
              <span className="font-mono font-bold text-slate-900">{profile.empId}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Assigned State:</span>
              <span className="font-semibold text-slate-900">Uttar Pradesh</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>District:</span>
              <span className="font-bold text-emerald-700">Gorakhpur</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Account Status:</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Right Columns: Settings & Preferences (2 cols) */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Operational Settings
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Default Catchment Preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Catchment Travel-Time
              </label>
              <div className="flex items-center gap-2">
                {[30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setProfile({ ...profile, defaultCatchmentMinutes: mins })}
                    className={`py-2 px-4 rounded-lg font-semibold text-xs border transition-all ${
                      profile.defaultCatchmentMinutes === mins
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Standard PMIS radius for institution talent matching and camp logistics.
              </p>
            </div>

            {/* Toggle Preferences */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">Weekly High-Risk Alerts</span>
                  <span className="text-[11px] text-slate-500">
                    Receive alert notifications when an opportunity enters the 7-day risk window.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={profile.notificationAlerts}
                  onChange={(e) =>
                    setProfile({ ...profile, notificationAlerts: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">
                    WhatsApp Bulletin Broadcast Sync
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Enable 1-click formatted flyer dispatch to verified ITI principal groups.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={profile.whatsappSync}
                  onChange={(e) =>
                    setProfile({ ...profile, whatsappSync: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                />
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Preferences</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RadarProfile;
