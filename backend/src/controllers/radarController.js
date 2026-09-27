/**
 * PMIS Opportunity Radar — API Controller
 * Provides all decision-support, catchment, institution ranking,
 * mobilisation action planning, and outcome monitoring endpoints.
 */

import prisma from '../config/prisma.js';
import { calculateOpportunityRisk, RISK_LEVELS } from '../services/radar/riskService.js';
import { resolveTravelTime, filterInstitutionsByCatchment } from '../services/radar/catchmentService.js';
import { rankInstitutionsForOpportunity } from '../services/radar/rankingService.js';
import { determineRecommendedAction } from '../services/radar/recommendationService.js';

// Helper to enforce district permission
function verifyDistrictAccess(req, districtCode) {
  if (!districtCode) return false;
  if (req.user.role === 'ADMIN') return true;
  const assigned = req.user.assignedDistricts || [];
  return assigned.includes(districtCode.toUpperCase());
}

/**
 * GET /api/v1/radar/districts
 * Returns all districts accessible to the user
 */
export async function getAvailableDistricts(req, res) {
  try {
    let districts;
    if (req.user.role === 'ADMIN') {
      districts = await prisma.district.findMany({
        where: { stateCode: 'UP' },
        orderBy: { name: 'asc' },
        select: { code: true, name: true, lowRegistrationFlag: true, localLanguage: true }
      });
    } else {
      const assigned = req.user.assignedDistricts || [];
      districts = await prisma.district.findMany({
        where: { code: { in: assigned } },
        orderBy: { name: 'asc' },
        select: { code: true, name: true, lowRegistrationFlag: true, localLanguage: true }
      });
    }
    return res.json({ success: true, data: districts });
  } catch (error) {
    console.error('Error fetching districts:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching districts' });
  }
}

/**
 * GET /api/v1/radar/dashboard/summary
 * Returns KPI cards, priority actions, and district context
 */
export async function getDashboardSummary(req, res) {
  try {
    const districtCode = req.query.districtCode?.toUpperCase() || req.user.assignedDistricts?.[0] || 'GORAKHPUR';

    if (!verifyDistrictAccess(req, districtCode)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have permission to view district ${districtCode}`
      });
    }

    const district = await prisma.district.findUnique({
      where: { code: districtCode },
      include: { configurations: true }
    });

    if (!district) {
      return res.status(404).json({ success: false, message: 'District not found' });
    }

    // Fetch all open postings in district
    const postings = await prisma.internshipPosting.findMany({
      where: { districtCode, status: { not: 'CLOSED' } },
      include: { qualification: true },
      orderBy: { windowCloseDate: 'asc' }
    });

    const now = new Date();
    let highRiskCount = 0;
    let openingsAtRisk = 0;
    let closingIn7Days = 0;

    const evaluatedPostings = postings.map((post) => {
      const risk = calculateOpportunityRisk(post, district.configurations || {}, now);
      if (risk.riskLevel === RISK_LEVELS.HIGH) {
        highRiskCount++;
        openingsAtRisk += post.openings;
      } else if (risk.riskLevel === RISK_LEVELS.MEDIUM) {
        openingsAtRisk += post.openings;
      }

      if (risk.daysLeft <= 7 && risk.daysLeft >= 0) {
        closingIn7Days++;
      }

      return {
        ...post,
        risk
      };
    });

    // Priority Action Opportunities: High risk with fewest days left
    const priorityCandidates = evaluatedPostings
      .filter((p) => p.risk.riskLevel === RISK_LEVELS.HIGH)
      .sort((a, b) => a.risk.daysLeft - b.risk.daysLeft)
      .slice(0, 3);

    // Fetch institutions in district and catchment for priority recommendations
    const institutions = await prisma.iTI.findMany({
      where: { status: 'ACTIVE' },
      include: {
        programmes: {
          include: { mappings: true }
        }
      }
    });

    const priorityActions = await Promise.all(
      priorityCandidates.map(async (p) => {
        const institutionsWithTravel = await Promise.all(
          institutions.map(async (inst) => {
            const travel = await resolveTravelTime(
              prisma,
              p.id,
              { lat: p.latitude, lng: p.longitude },
              inst
            );
            return {
              ...inst,
              ...travel
            };
          })
        );

        const eligible = filterInstitutionsByCatchment(institutionsWithTravel, 60);
        const ranked = rankInstitutionsForOpportunity(p, eligible, 60, 3);
        const rec = determineRecommendedAction({
          posting: p,
          rankedInstitutions: ranked,
          district
        });

        return {
          id: p.id,
          postingId: p.postingId,
          roleTitle: p.roleTitle,
          companyName: p.companyName,
          openings: p.openings,
          applications: p.applications,
          daysLeft: p.risk.daysLeft,
          riskLevel: p.risk.riskLevel,
          recommendation: rec,
          topInstitution: ranked[0] || null
        };
      })
    );

    return res.json({
      success: true,
      data: {
        district: {
          code: district.code,
          name: district.name,
          localLanguage: district.localLanguage,
          lowRegistrationFlag: district.lowRegistrationFlag
        },
        kpis: {
          openOpportunities: postings.length,
          highRisk: highRiskCount,
          openingsAtRisk,
          closingInNext7Days: closingIn7Days
        },
        priorityActions,
        lastUpdated: now
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ success: false, message: 'Server error generating dashboard summary' });
  }
}

/**
 * GET /api/v1/radar/map
 * Returns opportunities and institutions geo points for interactive district radar map
 */
export async function getMapData(req, res) {
  try {
    const districtCode = req.query.districtCode?.toUpperCase() || req.user.assignedDistricts?.[0] || 'GORAKHPUR';

    if (!verifyDistrictAccess(req, districtCode)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const postings = await prisma.internshipPosting.findMany({
      where: { districtCode, status: { not: 'CLOSED' } },
      select: {
        id: true,
        postingId: true,
        roleTitle: true,
        companyName: true,
        sector: true,
        openings: true,
        applications: true,
        latitude: true,
        longitude: true,
        windowCloseDate: true,
        qualificationCode: true
      }
    });

    const now = new Date();
    const mappedPostings = postings
      .filter((p) => p.latitude && p.longitude)
      .map((p) => {
        const risk = calculateOpportunityRisk(p, {}, now);
        return {
          ...p,
          riskLevel: risk.riskLevel,
          daysLeft: risk.daysLeft
        };
      });

    const institutions = await prisma.iTI.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ districtCode }, { districtCode: { in: ['DEORIA', 'MAHARAJGANJ', 'SANT_KABIR_NAGAR', 'KUSHINAGAR'] } }]
      },
      select: {
        id: true,
        name: true,
        type: true,
        district: true,
        districtCode: true,
        latitude: true,
        longitude: true,
        contactName: true,
        contactPhone: true,
        isGovernment: true
      }
    });

    return res.json({
      success: true,
      data: {
        opportunities: mappedPostings,
        institutions: institutions.filter((i) => i.latitude && i.longitude)
      }
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching map data' });
  }
}

/**
 * GET /api/v1/radar/opportunities
 * Filterable, sortable list of internship opportunities
 */
export async function getOpportunities(req, res) {
  try {
    const districtCode = req.query.districtCode?.toUpperCase() || req.user.assignedDistricts?.[0] || 'GORAKHPUR';

    if (!verifyDistrictAccess(req, districtCode)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { risk, sector, qualificationCode, closingWithinDays, search, sort = 'risk_desc' } = req.query;

    const where = {
      districtCode,
      status: { not: 'CLOSED' }
    };

    if (sector) where.sector = sector;
    if (qualificationCode) where.qualificationCode = qualificationCode;
    if (search) {
      where.OR = [
        { roleTitle: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { postingId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const postings = await prisma.internshipPosting.findMany({
      where,
      include: { qualification: true },
      orderBy: { windowCloseDate: 'asc' }
    });

    const now = new Date();
    let evaluated = postings.map((p) => {
      const riskEval = calculateOpportunityRisk(p, {}, now);
      return {
        ...p,
        risk: riskEval
      };
    });

    // Apply risk filter
    if (risk) {
      evaluated = evaluated.filter((p) => p.risk.riskLevel === risk.toUpperCase());
    }

    // Apply closingWithinDays filter
    if (closingWithinDays) {
      const maxDays = Number(closingWithinDays);
      evaluated = evaluated.filter((p) => p.risk.daysLeft <= maxDays && p.risk.daysLeft >= 0);
    }

    // Sorting
    const riskRank = { HIGH: 3, MEDIUM: 2, LOW: 1, CLOSED: 0 };
    if (sort === 'risk_desc') {
      evaluated.sort((a, b) => {
        const diff = riskRank[b.risk.riskLevel] - riskRank[a.risk.riskLevel];
        if (diff !== 0) return diff;
        return a.risk.daysLeft - b.risk.daysLeft;
      });
    } else if (sort === 'days_asc') {
      evaluated.sort((a, b) => a.risk.daysLeft - b.risk.daysLeft);
    } else if (sort === 'openings_desc') {
      evaluated.sort((a, b) => b.openings - a.openings);
    }

    return res.json({
      success: true,
      data: evaluated,
      total: evaluated.length
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching opportunities' });
  }
}

/**
 * GET /api/v1/radar/opportunities/:id
 * Detailed opportunity view with catchment slider (30/45/60 min) and ranked institutions
 */
export async function getOpportunityDetail(req, res) {
  try {
    const { id } = req.params;
    const catchmentMinutes = Number(req.query.catchmentMinutes) || 60;

    const posting = await prisma.internshipPosting.findUnique({
      where: { id },
      include: {
        qualification: true,
        district: true,
        snapshots: { orderBy: { observedAt: 'desc' }, take: 10 }
      }
    });

    if (!posting) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    if (!verifyDistrictAccess(req, posting.districtCode)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const now = new Date();
    const risk = calculateOpportunityRisk(posting, {}, now);

    // Fetch institutions with programmes and qualification mappings
    const institutions = await prisma.iTI.findMany({
      where: { status: 'ACTIVE' },
      include: {
        programmes: {
          include: { mappings: true }
        }
      }
    });

    // Compute travel times for each institution
    const institutionsWithTravel = await Promise.all(
      institutions.map(async (inst) => {
        const travel = await resolveTravelTime(
          prisma,
          posting.id,
          { lat: posting.latitude, lng: posting.longitude },
          inst
        );
        return {
          ...inst,
          ...travel
        };
      })
    );

    // Filter within chosen catchment
    const eligibleInstitutions = filterInstitutionsByCatchment(institutionsWithTravel, catchmentMinutes);

    // Score and rank top institutions
    const rankedInstitutions = rankInstitutionsForOpportunity(
      posting,
      eligibleInstitutions,
      catchmentMinutes,
      5
    );

    // Formulate recommended action using priority waterfall
    const recommendedAction = determineRecommendedAction({
      posting,
      rankedInstitutions,
      district: posting.district
    });

    return res.json({
      success: true,
      data: {
        posting: {
          ...posting,
          risk
        },
        catchmentMinutes,
        eligibleCount: eligibleInstitutions.length,
        rankedInstitutions,
        recommendedAction,
        provenance: {
          travelTimeSource: rankedInstitutions.some((i) => i.source === 'GEODESIC_FALLBACK')
            ? 'Geodesic road distance approximation (35 km/h standard speed)'
            : 'Precomputed verified travel network',
          calculatedAt: now
        }
      }
    });
  } catch (error) {
    console.error('Error fetching opportunity detail:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching opportunity detail' });
  }
}

/**
 * GET /api/v1/radar/institutions
 * Directory of ITIs, Polytechnics, and Colleges
 */
export async function getInstitutions(req, res) {
  try {
    const { districtCode, type, search } = req.query;

    const where = { status: 'ACTIVE' };
    if (districtCode) where.districtCode = districtCode.toUpperCase();
    if (type) where.type = type.toUpperCase();
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const institutions = await prisma.iTI.findMany({
      where,
      include: {
        programmes: true
      },
      orderBy: { name: 'asc' }
    });

    const formatted = institutions.map((inst) => {
      const totalSeats = inst.programmes.reduce((sum, p) => sum + (p.seats || 0), 0);
      return {
        id: inst.id,
        code: inst.code,
        name: inst.name,
        type: inst.type,
        district: inst.district,
        districtCode: inst.districtCode,
        isGovernment: inst.isGovernment,
        contactName: inst.contactName,
        contactRole: inst.contactRole,
        contactPhone: inst.contactPhone,
        programmesCount: inst.programmes.length,
        totalSeats,
        programmes: inst.programmes.map((p) => ({
          code: p.programmeCode,
          name: p.programmeName,
          seats: p.seats
        }))
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching institutions' });
  }
}

/**
 * GET /api/v1/radar/institutions/:id
 * Institution details and reverse-matched open opportunities in catchment
 */
export async function getInstitutionDetail(req, res) {
  try {
    const { id } = req.params;

    const institution = await prisma.iTI.findUnique({
      where: { id },
      include: {
        programmes: {
          include: { mappings: true }
        }
      }
    });

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    // Collect all qualification codes offered by this institution
    const offeredQualifications = new Set();
    institution.programmes.forEach((prog) => {
      prog.mappings.forEach((m) => offeredQualifications.add(m.qualificationCode));
    });

    // Find reverse matching open opportunities in district and nearby
    const matchingPostings = await prisma.internshipPosting.findMany({
      where: {
        qualificationCode: { in: Array.from(offeredQualifications) },
        status: { not: 'CLOSED' }
      },
      include: { qualification: true },
      take: 15
    });

    const now = new Date();
    const evaluatedPostings = matchingPostings.map((p) => {
      const risk = calculateOpportunityRisk(p, {}, now);
      return {
        id: p.id,
        postingId: p.postingId,
        roleTitle: p.roleTitle,
        companyName: p.companyName,
        openings: p.openings,
        applications: p.applications,
        daysLeft: risk.daysLeft,
        riskLevel: risk.riskLevel
      };
    });

    return res.json({
      success: true,
      data: {
        institution,
        reverseMatchingOpportunities: evaluatedPostings
      }
    });
  } catch (error) {
    console.error('Error fetching institution detail:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching institution detail' });
  }
}

/**
 * POST /api/v1/radar/bulletins/generate
 * Creates a bulletin mobilization record and pre-formats WhatsApp and printable content
 */
export async function generateBulletin(req, res) {
  try {
    const { postingId, language = 'Hindi' } = req.body;

    const posting = await prisma.internshipPosting.findUnique({
      where: { id: postingId },
      include: { qualification: true, district: true }
    });

    if (!posting) {
      return res.status(404).json({ success: false, message: 'Posting not found' });
    }

    const closeDateStr = new Date(posting.windowCloseDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const isHindi = language.toLowerCase().includes('hindi');
    const headline = isHindi
      ? `पीएम इंटर्नशिप अवसर — ${posting.roleTitle}`
      : `PM INTERNSHIP OPPORTUNITY — ${posting.roleTitle.toUpperCase()}`;

    const bodyText = isHindi
      ? `कंपनी: ${posting.companyName}\nस्थान: ${posting.address}\nयोग्यता: ${posting.qualification.label}\nअवधि: ${posting.durationMonths} माह\nमासिक सहयोग: ₹${posting.monthlySupport}\nआवेदन की अंतिम तिथि: ${closeDateStr}\n\nआवेदन केवल आधिकारिक पोर्टल pminternship.mca.gov.in पर करें। कोई शुल्क देय नहीं है।`
      : `Company: ${posting.companyName}\nLocation: ${posting.address}\nQualification: ${posting.qualification.label}\nDuration: ${posting.durationMonths} Months\nMonthly Support: ₹${posting.monthlySupport}\nLast Date to Apply: ${closeDateStr}\n\nApply only on official portal: pminternship.mca.gov.in. No fee is charged.`;

    const bulletin = await prisma.bulletin.create({
      data: {
        postingId: posting.id,
        language,
        headline,
        bodyText,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(posting.portalLink)}`,
        aspectRatio: '1:1',
        createdBy: req.user.email
      }
    });

    return res.json({
      success: true,
      data: bulletin
    });
  } catch (error) {
    console.error('Error generating bulletin:', error);
    return res.status(500).json({ success: false, message: 'Server error generating bulletin' });
  }
}

/**
 * POST /api/v1/radar/camps/plan
 * Records a mobilization camp plan and generates printable brief
 */
export async function planCamp(req, res) {
  try {
    const {
      postingId,
      institutionId,
      campName,
      proposedDate,
      proposedTime,
      coordinatorName,
      coordinatorPhone,
      address,
      notes
    } = req.body;

    const posting = await prisma.internshipPosting.findUnique({
      where: { id: postingId },
      include: { qualification: true }
    });

    const institution = await prisma.iTI.findUnique({
      where: { id: institutionId }
    });

    if (!posting || !institution) {
      return res.status(404).json({ success: false, message: 'Posting or Institution not found' });
    }

    const campPlan = await prisma.campPlan.create({
      data: {
        postingId,
        institutionId,
        campName: campName || `PMIS Mobilisation Camp - ${posting.roleTitle}`,
        proposedDate: new Date(proposedDate),
        proposedTime: proposedTime || '11:00 AM',
        coordinatorName: coordinatorName || req.user.officerProfile?.name || 'Rahul Sharma',
        coordinatorPhone: coordinatorPhone || institution.contactPhone || '9876543210',
        address: address || institution.address || `${institution.name}, ${institution.district}`,
        notes,
        createdBy: req.user.email,
        status: 'PLANNED',
        generatedBrief: {
          opportunityTitle: posting.roleTitle,
          companyName: posting.companyName,
          openings: posting.openings,
          stipend: posting.monthlySupport,
          institutionName: institution.name,
          institutionContact: institution.contactPhone
        }
      }
    });

    return res.json({ success: true, data: campPlan });
  } catch (error) {
    console.error('Error planning camp:', error);
    return res.status(500).json({ success: false, message: 'Server error planning camp' });
  }
}

/**
 * GET /api/v1/radar/action-plan
 * Returns weekly action plan items and progress
 */
export async function getActionPlan(req, res) {
  try {
    const districtCode = req.query.districtCode?.toUpperCase() || req.user.assignedDistricts?.[0] || 'GORAKHPUR';
    const weekIdentifier = req.query.weekIdentifier || '2026-W40';

    if (!verifyDistrictAccess(req, districtCode)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const items = await prisma.actionPlanItem.findMany({
      where: { districtCode, weekIdentifier },
      include: {
        posting: {
          include: { qualification: true }
        },
        notes: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const now = new Date();
    const enriched = items.map((item) => {
      const risk = calculateOpportunityRisk(item.posting, {}, now);
      return {
        ...item,
        posting: {
          ...item.posting,
          risk
        }
      };
    });

    return res.json({
      success: true,
      data: {
        districtCode,
        weekIdentifier,
        items: enriched,
        totalItems: enriched.length,
        completedCount: enriched.filter((i) => i.isDone).length
      }
    });
  } catch (error) {
    console.error('Error fetching action plan:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching action plan' });
  }
}

/**
 * PATCH /api/v1/radar/action-plan/:id/toggle
 * Toggles an action plan item done/not-done
 */
export async function toggleActionPlanItem(req, res) {
  try {
    const { id } = req.params;

    const item = await prisma.actionPlanItem.findUnique({
      where: { id }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Action plan item not found' });
    }

    if (!verifyDistrictAccess(req, item.districtCode)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updated = await prisma.actionPlanItem.update({
      where: { id },
      data: {
        isDone: !item.isDone,
        completedAt: !item.isDone ? new Date() : null,
        completedBy: !item.isDone ? req.user.email : null
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error toggling action plan item:', error);
    return res.status(500).json({ success: false, message: 'Server error toggling action item' });
  }
}

/**
 * POST /api/v1/radar/action-plan/:id/notes
 * Appends a field progress note to an action item
 */
export async function addActionPlanNote(req, res) {
  try {
    const { id } = req.params;
    const { noteText } = req.body;

    if (!noteText || !noteText.trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }

    const item = await prisma.actionPlanItem.findUnique({
      where: { id }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Action item not found' });
    }

    const authorName = req.user.officerProfile?.name || req.user.email;

    const note = await prisma.actionPlanNote.create({
      data: {
        itemId: id,
        authorName,
        noteText: noteText.trim()
      }
    });

    return res.json({ success: true, data: note });
  } catch (error) {
    console.error('Error adding action plan note:', error);
    return res.status(500).json({ success: false, message: 'Server error adding note' });
  }
}

/**
 * GET /api/v1/radar/outcomes
 * Comparative outcome observation metrics: Targeted vs Untargeted
 */
export async function getOutcomes(req, res) {
  try {
    const observations = await prisma.outcomeObservation.findMany({
      include: {
        posting: {
          select: { roleTitle: true, companyName: true, openings: true, districtCode: true }
        }
      }
    });

    const targeted = observations.filter((o) => o.isTargeted);
    const untargeted = observations.filter((o) => !o.isTargeted);

    // Calculate aggregated benchmark rates
    const calcRate = (list, field) => {
      if (list.length === 0) return 0;
      const total = list.reduce((sum, item) => sum + (item[field] || 0), 0);
      const openings = list.reduce((sum, item) => sum + (item.posting?.openings || 1), 0);
      return Math.round((total / Math.max(1, openings)) * 10) / 10;
    };

    const targetedAppsPerOpening = calcRate(targeted, 'applicationsTotal');
    const untargetedAppsPerOpening = calcRate(untargeted, 'applicationsTotal');

    const targetedCatchmentRatio = Math.round(
      (targeted.reduce((sum, o) => sum + o.catchmentApplications, 0) /
        Math.max(1, targeted.reduce((sum, o) => sum + o.applicationsTotal, 0))) *
        100
    );

    const untargetedCatchmentRatio = Math.round(
      (untargeted.reduce((sum, o) => sum + o.catchmentApplications, 0) /
        Math.max(1, untargeted.reduce((sum, o) => sum + o.applicationsTotal, 0))) *
        100
    );

    return res.json({
      success: true,
      data: {
        isIllustrative: true,
        label: 'Benchmark Observation Model (Targeted vs Untargeted Opportunities)',
        metrics: [
          {
            metricName: 'Applications per Opening',
            targeted: targetedAppsPerOpening,
            untargeted: untargetedAppsPerOpening,
            unit: 'ratio'
          },
          {
            metricName: 'Applications from Catchment',
            targeted: targetedCatchmentRatio,
            untargeted: untargetedCatchmentRatio,
            unit: '%'
          },
          {
            metricName: 'Offer Acceptance Rate',
            targeted: 89,
            untargeted: 64,
            unit: '%'
          },
          {
            metricName: 'Joining Rate',
            targeted: 84,
            untargeted: 52,
            unit: '%'
          }
        ],
        sampleSize: {
          targetedCount: targeted.length,
          untargetedCount: untargeted.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching outcomes:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching outcomes' });
  }
}
