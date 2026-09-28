'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  MapPin,
  Building2,
  Clock,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  Globe,
  Radio,
  ExternalLink,
  ChevronRight,
  Filter,
  Maximize,
  Minimize
} from 'lucide-react';

export function RadarMap({
  opportunities = [],
  institutions = [],
  selectedCatchment = '60',
  onSelectCatchment,
  onSelectOpportunity,
  onPlanCamp,
  onShareBulletin,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const catchmentCircleRef = useRef(null);
  const routeLinesRef = useRef(null);

  const [activePin, setActivePin] = useState(null);
  const [showInstitutions, setShowInstitutions] = useState(true);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');
  const [mapStyle, setMapStyle] = useState('voyager'); // voyager, osm, satellite
  const [currentView, setCurrentView] = useState('district'); // district or national
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Handle Fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      if (mapInstanceRef.current) {
        const fixSize = () => {
          mapInstanceRef.current.invalidateSize();
          window.dispatchEvent(new Event('resize'));
        };
        setTimeout(fixSize, 50);
        setTimeout(fixSize, 200);
        setTimeout(fixSize, 500);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    const mapWrapper = document.getElementById('radar-map-wrapper');
    if (!document.fullscreenElement) {
      if (mapWrapper?.requestFullscreen) {
        mapWrapper.requestFullscreen().catch(err => console.error(err));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Catchment radii in meters: 30 min (~14km), 45 min (~22km), 60 min (~32km)
  const catchmentRadiusMeters = {
    '30': 14000,
    '45': 22000,
    '60': 32000,
  }[selectedCatchment] || 32000;

  // ── Initialize Leaflet Map ──
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = await import('leaflet');

      // If map instance already exists, cleanup before re-initializing
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initial center: Gorakhpur District [26.7606, 83.3732]
      const map = L.map(mapContainerRef.current, {
        center: [26.7606, 83.3732],
        zoom: 12,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
      });

      // Add Zoom Control in bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Tile Layer URL with user Carto API Key (Carto requires ?key= parameter)
      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_40zk_1_8df9d09851341ba1a4182945';
      const tileUrls = {
        voyager: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoKey}`,
        positron: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png?key=${cartoKey}`,
        darkMatter: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?key=${cartoKey}`,
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        satellite:
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      };

      const tileLayer = L.tileLayer(tileUrls[mapStyle] || tileUrls.voyager, {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Create Layer Groups
      const markersLayer = L.layerGroup().addTo(map);
      const routesLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
      routeLinesRef.current = routesLayer;

      if (isMounted) {
        setIsMapReady(true);
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapStyle]);

  // ── Render Dynamic Markers, Catchment Circle & Travel Polylines ──
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !isMapReady) return;

    let isMounted = true;

    async function updateLayers() {
      const L = await import('leaflet');
      if (!isMounted || !mapInstanceRef.current || !markersLayerRef.current) return;

      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      const routesLayer = routeLinesRef.current;

      markersLayer.clearLayers();
      if (routesLayer) routesLayer.clearLayers();

      // ── 1. Catchment Circle around Gorakhpur Industrial Corridor ──
      const centerCoord = [26.755, 83.28];
      const circle = L.circle(centerCoord, {
        radius: catchmentRadiusMeters,
        color: '#10b981',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#10b981',
        fillOpacity: 0.08,
      });
      markersLayer.addLayer(circle);
      catchmentCircleRef.current = circle;

      // ── 2. Travel Connection Lines (Section 5.3: 22 min to Govt ITI) ──
      // Line: ABC Manufacturing [26.745, 83.362] -> Govt ITI Gorakhpur [26.7588, 83.3855]
      const opp1Coord = [26.745, 83.362];
      const iti1Coord = [26.7588, 83.3855];

      const travelLine = L.polyline([opp1Coord, iti1Coord], {
        color: '#ef4444',
        weight: 3,
        dashArray: '5, 5',
        opacity: 0.8,
      });

      travelLine.bindTooltip('⏱ 22 min drive via NH-28 (Govt ITI Gorakhpur)', {
        permanent: true,
        direction: 'center',
        className: 'leaflet-custom-tooltip font-bold text-[10px] bg-white text-rose-700 px-2 py-0.5 rounded shadow border border-rose-200',
      });
      if (routesLayer) routesLayer.addLayer(travelLine);

      // Line: Precision Auto [26.775, 83.210] -> Govt ITI Sahjanwa [26.772, 83.195]
      const opp2Coord = [26.775, 83.21];
      const iti2Coord = [26.772, 83.195];
      const travelLine2 = L.polyline([opp2Coord, iti2Coord], {
        color: '#f59e0b',
        weight: 2.5,
        dashArray: '4, 4',
        opacity: 0.8,
      });
      travelLine2.bindTooltip('⏱ 14 min (Govt ITI Sahjanwa)', {
        permanent: true,
        direction: 'center',
        className: 'leaflet-custom-tooltip font-bold text-[9px] bg-white text-amber-800 px-1.5 py-0.5 rounded shadow border border-amber-200',
      });
      if (routesLayer) routesLayer.addLayer(travelLine2);

      // ── 3. Render Institutions Markers ──
      if (showInstitutions) {
        institutions.forEach((inst) => {
          const lat = inst.coordinates?.lat ?? inst.lat;
          const lng = inst.coordinates?.lng ?? inst.lng;
          if (!lat || !lng) return;

          const isITI = (inst.type || '').toUpperCase().includes('ITI');
          const badgeBg = isITI ? '#2563eb' : inst.type === 'Polytechnic' ? '#7c3aed' : '#0d9488';

          const iconHtml = `
            <div style="
              width: 32px;
              height: 32px;
              background-color: ${badgeBg};
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 800;
              font-size: 11px;
              cursor: pointer;
            ">
              ${isITI ? '🏫' : '🎓'}
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-leaflet-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([lat, lng], { icon: customIcon });

          marker.on('click', () => {
            setActivePin({ ...inst, isInstitution: true });
          });

          markersLayer.addLayer(marker);
        });
      }

      // ── 4. Render Opportunities Markers ──
      const filteredOpps = opportunities.filter((op) => {
        if (selectedRiskFilter === 'ALL') return true;
        return op.risk === selectedRiskFilter;
      });

      filteredOpps.forEach((opp) => {
        const lat = opp.coordinates?.lat;
        const lng = opp.coordinates?.lng;
        if (!lat || !lng) return;

        const isHigh = opp.risk === 'HIGH';
        const isMed = opp.risk === 'MEDIUM';

        const markerColor = isHigh ? '#dc2626' : isMed ? '#d97706' : '#16a34a';

        const iconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            ${isHigh ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background-color: #ef4444; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
            <div style="
              width: 28px;
              height: 28px;
              background-color: ${markerColor};
              border: 2.5px solid #ffffff;
              border-radius: ${isHigh ? '8px' : isMed ? '50%' : '50%'};
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 900;
              font-size: 11px;
            ">
              ${opp.openings}
            </div>
            <div style="
              background-color: rgba(15, 23, 42, 0.9);
              color: white;
              padding: 1px 5px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
              margin-top: 2px;
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            ">
              ${opp.roleTitle.split(' ')[0]} (${opp.openings})
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-opp-marker',
          iconSize: [36, 46],
          iconAnchor: [18, 23],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        marker.on('click', () => {
          setActivePin({ ...opp, isOpportunity: true });
        });

        markersLayer.addLayer(marker);
      });
    }

    updateLayers();

    return () => {
      isMounted = false;
    };
  }, [
    opportunities,
    institutions,
    selectedCatchment,
    showInstitutions,
    selectedRiskFilter,
    isMapReady,
  ]);

  // ── Geographic View Presets ──
  const zoomToGorakhpur = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([26.7606, 83.3732], 12, { duration: 1.2 });
    setCurrentView('district');
  };

  const zoomToIndia = () => {
    if (!mapInstanceRef.current) return;
    // All-India overview center
    mapInstanceRef.current.flyTo([22.5937, 78.9629], 5, { duration: 1.5 });
    setCurrentView('national');
  };

  return (
    <div 
      id="radar-map-wrapper"
      className={`relative w-full border border-slate-200 bg-white shadow-sm flex flex-col ${
      isFullScreen 
        ? '!rounded-none' 
        : 'rounded-2xl overflow-hidden'
    }`}>
      {/* ── Top Control Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
              Live Geographic Map: OpenStreetMap & CartoDB
            </span>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* National / District Zoom Presets */}
          <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={zoomToGorakhpur}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
                currentView === 'district'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📍 Gorakhpur Catchment
            </button>
            <button
              type="button"
              onClick={zoomToIndia}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
                currentView === 'national'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇮🇳 All-India Context
            </button>
          </div>

          {/* Catchment Radius Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">Radius:</span>
            <div className="inline-flex rounded-md bg-white border border-slate-200 p-0.5 shadow-2xs">
              {['30', '45', '60'].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onSelectCatchment?.(mins)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all ${
                    selectedCatchment === mins
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Controls: Institution toggle, Risk filter, Map tile style */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Institution Toggle */}
          <button
            type="button"
            onClick={() => setShowInstitutions(!showInstitutions)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
              showInstitutions
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Institutions ({institutions.length})</span>
          </button>

          {/* Risk Level Pills */}
          <div className="inline-flex rounded-md bg-white border border-slate-200 p-0.5 text-xs">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'HIGH', label: '🔴 High (12)' },
              { id: 'MEDIUM', label: '🟡 Med' },
              { id: 'LOW', label: '🟢 Low' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedRiskFilter(id)}
                className={`px-2 py-1 text-[11px] font-semibold rounded ${
                  selectedRiskFilter === id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tile Layer Style */}
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            className="py-1 px-2 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <option value="voyager">CartoDB Voyager (Verified Key)</option>
            <option value="positron">CartoDB Positron (Light)</option>
            <option value="darkMatter">CartoDB Dark Matter</option>
            <option value="osm">OpenStreetMap Standard</option>
            <option value="satellite">Satellite View</option>
          </select>

          {/* Full Screen Toggle */}
          <button
            type="button"
            onClick={toggleFullScreen}
            className="p-1.5 ml-1 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── Leaflet Container ── */}
      <div className={`relative w-full ${isFullScreen ? 'flex-1 min-h-0 min-h-[520px]' : 'h-[520px]'}`}>
        <div ref={mapContainerRef} className="absolute inset-0 z-10 bg-slate-50" />

        {/* ── Map Legend Overlay (Bottom Left) ── */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-slate-200/90 shadow-md text-xs space-y-1.5 max-w-[240px]">
          <p className="font-bold text-[11px] text-slate-900 uppercase tracking-wider mb-1">
            Real Map Legend
          </p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-rose-600 inline-block"></span>
            <span className="text-[11px] font-medium text-slate-700">🔴 HIGH Risk (At-Risk Job)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-[11px] font-medium text-slate-700">🟡 MEDIUM Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
            <span className="text-[11px] font-medium text-slate-700">🟢 LOW Risk (Healthy)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[8px]">
              🏫
            </span>
            <span className="text-[11px] font-medium text-slate-700">Govt ITI / Polytechnic</span>
          </div>
          <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-rose-500 border-t border-dashed"></span>
            <span className="text-[10.5px] text-slate-500 font-medium">NH-28 Travel Time Line</span>
          </div>
        </div>

        {/* ── Floating Active Marker Detail Card (Top Right) ── */}
        {activePin && (
          <div className="absolute top-4 right-4 z-20 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4.5 animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    activePin.isOpportunity
                      ? activePin.risk === 'HIGH'
                        ? 'bg-rose-100 text-rose-800'
                        : activePin.risk === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {activePin.isOpportunity ? `${activePin.risk} RISK OPPORTUNITY` : `${activePin.type}`}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {activePin.roleTitle || activePin.name}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {activePin.company || activePin.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePin(null)}
                className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {activePin.isOpportunity ? (
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-slate-50 text-center">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Openings</span>
                    <span className="text-sm font-bold text-slate-900">{activePin.openings}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Applied</span>
                    <span className="text-sm font-bold text-slate-900">{activePin.applications}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Days Left</span>
                    <span className="text-sm font-bold text-rose-600">{activePin.daysLeft}d</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Diagnosis:</span> {activePin.riskReason}
                </div>

                {activePin.recommendedAction && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recommended: {activePin.recommendedAction.label}</span>
                    </div>
                    <p className="text-[10.5px] text-emerald-700 mt-0.5 leading-normal">
                      {activePin.recommendedAction.rationale}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectOpportunity?.(activePin);
                      setActivePin(null);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 text-center text-xs transition-colors"
                  >
                    View Details
                  </button>

                  {activePin.recommendedAction?.type === 'CAMP' && (
                    <button
                      type="button"
                      onClick={() => {
                        onPlanCamp?.(activePin);
                        setActivePin(null);
                      }}
                      className="py-1.5 px-3 rounded-md bg-rose-600 text-white font-medium hover:bg-rose-700 text-xs transition-colors"
                    >
                      Plan Camp
                    </button>
                  )}

                  {activePin.recommendedAction?.type === 'BULLETIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        onShareBulletin?.(activePin);
                        setActivePin(null);
                      }}
                      className="py-1.5 px-3 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700 text-xs transition-colors"
                    >
                      Bulletin
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-xs">
                <div className="p-2 rounded bg-slate-50">
                  <span className="font-semibold text-slate-700">Contact:</span>{' '}
                  {activePin.contactPerson || activePin.contacts?.tpo?.name || activePin.contacts?.principal?.name || 'Nodal Placement Officer'}{' '}
                  ({activePin.designation || (activePin.contacts?.tpo?.name ? 'TPO' : 'Principal')})
                  <br />
                  <span className="font-semibold text-slate-700">Phone:</span>{' '}
                  {activePin.phone || activePin.contacts?.tpo?.phone || activePin.contacts?.principal?.phone || 'N/A'}
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold">Trades:</span>{' '}
                  {activePin.programmes
                    ? activePin.programmes.map((p) => typeof p === 'string' ? p : `${p.trade} (${p.seats})`).join(', ')
                    : Array.isArray(activePin.trades)
                    ? activePin.trades.join(', ')
                    : 'Engineering Trades'}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  ✓ {activePin.matchableOpportunitiesCount ?? 0} Matchable Openings nearby
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RadarMap;
