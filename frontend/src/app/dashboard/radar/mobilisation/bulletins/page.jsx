'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Megaphone,
  Download,
  Printer,
  QrCode,
  Share2,
  Building2,
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

function BulletinsContent() {
  const searchParams = useSearchParams();
  const initialPostingId = searchParams.get('postingId') || '';

  const [opportunities, setOpportunities] = useState([]);
  const [selectedPostingId, setSelectedPostingId] = useState(initialPostingId);
  const [language, setLanguage] = useState('Hindi');
  const [bulletinData, setBulletinData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef(null);

  // Load available opportunities for dropdown
  useEffect(() => {
    const loadOpps = async () => {
      try {
        setLoading(true);
        const district = localStorage.getItem('pmis_selected_district') || 'GORAKHPUR';
        const res = await api.getRadarOpportunities({ districtCode: district });
        if (res.success && res.data.length > 0) {
          setOpportunities(res.data);
          if (!selectedPostingId) {
            setSelectedPostingId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load opportunities for bulletin:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOpps();
  }, []);

  // Generate bulletin when selectedPostingId or language changes
  useEffect(() => {
    if (!selectedPostingId) return;

    const generate = async () => {
      try {
        setGenerating(true);
        const res = await api.generateRadarBulletin({
          postingId: selectedPostingId,
          language
        });
        if (res.success) {
          setBulletinData(res.data);
        }
      } catch (err) {
        console.error('Failed to generate bulletin:', err);
      } finally {
        setGenerating(false);
      }
    };
    generate();
  }, [selectedPostingId, language]);

  const selectedOpp = opportunities.find((o) => o.id === selectedPostingId);

  // Copy text to clipboard
  const handleCopyText = () => {
    if (!bulletinData?.bodyText) return;
    const fullText = `*${bulletinData.headline}*\n\n${bulletinData.bodyText}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export 1:1 WhatsApp square image via HTML5 Canvas
  const handleDownloadSquareImage = () => {
    if (!bulletinData || !selectedOpp) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Decorative border
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 12;
    ctx.strokeRect(40, 40, 1000, 1000);

    // Top Header Banner
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('PRADHAN MANTRI INTERNSHIP SCHEME (PMIS)', 80, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText(selectedOpp.roleTitle, 80, 190);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '32px sans-serif';
    ctx.fillText(`Company: ${selectedOpp.companyName}`, 80, 250);
    ctx.fillText(`Location: ${selectedOpp.address}`, 80, 295);

    // Info Cards Box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(80, 340, 920, 200);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`Openings: ${selectedOpp.openings}`, 110, 400);
    ctx.fillText(`Qualification: ${selectedOpp.qualification?.label || selectedOpp.qualificationCode}`, 110, 450);
    ctx.fillText(`Duration: ${selectedOpp.durationMonths} Months`, 110, 500);

    ctx.fillStyle = '#4ade80';
    ctx.fillText(`Stipend: ₹${selectedOpp.monthlySupport} / month`, 560, 400);

    const closeDateStr = new Date(selectedOpp.windowCloseDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    ctx.fillStyle = '#f87171';
    ctx.fillText(`Last Date: ${closeDateStr}`, 560, 450);

    // How to Apply section
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('HOW TO APPLY (NO APPLICATION FEE)', 80, 600);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px sans-serif';
    ctx.fillText('1. Scan official PMIS QR Code or visit official portal', 80, 660);
    ctx.fillText('2. Register / Login with your Aadhaar credentials', 80, 710);
    ctx.fillText(`3. Search Opportunity Code: ${selectedOpp.postingId}`, 80, 760);
    ctx.fillText('4. Submit application directly on PMIS portal', 80, 810);

    // Disclaimer Box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(80, 870, 920, 130);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 870, 920, 130);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('⚠️ CAUTION: Apply ONLY on official portal: pminternship.mca.gov.in', 100, 920);
    ctx.font = '24px sans-serif';
    ctx.fillText('No government official charges any fee for PMIS registration.', 100, 960);

    // Download trigger
    const link = document.createElement('a');
    link.download = `PMIS_Bulletin_${selectedOpp.postingId}_WhatsApp.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            Mobilisation Bulletin Generator
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Create verified opportunity notices with official PMIS QR codes for WhatsApp broadcasting and institutional notice boards.
          </p>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Opportunity Selector */}
          <div className="flex-1 min-w-[240px]">
            <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
              Select Target Opportunity
            </label>
            <select
              value={selectedPostingId}
              onChange={(e) => setSelectedPostingId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
            >
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  [{opp.postingId}] {opp.roleTitle} ({opp.openings} openings)
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle */}
          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
              Language
            </label>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
              {['Hindi', 'English'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    language === lang
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
          <button
            onClick={handleDownloadSquareImage}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>WhatsApp 1:1 Image</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-indigo-600/20"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Live Preview Card (Standard A4 / WhatsApp Preview) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-center justify-center">
        {/* Visual Simulated Bulletin Layout */}
        <div className="w-full max-w-md bg-slate-900 border-2 border-indigo-500/40 rounded-xl p-6 shadow-2xl space-y-4 text-slate-100">
          {/* Header */}
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                PM Internship Scheme (PMIS)
              </span>
              <h3 className="font-extrabold text-base text-white mt-0.5">
                {bulletinData?.headline || selectedOpp?.roleTitle}
              </h3>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2 text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            {bulletinData?.bodyText || 'Generating bulletin body...'}
          </div>

          {/* QR Code and Disclaimer */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1 text-[11px] text-slate-400">
              <p className="font-bold text-slate-200">Official PMIS QR Code</p>
              <p>Scan with phone camera to apply directly on the MCA portal.</p>
              <p className="text-emerald-400 font-semibold">100% Free • No Intermediary</p>
            </div>
            {/* Real embedded QR Code pointing to official PMIS */}
            <div className="p-2 bg-white rounded-lg shadow shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  bulletinData?.qrCodeUrl ||
                  'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://pminternship.mca.gov.in/'
                }
                alt="Official PMIS QR Code"
                className="w-20 h-20"
              />
            </div>
          </div>

          <div className="text-[10px] text-center text-rose-300/80 bg-rose-500/10 p-2 rounded border border-rose-500/20">
            ⚠️ Apply only on official portal: <strong>pminternship.mca.gov.in</strong>. No fee is charged.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BulletinsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh] text-slate-400 text-xs">
          Loading bulletin generator...
        </div>
      }
    >
      <BulletinsContent />
    </Suspense>
  );
}
