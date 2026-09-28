'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFilter } from '@/context/FilterContext';
import { api } from '@/lib/api';
import RadarSidebar from '@/components/radar/RadarSidebar';
import RadarDashboard from '@/components/radar/RadarDashboard';
import RadarOpportunities from '@/components/radar/RadarOpportunities';
import RadarInstitutions from '@/components/radar/RadarInstitutions';
import RadarBulletins from '@/components/radar/RadarBulletins';
import RadarCampPlans from '@/components/radar/RadarCampPlans';
import RadarWeeklyPlan from '@/components/radar/RadarWeeklyPlan';
import RadarOutcomes from '@/components/radar/RadarOutcomes';
import RadarProfile from '@/components/radar/RadarProfile';
import RadarMethodology from '@/components/radar/RadarMethodology';
import OpportunityDetailModal from '@/components/radar/OpportunityDetailModal';
import {
  INSTITUTIONS,
  OPPORTUNITIES,
  PRIORITY_ACTIONS,
  KPI_METRICS,
  NODAL_OFFICER_PROFILE
} from '@/data/radarData';
import {
  normalizeInstitution,
  matchOpportunityInstitutions,
  computeInstitutionsWithMatchCounts
} from '@/lib/opportunityMatcher';
import { Menu, X } from 'lucide-react';

export function RadarView() {
  const { user, logout } = useAuth();
  const {
    globalState,
    setGlobalState,
    globalDistrict,
    setGlobalDistrict,
    availableDistricts,
    setAvailableDistricts,
  } = useFilter();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Selected Opportunity for Detail Modal
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Preselected opportunity for Camp Planner or Bulletin Generator
  const [preselectedOpp, setPreselectedOpp] = useState(null);

  // Filters to pass to RadarOpportunities
  const [opportunityFilters, setOpportunityFilters] = useState(null);

  const [liveOpportunities, setLiveOpportunities] = useState([]);
  const [liveInstitutions, setLiveInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const uniqueDistricts = useMemo(() => {
    const oppDistricts = liveOpportunities.map((op) => op.district);
    const instDistricts = liveInstitutions.map((inst) => inst.district);
    const defaultDistricts = [
      'Agra',
      'Aligarh',
      'Ayodhya',
      'Bareilly',
      'Firozabad',
      'Gorakhpur',
      'Hathras',
      'Kanpur Nagar',
      'Lucknow',
      'Mathura',
      'Meerut',
      'Prayagraj',
      'Varanasi'
    ];
    return Array.from(new Set([...oppDistricts, ...instDistricts, ...defaultDistricts]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [liveOpportunities, liveInstitutions]);

  useEffect(() => {
    if (uniqueDistricts.length > 0) {
      setAvailableDistricts(uniqueDistricts);
    }
  }, [uniqueDistricts, setAvailableDistricts]);

  // Global filtered data across all tabs
  const filteredOpportunities = useMemo(() => {
    if (!globalDistrict || globalDistrict === 'ALL') return liveOpportunities;
    return liveOpportunities.filter(
      (op) => op.district?.toLowerCase() === globalDistrict.toLowerCase()
    );
  }, [liveOpportunities, globalDistrict]);

  const filteredInstitutions = useMemo(() => {
    if (!globalDistrict || globalDistrict === 'ALL') return liveInstitutions;
    return liveInstitutions.filter(
      (inst) => inst.district?.toLowerCase() === globalDistrict.toLowerCase()
    );
  }, [liveInstitutions, globalDistrict]);

  // Active officer profile data
  const officerProfile = useMemo(() => ({
    ...NODAL_OFFICER_PROFILE,
    name: user?.officerProfile?.name || user?.name || NODAL_OFFICER_PROFILE.name,
    email: user?.email || NODAL_OFFICER_PROFILE.email,
    district: user?.officerProfile?.district || NODAL_OFFICER_PROFILE.district,
  }), [user]);

  useEffect(() => {
    let isMounted = true;

    const loadRadarData = async () => {
      try {
        setIsLoading(true);

        // Concurrently fetch requirements and baseline ITIs
        const reqRes = await api.getRequirements().catch((err) => {
          console.warn('Live requirements API unavailable, using fallback data:', err);
          return { success: false };
        });

        // Determine all districts to fetch ITIs for (all districts where opportunities exist + officer district)
        const oppDistricts = (reqRes?.data || []).map((r) => {
          const match = (r.jdText || '').match(/District:\s*([^\n\r]+)/i);
          return match ? match[1].trim() : null;
        }).filter(Boolean);

        const allDistricts = Array.from(
          new Set([
            ...oppDistricts,
            officerProfile.district || 'Gorakhpur',
            'Firozabad',
            'Gorakhpur'
          ])
        );

        // Fetch ITIs across all relevant districts in parallel
        const itiResults = await Promise.all(
          allDistricts.map((d) =>
            api.getITIs({ district: d }).catch(() => ({ success: false }))
          )
        );

        let rawItis = itiResults.flatMap((r) =>
          r.success && Array.isArray(r.itis) ? r.itis : []
        );

        if (rawItis.length === 0) {
          rawItis = INSTITUTIONS;
        }

        const normalizedItis = rawItis.map(normalizeInstitution).filter(Boolean);

        // Process opportunities and dynamically match against loaded ITIs
        let mappedOpps = [];
        if (reqRes?.success && Array.isArray(reqRes.data) && reqRes.data.length > 0) {
          mappedOpps = reqRes.data.map((req) => {
            const jdLines = (req.jdText || '').split('\n');
            const companyLine = jdLines.find((l) => l.startsWith('Company:')) || 'Company: Industrial Partner';
            const stipendLine = jdLines.find((l) => l.startsWith('Stipend:')) || 'Stipend: ₹8,000 / month';
            const districtLine = jdLines.find((l) => l.startsWith('District:')) || `District: ${officerProfile.district || 'Gorakhpur'}`;
            const latLine = jdLines.find((l) => l.startsWith('Lat:')) || 'Lat: 26.75';
            const lngLine = jdLines.find((l) => l.startsWith('Lng:')) || 'Lng: 83.38';
            const riskLine = jdLines.find((l) => l.startsWith('Risk:')) || 'Risk: MEDIUM';

            const company = companyLine.replace('Company:', '').trim();
            const stipend = stipendLine.replace('Stipend:', '').trim();
            const district = districtLine.replace('District:', '').trim();
            const lat = parseFloat(latLine.replace('Lat:', '').trim()) || 26.75;
            const lng = parseFloat(lngLine.replace('Lng:', '').trim()) || 83.38;
            const risk = riskLine.replace('Risk:', '').trim();

            const oppObj = {
              id: req.id,
              roleTitle: req.title,
              company,
              sector: 'Manufacturing & Engineering',
              qualification: req.requiredTrade ? `ITI - ${req.requiredTrade}` : 'ITI - Technical',
              openings: Math.floor(Math.random() * 12) + 6,
              applications: Math.floor(Math.random() * 5),
              daysLeft: Math.floor(Math.random() * 25) + 3,
              closingDate: 'TBD',
              openingDate: new Date(req.createdAt).toLocaleDateString(),
              duration: '12 Months',
              monthlyStipend: stipend,
              address: `${district} Industrial Area`,
              district,
              coordinates: { lat, lng },
              risk,
              riskReason: `${risk} fill risk based on current applicant-to-opening ratio and deadline.`,
            };

            // Dynamic match against institutions
            const matchResult = matchOpportunityInstitutions(oppObj, normalizedItis);
            oppObj.catchmentInstitutions = matchResult.catchmentInstitutions;
            oppObj.recommendedAction = matchResult.recommendedAction;

            return oppObj;
          });
        } else {
          // Dynamic match against baseline opportunities
          mappedOpps = OPPORTUNITIES.map((opp) => {
            const oppCopy = { ...opp };
            const matchResult = matchOpportunityInstitutions(oppCopy, normalizedItis);
            oppCopy.catchmentInstitutions = matchResult.catchmentInstitutions;
            oppCopy.recommendedAction = matchResult.recommendedAction;
            return oppCopy;
          });
        }

        // Compute reverse match counts for each institution
        const enrichedInstitutions = computeInstitutionsWithMatchCounts(
          normalizedItis,
          mappedOpps
        );

        if (isMounted) {
          setLiveInstitutions(enrichedInstitutions);
          setLiveOpportunities(mappedOpps);
        }
      } catch (error) {
        console.error('Failed to load radar data:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRadarData();

    return () => {
      isMounted = false;
    };
  }, [user, officerProfile.district]);

  // On-demand ITI loading when district changes
  useEffect(() => {
    if (!globalDistrict || globalDistrict === 'ALL') return;

    const hasDistItis = liveInstitutions.some(
      (inst) => inst.district?.toLowerCase() === globalDistrict.toLowerCase()
    );

    if (!hasDistItis) {
      api.getITIs({ district: globalDistrict }).then((res) => {
        if (res?.success && Array.isArray(res.itis) && res.itis.length > 0) {
          const normalized = res.itis.map(normalizeInstitution).filter(Boolean);
          const enriched = computeInstitutionsWithMatchCounts(normalized, liveOpportunities);
          setLiveInstitutions((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newOnes = enriched.filter((i) => !existingIds.has(i.id));
            return [...prev, ...newOnes];
          });
        }
      }).catch((err) => {
        console.warn(`Could not fetch ITIs for district ${globalDistrict}:`, err);
      });
    }
  }, [globalDistrict, liveOpportunities, liveInstitutions]);

  // Compute live KPI metrics based on filtered opportunities
  const liveKpiMetrics = useMemo(() => {
    if (filteredOpportunities.length === 0) return KPI_METRICS;
    const highRiskCount = filteredOpportunities.filter((o) => o.risk === 'HIGH').length;
    const openingsAtRisk = filteredOpportunities
      .filter((o) => o.risk === 'HIGH')
      .reduce((sum, o) => sum + (o.openings || 0), 0);
    const totalOpenings = filteredOpportunities.reduce((sum, o) => sum + (o.openings || 0), 0);
    const totalApplications = filteredOpportunities.reduce((sum, o) => sum + (o.applications || 0), 0);
    const closingNext7Days = filteredOpportunities.filter((o) => (o.daysLeft || 30) <= 7).length;

    return {
      openOpportunities: filteredOpportunities.length,
      highRisk: highRiskCount,
      openingsAtRisk,
      closingNext7Days,
      totalOpenings,
      totalApplications,
      lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      weekRange: KPI_METRICS.weekRange,
    };
  }, [filteredOpportunities]);

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
    <div className="flex min-h-[calc(100vh-5rem)] bg-slate-50/60 font-sans">
      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:block shrink-0 sticky top-20 h-[calc(100vh-5rem)] z-30">
        <RadarSidebar
          activeNav={activeNav}
          onNavChange={(nav) => setActiveNav(nav)}
          kpiMetrics={liveKpiMetrics}
          officerProfile={officerProfile}
          globalDistrict={globalDistrict}
          globalState={globalState}
          institutionsCount={filteredInstitutions.length}
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
              kpiMetrics={liveKpiMetrics}
              officerProfile={officerProfile}
              globalDistrict={globalDistrict}
              globalState={globalState}
              institutionsCount={filteredInstitutions.length}
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
            {globalDistrict === 'ALL' ? 'All Districts' : globalDistrict}, UP
          </span>
        </div>

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeNav === 'dashboard' && (
            <RadarDashboard
              opportunities={filteredOpportunities}
              institutions={filteredInstitutions}
              priorityActions={PRIORITY_ACTIONS}
              globalDistrict={globalDistrict}
              setGlobalDistrict={setGlobalDistrict}
              globalState={globalState}
              setGlobalState={setGlobalState}
              uniqueDistricts={uniqueDistricts}
              onSelectOpportunity={handleOpenOpportunityModal}
              onPlanCamp={handlePlanCamp}
              onShareBulletin={handleShareBulletin}
              onNavigateToNav={(nav, filters) => {
                setOpportunityFilters(filters || null);
                setActiveNav(nav);
              }}
            />
          )}

          {activeNav === 'opportunities' && (
            <RadarOpportunities
              opportunities={filteredOpportunities}
              initialFilters={opportunityFilters}
              globalDistrict={globalDistrict}
              setGlobalDistrict={setGlobalDistrict}
              uniqueDistricts={uniqueDistricts}
              onSelectOpportunity={handleOpenOpportunityModal}
              onPlanCamp={handlePlanCamp}
              onShareBulletin={handleShareBulletin}
            />
          )}

          {activeNav === 'institutions' && (
            <RadarInstitutions
              institutions={filteredInstitutions}
              opportunities={filteredOpportunities}
              globalDistrict={globalDistrict}
              setGlobalDistrict={setGlobalDistrict}
              uniqueDistricts={uniqueDistricts}
              onPlanCamp={handlePlanCamp}
              onSelectOpportunity={handleOpenOpportunityModal}
            />
          )}

          {activeNav === 'bulletins' && (
            <RadarBulletins
              opportunities={filteredOpportunities}
              globalDistrict={globalDistrict}
              setGlobalDistrict={setGlobalDistrict}
              uniqueDistricts={uniqueDistricts}
              selectedOppId={preselectedOpp?.id}
              onSelectOpportunity={handleOpenOpportunityModal}
            />
          )}

          {activeNav === 'camp-plans' && (
            <RadarCampPlans
              opportunities={filteredOpportunities}
              institutions={filteredInstitutions}
              globalDistrict={globalDistrict}
              setGlobalDistrict={setGlobalDistrict}
              uniqueDistricts={uniqueDistricts}
              preselectedOpportunity={preselectedOpp}
              nodalOfficer={officerProfile}
            />
          )}

          {activeNav === 'weekly-plan' && <RadarWeeklyPlan />}

          {activeNav === 'outcomes' && <RadarOutcomes />}

          {activeNav === 'settings' && <RadarProfile officerProfile={officerProfile} />}

          {activeNav === 'methodology' && <RadarMethodology />}
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
