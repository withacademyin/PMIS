/**
 * PMIS Opportunity Radar — Ranking Service
 * Ranks eligible catchment institutions using normalized multi-variable scoring
 * as specified in PMIS_DNO_Admin_Dashboard_Data_Flow.md Section 15.
 */

const MATCH_STRENGTH_WEIGHTS = {
  EXACT: 1.0,     // 3 / 3
  RELATED: 0.67,  // 2 / 3
  GENERIC: 0.33,  // 1 / 3
  NONE: 0.0
};

const SCORE_WEIGHTS = {
  MATCH: 0.40,
  PROXIMITY: 0.30,
  SIZE: 0.20,
  RESPONSE: 0.10
};

/**
 * Calculates normalized rank score (0 to 100) for an institution relative to an opportunity.
 *
 * @param {Object} params
 * @param {string} params.matchStrength - 'EXACT' | 'RELATED' | 'GENERIC' | 'NONE'
 * @param {number} params.travelMinutes - Travel time in minutes
 * @param {number} params.catchmentMinutes - Current catchment boundary (e.g. 30, 45, 60)
 * @param {number} params.programmeSeats - Available capacity in matching programme
 * @param {number} [params.responseScore=0.8] - Cooperation / responsiveness factor (0.0 to 1.0)
 * @returns {{ score: number, components: Object, whyThisInstitution: string }}
 */
export function scoreInstitution({
  matchStrength,
  matchProgrammeName,
  travelMinutes,
  catchmentMinutes = 60,
  programmeSeats = 0,
  responseScore = 0.8
}) {
  // 1. Match Score (0.0 to 1.0)
  const matchScore = MATCH_STRENGTH_WEIGHTS[matchStrength] || 0.0;

  // 2. Proximity Score (0.0 to 1.0, closer is higher)
  const proximityScore = Math.max(0.0, Math.min(1.0, 1.0 - travelMinutes / Math.max(1, catchmentMinutes)));

  // 3. Size Score (0.0 to 1.0, normalized against 200 seat ceiling)
  const sizeScore = Math.max(0.0, Math.min(1.0, programmeSeats / 200.0));

  // 4. Response Score (0.0 to 1.0)
  const normalizedResponse = Math.max(0.0, Math.min(1.0, responseScore));

  // Combined score (0 to 100)
  const rawScore =
    100 *
    (SCORE_WEIGHTS.MATCH * matchScore +
      SCORE_WEIGHTS.PROXIMITY * proximityScore +
      SCORE_WEIGHTS.SIZE * sizeScore +
      SCORE_WEIGHTS.RESPONSE * normalizedResponse);

  const finalScore = Math.round(rawScore);

  // Generate human-readable rationale
  const strengthName =
    matchStrength === 'EXACT' ? 'Exact' : matchStrength === 'RELATED' ? 'Related' : 'General';
  const progDetail = matchProgrammeName ? ` (${matchProgrammeName})` : '';
  const whyThisInstitution = `${strengthName} match${progDetail}, ${travelMinutes} min away, ${programmeSeats} seats capacity.`;

  return {
    score: finalScore,
    components: {
      matchScore: Math.round(matchScore * 100) / 100,
      proximityScore: Math.round(proximityScore * 100) / 100,
      sizeScore: Math.round(sizeScore * 100) / 100,
      responseScore: Math.round(normalizedResponse * 100) / 100
    },
    whyThisInstitution
  };
}

/**
 * Ranks all eligible institutions in the catchment for a posting, returning the Top N.
 *
 * @param {Object} posting - The internship posting
 * @param {Array<Object>} institutionsWithCatchment - Institutions with travel times and programme mappings
 * @param {number} catchmentMinutes - 30, 45, or 60
 * @param {number} [topN=5] - Number of top institutions to return
 * @returns {Array<Object>} Ranked top institutions with scores and rationales
 */
export function rankInstitutionsForOpportunity(
  posting,
  institutionsWithCatchment,
  catchmentMinutes = 60,
  topN = 5
) {
  const scoredInstitutions = institutionsWithCatchment.map((inst) => {
    // Find best match programme for this posting's qualification
    let bestStrength = 'NONE';
    let bestProgramme = null;
    let maxSeats = 0;

    const programmes = inst.programmes || [];
    for (const prog of programmes) {
      const mappings = prog.mappings || [];
      for (const m of mappings) {
        if (m.qualificationCode === posting.qualificationCode) {
          const strengthRank = { EXACT: 3, RELATED: 2, GENERIC: 1, NONE: 0 };
          if (strengthRank[m.matchStrength] > strengthRank[bestStrength]) {
            bestStrength = m.matchStrength;
            bestProgramme = prog;
            maxSeats = prog.seats || 0;
          }
        }
      }
    }

    const { score, components, whyThisInstitution } = scoreInstitution({
      matchStrength: bestStrength,
      matchProgrammeName: bestProgramme?.programmeName || null,
      travelMinutes: inst.travelMinutes,
      catchmentMinutes,
      programmeSeats: maxSeats,
      responseScore: 0.85
    });

    return {
      ...inst,
      matchStrength: bestStrength,
      matchedProgramme: bestProgramme,
      matchingSeats: maxSeats,
      rankScore: score,
      scoreComponents: components,
      whyThisInstitution
    };
  });

  // Filter out institutions with no match, sort descending by rankScore
  return scoredInstitutions
    .filter((inst) => inst.matchStrength !== 'NONE')
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, topN);
}
