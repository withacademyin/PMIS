'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Phone,
  GraduationCap,
  Users,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { api } from '@/lib/api';

export default function InstitutionsPage() {
  const [districtCode, setDistrictCode] = useState('GORAKHPUR');
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInstitutions = async (code) => {
    try {
      setLoading(true);
      const params = { districtCode: code || districtCode };
      if (selectedType !== 'ALL') params.type = selectedType;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getRadarInstitutions(params);
      if (res.success) {
        setInstitutions(res.data);
      }
    } catch (err) {
      console.error('Failed to load institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('pmis_selected_district') || 'GORAKHPUR';
    setDistrictCode(saved);
    fetchInstitutions(saved);

    const handleDistrictChange = (e) => {
      if (e.detail) {
        setDistrictCode(e.detail);
        fetchInstitutions(e.detail);
      }
    };

    window.addEventListener('radar_district_changed', handleDistrictChange);
    return () => window.removeEventListener('radar_district_changed', handleDistrictChange);
  }, [selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInstitutions(districtCode);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Institution Master Directory
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Verified ITIs, Polytechnics, and Degree Colleges available in {districtCode} and surrounding catchment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
            Total Institutions: <strong className="text-white">{institutions.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by institution name or trade/course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {['ALL', 'ITI', 'POLYTECHNIC', 'COLLEGE'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  selectedType === type
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All Types' : type}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Institutions Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading institutions...</p>
        </div>
      ) : institutions.length === 0 ? (
        <div className="text-center p-12 text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">No institutions found</p>
          <p className="text-xs text-slate-500 mt-1">Try broadening your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.map((inst) => (
            <div
              key={inst.id}
              className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 p-5 rounded-xl shadow-lg flex flex-col justify-between transition group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
                    {inst.type}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {inst.code}
                  </span>
                </div>

                <Link
                  href={`/dashboard/radar/institutions/${inst.id}`}
                  className="font-bold text-sm text-slate-100 hover:text-indigo-400 transition line-clamp-2"
                >
                  {inst.name}
                </Link>

                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  {inst.district}
                </p>

                {/* Capacity & Programmes */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Programmes</span>
                    <p className="font-bold text-slate-200">{inst.programmesCount}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Total Seats</span>
                    <p className="font-bold text-indigo-400">{inst.totalSeats}</p>
                  </div>
                </div>

                {/* Programme tags preview */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {inst.programmes.slice(0, 3).map((p) => (
                    <span
                      key={p.code}
                      className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[10px]"
                    >
                      {p.name} ({p.seats})
                    </span>
                  ))}
                  {inst.programmes.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded text-[10px]">
                      +{inst.programmes.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                  {inst.contactPhone ? (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Phone className="w-3 h-3 text-indigo-400 shrink-0" />
                      {inst.contactPhone}
                    </span>
                  ) : (
                    <span>{inst.contactRole || 'Principal'}</span>
                  )}
                </div>

                <Link
                  href={`/dashboard/radar/institutions/${inst.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  <span>Reverse Match</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
