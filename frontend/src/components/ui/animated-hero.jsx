'use client';

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Wrench,
  Zap,
  HardHat,
  MapPin,
  BadgeCheck,
  Radio,
  Navigation,
} from "lucide-react";
import Link from "next/link";

const TRADES = ["welders", "electricians", "fitters", "machinists", "plumbers"];

const STATS = [
  { value: "240,000+", label: "Workers registered" },
  { value: "14,000+", label: "ITIs on platform" },
  { value: "750+", label: "Districts covered" },
];

const NEARBY_WORKERS = [
  {
    icon: Zap,
    name: "Ramesh Kumar",
    trade: "Electrician",
    grade: "Grade O",
    distance: "8 km",
    verified: true,
  },
  {
    icon: Wrench,
    name: "Suresh Yadav",
    trade: "Fitter",
    grade: "Grade A",
    distance: "14 km",
    verified: true,
  },
  {
    icon: HardHat,
    name: "Vikram Singh",
    trade: "Welder",
    grade: "Grade B",
    distance: "23 km",
    verified: false,
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const trades = useMemo(() => TRADES, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev === trades.length - 1 ? 0 : prev + 1));
    }, 2200);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, trades]);

  return (
    <section className="relative w-full z-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-20">

        {/* ─── Left Column ─── */}
        <div className="lg:col-span-6 space-y-7 text-left">

          {/* Announcement pill */}
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3.5 py-1.5 text-xs font-medium text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Now live across India
            </span>
          </motion.div>

          {/* Headline with rotating trade words */}
          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08]"
          >
            <span className="block">Connecting ITI</span>
            <span className="flex items-center">
              <span className="relative flex-1 overflow-hidden text-left text-[#4CAF50] h-[1.15em]">
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
            <span className="block">to nodal officers</span>
          </motion.h1>

          {/* Subcopy */}
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg"
          >
            A portal for <span className="text-slate-950 font-semibold">Indian</span> ITI
            workers and learners to get discovered, and for nodal officers to find{" "}
            <span className="text-slate-950 font-semibold">trade-certified talent</span> within a{" "}
            <span className="text-slate-950 font-semibold">50&nbsp;km radius</span> of their district.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1"
          >
            <Link
              href="/auth/signup?role=worker"
              className="bg-[#4CAF50] hover:bg-[#429a46] text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-sm transition text-center inline-flex items-center justify-center gap-2"
            >
              I&apos;m a Worker / Learner
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/signup?role=officer"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-sm transition text-center inline-flex items-center justify-center gap-2"
            >
              I&apos;m a Nodal Officer
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Trust stats */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="grid grid-cols-3 gap-4 pt-5 border-t border-slate-200/80 max-w-lg"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ─── Right Column — Live Radius Search Preview ─── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-6 w-full flex justify-center mt-12 lg:mt-0"
        >
          <div className="relative w-full max-w-lg overflow-hidden">
            <div className="absolute inset-0 -m-4 bg-indigo-100/50 blur-2xl rounded-full" />

            <div className="relative rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 bg-white overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#4CAF50]" />
                  <span className="text-sm font-semibold text-slate-900">Radius Search — New Delhi</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  <Radio className="w-3 h-3" />
                  LIVE
                </span>
              </div>

              {/* Radar visual */}
              <div className="relative h-56 bg-gradient-to-b from-slate-50 to-white">
                {/* concentric radius rings */}
                {[208, 156, 104, 52].map((size) => (
                  <div
                    key={size}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/80"
                    style={{ width: size, height: size }}
                  />
                ))}
                {/* radius label */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="absolute left-6 top-[-3.25rem] text-[9px] font-medium text-slate-400 whitespace-nowrap">
                    50 km
                  </span>
                </div>
                {/* district center pin */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4CAF50] opacity-40" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#4CAF50] border-2 border-white shadow" />
                  </span>
                  <span className="mt-1.5 text-[9px] font-semibold text-slate-600 bg-white/90 border border-slate-200 rounded px-1.5 py-0.5 shadow-sm whitespace-nowrap">
                    District Node
                  </span>
                </div>
                {/* worker dots */}
                {[
                  { left: "62%", top: "30%" },
                  { left: "30%", top: "38%" },
                  { left: "70%", top: "62%" },
                  { left: "24%", top: "66%" },
                  { left: "46%", top: "18%" },
                ].map((pos, i) => (
                  <span
                    key={i}
                    className="absolute h-2.5 w-2.5 rounded-full bg-indigo-500 border border-white shadow"
                    style={{ left: pos.left, top: pos.top }}
                  />
                ))}
              </div>

              {/* Nearby workers list */}
              <div className="px-5 py-3 space-y-2.5 border-t border-slate-100">
                {NEARBY_WORKERS.map(({ icon: Icon, name, trade, grade, distance, verified }) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#4CAF50]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1.5">
                        {name}
                        {verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {trade} · {grade}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 shrink-0">
                      <Navigation className="w-3 h-3" />
                      {distance}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card footer */}
              <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Within 50 km of district center</span>
                <span className="font-semibold text-slate-900">142 workers found</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export { Hero };
