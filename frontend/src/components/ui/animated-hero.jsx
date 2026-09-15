'use client';

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["students", "recruiters", "engineers", "designers", "startups"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section className="relative w-full z-20">
      <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-20">
        
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-6 text-left">
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            <span className="text-slate-900 block mb-2">The Hiring Portal</span>
            <span className="flex items-center">
              <span className="text-slate-900 mr-3 lg:mr-4">for</span>
              <span className="relative flex-1 overflow-hidden text-left text-[#4CAF50] h-[1.2em]">
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute font-bold"
                  initial={{ opacity: 0, y: -100 }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? { y: 0, opacity: 1 }
                      : { y: titleNumber > index ? -150 : 150, opacity: 0 }
                  }
                >
                  {title}
                </motion.span>
              ))}
            </span>
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
            Connect students with the right opportunities using our <span className="text-slate-950 font-semibold"> skill-matching </span> and <span className="text-slate-950 font-semibold">AI-assisted screening</span> process.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link 
              href="/auth/signup"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-sm transition text-center"
            >
              Get Started Free
            </Link>
          </div>
          
        </div>

        {/* Right Column - Full-Sized Product Preview */}
        <div className="lg:col-span-6 w-full flex justify-center mt-12 lg:mt-0">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xl shadow-slate-200/60 space-y-5">
            
            {/* Window Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">CANDIDATE PROFILE</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                94% match
              </div>
            </div>

            {/* Candidate Header */}
            <div className="flex items-center gap-3">
              <img src="/priya.png" alt="Priya Verma" className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Priya Verma</h3>
                <p className="text-xs text-slate-500 mt-0.5">B.Tech CSE • Batch 2026 • NSUT</p>
              </div>
            </div>

            {/* Deterministic Skills Overlap */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-700">Deterministic Skill Match (3 of 4)</h4>
              <div className="flex flex-wrap gap-2">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1">
                  Node.js <span className="text-emerald-500">✓</span>
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1">
                  PostgreSQL <span className="text-emerald-500">✓</span>
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1">
                  Express <span className="text-emerald-500">✓</span>
                </span>
                <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-medium">
                  Docker
                </span>
              </div>
            </div>

            {/* AI Screening Verdict Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">AI Technical Screening</span>
                <span className="text-xs font-bold text-emerald-700">Score: 92/100</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Demonstrated clean RESTful contract design, parameterized SQL queries, and robust error middleware."
              </p>
            </div>

            {/* Card Action Controls */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 transition">
                Review Assessment
              </button>
              <button className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-xs transition">
                Shortlist Candidate
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export { Hero };
