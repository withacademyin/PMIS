/**
 * PMIS Opportunity Radar — Recommendation Service
 * Implements strict waterfall precedence engine for mobilisation actions
 * as specified in PMIS_DNO_Admin_Dashboard_Data_Flow.md Section 7.4.
 */

export const ACTION_TYPES = {
  CAMPUS_CAMP: 'CAMPUS_CAMP',
  ASSISTED_REGISTRATION: 'ASSISTED_REGISTRATION',
  SHARE_BULLETIN: 'SHARE_BULLETIN',
  WIDEN_OUTREACH: 'WIDEN_OUTREACH'
};

export const ACTION_LABELS = {
  CAMPUS_CAMP: 'Campus Camp',
  ASSISTED_REGISTRATION: 'Assisted Registration Session',
  SHARE_BULLETIN: 'Share Bulletin',
  WIDEN_OUTREACH: 'Widen Outreach / Employer Follow-up'
};

/**
 * Determines the single recommended mobilisation action using a strict priority waterfall.
 *
 * @param {Object} params
 * @param {Object} params.posting - The internship posting
 * @param {Array<Object>} params.rankedInstitutions - Top institutions from rankingService
 * @param {Object} [params.district] - District configuration with lowRegistrationFlag
 * @param {Object} [params.config] - Custom thresholds (e.g. minOpeningsForCamp)
 * @returns {{ actionKey: string, actionLabel: string, reason: string, primaryTargetInstitution: Object|null, targetInstitutions: Array<Object> }}
 */
export function determineRecommendedAction({
  posting,
  rankedInstitutions = [],
  district = {},
  config = {}
}) {
  const minOpeningsForCamp = config.minOpeningsForCamp ?? 10;
  const minSeatsForCamp = config.minSeatsForCamp ?? 100;
  const openings = Number(posting.openings) || 0;
  const topInstitution = rankedInstitutions[0] || null;

  // Waterfall Step 1: No matching institutions found within catchment
  if (!topInstitution || rankedInstitutions.length === 0) {
    return {
      actionKey: ACTION_TYPES.WIDEN_OUTREACH,
      actionLabel: ACTION_LABELS.WIDEN_OUTREACH,
      reason: 'No institutions with matching programmes found within the current travel catchment.',
      primaryTargetInstitution: null,
      targetInstitutions: []
    };
  }

  // Waterfall Step 2: District-wide low registration flag
  if (district.lowRegistrationFlag) {
    return {
      actionKey: ACTION_TYPES.ASSISTED_REGISTRATION,
      actionLabel: ACTION_LABELS.ASSISTED_REGISTRATION,
      reason: 'District has a low candidate registration flag. Organise an assisted registration desk.',
      primaryTargetInstitution: topInstitution,
      targetInstitutions: rankedInstitutions.slice(0, 3)
    };
  }

  // Waterfall Step 3: High opening volume and large exact matching institution nearby
  if (
    openings >= minOpeningsForCamp &&
    topInstitution.matchStrength === 'EXACT' &&
    (topInstitution.matchingSeats >= minSeatsForCamp || (topInstitution.matchedProgramme?.seats || 0) >= minSeatsForCamp)
  ) {
    return {
      actionKey: ACTION_TYPES.CAMPUS_CAMP,
      actionLabel: ACTION_LABELS.CAMPUS_CAMP,
      reason: `High opening volume (${openings} openings) and large matching institution nearby (${topInstitution.name}).`,
      primaryTargetInstitution: topInstitution,
      targetInstitutions: [topInstitution]
    };
  }

  // Waterfall Step 4: Default action -> Share Bulletin
  const institutionCount = Math.min(3, rankedInstitutions.length);
  return {
    actionKey: ACTION_TYPES.SHARE_BULLETIN,
    actionLabel: ACTION_LABELS.SHARE_BULLETIN,
    reason: `Share tailored opportunity bulletin with top ${institutionCount} institutions.`,
    primaryTargetInstitution: topInstitution,
    targetInstitutions: rankedInstitutions.slice(0, 3)
  };
}
