'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  QrCode,
  Languages,
  Check,
  Building2,
  Calendar,
  MapPin,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  IndianRupee,
  Clock
} from 'lucide-react';

export function RadarBulletins({ opportunities = [], globalDistrict, setGlobalDistrict, uniqueDistricts, selectedOppId, onSelectOpportunity }) {
  const filteredOpportunities = globalDistrict === 'ALL' 
    ? opportunities 
    : opportunities.filter(op => op.district === globalDistrict);

  const [currentId, setCurrentId] = useState(selectedOppId || filteredOpportunities[0]?.id || 'DEMO-0007');
  const [language, setLanguage] = useState('EN'); // EN or HI
  const [copied, setCopied] = useState(false);

  const activeOpp = filteredOpportunities.find((o) => o.id === currentId) || filteredOpportunities[0];

  const handleCopyWhatsApp = () => {
    if (!activeOpp) return;
    const text =
      language === 'HI'
        ? `📢 *प्रधानमंत्री इंटर्नशिप योजना (PMIS) - अवसर सूचना*\n\n` +
          `📌 पद: *${activeOpp.roleTitle}*\n` +
          `🏢 प्रतिष्ठान: ${activeOpp.company}\n` +
          `📍 स्थान: ${activeOpp.address || 'गोरखपुर, उत्तर प्रदेश'}\n` +
          `🎓 योग्यता: ${activeOpp.qualification}\n` +
          `💰 मासिक स्टाइपेंड: ${activeOpp.monthlyStipend || '₹5,000 / माह'}\n` +
          `⏱ अवधि: ${activeOpp.duration || '12 माह'}\n` +
          `📅 आवेदन की अंतिम तिथि: *${activeOpp.closingDate}*\n\n` +
          `✅ केवल आधिकारिक PMIS पोर्टल पर निःशुल्क आवेदन करें:\n` +
          `🔗 https://pminternship.mca.gov.in\n` +
          `जिला नोडल अधिकारी कक्ष, गोरखपुर`
        : `📢 *PM INTERNSHIP SCHEME (PMIS) - OFFICIAL OPPORTUNITY BULLETIN*\n\n` +
          `📌 Role: *${activeOpp.roleTitle}*\n` +
          `🏢 Company: ${activeOpp.company}\n` +
          `📍 Location: ${activeOpp.address || 'Gorakhpur, Uttar Pradesh'}\n` +
          `🎓 Eligibility: ${activeOpp.qualification}\n` +
          `💰 Monthly Stipend: ${activeOpp.monthlyStipend || '₹5,000 / month'}\n` +
          `⏱ Duration: ${activeOpp.duration || '12 Months'}\n` +
          `📅 Last Date to Apply: *${activeOpp.closingDate}*\n\n` +
          `✅ Apply only on the official PMIS portal. No fee charged:\n` +
          `🔗 https://pminternship.mca.gov.in\n` +
          `District Nodal Officer Cell, Gorakhpur`;

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Events & Camps Bulletin Generator
              </h2>
              <p className="text-xs text-slate-500">
                Official PMIS notices formatted for institution noticeboards and WhatsApp broadcast.
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* District Filter */}
          <select
            value={globalDistrict}
            onChange={(e) => setGlobalDistrict(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-emerald-50 text-emerald-800 focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Districts</option>
            {uniqueDistricts?.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Opportunity Switcher */}
          <select
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-2xs focus:ring-1 focus:ring-slate-900 max-w-[200px] truncate"
          >
            {filteredOpportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.risk === 'HIGH' ? '🔴' : '🟡'} {o.roleTitle} ({o.openings} vacancies)
              </option>
            ))}
          </select>

          {/* Bilingual Switcher */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setLanguage('EN')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                language === 'EN'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('HI')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                language === 'HI'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>

          {/* Copy WhatsApp Broadcast */}
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Text!' : 'Copy for WhatsApp'}</span>
          </button>

          {/* Print Flyer */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print A4</span>
          </button>
        </div>
      </div>

      {/* ── Bulletin Preview Container ── */}
      <div className="max-w-2xl mx-auto">
        <div
          id="printable-bulletin"
          className="bg-white rounded-2xl border-2 border-slate-900 shadow-xl overflow-hidden transition-all"
        >
          {/* Official Emblem Banner */}
          <div className="bg-slate-900 text-white p-6 text-center space-y-1 relative">
            <div className="w-12 h-12 rounded-full bg-white/10 mx-auto flex items-center justify-center mb-2 border border-white/20">
              <span className="text-xl">🇮🇳</span>
            </div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-amber-300 uppercase">
              {language === 'HI' ? 'भारत सरकार • कौशल विकास एवं उद्यमशीलता' : 'GOVERNMENT OF INDIA • PMIS CELL'}
            </p>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
              {language === 'HI'
                ? 'प्रधानमंत्री इंटर्नशिप अवसर'
                : 'PM INTERNSHIP OPPORTUNITY'}
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              {language === 'HI'
                ? 'जिला नोडल अधिकारी सेल — गोरखपुर, उत्तर प्रदेश'
                : 'District Nodal Officer Cell —  Uttar Pradesh'}
            </p>
          </div>

          {/* Golden Highlight Strip */}
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-500"></div>

          {/* Flyer Content Body */}
          <div className="p-8 space-y-6">
            {/* Role Header Box */}
            <div className="text-center pb-5 border-b border-slate-200 space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs uppercase tracking-wider border border-emerald-200">
                {activeOpp.openings} {language === 'HI' ? 'रिक्त पद' : 'Openings Available'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 pt-1">
                {activeOpp.roleTitle}
              </h2>
              <p className="text-base font-bold text-slate-700">
                {activeOpp.company}
              </p>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">
                    {language === 'HI' ? 'स्थान' : 'Location'}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {activeOpp.address || 'Gorakhpur Industrial Area'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <GraduationCap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">
                    {language === 'HI' ? 'आवश्यक योग्यता' : 'Eligibility'}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {activeOpp.qualification}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">
                    {language === 'HI' ? 'अवधि एवं स्टाइपेंड' : 'Duration & Stipend'}
                  </span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {activeOpp.monthlyStipend || '₹5,000 / month'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {activeOpp.duration || '12 Months'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-start gap-3">
                <Calendar className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-rose-500 uppercase font-bold text-[10px] block">
                    {language === 'HI' ? 'अंतिम तिथि' : 'Last Date to Apply'}
                  </span>
                  <span className="font-black text-rose-700 text-sm">
                    {activeOpp.closingDate}
                  </span>
                  <span className="text-[11px] text-rose-600 font-semibold block">
                    {activeOpp.daysLeft} {language === 'HI' ? 'दिन शेष' : 'days remaining'}
                  </span>
                </div>
              </div>
            </div>

            {/* How to Apply with Stylized QR Code Box */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  {language === 'HI' ? 'आवेदन कैसे करें:' : 'How to Apply:'}
                </h4>
                <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside font-medium">
                  <li>
                    {language === 'HI'
                      ? 'सामने दिए गए QR कोड को स्कैन करें'
                      : 'Scan QR Code or visit official PMIS portal'}
                  </li>
                  <li>
                    {language === 'HI'
                      ? 'आधिकारिक PMIS पोर्टल खोलें'
                      : 'Open https://pminternship.mca.gov.in'}
                  </li>
                  <li>
                    {language === 'HI'
                      ? 'पंजीकरण अथवा लॉगिन करें'
                      : 'Register / Sign in with mobile number'}
                  </li>
                  <li>
                    {language === 'HI'
                      ? 'इस इंटर्नशिप के लिए आवेदन सबमिट करें'
                      : `Search ID ${activeOpp.id} and submit application`}
                  </li>
                </ol>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shadow-sm shrink-0">
                <div className="w-28 h-28 bg-slate-900 rounded-lg p-2 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded p-1.5 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 bg-slate-900 rounded-xs"></div>
                      <div className="w-6 h-6 bg-slate-900 rounded-xs"></div>
                    </div>
                    <div className="text-center font-mono text-[8px] font-bold text-slate-900 tracking-tighter">
                      PMIS GKP
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="w-6 h-6 bg-slate-900 rounded-xs"></div>
                      <div className="w-4 h-4 bg-emerald-600 rounded-xs"></div>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-wider">
                  SCAN TO APPLY
                </span>
              </div>
            </div>

            {/* Official Disclaimer Footer */}
            <div className="pt-3 border-t border-slate-200 text-center space-y-1 text-[11px] text-slate-500 font-medium">
              <p className="text-slate-800 font-bold">
                {language === 'HI'
                  ? '⚠️ केवल आधिकारिक PMIS पोर्टल पर ही आवेदन करें। कोई शुल्क नहीं लिया जाता है।'
                  : '⚠️ Apply only on the official PMIS portal. No application fee is charged.'}
              </p>
              <p>
                District Skill Development Committee, Gorakhpur • Helpline: +91 98391 23401
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RadarBulletins;
