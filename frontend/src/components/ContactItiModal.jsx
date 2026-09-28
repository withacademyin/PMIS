'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Building2,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ContactItiModal({
  isOpen,
  onClose,
  iti,
  requirements = [],
  initialRequirementId = null,
  initialRoleTitle = '',
}) {
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'inquiry' | 'history'
  const [selectedRequirementId, setSelectedRequirementId] = useState(initialRequirementId || '');
  const [inquiryType, setInquiryType] = useState('BATCH_REQUEST');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [pastInquiries, setPastInquiries] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Sync initial state when modal opens or ITI changes
  useEffect(() => {
    if (isOpen && iti) {
      setSuccessMsg('');
      setErrorMsg('');
      const defaultReq = requirements.find((r) => r.id === initialRequirementId) || requirements[0];
      const reqId = defaultReq ? defaultReq.id : '';
      const reqTrade = defaultReq ? defaultReq.requiredTrade : (initialRoleTitle || 'Candidates');
      setSelectedRequirementId(reqId);

      const defaultSubject = `Recruitment Inquiry: ${reqTrade} Candidates at ${iti.name}`;
      setSubject(defaultSubject);
      setMessage(
        `Dear Placement Cell at ${iti.name},\n\nWe have an active requirement for qualified ${reqTrade} candidates. We would like to request resumes of your top-ranked certified graduates and schedule screening interviews.\n\nPlease share available student batches and coordinator details.`
      );

      loadPastInquiries();
    }
  }, [isOpen, iti, initialRequirementId, initialRoleTitle]);

  const loadPastInquiries = async () => {
    if (!iti?.id) return;
    setLoadingHistory(true);
    try {
      const res = await api.getITIContactInquiries(iti.id);
      if (res.success) {
        setPastInquiries(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load past inquiries:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !iti) return null;

  const contacts = iti.contacts || {
    tpo: {
      name: 'Er. Rajesh Verma',
      designation: 'Training & Placement Officer (TPO)',
      role: 'TPO',
      phone: iti.phone || '+91 9415729360',
      email: iti.email || 'tpo@iti.gov.in',
      whatsapp: '+919415729360',
      office: 'Placement Cell, Room 104',
      availability: 'Mon - Sat: 9:30 AM - 5:00 PM',
      responseRate: 'Typically responds within 2 hours',
    },
    principal: {
      name: 'Dr. Arvind K. Sharma',
      designation: 'Principal & Nodal Superintendent',
      role: 'PRINCIPAL',
      phone: '+91 9839905520',
      email: 'principal@iti.gov.in',
      office: 'Directorate Secretariat',
      availability: 'Mon - Fri: 10:00 AM - 4:00 PM',
    },
    helpdesk: {
      phone: iti.phone || '+91 522 2451020',
      email: iti.email || 'helpdesk@iti.gov.in',
      address: iti.address || `${iti.district}, Uttar Pradesh`,
      pincode: iti.pincode || '226001',
      officeHours: 'Mon - Sat: 9:00 AM - 5:00 PM',
    },
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleTemplateSelect = (type) => {
    setInquiryType(type);
    const activeReq = requirements.find((r) => r.id === selectedRequirementId);
    const trade = activeReq ? activeReq.requiredTrade : 'Technical';

    if (type === 'BATCH_REQUEST') {
      setSubject(`Request for Batch of ${trade} Candidates - ${iti.name}`);
      setMessage(
        `Dear Placement Officer,\n\nWe are actively recruiting for ${trade} roles and would like to invite verified candidates from ${iti.name}. Kindly share a batch of eligible student profiles with contact details.\n\nLooking forward to your prompt response.`
      );
    } else if (type === 'CAMPUS_DRIVE') {
      setSubject(`Proposal for On-Campus Placement Drive at ${iti.name} (${trade})`);
      setMessage(
        `Dear Principal & TPO,\n\nWe propose conducting an on-campus placement / screening session at ${iti.name} for graduating ${trade} students. Please confirm available dates next week and student batch size.`
      );
    } else if (type === 'VERIFICATION') {
      setSubject(`Verification of Candidate Credentials - ${trade} Trainees`);
      setMessage(
        `Dear Verification Desk,\n\nWe have shortlisted candidates hailing from ${iti.name} for our ${trade} openings. Kindly confirm their NCVT certification status, attendance records, and conduct clearance.`
      );
    }
  };

  const handleRequirementChange = (reqId) => {
    setSelectedRequirementId(reqId);
    const req = requirements.find((r) => r.id === reqId);
    if (req) {
      setSubject(`Recruitment Inquiry: ${req.requiredTrade} Candidates at ${iti.name}`);
      setMessage(
        `Dear Placement Cell at ${iti.name},\n\nWe have an active requirement for qualified ${req.requiredTrade} candidates. We would like to request resumes of your top-ranked certified graduates and schedule screening interviews.\n\nPlease share available student batches and coordinator details.`
      );
    }
  };

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const activeReq = requirements.find((r) => r.id === selectedRequirementId);
      const payload = {
        requirementId: selectedRequirementId || null,
        roleTitle: activeReq ? `${activeReq.title} (${activeReq.requiredTrade})` : 'General Role Inquiry',
        contactRole: 'TPO',
        inquiryType,
        subject,
        message,
        urgency: isUrgent ? 'URGENT' : 'NORMAL',
      };

      const res = await api.contactITI(iti.id, payload);
      if (res.success) {
        setSuccessMsg(res.message || 'Inquiry successfully dispatched to ITI Placement Cell');
        if (res.data) {
          setPastInquiries((prev) => [res.data, ...prev]);
        }
        setTimeout(() => {
          setActiveTab('history');
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send inquiry to ITI');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-indigo-300 border border-white/10 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold leading-tight">{iti.name}</h2>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
                  {iti.isGovernment ? '🏛️ Government ITI' : 'Accredited Institute'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300 flex items-center gap-2">
                <span>Code: {iti.code || 'NCVT-UP'}</span>
                <span>•</span>
                <span>{iti.district}, {iti.state}</span>
                {iti.distanceKm !== undefined && (
                  <>
                    <span>•</span>
                    <span className="text-amber-300 font-medium">📍 {iti.distanceKm} km away</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'contacts'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            Official Contacts & Desk
          </button>
          <button
            onClick={() => setActiveTab('inquiry')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'inquiry'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            Send Role Inquiry
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Sent Inquiries ({pastInquiries.length})
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: OFFICIAL CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              {/* TPO Card (Primary Placement Contact) */}
              <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-4.5 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                      <Briefcase className="h-3 w-3" /> Training & Placement Cell
                    </span>
                    <h3 className="mt-1.5 text-base font-bold text-slate-900">{contacts.tpo?.name}</h3>
                    <p className="text-xs text-slate-600 font-medium">{contacts.tpo?.designation}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{contacts.tpo?.office}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {contacts.tpo?.responseRate || 'Active Today'}
                  </span>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {/* Phone / Call */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="h-4 w-4 text-indigo-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-[10px] font-medium text-slate-400 uppercase">Direct Mobile</p>
                        <a href={`tel:${contacts.tpo?.phone}`} className="text-xs font-bold text-slate-800 hover:text-indigo-600">
                          {contacts.tpo?.phone}
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(contacts.tpo?.phone, 'tpoPhone')}
                      className="text-xs text-slate-400 hover:text-slate-700 px-1 py-0.5"
                      title="Copy phone"
                    >
                      {copiedField === 'tpoPhone' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-[10px] font-medium text-emerald-700 uppercase">WhatsApp Official</p>
                        <p className="text-xs font-bold text-emerald-900">{contacts.tpo?.whatsapp}</p>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${(contacts.tpo?.whatsapp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${contacts.tpo?.name}, contacting you regarding placement requirements from ITI Portal.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                    >
                      Chat <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white sm:col-span-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="h-4 w-4 text-indigo-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-[10px] font-medium text-slate-400 uppercase">Official Email</p>
                        <a href={`mailto:${contacts.tpo?.email}`} className="text-xs font-semibold text-slate-800 hover:text-indigo-600">
                          {contacts.tpo?.email}
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(contacts.tpo?.email, 'tpoEmail')}
                      className="text-xs text-slate-400 hover:text-slate-700 px-1 py-0.5"
                    >
                      {copiedField === 'tpoEmail' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>⏰ Availability: {contacts.tpo?.availability}</span>
                  <button
                    onClick={() => setActiveTab('inquiry')}
                    className="font-bold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Draft Formal Inquiry &rarr;
                  </button>
                </div>
              </div>

              {/* Principal Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      <ShieldCheck className="h-3 w-3 text-slate-600" /> Institutional Head
                    </span>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">{contacts.principal?.name}</h4>
                    <p className="text-xs text-slate-500">{contacts.principal?.designation}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${contacts.principal?.phone}`}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Phone className="h-3.5 w-3.5 text-slate-500" /> Call
                    </a>
                    <a
                      href={`mailto:${contacts.principal?.email}`}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Mail className="h-3.5 w-3.5 text-slate-500" /> Email
                    </a>
                  </div>
                </div>
              </div>

              {/* Institute Helpdesk & Address */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-900">🏛️ Institute Central Office & Verification Desk</p>
                <p>📍 {contacts.helpdesk?.address} - PIN {contacts.helpdesk?.pincode}</p>
                <p>📞 Central Phone: {contacts.helpdesk?.phone} • ✉️ Central: {contacts.helpdesk?.email}</p>
                <p className="text-[11px] text-slate-400">Hours: {contacts.helpdesk?.officeHours}</p>
              </div>
            </div>
          )}

          {/* TAB 2: SEND ROLE INQUIRY */}
          {activeTab === 'inquiry' && (
            <form onSubmit={handleSubmitInquiry} className="space-y-4">
              {/* Select Job / Requirement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Regarding Posted Requirement / Role
                </label>
                {requirements.length > 0 ? (
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                    value={selectedRequirementId}
                    onChange={(e) => handleRequirementChange(e.target.value)}
                  >
                    {requirements.map((req) => (
                      <option key={req.id} value={req.id}>
                        {req.title} • {req.requiredTrade} ({req.applicantCount || 0} candidates applied)
                      </option>
                    ))}
                    <option value="">-- General Campus Placement Inquiry (All Trades) --</option>
                  </select>
                ) : (
                  <Input
                    placeholder="Role Title (e.g. Electricians, Fitters)"
                    value={selectedRequirementId}
                    onChange={(e) => setSelectedRequirementId(e.target.value)}
                  />
                )}
              </div>

              {/* Inquiry Type & Quick Templates */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Inquiry Purpose & Template
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect('BATCH_REQUEST')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                      inquiryType === 'BATCH_REQUEST'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📦 Request Candidate Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect('CAMPUS_DRIVE')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                      inquiryType === 'CAMPUS_DRIVE'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🎓 Schedule Campus Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect('VERIFICATION')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                      inquiryType === 'VERIFICATION'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📜 Verify Certifications
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <Input
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message to ITI Placement Cell</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-indigo-500 font-mono"
                  placeholder="Detail your hiring requirements, batch size, target CTC, or test schedules..."
                />
              </div>

              {/* Priority Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgentToggle"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="urgentToggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Mark as <strong className="text-amber-700">High Priority / Urgent Hiring</strong> (dispatches priority alert to TPO)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sending} className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs">
                  {sending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Dispatch Inquiry to ITI
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: PAST INQUIRIES */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {loadingHistory ? (
                <div className="flex items-center justify-center p-8 text-slate-400 text-xs">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading past outreach logs...
                </div>
              ) : pastInquiries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  No inquiries sent to {iti.name} yet. Use the "Send Role Inquiry" tab to initiate contact.
                </div>
              ) : (
                pastInquiries.map((inq) => (
                  <div key={inq.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{inq.subject}</span>
                          <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 border border-indigo-200">
                            {inq.inquiryType}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Role: <span className="font-medium text-slate-700">{inq.roleTitle}</span> • Dispatched to {inq.contactRole}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 shrink-0">
                        {inq.status}
                      </span>
                    </div>

                    <p className="rounded-md bg-slate-50 p-2 text-xs text-slate-600 font-mono line-clamp-3">
                      {inq.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Receipt: {inq.deliveryReceipt || 'MSG-ITI-OK'}</span>
                      <span>{new Date(inq.sentAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Direct government vocational liaison bridge
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
