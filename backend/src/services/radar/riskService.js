/**
 * PMIS Opportunity Radar — Risk Service
 * Implements deterministic fill-risk calculation and snapshot preservation
 * as specified in PMIS_DNO_Admin_Dashboard_Data_Flow.md Section 13.
 */

export const RISK_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  CLOSED: 'CLOSED'
};

/**
 * Calculates deterministic fill-risk metrics for an internship posting.
 *
 * @param {Object} posting
 * @param {number} posting.openings
 * @param {number} posting.applications
 * @param {Date|string} posting.windowCloseDate
 * @param {Object} [config]
 * @param {number} [config.targetMultiplier=3.0]
 * @param {number} [config.highRiskDaysLimit=14]
 * @param {number} [config.highRiskCoverageCap=0.5]
 * @param {Date} [asOfDate=new Date()]
 * @returns {Object} Calculated risk evaluation
 */
export function calculateOpportunityRisk(posting, config = {}, asOfDate = new Date()) {
  const targetMultiplier = config.targetMultiplier ?? 3.0;
  const highRiskDaysLimit = config.highRiskDaysLimit ?? 14;
  const highRiskCoverageCap = config.highRiskCoverageCap ?? 0.5;

  const openings = Math.max(0, Number(posting.openings) || 0);
  const applications = Math.max(0, Number(posting.applications) || 0);
  const closeDate = new Date(posting.windowCloseDate);
  const now = new Date(asOfDate);

  // Milliseconds to integer days remaining
  const msDiff = closeDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

  // Target applications: openings * targetMultiplier (at least 1 if openings > 0)
  const targetApplications = Math.max(1, Math.round(openings * targetMultiplier));

  // Coverage: applications / targetApplications
  const rawCoverage = openings > 0 ? applications / targetApplications : 1.0;
  const coverage = Math.round(rawCoverage * 1000) / 1000;

  let riskLevel = RISK_LEVELS.LOW;
  let reason = 'Healthy application coverage';

  if (daysLeft < 0) {
    riskLevel = RISK_LEVELS.CLOSED;
    reason = 'Application window expired';
  } else if (applications === 0) {
    riskLevel = RISK_LEVELS.HIGH;
    reason = `0 applications received for ${openings} openings (${daysLeft} days remaining)`;
  } else if (coverage < highRiskCoverageCap && daysLeft <= highRiskDaysLimit) {
    riskLevel = RISK_LEVELS.HIGH;
    reason = `${applications} applications for ${openings} openings, closes in ${daysLeft} days`;
  } else if (coverage < 1.0) {
    riskLevel = RISK_LEVELS.MEDIUM;
    reason = `Coverage at ${Math.round(coverage * 100)}% of target (${applications}/${targetApplications}), ${daysLeft} days left`;
  } else {
    riskLevel = RISK_LEVELS.LOW;
    reason = `On target: ${applications} applications for ${openings} openings (${Math.round(coverage * 100)}% coverage)`;
  }

  return {
    riskLevel,
    reason,
    targetApplications,
    coverage,
    daysLeft,
    calculatedAt: now
  };
}

/**
 * Creates or updates an OpportunityRiskSnapshot in the database.
 * Preserves audit trail and inputs.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} postingId
 * @param {Object} [config]
 * @param {Date} [asOfDate]
 */
export async function evaluateAndRecordPostingRisk(prisma, postingId, config, asOfDate = new Date()) {
  const posting = await prisma.internshipPosting.findUnique({
    where: { id: postingId }
  });

  if (!posting) {
    throw new Error(`Posting not found: ${postingId}`);
  }

  const evaluation = calculateOpportunityRisk(posting, config, asOfDate);

  const snapshot = await prisma.opportunityRiskSnapshot.create({
    data: {
      postingId: posting.id,
      riskLevel: evaluation.riskLevel,
      reason: evaluation.reason,
      targetApplications: evaluation.targetApplications,
      coverage: evaluation.coverage,
      daysLeft: evaluation.daysLeft,
      calculatedAt: evaluation.calculatedAt
    }
  });

  // Also sync current status on posting if closed
  if (evaluation.riskLevel === RISK_LEVELS.CLOSED && posting.status !== 'CLOSED') {
    await prisma.internshipPosting.update({
      where: { id: posting.id },
      data: { status: 'CLOSED' }
    });
  }

  return { evaluation, snapshot };
}
