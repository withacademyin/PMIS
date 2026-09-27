/**
 * Integration Test for PMIS Opportunity Radar Backend APIs
 * Starts server in-process, logs in as DNO, tests all endpoints & RBAC isolation.
 */

import http from 'http';
import app from './src/server.js';

let server;
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

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

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const json = await res.json();
  return { status: res.status, data: json };
}

async function run() {
  console.log('--- Starting PMIS Opportunity Radar API Integration Tests ---');

  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  try {
    // 1. Authenticate as DNO Gorakhpur
    console.log('\n1. Testing Authentication:');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'dno.gorakhpur@pmis.gov.in',
        password: 'Officer@123'
      })
    });

    assert(loginRes.status === 200, 'DNO Gorakhpur logged in successfully');
    const token = loginRes.data.data?.token || loginRes.data.token;
    assert(!!token, 'Auth token received');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Available Districts
    console.log('\n2. Testing Districts Endpoint:');
    const distRes = await request('/radar/districts', { headers: authHeaders });
    assert(distRes.status === 200, 'Districts retrieved');
    assert(distRes.data.data.some((d) => d.code === 'GORAKHPUR'), 'Assigned district GORAKHPUR in list');

    // 3. District Role Isolation (Accessing unauthorized district returns 403)
    console.log('\n3. Testing Role & District Isolation:');
    const forbiddenRes = await request('/radar/dashboard/summary?districtCode=VARANASI', {
      headers: authHeaders
    });
    assert(forbiddenRes.status === 403, 'Querying unauthorized district VARANASI returns 403 Forbidden');

    // 4. Dashboard Summary for Gorakhpur
    console.log('\n4. Testing Dashboard Summary:');
    const summaryRes = await request('/radar/dashboard/summary?districtCode=GORAKHPUR', {
      headers: authHeaders
    });
    assert(summaryRes.status === 200, 'Dashboard summary retrieved for GORAKHPUR');
    const { kpis, priorityActions } = summaryRes.data.data;
    assert(kpis.openOpportunities > 0, `Open opportunities: ${kpis.openOpportunities}`);
    assert(kpis.highRisk > 0, `High risk opportunities: ${kpis.highRisk}`);
    assert(kpis.openingsAtRisk > 0, `Openings at risk: ${kpis.openingsAtRisk}`);
    assert(priorityActions.length > 0, `Priority actions generated: ${priorityActions.length}`);
    assert(!!priorityActions[0].recommendation?.actionKey, `Top priority has recommended action: ${priorityActions[0].recommendation?.actionLabel}`);

    // 5. Radar Map Geo Data
    console.log('\n5. Testing Radar Map Geo Points:');
    const mapRes = await request('/radar/map?districtCode=GORAKHPUR', { headers: authHeaders });
    assert(mapRes.status === 200, 'Map data retrieved');
    assert(mapRes.data.data.opportunities.length > 0, `Mapped opportunities: ${mapRes.data.data.opportunities.length}`);
    assert(mapRes.data.data.institutions.length > 0, `Mapped institutions: ${mapRes.data.data.institutions.length}`);

    // 6. Opportunities Listing & Risk Sorting
    console.log('\n6. Testing Opportunities Table & Filters:');
    const oppsRes = await request('/radar/opportunities?districtCode=GORAKHPUR&sort=risk_desc', {
      headers: authHeaders
    });
    assert(oppsRes.status === 200, 'Opportunities retrieved');
    assert(oppsRes.data.data.length > 0, `Total opportunities: ${oppsRes.data.data.length}`);
    assert(oppsRes.data.data[0].risk.riskLevel === 'HIGH', 'First opportunity is HIGH risk under risk_desc sorting');

    // 7. Opportunity Detail & Catchment Slider
    console.log('\n7. Testing Opportunity Detail & Catchment Slider:');
    const oppId = oppsRes.data.data[0].id;
    const detail60Res = await request(`/radar/opportunities/${oppId}?catchmentMinutes=60`, {
      headers: authHeaders
    });
    assert(detail60Res.status === 200, 'Opportunity detail (60 min) retrieved');
    assert(detail60Res.data.data.rankedInstitutions.length > 0, `Ranked institutions (60 min): ${detail60Res.data.data.rankedInstitutions.length}`);
    assert(!!detail60Res.data.data.recommendedAction?.actionKey, `Recommended action computed: ${detail60Res.data.data.recommendedAction?.actionLabel}`);

    const detail30Res = await request(`/radar/opportunities/${oppId}?catchmentMinutes=30`, {
      headers: authHeaders
    });
    assert(detail30Res.status === 200, 'Opportunity detail (30 min) retrieved');
    assert(
      detail30Res.data.data.eligibleCount <= detail60Res.data.data.eligibleCount,
      'Catchment 30 min has <= institutions than 60 min'
    );

    // 8. Institutions Directory & Reverse Opportunities
    console.log('\n8. Testing Institutions Directory:');
    const instsRes = await request('/radar/institutions?districtCode=GORAKHPUR', { headers: authHeaders });
    assert(instsRes.status === 200, 'Institutions directory retrieved');
    assert(instsRes.data.data.length > 0, `Gorakhpur institutions: ${instsRes.data.data.length}`);

    const instId = instsRes.data.data[0].id;
    const instDetailRes = await request(`/radar/institutions/${instId}`, { headers: authHeaders });
    assert(instDetailRes.status === 200, 'Institution detail retrieved');
    assert(Array.isArray(instDetailRes.data.data.reverseMatchingOpportunities), 'Reverse matching opportunities present');

    // 9. Mobilisation: Bulletin Generator
    console.log('\n9. Testing Bulletin Generator:');
    const bulletinRes = await request('/radar/bulletins/generate', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ postingId: oppId, language: 'Hindi' })
    });
    assert(bulletinRes.status === 200, 'Bulletin generated');
    assert(bulletinRes.data.data.bodyText.includes('pminternship.mca.gov.in'), 'Bulletin contains official PMIS portal URL');

    // 10. Mobilisation: Camp Planner
    console.log('\n10. Testing Camp Planner:');
    const campRes = await request('/radar/camps/plan', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        postingId: oppId,
        institutionId: instId,
        campName: 'Test Mobilisation Camp',
        proposedDate: '2026-10-02T11:00:00Z',
        proposedTime: '11:00 AM',
        coordinatorName: 'Rahul Sharma',
        coordinatorPhone: '9876543210',
        notes: 'Integration test generated camp'
      })
    });
    assert(campRes.status === 200, 'Camp planned successfully');
    assert(campRes.data.data.status === 'PLANNED', 'Camp status is PLANNED');

    // 11. Weekly Action Plan & Notes
    console.log('\n11. Testing Weekly Action Plan:');
    const actionPlanRes = await request('/radar/action-plan?districtCode=GORAKHPUR&weekIdentifier=2026-W40', {
      headers: authHeaders
    });
    assert(actionPlanRes.status === 200, 'Action plan items retrieved');
    assert(actionPlanRes.data.data.items.length > 0, `Action items: ${actionPlanRes.data.data.items.length}`);

    const actionItemId = actionPlanRes.data.data.items[0].id;
    const toggleRes = await request(`/radar/action-plan/${actionItemId}/toggle`, {
      method: 'PATCH',
      headers: authHeaders
    });
    assert(toggleRes.status === 200, 'Action item toggled');

    const noteRes = await request(`/radar/action-plan/${actionItemId}/notes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ noteText: 'Integration test field progress note.' })
    });
    assert(noteRes.status === 200, 'Action item note added');

    // 12. Outcomes Monitoring
    console.log('\n12. Testing Outcomes Monitoring:');
    const outcomesRes = await request('/radar/outcomes?districtCode=GORAKHPUR', { headers: authHeaders });
    assert(outcomesRes.status === 200, 'Outcomes data retrieved');
    assert(outcomesRes.data.data.isIllustrative === true, 'Outcomes explicitly labelled as isIllustrative');
    assert(outcomesRes.data.data.metrics.length === 4, 'All 4 comparative metrics present');

    console.log(`\nFinal Test Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL RADAR API INTEGRATION TESTS PASSED!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
}

run();
