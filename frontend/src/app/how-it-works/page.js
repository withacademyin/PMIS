'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import { WebGLBackground } from '@/components/ui/webgl-background';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <WebGLBackground backgroundColor="transparent" dotColors={[[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]]} />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-start">
          <div className="space-y-4 mb-16 w-full">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              How TalentPortal Works
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl">
              We're replacing the traditional, bias-prone resume screen with a deterministic, skill-first matching engine.
            </p>
          </div>

          <article className="w-full space-y-10 text-slate-600 leading-relaxed text-lg">
            
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">1. Create a Standardized Profile</h2>
              <p>
                When a student joins TalentPortal, they build a profile that normalizes their academic history, skill sets, and project experience into structured data. No more guessing what "familiar with React" means in a PDF—our schema defines exactly what a candidate brings to the table.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">2. Deterministic Skill Matching</h2>
              <p>
                Recruiters post roles with strict, deterministic skill prerequisites (e.g., must know React, Node.js, and PostgreSQL). When candidates apply, our matching engine instantly calculates a percentage overlap. Recruiters see an immediate, ranked pipeline based purely on objective qualifications.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">3. AI-Assisted Technical Screening</h2>
              <p>
                Candidates who meet the threshold are invited to take an automated assessment. This isn't just a multiple-choice quiz; it's an AI-driven technical screening that evaluates coding style, architecture decisions, and problem-solving. The engine outputs a confidence score and a concise summary for the recruiter.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900">4. Transparent Shortlisting</h2>
              <p>
                Recruiters review the ranked pipeline and the AI screening results, and make their shortlisting decisions. The process is entirely transparent to the candidates, who receive clear feedback on exactly which skills they matched and how they performed on the assessment.
              </p>
            </section>

          </article>
          
          <div className="mt-20 pt-10 border-t border-slate-200 w-full flex flex-col sm:flex-row gap-4 items-center justify-between">
            <p className="text-slate-600 font-medium">Ready to get started?</p>
            <div className="flex gap-4">
              <Link href="/auth/signup?role=student" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg hover:bg-slate-50 font-medium text-sm transition">
                I'm a Student
              </Link>
              <Link href="/auth/signup?role=recruiter" className="px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition shadow-sm">
                I'm an Employer
              </Link>
            </div>
          </div>
          
        </main>

        <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm py-8 mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo className="h-5 w-5" />
              <span className="font-semibold text-slate-900 text-sm">TalentPortal</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} TalentPortal Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
