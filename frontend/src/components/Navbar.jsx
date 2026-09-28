'use client';

import React from 'react';
import { LogOut, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';

/**
 * Returns the correct dashboard path for a given user role.
 */
function getDashboardPath(role) {
  const r = role?.toLowerCase();
  if (r === 'worker' || r === 'student') return '/dashboard/worker';
  if (r === 'officer' || r === 'recruiter') return '/dashboard/officer';
  if (r === 'admin') return '/dashboard/admin';
  return '/';
}

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const role = user?.role?.toLowerCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="w-full max-w-7xl mx-auto px-6 h-25 flex items-center justify-between">

        {/* ── Left: Brand ── */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-10 w-auto object-contain" />
          </Link>
        </div>

        {/* ── Center: Navigation ── */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500">
          {!loading && user ? (
            <>
              {/* Dashboard link — correct for every role */}
              <Link
                href={getDashboardPath(role)}
                className="px-4 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>

              {/* Role-specific links */}
              {(role === 'worker' || role === 'student') && (
                <Link
                  href="/dashboard/worker"
                  className="px-4 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  My Profile & Trade
                </Link>
              )}
              {(role === 'officer' || role === 'recruiter') && (
                <>
                  <Link
                    href="/dashboard/officer"
                    className="px-4 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Opportunity Radar
                  </Link>
                </>
              )}
              {role === 'admin' && (
                <Link
                  href="/dashboard/admin"
                  className="px-4 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Admin Verification
                </Link>
              )}
            </>
          ) : (
            !loading && (
              <div className="flex items-center gap-1">
                <Link
                  href="/dashboard/officer"
                  className="px-3.5 py-2 rounded-md bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-xs border border-emerald-200"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  PMIS Opportunity Radar
                </Link>
                <Link
                  href="/auth/signup?role=worker"
                  className="px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors text-slate-600"
                >
                  For Workers
                </Link>
                <Link
                  href="/#how-it-works"
                  className="px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors text-slate-600"
                >
                  How It Works
                </Link>
                <Link
                  href="/#contact"
                  className="px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors text-slate-600"
                >
                  Contact Us
                </Link>
              </div>
            )
          )}
        </nav>

        {/* ── Right: User Actions ── */}
        <div className="flex items-center gap-4">
          {!loading && user ? (
            <div className="flex items-center gap-4">
              {/* Avatar with proper fallback for all roles */}
              <div className="hidden md:flex items-center gap-3 border-r border-slate-200 pr-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600 tracking-wider">
                  {(() => {
                    if (role === 'admin') {
                      return <ShieldCheck className="w-5 h-5 text-slate-500" strokeWidth={1.75} />;
                    }
                    const name =
                      user?.workerProfile?.fullName ||
                      user?.officerProfile?.name ||
                      user?.name ||
                      user?.email;
                    if (!name) return <User className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />;
                    const parts = name.trim().split(/\s+/);
                    if (parts.length > 1 && parts[parts.length - 1].length > 0) {
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    }
                    return name.trim().slice(0, 2).toUpperCase();
                  })()}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-slate-700 leading-none">
                    {role === 'admin'
                      ? 'Admin'
                      : user?.workerProfile?.fullName ||
                        user?.officerProfile?.name ||
                        user?.name ||
                        user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 capitalize">{role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-10 text-sm text-slate-400 hover:text-slate-800 px-3"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            !loading && (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )
          )}
        </div>

      </div>
    </header>
  );
}

export default Navbar;
