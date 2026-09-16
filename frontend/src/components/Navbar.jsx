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
  if (r === 'learner' || r === 'student') return '/dashboard/student';
  if (r === 'recruiter') return '/dashboard/recruiter';
  if (r === 'admin') return '/dashboard/admin';
  return '/';
}

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const role = user?.role?.toLowerCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="w-full max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* ── Left: Brand ── */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="w-7 h-7 rounded-md object-contain" />
            <span className="text-sm font-bold text-slate-950 tracking-tight">
              Talent<span className="text-[#4CAF50]">Portal</span>
            </span>
          </Link>
        </div>

        {/* ── Center: Navigation ── */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-500">
          {!loading && user ? (
            <>
              {/* Dashboard link — correct for every role */}
              <Link
                href={getDashboardPath(role)}
                className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>

              {/* Role-specific links */}
              {(role === 'learner' || role === 'student') && (
                <Link
                  href="/dashboard/student"
                  className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Applications
                </Link>
              )}
              {role === 'recruiter' && (
                <Link
                  href="/dashboard/recruiter"
                  className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Manage Roles
                </Link>
              )}
              {role === 'admin' && (
                <Link
                  href="/dashboard/admin"
                  className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Verification
                </Link>
              )}
            </>
          ) : (
            !loading && (
              <>
                <Link href="/how-it-works" className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  How It Works
                </Link>
                <Link href="/auth/signup?role=learner" className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  Explore Roles
                </Link>
                <Link href="/auth/signup?role=recruiter" className="px-3 py-1.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  For Employers
                </Link>
              </>
            )
          )}
        </nav>

        {/* ── Right: User Actions ── */}
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <div className="flex items-center gap-3">
              {/* Avatar with proper fallback for all roles */}
              <div className="hidden md:flex items-center gap-2.5 border-r border-slate-200 pr-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 tracking-wider">
                  {(() => {
                    if (role === 'admin') {
                      return <ShieldCheck className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />;
                    }
                    const name =
                      user?.studentProfile?.fullName ||
                      user?.recruiterProfile?.companyName ||
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
                  <p className="text-[11px] font-medium text-slate-700 leading-none">
                    {role === 'admin'
                      ? 'Admin'
                      : user?.studentProfile?.fullName ||
                        user?.recruiterProfile?.companyName ||
                        user?.name ||
                        user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-7 text-[11px] text-slate-400 hover:text-slate-800 px-2"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            </div>
          ) : (
            !loading && (
              <>
                <Link
                  href="/auth/login"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-md transition-colors"
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
