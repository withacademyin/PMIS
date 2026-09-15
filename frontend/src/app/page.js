'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ArrowRight, Building2, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { WebGLBackground } from '@/components/ui/webgl-background';
import { Hero } from '@/components/ui/animated-hero';
import { Component as Testimonials } from '@/components/ui/marquee-card';
import { Logo } from '@/components/ui/logo';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const role = user.role?.toLowerCase();
      if ((role === 'learner' || role === 'student') && !user.profileCompleted) {
        router.replace('/onboarding/student');
      } else {
        const dashRoute = (role === 'learner' || role === 'student') ? 'student' : role;
        router.replace(`/dashboard/${dashRoute}`);
      }
    }
  }, [loading, user, router]);

  if (!loading && user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <WebGLBackground backgroundColor="white" dotColors={[[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]]} />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1 flex flex-col w-full">
          <div className="w-full min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <Hero />
          </div>
          <div className="w-full py-20 pb-32 flex flex-col items-center justify-center overflow-hidden">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center px-4">Loved by Students and Recruiters</h2>
            <p className="text-slate-500 text-center mb-12 max-w-2xl mx-auto px-4">See how TalentPortal is transforming the internship search and hiring process with deep profile matching.</p>
            <div className="w-full">
              <Testimonials />
            </div>
          </div>
        </main>

      <footer className="border-t border-slate-200 bg-white py-12 mt-auto relative z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Matching Engine</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Assessments</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Solutions</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">For Students</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">For Universities</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">For Startups</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Legal</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span className="font-semibold text-slate-900 text-sm">TalentPortal</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} TalentPortal Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
