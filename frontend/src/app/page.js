'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  ArrowRight, 
  Building2, 
  GraduationCap, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  Check, 
  UserCheck 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { WebGLBackground } from '@/components/ui/webgl-background';
import { Hero } from '@/components/ui/animated-hero';
import { Component as Testimonials } from '@/components/ui/marquee-card';
import { Logo } from '@/components/ui/logo';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'worker',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate support ticket dispatch
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-bold text-emerald-900 mb-1">Message Received</h4>
        <p className="text-sm text-emerald-700 max-w-md mx-auto mb-4">
          Thank you, <span className="font-semibold">{formData.name}</span>. Your ticket <span className="font-mono font-semibold">#ITI-84920</span> has been logged. Our district support cell will contact you within 24 hours.
        </p>
        <button
          onClick={() => {
            setFormData({ name: '', email: '', phone: '', role: 'worker', subject: '', message: '' });
            setSubmitted(false);
          }}
          className="text-xs font-semibold text-emerald-800 underline hover:text-emerald-950"
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ramesh Kumar"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Phone / Mobile *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g. +91 98765 43210"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ramesh@example.com"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            I am a ...
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="worker">ITI Worker / Candidate</option>
            <option value="officer">Nodal Officer / District Admin</option>
            <option value="principal">ITI Institute Principal / Staff</option>
            <option value="employer">Industrial Employer</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Subject *
        </label>
        <input
          type="text"
          required
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="e.g. Need assistance with Welder Trade Verification"
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Message / Details *
        </label>
        <textarea
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Describe your query or the issue you are facing..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {submitting ? (
          <span>Sending Inquiry...</span>
        ) : (
          <>
            <Send className="w-4 h-4" /> Send Inquiry
          </>
        )}
      </button>
    </form>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const role = user.role?.toLowerCase();
      if ((role === 'worker') && !user.profileCompleted) {
        router.replace('/onboarding/worker');
      } else {
        const dashRoute = (role === 'worker') ? 'worker' : role;
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
          <div className="w-full py-20 pb-28 flex flex-col items-center justify-center overflow-hidden border-b border-slate-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center px-4">Trusted by Workers and Nodal Officers</h2>
            <p className="text-slate-500 text-center mb-12 max-w-2xl mx-auto px-4">See how ITIPortal is transforming the ITI hiring process with deep profile matching and spatial search.</p>
            <div className="w-full">
              <Testimonials />
            </div>
          </div>

          {/* ── HOW IT WORKS SECTION ── */}
          <section id="how-it-works" className="w-full py-24 bg-slate-50/70 border-b border-slate-200 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Simple 4-Step Process
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  How ITIPortal Works for Workers
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  From vocational trade certification to district-level deployment. Connect directly with Nodal Officers seeking certified talent in your area.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Step 1 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-5 font-bold text-lg">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Create Trade Profile</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                    Sign up with your mobile number or email, pick your trade (Electrician, Fitter, Welder, COPA, Turner), and add your certified skills.
                  </p>
                  <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fast 2-min onboarding
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center mb-5 font-bold text-lg">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Verify ITI Institute</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                    Link your accredited Government or Private ITI institute from our directory of 1,500+ verified institutes across Uttar Pradesh.
                  </p>
                  <div className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 w-fit">
                    <ShieldCheck className="w-3.5 h-3.5" /> NCVT / SCVT Verified
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center mb-5 font-bold text-lg">
                    3
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">50 km Spatial Match</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                    District Nodal Officers run localized radius searches to find candidates matching exact technical skills within 50 km of project hubs.
                  </p>
                  <div className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 w-fit">
                    <MapPin className="w-3.5 h-3.5" /> High local visibility
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center mb-5 font-bold text-lg">
                    4
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Direct Placement</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                    Receive verified apprenticeship and employment offers directly with no intermediaries or platform commission charges.
                  </p>
                  <div className="text-xs font-medium text-purple-700 bg-purple-50 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 w-fit">
                    <Sparkles className="w-3.5 h-3.5" /> 100% Free for workers
                  </div>
                </div>
              </div>

              {/* Call to action bar */}
              <div className="mt-14 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Ready to boost your career opportunities?</h4>
                  <p className="text-slate-600 text-sm mt-1">Join thousands of certified ITI technicians already connected to district projects.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/auth/signup?role=worker"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
                  >
                    Register as Worker <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/auth/signup?role=officer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors shadow-sm"
                  >
                    Officer Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── CONTACT US SECTION ── */}
          <section id="contact" className="w-full py-24 bg-white scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-4">
                  Help & Inquiries
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Contact Support & Helpdesk
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Have questions about worker registration, Nodal verification, or institutional onboarding? Reach out to our dedicated support cell.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left info column */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Directorate Information</h3>
                    <div className="space-y-4 text-sm text-slate-600">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Toll-Free Helpline</p>
                          <p className="text-slate-600">1800-111-4040 / 0522-2621000</p>
                          <p className="text-xs text-slate-400 mt-0.5">Monday to Saturday, 9:00 AM – 6:00 PM</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Email Inquiries</p>
                          <p className="text-slate-600">support@itiportal.up.gov.in</p>
                          <p className="text-xs text-slate-400 mt-0.5">nodal-desk@itiportal.up.gov.in</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Head Office</p>
                          <p className="text-slate-600">
                            Directorate of Training and Employment,<br />
                            Guru Govind Singh Marg, Charbagh,<br />
                            Lucknow, Uttar Pradesh - 226004
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                    <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" /> Fast-Track Verification
                    </h4>
                    <p className="text-xs text-emerald-800 mt-2 leading-relaxed">
                      For ITI Principals requesting bulk verification of graduating batches or Nodal Officers requiring GIS access credentials, write to <span className="font-semibold underline">nodal-desk@itiportal.up.gov.in</span> with your official institutional email.
                    </p>
                  </div>
                </div>

                {/* Right dummy form column */}
                <div className="lg:col-span-7">
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Send us a message</h3>
                    <p className="text-sm text-slate-500 mb-6">Fill in the details below and our regional support desk will get back to you.</p>

                    <ContactForm />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

      <footer className="border-t border-slate-200 bg-white py-12 mt-auto relative z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Platform</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="/#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a></li>
                <li><a href="/#how-it-works" className="hover:text-emerald-600 transition-colors">Spatial Matching (50km)</a></li>
                <li><a href="/#contact" className="hover:text-emerald-600 transition-colors">Helpdesk & Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Portals</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="/auth/signup?role=worker" className="hover:text-emerald-600 transition-colors">For ITI Workers</a></li>
                <li><a href="/auth/signup?role=officer" className="hover:text-emerald-600 transition-colors">For Nodal Officers</a></li>
                <li><a href="/auth/login" className="hover:text-emerald-600 transition-colors">Institutional Login</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">State Directorate</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="/#contact" className="hover:text-emerald-600 transition-colors">Directorate of Training & Employment</a></li>
                <li><a href="/#contact" className="hover:text-emerald-600 transition-colors">District Hubs</a></li>
                <li><a href="/#contact" className="hover:text-emerald-600 transition-colors">Contact Us</a></li>
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
              <span className="font-semibold text-slate-900 text-sm">ITIPortal</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} ITIPortal Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
