/**
 * Utility service to provide rich dummy applicants, AI confidence scoring,
 * ITI official contacts (TPO, Principal, Helpdesk), and contact inquiry logs.
 */

// In-memory status overrides for applicants (requirementId -> applicantId -> status)
const applicantStatusStore = new Map();

// In-memory contact inquiry log
const contactInquiriesStore = [];

/**
 * Deterministic hash from string to generate stable values
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Clean string for email domain / username
 */
function slugify(text) {
  return (text || 'iti')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 14);
}

/**
 * Generate rich, realistic dummy contacts for an ITI
 */
export function generateITIContacts(iti) {
  if (!iti) return null;

  const h = hashString(iti.id || iti.name || 'iti');
  const slug = slugify(iti.name || iti.district);

  const tpoNames = [
    'Er. Rajesh Verma',
    'Er. Sudhir Chauhan',
    'Dr. Manisha Gupta',
    'Er. Amitesh Tripathi',
    'Er. Pradeep Yadav',
    'Er. Shalini Mishra',
    'Er. Vikram Rathore',
    'Er. Neha Srivastava',
  ];

  const principalNames = [
    'Dr. Arvind K. Sharma',
    'Dr. S. K. Awasthi',
    'Shri R. P. Yadav',
    'Dr. B. N. Tiwari',
    'Dr. Sunita Saxena',
    'Shri Anand Swaroop',
    'Dr. Devendra Pandey',
  ];

  const tpoName = tpoNames[h % tpoNames.length];
  const principalName = principalNames[(h + 3) % principalNames.length];

  // Stable phone numbers
  const tpoPhoneSuffix = (100000 + (h % 900000)).toString();
  const principalPhoneSuffix = (100000 + ((h * 7) % 900000)).toString();
  const tpoPhone = iti.phone || `+91 9415${tpoPhoneSuffix.slice(0, 6)}`;
  const principalPhone = `+91 9839${principalPhoneSuffix.slice(0, 6)}`;
  const cleanTpoMobile = tpoPhone.replace(/[^0-9]/g, '');

  return {
    tpo: {
      name: tpoName,
      designation: 'Training & Placement Officer (TPO)',
      role: 'TPO',
      phone: tpoPhone,
      email: `tpo.${slug}@iti.up.gov.in`,
      whatsapp: `+${cleanTpoMobile.length === 10 ? '91' + cleanTpoMobile : cleanTpoMobile}`,
      office: 'Placement Cell, Administrative Block, Room 104',
      availability: 'Mon - Sat: 9:30 AM - 5:00 PM',
      responseRate: 'Typically responds within 2 hours',
    },
    principal: {
      name: principalName,
      designation: 'Principal & Nodal Superintendent',
      role: 'PRINCIPAL',
      phone: principalPhone,
      email: `principal.${slug}@iti.up.gov.in`,
      office: 'Directorate Secretariat, Main Administration Wing',
      availability: 'Mon - Fri: 10:00 AM - 4:00 PM',
    },
    helpdesk: {
      phone: iti.phone || '+91 522 2451020',
      email: iti.email || `helpdesk.${slug}@iti.up.gov.in`,
      address: iti.address || `${iti.district || 'District Center'}, Uttar Pradesh`,
      pincode: iti.pincode || '226001',
      officeHours: 'Mon - Sat: 9:00 AM - 5:00 PM',
      verificationDesk: `verify.${slug}@iti.up.gov.in`,
    },
  };
}

/**
 * Trade specific skills helper
 */
const TRADE_SKILLS = {
  electrician: [
    'Industrial Wiring',
    'Three-Phase Motor Controls',
    'PLC Basics',
    'Circuit Breaker Maintenance',
    'Earthing & Safety Protocols',
    'Fault Diagnosis',
  ],
  fitter: [
    'Lathe Machine Operation',
    'Precision Measurement (Vernier/Micrometer)',
    'Pneumatics & Hydraulics',
    'TIG/MIG Joint Fitting',
    'Blueprint Reading',
    'Assembly Tolerances',
  ],
  welder: [
    'Shielded Metal Arc Welding (SMAW)',
    'Gas Metal Arc Welding (GMAW/MIG)',
    'Pipe Welding (6G Certified)',
    'Gas Cutting & Edge Prep',
    'Weld Inspection & Safety',
  ],
  turner: [
    'CNC Lathe Programming',
    'Cylindrical Grinding',
    'Thread Cutting & Boring',
    'Machine Tool Setup',
  ],
  machinist: [
    'Milling Machine Operations',
    'Surface Grinding',
    'CNC G-Code / M-Code',
    'Gear Cutting',
  ],
  plumber: [
    'Commercial Piping Installation',
    'Drainage & Sewage Layouts',
    'Pressure Testing',
    'Pipe Threading & Welding',
  ],
  mechanic: [
    'Diesel Engine Overhaul',
    'Automotive Electronics & Sensors',
    'Braking & Transmission Systems',
    'OBD Diagnostics',
  ],
};

function getSkillsForTrade(tradeName) {
  const key = (tradeName || '').toLowerCase().trim();
  for (const [tradeKey, skills] of Object.entries(TRADE_SKILLS)) {
    if (key.includes(tradeKey)) return skills;
  }
  return [
    'Standard Workshop Safety',
    'Equipment Maintenance',
    'NCVT Certified Practical Execution',
    'Quality Inspection',
    'Tools Handling',
  ];
}

/**
 * Generate rich dummy applicants & shortlisted candidates with confidence scores
 */
export function generateDummyApplicants(requirement, nearbyItis = []) {
  if (!requirement) return [];

  const reqId = requirement.id;
  const h = hashString(reqId);
  const trade = requirement.requiredTrade || 'Electrician';
  const skills = getSkillsForTrade(trade);

  // Status overrides from memory
  const statusMap = applicantStatusStore.get(reqId) || {};

  const firstNames = ['Rohan', 'Amitesh', 'Suresh', 'Pooja', 'Deepak', 'Mohd.', 'Vikram', 'Neha', 'Sachin', 'Kavita'];
  const lastNames = ['Verma', 'Kumar', 'Maurya', 'Sharma', 'Yadav', 'Rizwan', 'Chauhan', 'Singh', 'Patel', 'Tiwari'];

  // Base confidence scores for the candidate tier
  const baseScores = [96, 92, 88, 84, 79, 74, 68];

  const applicants = baseScores.map((score, idx) => {
    const applicantId = `app_${reqId.slice(0, 8)}_${idx + 1}`;
    const nameIdx = (h + idx) % firstNames.length;
    const surnameIdx = (h + idx * 3) % lastNames.length;
    const fullName = `${firstNames[nameIdx]} ${lastNames[surnameIdx]}`;
    
    // Pick an ITI from nearby list or fallback
    const iti = nearbyItis.length > 0
      ? nearbyItis[idx % nearbyItis.length]
      : {
          id: `iti_${idx + 1}`,
          name: `Government ITI ${idx % 2 === 0 ? 'Aliganj' : 'Mohanlalganj'}`,
          district: requirement.officer?.district || 'Lucknow',
          state: 'Uttar Pradesh',
          code: `ITI-UP-${100 + idx}`,
          isGovernment: true,
        };

    const itiContacts = generateITIContacts(iti);
    const distanceKm = Number((3.5 + ((idx * 4.2 + (h % 5)) % 25)).toFixed(1));
    const experienceYears = [3, 2, 2, 1, 4, 1, 2][idx % 7];
    const grade = idx < 3 ? 'Grade A+' : idx < 5 ? 'Grade A' : 'Grade B+';

    // Current status: check memory override first
    let currentStatus = statusMap[applicantId];
    if (!currentStatus) {
      // Default: top 2 applicants are SHORTLISTED, 3rd is INTERVIEW_SCHEDULED, rest are APPLIED
      if (idx === 0) currentStatus = 'SHORTLISTED';
      else if (idx === 1) currentStatus = 'SHORTLISTED';
      else if (idx === 2) currentStatus = 'INTERVIEW_SCHEDULED';
      else currentStatus = 'APPLIED';
    }

    const confidenceLevel = score >= 85 ? 'HIGH' : score >= 75 ? 'MEDIUM' : 'MODERATE';

    // Rationale for AI confidence
    const rationales = [
      `Top 2% district percentile in ${trade} practical exam; ${experienceYears} yrs hands-on industrial training.`,
      `Outstanding workshop practical score (94/100); NCVT certified with distinction; 100% attendance.`,
      `Strong foundational skill alignment for ${trade}; completed specialized industrial apprenticeship.`,
      `Certified ${grade} technician; verified hands-on competency in modern tool safety.`,
      `Experienced in ${skills[0]} and ${skills[1] || 'safety protocols'}; good technical interview readiness.`,
      `Solid vocational training background with valid trade certificate; basic shopfloor exposure.`,
      `Meets core trade eligibility criteria; recommended for entry-level technician role.`,
    ];

    return {
      id: applicantId,
      workerId: applicantId,
      requirementId: reqId,
      fullName,
      trade,
      experienceYears,
      certificationGrade: grade,
      isVerified: true,
      distanceKm,
      status: currentStatus,
      appliedAt: new Date(Date.now() - (idx * 14 + 4) * 3600 * 1000).toISOString(),
      skills: skills.slice(0, 4),
      confidenceScore: score,
      confidenceLevel,
      confidenceBreakdown: {
        tradeAlignment: Math.min(100, score + 4),
        skillProficiency: Math.min(100, score - 1),
        practicalAssessment: Math.min(100, score + 2),
        ncvtCertification: 100,
        proximityScore: Math.max(10, Math.round(25 * (1 - distanceKm / 50))),
      },
      matchHighlights: [
        `🎯 ${score}% AI Match Confidence`,
        `📜 NCVT ${grade} Certified`,
        `📍 ${distanceKm} km from operational center`,
        `🛠️ Skilled in ${skills[0]} & ${skills[1] || 'Maintenance'}`,
      ],
      aiRationale: rationales[idx] || rationales[0],
      phone: `+91 9792${(100000 + ((h + idx * 11) % 900000)).toString().slice(0, 6)}`,
      email: `${fullName.toLowerCase().replace(/[^a-z]/g, '')}${10 + idx}@gmail.com`,
      iti: {
        id: iti.id,
        name: iti.name,
        code: iti.code,
        district: iti.district,
        state: iti.state,
        isGovernment: iti.isGovernment !== false,
        contacts: itiContacts,
      },
    };
  });

  return applicants;
}

/**
 * Update an applicant's status (e.g. APPLIED -> SHORTLISTED -> INTERVIEW_SCHEDULED -> SELECTED -> REJECTED)
 */
export function setApplicantStatus(requirementId, applicantId, status) {
  if (!applicantStatusStore.has(requirementId)) {
    applicantStatusStore.set(requirementId, {});
  }
  const statusMap = applicantStatusStore.get(requirementId);
  statusMap[applicantId] = status;
  return status;
}

/**
 * Record a contact inquiry sent by an officer to an ITI
 */
export function recordContactInquiry({
  itiId,
  itiName,
  officerId,
  officerName,
  requirementId,
  roleTitle,
  contactRole,
  inquiryType,
  subject,
  message,
  urgency = 'NORMAL',
}) {
  const inquiry = {
    id: `inq_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    itiId,
    itiName: itiName || 'Industrial Training Institute',
    officerId,
    officerName: officerName || 'Placement Nodal Officer',
    requirementId: requirementId || null,
    roleTitle: roleTitle || 'General Placement Inquiry',
    contactRole: contactRole || 'TPO',
    inquiryType: inquiryType || 'BATCH_REQUEST',
    subject: subject || `Recruitment & Role Inquiry regarding ${roleTitle || 'Candidates'}`,
    message: message || '',
    urgency,
    status: 'DELIVERED',
    sentAt: new Date().toISOString(),
    deliveryReceipt: `MSG-ITI-${Math.floor(100000 + Math.random() * 900000)}`,
  };

  contactInquiriesStore.unshift(inquiry);
  return inquiry;
}

/**
 * Get inquiry history for a specific ITI (or all inquiries for an officer)
 */
export function getContactInquiries(itiId, officerId) {
  return contactInquiriesStore.filter((inq) => {
    if (itiId && inq.itiId !== itiId) return false;
    if (officerId && inq.officerId !== officerId) return false;
    return true;
  });
}
