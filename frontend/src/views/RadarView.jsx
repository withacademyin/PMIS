'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import RadarSidebar from '@/components/radar/RadarSidebar';
import RadarDashboard from '@/components/radar/RadarDashboard';
import RadarOpportunities from '@/components/radar/RadarOpportunities';
import RadarInstitutions from '@/components/radar/RadarInstitutions';
import RadarBulletins from '@/components/radar/RadarBulletins';
import RadarCampPlans from '@/components/radar/RadarCampPlans';
import RadarWeeklyPlan from '@/components/radar/RadarWeeklyPlan';
import RadarOutcomes from '@/components/radar/RadarOutcomes';
import RadarProfile from '@/components/radar/RadarProfile';
import OpportunityDetailModal from '@/components/radar/OpportunityDetailModal';
import {
  OPPORTUNITIES,
  INSTITUTIONS,
  PRIORITY_ACTIONS,
  KPI_METRICS,
  NODAL_OFFICER_PROFILE
} from '@/data/radarData';
import { Menu, X } from 'lucide-react';

export function RadarView() {
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Selected Opportunity for Detail Modal
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Preselected opportunity for Camp Planner or Bulletin Generator
  const [preselectedOpp, setPreselectedOpp] = useState(null);

  // Active officer profile data
  const officerProfile = {
    ...NODAL_OFFICER_PROFILE,
    name: user?.officerProfile?.name || user?.name || NODAL_OFFICER_PROFILE.name,
    email: user?.email || NODAL_OFFICER_PROFILE.email,
    district: user?.officerProfile?.district || NODAL_OFFICER_PROFILE.district,
  };

  const handleOpenOpportunityModal = (opp) => {
    setSelectedOpportunity(opp);
    setIsModalOpen(true);
  };

  const handlePlanCamp = (opp) => {
    setPreselectedOpp(opp);
    setActiveNav('camp-plans');
  };

  const handleShareBulletin = (opp) => {
    setPreselectedOpp(opp);
    setActiveNav('bulletins');
  };

  return (
    <div className="flex min-h-screen bg-slate-50/60 font-sans">
      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-30">
        <RadarSidebar
          activeNav={activeNav}
          onNavChange={(nav) => setActiveNav(nav)}
          kpiMetrics={KPI_METRICS}
          officerProfile={officerProfile}
          onLogout={logout}
        />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 bg-white flex flex-col h-full shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <RadarSidebar
              activeNav={activeNav}
              onNavChange={(nav) => {
                setActiveNav(nav);
                setMobileSidebarOpen(false);
              }}
              kpiMetrics={KPI_METRICS}
              officerProfile={officerProfile}
              onLogout={logout}
            />
          </div>
        </div>
      )}

      {/* ── Main View Area ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Mobile Header Bar */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-slate-900">PMIS Opportunity Radar</span>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Gorakhpur, UP
          </span>
        </div>

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeNav === 'dashboard' && (
            <RadarDashboard
              opportunities={OPPORTUNITIES}
              institutions={INSTITUTIONS}
              priorityActions={PRIORITY_ACTIONS}
              onSelectOpportunity={handleOpenOpportunityModal}
              onPlanCamp={handlePlanCamp}
              onShareBulletin={handleShareBulletin}
              onNavigateToNav={(nav) => setActiveNav(nav)}
            />
          )}

          {activeNav === 'opportunities' && (
            <RadarOpportunities
              onSelectOpportunity={handleOpenOpportunityModal}
              onPlanCamp={handlePlanCamp}
              onShareBulletin={handleShareBulletin}
            />
          )}

          {activeNav === 'institutions' && (
            <RadarInstitutions
              onPlanCamp={handlePlanCamp}
              onSelectOpportunity={handleOpenOpportunityModal}
            />
          )}

          {activeNav === 'bulletins' && (
            <RadarBulletins
              opportunities={OPPORTUNITIES}
              selectedOppId={preselectedOpp?.id}
              onSelectOpportunity={handleOpenOpportunityModal}
            />
          )}

          {activeNav === 'camp-plans' && (
            <RadarCampPlans
              opportunities={OPPORTUNITIES}
              institutions={INSTITUTIONS}
              preselectedOpportunity={preselectedOpp}
              nodalOfficer={officerProfile}
            />
          )}

          {activeNav === 'weekly-plan' && <RadarWeeklyPlan />}

          {activeNav === 'outcomes' && <RadarOutcomes />}

          {activeNav === 'settings' && <RadarProfile officerProfile={officerProfile} />}
        </main>
      </div>

      {/* ── Opportunity Detail Modal (Section 7) ── */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPlanCamp={handlePlanCamp}
        onShareBulletin={handleShareBulletin}
      />
    </div>
  );
}

export default RadarView;
