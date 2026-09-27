/**
 * Unit Test Suite for PMIS Opportunity Radar Core Services
 * Tests risk calculation, catchment filtering, ranking scoring, and waterfall recommendations.
 */

import { calculateOpportunityRisk, RISK_LEVELS } from './src/services/radar/riskService.js';
import {
  calculateHaversineDistanceKm,
  estimateTravelMinutesFromDistance,
  filterInstitutionsByCatchment
} from './src/services/radar/catchmentService.js';
import { scoreInstitution, rankInstitutionsForOpportunity } from './src/services/radar/rankingService.js';
import { determineRecommendedAction, ACTION_TYPES } from './src/services/radar/recommendationService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('--- Testing PMIS Opportunity Radar Core Services ---');

// ==========================================
// 1. RISK SERVICE TESTS
// ==========================================
console.log('\n1. Testing Risk Engine:');

const asOf = new Date('2026-09-28T10:00:00Z');

// Test Case 1: Scenario A (12 openings, 4 apps, closes in 6 days) -> HIGH RISK
const scenarioA = calculateOpportunityRisk(
  {
    openings: 12,
    applications: 4,
    windowCloseDate: new Date('2026-10-04T10:00:00Z')
  },
  {},
  asOf
);
assert(scenarioA.riskLevel === RISK_LEVELS.HIGH, 'Scenario A is HIGH risk');
assert(scenarioA.targetApplications === 36, 'Target applications = 12 * 3 = 36');
assert(scenarioA.coverage === 0.111, 'Coverage is ~0.111');
assert(scenarioA.daysLeft === 6, 'Days left = 6');

// Test Case 2: Zero applications -> HIGH RISK regardless of days
const zeroApps = calculateOpportunityRisk(
  {
    openings: 5,
    applications: 0,
    windowCloseDate: new Date('2026-10-28T10:00:00Z') // 30 days left
  },
  {},
  asOf
);
assert(zeroApps.riskLevel === RISK_LEVELS.HIGH, 'Zero applications is always HIGH risk');

// Test Case 3: Expired job -> CLOSED
const expiredJob = calculateOpportunityRisk(
  {
    openings: 10,
    applications: 5,
    windowCloseDate: new Date('2026-09-20T10:00:00Z')
  },
  {},
  asOf
);
assert(expiredJob.riskLevel === RISK_LEVELS.CLOSED, 'Past closing date evaluates to CLOSED');

// Test Case 4: Medium risk (coverage 0.6, 20 days left)
const mediumJob = calculateOpportunityRisk(
  {
    openings: 10,
    applications: 18,
    windowCloseDate: new Date('2026-10-18T10:00:00Z') // 20 days
  },
  {},
  asOf
);
assert(mediumJob.riskLevel === RISK_LEVELS.MEDIUM, 'Coverage < 1.0 with days > 14 is MEDIUM risk');

// Test Case 5: Low risk (coverage >= 1.0)
const healthyJob = calculateOpportunityRisk(
  {
    openings: 10,
    applications: 35,
    windowCloseDate: new Date('2026-10-15T10:00:00Z')
  },
  {},
  asOf
);
assert(healthyJob.riskLevel === RISK_LEVELS.LOW, 'Coverage >= 1.0 is LOW risk');

// Test Case 6: Edge case - 0 openings does not throw NaN
const zeroOpenings = calculateOpportunityRisk(
  {
    openings: 0,
    applications: 0,
    windowCloseDate: new Date('2026-10-05T10:00:00Z')
  },
  {},
  asOf
);
assert(!isNaN(zeroOpenings.coverage), 'Zero openings coverage is not NaN');
assert(typeof zeroOpenings.riskLevel === 'string', 'Zero openings returns valid riskLevel');

// ==========================================
// 2. CATCHMENT SERVICE TESTS
// ==========================================
console.log('\n2. Testing Catchment Service:');

const dist = calculateHaversineDistanceKm(26.7588, 83.3697, 26.5020, 83.7780); // Gorakhpur to Deoria
assert(dist > 45 && dist < 60, `Gorakhpur to Deoria distance ~50km (actual: ${dist} km)`);

const travelMins = estimateTravelMinutesFromDistance(dist);
assert(travelMins >= 60, `Gorakhpur to Deoria travel time estimate realistic (actual: ${travelMins} mins)`);

const dummyInstitutions = [
  { id: '1', name: 'Nearby ITI', travelMinutes: 20 },
  { id: '2', name: 'Mid ITI', travelMinutes: 40 },
  { id: '3', name: 'Far ITI', travelMinutes: 58 },
  { id: '4', name: 'Beyond ITI', travelMinutes: 75 }
];

const within30 = filterInstitutionsByCatchment(dummyInstitutions, 30);
assert(within30.length === 1 && within30[0].id === '1', 'Catchment 30 min retains only institutions <= 30 min');

const within45 = filterInstitutionsByCatchment(dummyInstitutions, 45);
assert(within45.length === 2, 'Catchment 45 min retains <= 45 min');

const within60 = filterInstitutionsByCatchment(dummyInstitutions, 60);
assert(within60.length === 3, 'Catchment 60 min retains <= 60 min');

// ==========================================
// 3. RANKING SERVICE TESTS
// ==========================================
console.log('\n3. Testing Ranking Service:');

const exactClose = scoreInstitution({
  matchStrength: 'EXACT',
  matchProgrammeName: 'Electrician',
  travelMinutes: 15,
  catchmentMinutes: 60,
  programmeSeats: 120
});
assert(exactClose.score > 75, `Exact match close by scores high (actual: ${exactClose.score}/100)`);
assert(exactClose.whyThisInstitution.includes('Exact match (Electrician)'), 'Generates human-readable rationale');

const relatedFar = scoreInstitution({
  matchStrength: 'RELATED',
  matchProgrammeName: 'Wireman',
  travelMinutes: 55,
  catchmentMinutes: 60,
  programmeSeats: 50
});
assert(relatedFar.score < exactClose.score, `Related & distant institution scores lower (${relatedFar.score} < ${exactClose.score})`);

// ==========================================
// 4. RECOMMENDATION WATERFALL TESTS
// ==========================================
console.log('\n4. Testing Waterfall Recommendation Engine:');

// Waterfall Rule 1: No matching institutions -> WIDEN_OUTREACH
const recNoInst = determineRecommendedAction({
  posting: { openings: 12 },
  rankedInstitutions: []
});
assert(recNoInst.actionKey === ACTION_TYPES.WIDEN_OUTREACH, '0 institutions triggers Widen Outreach');

// Waterfall Rule 2: Low registration flag district -> ASSISTED_REGISTRATION
const recLowReg = determineRecommendedAction({
  posting: { openings: 12 },
  rankedInstitutions: [{ id: '1', name: 'ITI A', matchStrength: 'EXACT', matchingSeats: 150 }],
  district: { lowRegistrationFlag: true }
});
assert(recLowReg.actionKey === ACTION_TYPES.ASSISTED_REGISTRATION, 'Low registration district triggers Assisted Registration');

// Waterfall Rule 3: Scenario A -> CAMPUS_CAMP (openings >= 10, exact match, seats >= 100)
const recCamp = determineRecommendedAction({
  posting: { openings: 12 },
  rankedInstitutions: [{ id: '1', name: 'Govt ITI Gorakhpur', matchStrength: 'EXACT', matchingSeats: 120 }],
  district: { lowRegistrationFlag: false }
});
assert(recCamp.actionKey === ACTION_TYPES.CAMPUS_CAMP, 'Scenario A triggers Campus Camp');
assert(recCamp.primaryTargetInstitution.name === 'Govt ITI Gorakhpur', 'Target institution assigned correctly');

// Waterfall Rule 4: Scenario B -> SHARE_BULLETIN (openings = 10, seats = 80 (< 100))
const recBulletin = determineRecommendedAction({
  posting: { openings: 10 },
  rankedInstitutions: [
    { id: '1', name: 'ITI A', matchStrength: 'EXACT', matchingSeats: 80 },
    { id: '2', name: 'ITI B', matchStrength: 'RELATED', matchingSeats: 60 }
  ],
  district: { lowRegistrationFlag: false }
});
assert(recBulletin.actionKey === ACTION_TYPES.SHARE_BULLETIN, 'Scenario B triggers Share Bulletin');

// ==========================================
// SUMMARY
// ==========================================
console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL RADAR SERVICE UNIT TESTS PASSED!');
  process.exit(0);
}
