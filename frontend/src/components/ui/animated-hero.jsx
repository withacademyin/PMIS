'use client';

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Wrench, Zap, HardHat, Award } from "lucide-react";
import Link from "next/link";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const trades = useMemo(
    () => ["welders", "electricians", "fitters", "machinists", "plumbers"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === trades.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, trades]);

  return (
    <section className="relative w-full z-20">
      <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-20">

        {/* Left Column */}
        <div className="lg:col-span-6 space-y-6 text-left">

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            <span className="text-slate-900 block mb-2">Connecting ITI</span>
            <span className="flex items-center">
              <span className="relative flex-1 overflow-hidden text-left text-[#4CAF50] h-[1.2em]">
              {trades.map((trade, index) => (
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
                  {trade}
                </motion.span>
              ))}
            </span>
            </span>
            <span className="text-slate-900 block mt-2">to nodal officers</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
            A portal for <span className="text-slate-950 font-semibold">Uttar Pradesh</span> ITI workers and learners to get discovered, and for nodal officers to find <span className="text-slate-950 font-semibold">trade-certified talent</span> within a <span className="text-slate-950 font-semibold">50km radius</span> of their district.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link
              href="/auth/signup?role=worker"
              className="bg-[#4CAF50] hover:bg-[#429a46] text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-sm transition text-center inline-flex items-center justify-center gap-2"
            >
              I'm a Worker / Learner
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/signup?role=officer"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-sm transition text-center inline-flex items-center justify-center gap-2"
            >
              I'm a Nodal Officer
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* Right Column - Live Search Preview (icon-based, no external image dependency) */}
        <div className="lg:col-span-6 w-full flex justify-center mt-12 lg:mt-0">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-4 bg-indigo-100/50 blur-2xl rounded-full"></div>

            <div className="relative rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 bg-white p-8">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Wrench, label: "Fitter", grade: "Grade A" },
                  { icon: Zap, label: "Electrician", grade: "Grade O" },
                  { icon: HardHat, label: "Welder", grade: "Grade B" },
                  { icon: Award, label: "Machinist", grade: "Grade A" },
                ].map(({ icon: Icon, label, grade }, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <Icon className="w-6 h-6 text-[#4CAF50]" />
                    <span className="text-sm font-semibold text-slate-900">{label}</span>
                    <span className="text-xs text-slate-500">{grade}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Within 50km of your location</span>
                <span className="font-medium text-slate-900">142 workers found</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { Hero };