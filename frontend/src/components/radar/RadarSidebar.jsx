'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Megaphone,
  FileText,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronRight,
  Radio,
  Sparkles,
  FileCheck,
  CalendarCheck,
  LogOut,
  UserCheck,
  Calculator
} from 'lucide-react';

export function RadarSidebar({
  activeNav,
  onNavChange,
  kpiMetrics,
  officerProfile,
  globalDistrict,
  globalState = 'UP',
  onLogout,
  onSelectSubNav,
  institutionsCount,
}) {
  const [mobilisationOpen, setMobilisationOpen] = useState(
    activeNav === 'mobilisation' || activeNav === 'bulletins' || activeNav === 'camp-plans'
  );

  const isNavActive = (id) => activeNav === id;
  const isMobilisationActive =
    activeNav === 'mobilisation' || activeNav === 'bulletins' || activeNav === 'camp-plans';

  const handleNavClick = (id) => {
    if (id === 'mobilisation') {
      setMobilisationOpen((prev) => !prev);
      onNavChange('bulletins'); // default to bulletins
    } else {
      onNavChange(id);
    }
  };

  return (
    <aside className="w-68 flex flex-col border-r border-slate-200 bg-white h-full shrink-0 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      {/* ── Brand Header ── */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[14px] font-bold tracking-tight text-slate-900 leading-tight">
                PMIS Opportunity Radar
              </h1>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                India
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Menu ── */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className={`w-full group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${isNavActive('dashboard')
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard
              className={`w-4 h-4 ${isNavActive('dashboard') ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-600'
                }`}
            />
            <span>Dashboard</span>
          </div>
          <span
            className={`w-1.5 h-1.5 rounded-full ${isNavActive('dashboard') ? 'bg-emerald-400' : 'bg-transparent'
              }`}
          />
        </button>

        {/* 2. Opportunities */}
        <button
          type="button"
          onClick={() => handleNavClick('opportunities')}
          className={`w-full group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${isNavActive('opportunities')
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <div className="flex items-center gap-2.5">
            <MapPin
              className={`w-4 h-4 ${isNavActive('opportunities') ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-600'
                }`}
            />
            <span>Opportunities</span>
          </div>
        </button>

        {/* 3. Institutions */}
        <button
          type="button"
          onClick={() => handleNavClick('institutions')}
          className={`w-full group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${isNavActive('institutions')
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <div className="flex items-center gap-2.5">
            <Building2
              className={`w-4 h-4 ${isNavActive('institutions') ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-600'
                }`}
            />
            <span>Institutions</span>
          </div>
        </button>

        {/* 4. Mobilisation (with Expandable Sub-items) */}
        <div>
          <button
            type="button"
            onClick={() => {
              setMobilisationOpen(!mobilisationOpen);
              if (!isMobilisationActive) {
                onNavChange('bulletins');
              }
            }}
            className={`w-full group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${isMobilisationActive
              ? 'bg-slate-100/90 text-slate-900 font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <Megaphone
                className={`w-4 h-4 ${isMobilisationActive ? 'text-rose-600' : 'text-slate-600 group-hover:text-slate-600'
                  }`}
              />
              <span> Events &amp; Camps</span>
            </div>
            {mobilisationOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            )}
          </button>

          {/* Sub-items tree: Bulletins & Camp Plans */}
          {mobilisationOpen && (
            <div className="ml-4 mt-1 pl-3 border-l-2 border-slate-200 space-y-0.5">
              <button
                type="button"
                onClick={() => onNavChange('bulletins')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors ${activeNav === 'bulletins'
                  ? 'bg-rose-50 text-rose-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                <span className="font-mono text-xs text-slate-600">├─</span>
                <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Bulletins</span>
              </button>

              <button
                type="button"
                onClick={() => onNavChange('camp-plans')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors ${activeNav === 'camp-plans'
                  ? 'bg-rose-50 text-rose-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                <span className="font-mono text-xs text-slate-600">└─</span>
                <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Camp Plans</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Weekly Action Plan */}
        <button
          type="button"
          onClick={() => handleNavClick('weekly-plan')}
          className={`w-full group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${isNavActive('weekly-plan')
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <div className="flex items-center gap-2.5">
            <FileText
              className={`w-4 h-4 ${isNavActive('weekly-plan') ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-600'
                }`}
            />
            <span>Weekly Action Plan</span>
          </div>
        </button>

        {/* 6. Outcomes */}
        <button
          type="button"
          onClick={() => handleNavClick('outcomes')}
          className={`w-full group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${isNavActive('outcomes')
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <div className="flex items-center gap-2.5">
            <TrendingUp
              className={`w-4 h-4 ${isNavActive('outcomes') ? 'text-purple-400' : 'text-slate-600 group-hover:text-slate-600'
                }`}
            />
            <span>Outcomes</span>
          </div>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${isNavActive('outcomes')
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
          >
            Pilot
          </span>
        </button>

        {/* Divider */}
        <div className="pt-3 pb-2">
          <div className="border-t border-slate-200"></div>
        </div>

        {/* 7. Profile / Settings */}
        <button
          type="button"
          onClick={() => handleNavClick('settings')}
          className={`w-full group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${isNavActive('settings')
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Settings
            className={`w-4 h-4 ${isNavActive('settings') ? 'text-slate-300' : 'text-slate-600 group-hover:text-slate-600'
              }`}
          />
          <span> Profile / Settings</span>
        </button>

        {/* 8. Methodology */}
        <button
          type="button"
          onClick={() => handleNavClick('methodology')}
          className={`w-full group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${isNavActive('methodology')
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Calculator
            className={`w-4 h-4 ${isNavActive('methodology') ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-600'
              }`}
          />
          <span> Methodology</span>
        </button>
      </div>

      {/* ── User Profile Footer ── */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center font-bold text-xs tracking-wider border-2 border-white shadow-sm">
              RS
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-900 truncate">
                {officerProfile?.name || 'Rahul Sharma'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {officerProfile?.roleTitle || 'District Nodal Officer'}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium">
              {!globalDistrict || globalDistrict === 'ALL' ? 'All Districts, UP' : `${globalDistrict}, UP`}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default RadarSidebar;
