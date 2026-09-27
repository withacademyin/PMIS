'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  LayoutDashboard,
  Briefcase,
  Building2,
  Megaphone,
  ClipboardList,
  BarChart3,
  LogOut,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';

export default function RadarLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('GORAKHPUR');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Check auth
    const token = typeof window !== 'undefined' ? localStorage.getItem('hiring_portal_token') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('hiring_portal_user') : null;

    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }

    // Set time string
    const now = new Date();
    setCurrentTime(
      now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ', ' +
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );

    // Fetch user available districts
    api
      .getRadarDistricts()
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setDistricts(res.data);
          const savedDistrict = localStorage.getItem('pmis_selected_district');
          if (savedDistrict && res.data.some((d) => d.code === savedDistrict)) {
            setSelectedDistrict(savedDistrict);
          } else {
            setSelectedDistrict(res.data[0].code);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load districts:', err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDistrictChange = (code) => {
    setSelectedDistrict(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pmis_selected_district', code);
      // Trigger a custom event for child pages to react if needed
      window.dispatchEvent(new CustomEvent('radar_district_changed', { detail: code }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hiring_portal_token');
    localStorage.removeItem('hiring_portal_user');
    localStorage.removeItem('pmis_selected_district');
    router.push('/auth/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard/radar', icon: LayoutDashboard, exact: true },
    { label: 'Opportunities', href: '/dashboard/radar/opportunities', icon: Briefcase },
    { label: 'Institutions', href: '/dashboard/radar/institutions', icon: Building2 },
    { label: 'Bulletins', href: '/dashboard/radar/mobilisation/bulletins', icon: Megaphone },
    { label: 'Camp Planner', href: '/dashboard/radar/mobilisation/camps', icon: Layers },
    { label: 'Weekly Action Plan', href: '/dashboard/radar/action-plan', icon: ClipboardList },
    { label: 'Outcomes Tracker', href: '/dashboard/radar/outcomes', icon: BarChart3 }
  ];

  const currentDistrictObj = districts.find((d) => d.code === selectedDistrict) || {
    name: 'Gorakhpur',
    code: 'GORAKHPUR'
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  PMIS Radar
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                    DNO UP
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Opportunity Decision Engine</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Operations
            </div>
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || (item.href !== '/dashboard/radar' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.officerProfile?.name ? user.officerProfile.name.charAt(0) : 'D'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.officerProfile?.name || 'Rahul Sharma'}
                </p>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-amber-400 inline" />
                  {currentDistrictObj.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            {/* District Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 hidden sm:inline">District:</span>
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="appearance-none bg-slate-900 border border-slate-700/80 text-slate-100 text-xs font-semibold rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name} {d.lowRegistrationFlag ? '⚠️ (Low Reg)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {currentDistrictObj.lowRegistrationFlag && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-md">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Low Registration Zone
              </span>
            )}
          </div>

          {/* Right Header Metadata */}
          <div className="flex items-center space-x-5 text-xs text-slate-400">
            <div className="hidden lg:flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium text-slate-300">Week: 28 Sep – 04 Oct 2026</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-slate-400">Live Synced: {currentTime || 'Just now'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900/95">
          {children}
        </main>
      </div>
    </div>
  );
}
