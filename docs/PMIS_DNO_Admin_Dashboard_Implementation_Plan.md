# PMIS DNO Admin Dashboard — Implementation Plan

## 1. Objective & Product Alignment

Build the **District Opportunity Radar** for District Nodal Officers (DNOs) and State PMU teams as specified in `PMIS_DNO_Admin_Dashboard_Data_Flow.md`, extending the existing ITI Portal codebase (`E:\Projects\iti-portal`).

The core operational pipeline:

```text
PMIS Job Master / Feed
       |
       v
Open Internship Jobs
       |
       v
Risk Engine (Precedence & Boundary Checked)
       |
       +---------------------------------+
       |                                 |
       v                                 v
Catchment Engine (30/45/60 min)   Qualification Mapping (Exact / Related / Generic)
       |                                 |
       +----------------+----------------+
                        |
                        v
           Ranked Institutions (Top 5, Normalized Weights)
                        |
                        v
           Recommended Action (Strict Precedence Waterfall)
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
       Bulletin     Camp Plan   Weekly Action Sheet
          |             |             |
          +-------------+-------------+
                        |
                        v
                 Field Mobilisation
                        |
                        v
             Candidates Apply on PMIS
                        |
                        v
                 Outcomes Tracker (Targeted vs Untargeted)
```

### Critical Non-Goals
1. The Radar operates **alongside** the official PMIS portal (`pminternship.mca.gov.in`).
2. It is **not** a candidate registration portal. DNOs must not register candidates or apply for jobs.
3. It does **not** directly mutate official PMIS candidate application records.
4. It is strictly an **analysis, decision-support, mobilisation, and monitoring tool**.

---

## 2. Current Baseline & Delta Analysis

### 2.1 Existing Foundations in `E:\Projects\iti-portal`
- **Backend**: Node.js (ES Modules), Express.js, Prisma ORM 6.4, PostgreSQL with PostGIS (`geography(Point, 4326)`) and pgvector extensions.
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, Radix UI primitives.
- **Auth**: JWT-based auth in `auth.js` supporting roles `ADMIN`, `OFFICER`, `WORKER`.
- **Existing Models**: `User`, `OfficerProfile`, `WorkerProfile`, `ITI`, `WorkRequirement`, `Shortlist`, `Placement`.

### 2.2 New Radar Domains to Introduce
1. **State & District Hierarchy**: Normalized master data for all 75 Uttar Pradesh districts with configuration flags (`low_registration_flag`, `boundary`, `local_language`).
2. **Institution Model Evolution**: Evolving the existing `ITI` model to support **Colleges**, **Polytechnics**, and **ITIs** with normalized programme capacities (`InstitutionProgramme`).
3. **Qualification Master & Mapping**: Standardized qualification codes (`ITI_ELECTRICIAN`, `DIPLOMA_MECHANICAL`, `GRADUATE_ANY`) and many-to-many match mappings to institution programmes.
4. **PMIS Internship Postings & Snapshots**: Dedicated opportunity tracking with historical application snapshots, independent of local `WorkRequirement` records.
5. **Calculated Risk Snapshots**: Deterministic, reproducible fill-risk records with input preservation.
6. **Travel Times & Catchment**: Pre-computed road travel times with PostGIS geodesic distance fallback.
7. **Mobilisation Artifacts**: Bulletin generation (WhatsApp 1:1 image + printable PDF), Camp planning with brief generation, and Weekly Action Plans with note tracking.
8. **Outcomes Tracking**: Comparative observation engine (targeted vs untargeted) with explicit illustrative labeling.

---

## 3. Architecture & Guiding Decisions

1. **Strict Separation of Domains**: PMIS opportunities and mobilisation actions exist in dedicated tables. Existing worker recruitment and placement flows remain fully untouched.
2. **Backend-Driven Business Logic**: The frontend is purely a presentation layer. Risk classification, catchment filtering, qualification matching, institution ranking, and action recommendations are calculated by pure, unit-tested backend services.
3. **Dual Source Ingestion Pipeline**: Ingestion treats demo seeds, CSV uploads, and future PMIS live feeds identically through a unified validation and upsert boundary.
4. **District-Scoped Access Control**: Officer access is strictly enforced in database queries based on JWT claims (`assignedDistrictCodes`), rejecting any unauthorized district parameters.
5. **Multi-District & State PMU Support**: Admins and State PMU users can view across all districts or switch districts via a header selector; DNOs are restricted to assigned district(s).
6. **Provenance & Transparency**: Every calculation stores its inputs, timestamp, and rule version. Approximate travel times and illustrative outcome metrics are prominently labelled in API payloads and UI.

---

## 4. Database Schema Design (Prisma)

### 4.1 Schema Additions & Modifications

```prisma
// ==========================================
// 1. GEOGRAPHY & DISTRICT CONFIGURATION
// ==========================================

model State {
  code      String     @id // e.g. "UP"
  name      String     // e.g. "Uttar Pradesh"
  districts District[]
  status    String     @default("ACTIVE")
  createdAt DateTime   @default(now())
}

model District {
  code                String                @id // e.g. "GORAKHPUR"
  name                String                // e.g. "Gorakhpur"
  stateCode           String
  state               State                 @relation(fields: [stateCode], references: [code])
  localLanguage       String                @default("Hindi")
  lowRegistrationFlag Boolean               @default(false)
  boundary            Json?                 // GeoJSON polygon boundary
  status              String                @default("ACTIVE")
  institutions        ITI[]
  postings            InternshipPosting[]
  officerDistricts    OfficerDistrict[]
  configurations      DistrictConfiguration?
  actionPlans         ActionPlanItem[]
  createdAt           DateTime              @default(now())
}

model DistrictConfiguration {
  id                   String   @id @default(uuid())
  districtCode         String   @unique
  district             District @relation(fields: [districtCode], references: [code])
  targetMultiplier     Float    @default(3.0)
  highRiskDaysLimit    Int      @default(14)
  highRiskCoverageCap  Float    @default(0.5)
  defaultCatchmentMin  Int      @default(60)
  timezone             String   @default("Asia/Kolkata")
  updatedAt            DateTime @updatedAt
}

model OfficerDistrict {
  id               String         @id @default(uuid())
  officerProfileId String
  officerProfile   OfficerProfile @relation(fields: [officerProfileId], references: [id], onDelete: Cascade)
  districtCode     String
  district         District       @relation(fields: [districtCode], references: [code])

  @@unique([officerProfileId, districtCode])
}

// ==========================================
// 2. INSTITUTION EVOLUTION (Colleges, Polytechnics, ITIs)
// ==========================================

enum InstitutionType {
  ITI
  POLYTECHNIC
  COLLEGE
}

enum LocationConfidence {
  VERIFIED
  APPROXIMATE
  UNVERIFIED
}

// Existing ITI model extended to serve as unified Institution master
// Maintaining full backward-compatibility with WorkerProfile.itiId
enum MatchStrength {
  EXACT    // Weight: 3 (normalized 1.0)
  RELATED  // Weight: 2 (normalized 0.67)
  GENERIC  // Weight: 1 (normalized 0.33)
}

// Updated ITI model:
// model ITI {
//   ... existing fields ...
//   districtCode     String?
//   districtRel      District?              @relation(fields: [districtCode], references: [code])
//   type             InstitutionType        @default(ITI)
//   locationConfidence LocationConfidence   @default(APPROXIMATE)
//   contactName      String?
//   contactRole      String?
//   contactPhone     String?
//   latitude         Float?
//   longitude        Float?
//   programmes       InstitutionProgramme[]
//   travelTimes      TravelTime[]
//   camps            CampPlan[]
// }

model InstitutionProgramme {
  id            String             @id @default(uuid())
  institutionId String
  institution   ITI                @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  programmeCode String             // e.g. "ITI_ELECTRICIAN", "DIPLOMA_CIVIL"
  programmeName String             // e.g. "Electrician", "Civil Engineering"
  seats         Int                @default(0)
  status        String             @default("ACTIVE")
  mappings      QualificationProgrammeMapping[]
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  @@unique([institutionId, programmeCode])
}

// ==========================================
// 3. QUALIFICATION MASTER & MAPPING
// ==========================================

model Qualification {
  code        String                          @id // e.g. "ITI_ELECTRICIAN"
  label       String                          // e.g. "ITI - Electrician"
  category    String                          // e.g. "VOCATIONAL", "DIPLOMA", "GRADUATE"
  status      String                          @default("ACTIVE")
  mappings    QualificationProgrammeMapping[]
  postings    InternshipPosting[]
}

model QualificationProgrammeMapping {
  id                String               @id @default(uuid())
  qualificationCode String
  qualification     Qualification        @relation(fields: [qualificationCode], references: [code], onDelete: Cascade)
  programmeId       String
  programme         InstitutionProgramme @relation(fields: [programmeId], references: [id], onDelete: Cascade)
  matchStrength     MatchStrength        @default(EXACT)
  status            String               @default("ACTIVE")

  @@unique([qualificationCode, programmeId])
}

// ==========================================
// 4. INTERNSHIP POSTINGS & RISK ENGINE
// ==========================================

enum OpportunityRisk {
  HIGH
  MEDIUM
  LOW
  CLOSED
}

model InternshipPosting {
  id                  String                   @id @default(uuid())
  postingId           String                   @unique // e.g. "DEMO-0007" or PMIS external ID
  roleTitle           String
  companyName         String
  sector              String
  qualificationCode   String
  qualification       Qualification            @relation(fields: [qualificationCode], references: [code])
  openings            Int
  applications        Int                      @default(0)
  windowOpenDate      DateTime
  windowCloseDate     DateTime
  durationMonths      Int                      @default(6)
  monthlySupport      Float                    @default(0)
  address             String
  districtCode        String
  district            District                 @relation(fields: [districtCode], references: [code])
  stateCode           String                   @default("UP")
  location            Unsupported("geography(Point,4326)")?
  latitude            Float?
  longitude           Float?
  portalLink          String                   @default("https://pminternship.mca.gov.in/")
  status              String                   @default("OPEN") // "OPEN", "CLOSED", "FILLED"
  source              String                   @default("DEMO") // "DEMO", "MANUAL", "PMIS_FEED"
  sourceReference     String?
  applicationHistory  Json                     @default("[]") // Array of { date, count }
  snapshots           ApplicationSnapshot[]
  riskSnapshots       OpportunityRiskSnapshot[]
  travelTimes         TravelTime[]
  bulletins           Bulletin[]
  camps               CampPlan[]
  actionPlanItems     ActionPlanItem[]
  outcomeObservations OutcomeObservation[]
  createdAt           DateTime                 @default(now())
  updatedAt           DateTime                 @updatedAt

  @@index([districtCode, status])
  @@index([windowCloseDate])
}

model ApplicationSnapshot {
  id          String            @id @default(uuid())
  postingId   String
  posting     InternshipPosting @relation(fields: [postingId], references: [id], onDelete: Cascade)
  count       Int
  observedAt  DateTime          @default(now())
  source      String            @default("SYSTEM")
}

model OpportunityRiskSnapshot {
  id                 String            @id @default(uuid())
  postingId          String
  posting            InternshipPosting @relation(fields: [postingId], references: [id], onDelete: Cascade)
  riskLevel          OpportunityRisk
  reason             String
  targetApplications Int
  coverage           Float
  daysLeft           Int
  calculatedAt       DateTime          @default(now())

  @@index([postingId, calculatedAt])
}

model TravelTime {
  id                 String            @id @default(uuid())
  postingId          String
  posting            InternshipPosting @relation(fields: [postingId], references: [id], onDelete: Cascade)
  institutionId      String
  institution        ITI               @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  roadTravelMinutes  Int
  isApproximate      Boolean           @default(false)
  source             String            @default("PRECOMPUTED") // "PRECOMPUTED", "POSTGIS_ESTIMATE"
  updatedAt          DateTime          @updatedAt

  @@unique([postingId, institutionId])
}

// ==========================================
// 5. MOBILISATION & OUTCOME MONITORING
// ==========================================

model Bulletin {
  id               String            @id @default(uuid())
  postingId        String
  posting          InternshipPosting @relation(fields: [postingId], references: [id], onDelete: Cascade)
  language         String            @default("Hindi") // "Hindi", "English"
  headline         String
  bodyText         String
  qrCodeUrl        String?
  aspectRatio      String            @default("1:1") // "1:1" for WhatsApp, "A4" for Print
  generatedBrief   Json?
  createdBy        String?
  createdAt        DateTime          @default(now())
}

model CampPlan {
  id               String            @id @default(uuid())
  postingId        String
  posting          InternshipPosting @relation(fields: [postingId], references: [id], onDelete: Cascade)
  institutionId    String
  institution      ITI               @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  campName         String
  proposedDate     DateTime
  proposedTime     String            // e.g. "11:00 AM"
  coordinatorName  String
  coordinatorPhone String
  address          String
  notes            String?
  generatedBrief   Json?
  status           String            @default("PLANNED") // "PLANNED", "COMPLETED", "CANCELLED"
  createdBy        String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
}

model ActionPlanItem {
  id                String            @id @default(uuid())
  districtCode      String
  district          District          @relation(fields: [districtCode], references: [code])
  weekIdentifier    String            // e.g. "2026-W40"
  postingId         String
  posting           InternshipPosting @relation(fields: [postingId], references: [id], onDelete: Cascade)
  recommendedAction String            // "CAMP", "BULLETIN", "ASSISTED_REGISTRATION", "WIDEN_OUTREACH"
  targetInstitutions Json             // Array of { id, name, contact }
  isDone            Boolean           @default(false)
  completedAt       DateTime?
  completedBy       String?
  notes             ActionPlanNote[]
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@unique([districtCode, weekIdentifier, postingId])
}

model ActionPlanNote {
  id          String         @id @default(uuid())
  itemId      String
  actionItem  ActionPlanItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  authorName  String
  noteText    String
  createdAt   DateTime       @default(now())
}

model OutcomeObservation {
  id                   String            @id @default(uuid())
  postingId            String
  posting              InternshipPosting @relation(fields: [postingId], references: [id], onDelete: Cascade)
  isTargeted           Boolean           @default(false)
  observationDate      DateTime          @default(now())
  applicationsTotal    Int               @default(0)
  catchmentApplications Int              @default(0)
  offerCount           Int               @default(0)
  acceptanceCount      Int               @default(0)
  joiningCount         Int               @default(0)
  isIllustrative       Boolean           @default(true)
  source               String            @default("DEMO")
}
```

---

## 5. Core Radar Business Logic & Algorithms

### 5.1 Risk Engine (`riskService.js`)

The risk engine is a pure, side-effect-free service with explicit evaluation order and boundary guards:

```javascript
export function calculateOpportunityRisk({
  openings,
  applications,
  windowCloseDate,
  today = new Date(),
  targetMultiplier = 3.0,
  highRiskDaysLimit = 14,
  highRiskCoverageCap = 0.5,
}) {
  const close = new Date(windowCloseDate);
  const now = new Date(today);
  
  // Calculate whole days left, normalized to start of day UTC
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.floor((close.getTime() - now.getTime()) / msPerDay);

  // 1. Precedence 1: Check Expiry First
  if (daysLeft < 0) {
    return {
      riskLevel: 'CLOSED',
      reason: `Application window closed ${Math.abs(daysLeft)} day(s) ago`,
      targetApplications: openings * targetMultiplier,
      coverage: openings > 0 ? applications / (openings * targetMultiplier) : 0,
      daysLeft,
    };
  }

  // 2. Division-by-Zero Guard
  const safeOpenings = Math.max(0, openings || 0);
  const safeApplications = Math.max(0, applications || 0);
  const targetApplications = safeOpenings * targetMultiplier;
  const coverage = targetApplications > 0 ? (safeApplications / targetApplications) : 0;

  // 3. Precedence 2: High Risk Rules
  // Rule A: Exactly 0 applications received
  // Rule B: Coverage < 50% target AND closes within 14 days
  if (safeApplications === 0) {
    return {
      riskLevel: 'HIGH',
      reason: `0 applications received for ${safeOpenings} opening(s), closes in ${daysLeft} day(s)`,
      targetApplications,
      coverage,
      daysLeft,
    };
  }

  if (coverage < highRiskCoverageCap && daysLeft <= highRiskDaysLimit) {
    return {
      riskLevel: 'HIGH',
      reason: `${safeApplications} application(s) for ${safeOpenings} opening(s) (${Math.round(coverage * 100)}% coverage), closes in ${daysLeft} day(s)`,
      targetApplications,
      coverage,
      daysLeft,
    };
  }

  // 4. Precedence 3: Medium Risk Rule
  if (coverage < 1.0) {
    return {
      riskLevel: 'MEDIUM',
      reason: `${safeApplications} application(s) for ${safeOpenings} opening(s) (under target 3x coverage), closes in ${daysLeft} day(s)`,
      targetApplications,
      coverage,
      daysLeft,
    };
  }

  // 5. Precedence 4: Low Risk Rule
  return {
    riskLevel: 'LOW',
    reason: `Healthy application pipeline: ${safeApplications} application(s) for ${safeOpenings} opening(s) (${Math.round(coverage * 100)}% coverage)`,
    targetApplications,
    coverage,
    daysLeft,
  };
}
```

### 5.2 KPI Calculations (`dashboardService.js`)

All dashboard KPIs are derived strictly from the active open postings:

```javascript
// 1. Open Opportunities: Active, non-closed postings
const openOpportunities = postings.filter(p => p.riskLevel !== 'CLOSED');

// 2. High Risk Count
const highRiskCount = openOpportunities.filter(p => p.riskLevel === 'HIGH').length;

// 3. Openings At Risk (Sum of OPENINGS for High + Medium risk postings)
const openingsAtRisk = openOpportunities
  .filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'MEDIUM')
  .reduce((sum, p) => sum + p.openings, 0);

// 4. Closing in Next 7 Days (Count of postings closing within 0 to 7 days)
const closingNext7Days = openOpportunities
  .filter(p => p.daysLeft >= 0 && p.daysLeft <= 7).length;
```

---

### 5.3 Catchment & Travel-Time Engine (`catchmentService.js`)

1. **Catchment Tiers**: Allowed selectors are strictly `30`, `45`, and `60` minutes (default: `60`).
2. **Lookup Strategy**:
   - Query pre-calculated table `TravelTime` for `(postingId, institutionId)`.
   - **PostGIS Geodesic Fallback**: If no pre-computed time exists, calculate distance using PostGIS:
     ```sql
     ST_Distance(posting.location, institution.location) / 1000.0 AS distance_km
     ```
   - Estimate road travel time:
     $$\text{minutes} = \text{Math.round}\left(\frac{\text{distance\_km}}{30 \text{ km/h}} \times 60 \times 1.25\right)$$
   - Flag as `isApproximate = true` and `source = 'POSTGIS_ESTIMATE'`.
3. **Filter**: Retain only institutions where `travelMinutes <= selectedCatchmentMinutes`.

---

### 5.4 Institution Ranking & Normalization (`rankingService.js`)

Every candidate institution within catchment is evaluated on a normalized $0.0 \dots 1.0$ scale before applying weights:

```javascript
// Weights from Specification:
// 40% Match + 30% Proximity + 20% Size + 10% Response
const WEIGHTS = {
  match: 0.40,
  proximity: 0.30,
  size: 0.20,
  response: 0.10,
};

export function scoreInstitution({
  matchStrength,      // 'EXACT' | 'RELATED' | 'GENERIC'
  travelMinutes,      // Integer
  catchmentMinutes,   // 30, 45, or 60
  seats,              // Programme capacity integer
  responseRate = 1.0, // Historical response rate or default 1.0
  programmeName,
}) {
  // 1. Normalized Match Score (0.0 to 1.0)
  const matchScore = matchStrength === 'EXACT' ? 1.0 :
                     matchStrength === 'RELATED' ? (2 / 3) : (1 / 3);

  // 2. Normalized Proximity Score (0.0 to 1.0)
  // Closer to 0 min = 1.0; at catchment boundary = 0.0
  const proximityScore = Math.max(0, 1 - (travelMinutes / catchmentMinutes));

  // 3. Normalized Size Score (0.0 to 1.0)
  // Benchmarked against standard capacity threshold of 150 seats
  const sizeScore = Math.min(1.0, Math.max(0, seats / 150));

  // 4. Normalized Response Score (0.0 to 1.0)
  const safeResponseScore = Math.min(1.0, Math.max(0, responseRate));

  // Composite Rank Score (0 to 100)
  const rankScore = Math.round(100 * (
    WEIGHTS.match * matchScore +
    WEIGHTS.proximity * proximityScore +
    WEIGHTS.size * sizeScore +
    WEIGHTS.response * safeResponseScore
  ));

  // Human-readable 'Why this institution?'
  const matchLabel = matchStrength === 'EXACT' ? 'Exact trade match' :
                     matchStrength === 'RELATED' ? 'Related trade' : 'General qualification match';
  const whyExplanation = `${matchLabel} (${programmeName}), ${travelMinutes} min away, ${seats} seats.`;

  return {
    rankScore,
    matchScore,
    proximityScore,
    sizeScore,
    responseScore: safeResponseScore,
    whyExplanation,
  };
}
```

Sort by `rankScore DESC`, return top 5 institutions.

---

### 5.5 Recommended Action Waterfall (`recommendationService.js`)

Actions follow a deterministic waterfall priority:

```javascript
export function determineRecommendedAction({
  openings,
  rankedInstitutions,
  districtLowRegistrationFlag = false,
}) {
  // Priority 1: No matching institutions within catchment
  if (!rankedInstitutions || rankedInstitutions.length === 0) {
    return {
      action: 'WIDEN_OUTREACH',
      label: 'Widen Outreach / Employer Follow-up',
      reason: 'No matching institutions found within the selected travel catchment.',
      primaryButtonText: 'Widen Catchment to 60m',
      route: 'catchment',
    };
  }

  const top = rankedInstitutions[0];

  // Priority 2: Large opportunity + exact match large institution nearby
  if (openings >= 10 && top.matchStrength === 'EXACT' && top.seats >= 100) {
    return {
      action: 'CAMP',
      label: 'Campus Camp',
      reason: `Significant vacancies (${openings} openings) and an exact-match institution (${top.name}) with ${top.seats} seats nearby.`,
      primaryButtonText: 'Plan Camp',
      targetInstitution: top,
      route: 'camps/new',
    };
  }

  // Priority 3: District-wide low registration intervention
  if (districtLowRegistrationFlag) {
    return {
      action: 'ASSISTED_REGISTRATION',
      label: 'Assisted Registration Session',
      reason: 'Assigned district is flagged with low PMIS candidate registration.',
      primaryButtonText: 'Schedule Registration Session',
      targetInstitution: top,
      route: 'camps/new?type=assisted',
    };
  }

  // Priority 4: Default Outreach via institutional bulletins
  return {
    action: 'BULLETIN',
    label: 'Share Bulletin',
    reason: `Standard institutional outreach across ${rankedInstitutions.length} catchment institution(s).`,
    primaryButtonText: 'Create Bulletin',
    targetInstitutions: rankedInstitutions.slice(0, 3),
    route: 'bulletins/new',
  };
}
```

---

### 5.6 Reverse Matching for Institution Detail View

When a DNO views `/institutions/:id`, the system answers: *"Which at-risk internships can I discuss with this institution?"*

- **Filter Criteria**:
  1. `posting.status == 'OPEN'` AND `daysLeft >= 0`.
  2. Qualification mapping: The posting's `qualificationCode` maps to one of the institution's active programmes with strength `EXACT` or `RELATED`.
  3. Distance: Posting is within the institution's 60-minute catchment or in the same district.
- **Output**: List of matching postings sorted by `riskLevel` (HIGH first), then fewest `daysLeft`.

---

## 6. API Route Specification (`/api/v1`)

All endpoints live under `/api/v1` and enforce district scoping:

### 6.1 Dashboard & Geography
- `GET /api/v1/radar/dashboard/summary?district=GORAKHPUR`
  - Returns: KPIs (`openOpportunities`, `highRisk`, `openingsAtRisk`, `closingNext7Days`), district metadata, priority action cards.
- `GET /api/v1/radar/dashboard/map?district=GORAKHPUR`
  - Returns: GeoJSON boundary, opportunity markers with risk badges, institution markers with trade tags.
- `GET /api/v1/radar/master/states`
- `GET /api/v1/radar/master/districts?state=UP`

### 6.2 Opportunities
- `GET /api/v1/radar/opportunities?district=GORAKHPUR&risk=&sector=&qualification=&closingWindow=`
  - Sorts default: `HIGH -> MEDIUM -> LOW`, subsorted by `daysLeft ASC`.
- `GET /api/v1/radar/opportunities/:id`
  - Returns: Job details, risk reason, application trend history.
- `GET /api/v1/radar/opportunities/:id/catchment?minutes=60`
  - Returns: Ranked institutions (top 5), match explanations, travel times, recommended action.

### 6.3 Institutions
- `GET /api/v1/radar/institutions?district=GORAKHPUR&type=ITI,POLYTECHNIC,COLLEGE&trade=`
- `GET /api/v1/radar/institutions/:id`
- `GET /api/v1/radar/institutions/:id/opportunities` (Reverse matching view)

### 6.4 Mobilisation & Action Plans
- `POST /api/v1/radar/bulletins` (Generates bulletin record and rendered image/PDF metadata)
- `GET /api/v1/radar/bulletins/:id`
- `POST /api/v1/radar/camps` (Saves camp plan and generates printable brief)
- `GET /api/v1/radar/camps/:id`
- `GET /api/v1/radar/action-plans?district=GORAKHPUR&week=2026-W40`
- `PATCH /api/v1/radar/action-plans/:id/toggle` (Toggle done state)
- `POST /api/v1/radar/action-plans/:id/notes` (Append action note)

### 6.5 Outcomes
- `GET /api/v1/radar/outcomes?district=GORAKHPUR`
  - Returns: Comparative metrics (Applications/Opening, Catchment Share, Offer Rate, Joining Rate) with `isIllustrative: true`.

---

## 7. Frontend Architecture & Screen Implementation

### 7.1 Layout & Navigation
Integrates with the existing Next.js App Router (`frontend/src/app`):

```text
frontend/src/app/dashboard/radar/
├── layout.jsx                      # Radar shell with DNO Sidebar & Top Header
├── page.jsx                        # 1. District Dashboard (KPIs, Map, Priority Cards)
├── opportunities/
│   ├── page.jsx                    # 2. Opportunities Table & Multi-filter
│   └── [id]/page.jsx               # 3. Opportunity Detail & Catchment Radar
├── institutions/
│   ├── page.jsx                    # 4. Institution Directory (ITI / Poly / College)
│   └── [id]/page.jsx               # 5. Institution Detail & Reverse Opportunities
├── mobilisation/
│   ├── bulletins/page.jsx          # 6. Bulletin Generator & WhatsApp Exporter
│   └── camps/page.jsx              # 7. Camp Planner & Brief Generator
├── action-plan/page.jsx            # 8. Weekly Action Plan (Checklist & Notes)
└── outcomes/page.jsx               # 9. Outcomes Tracker (Targeted vs Untargeted)
```

### 7.2 Sidebar & Top Bar Structure
- **Sidebar**:
  - `PMIS Opportunity Radar` (Header with State badge)
  - 🏠 Dashboard
  - 📍 Opportunities
  - 🏫 Institutions
  - 📢 Mobilisation (Bulletins, Camp Plans)
  - 📄 Weekly Action Plan
  - 📊 Outcomes
  - Profile & Assigned District
- **Top Header**:
  - District Switcher (for Admins / Multi-district officers)
  - Current Week indicator (e.g. `Week: 28 Sep – 04 Oct 2026`)
  - Last synced timestamp

### 7.3 Accessibility & Design Tokens
- **Color + Non-Color Risk Indicators**: Red circle + label `HIGH`, yellow triangle + label `MEDIUM`, green square + label `LOW`. Never rely on color alone.
- **Client-Side Exporters**:
  - WhatsApp Square image: Render 1080x1080 Canvas using HTML5 Canvas or SVG template with embedded PMIS QR code and no-fee disclaimer.
  - Printable A4 Briefs: Clean `@media print` CSS layout for camp briefs and weekly action sheets.

---

## 8. Seed Data & Development Slice

### 8.1 Geographic Scope
- All 75 districts of Uttar Pradesh seeded in `District` and `State` tables.
- Primary development focus: **Gorakhpur** + adjacent catchment districts (**Deoria**, **Maharajganj**, **Sant Kabir Nagar**, **Kushinagar**).

### 8.2 Baseline Master Datasets
1. **Qualifications**: 14 standard codes (`ITI_ELECTRICIAN`, `ITI_FITTER`, `ITI_COPA`, `ITI_MMV`, `ITI_WELDER`, `DIPLOMA_MECHANICAL`, `DIPLOMA_ELECTRICAL`, `DIPLOMA_CIVIL`, `GRADUATE_BCOM`, `GRADUATE_BSC`, `GRADUATE_BA`, `GRADUATE_ANY`, `10TH_PASS`, `12TH_PASS`).
2. **Institutions**: 40+ verified institutions in Gorakhpur and surrounding catchment:
   - Mix: 60% ITIs, 25% Polytechnics, 15% Degree Colleges.
   - Real, verified coordinates and official contact designations (dummy phone numbers for demo).
3. **Internship Postings**: 50 demo postings with fictional company names:
   - ~30% High Risk, ~30% Medium Risk, ~40% Low Risk.
   - **3 Dedicated Demo Scenarios**:
     - *Scenario A*: Electrical Maintenance Intern (12 openings, 4 apps, closes in 6 days) -> Campus Camp recommendation.
     - *Scenario B*: CNC Operator Intern (10 openings, 2 apps, closes in 9 days) -> Share Bulletin recommendation.
     - *Scenario C*: High-risk opportunity with 0 institutions within 30 min -> Widen Outreach recommendation.

---

## 9. Phased Execution Roadmap

### Phase 1: Database Migration & Seed Foundation (Days 1–2)
1. Apply Prisma migration with `State`, `District`, `DistrictConfiguration`, `OfficerDistrict`, `InstitutionProgramme`, `Qualification`, `QualificationProgrammeMapping`, `InternshipPosting`, `TravelTime`, `Bulletin`, `CampPlan`, `ActionPlanItem`, `OutcomeObservation`.
2. Seed UP 75 districts and Gorakhpur demo institutions and opportunities.
3. Verify existing worker recruitment regression tests pass.

### Phase 2: Core Radar Backend Services & APIs (Days 3–4)
1. Build and unit-test `riskService.js` (boundary cases, zero openings, negative days, coverage).
2. Build `catchmentService.js` with PostGIS fallback.
3. Build `rankingService.js` with normalized score weights.
4. Build `recommendationService.js` with strict priority waterfall.
5. Expose `/api/v1/radar/dashboard/summary`, `/map`, `/opportunities`, `/institutions`.

### Phase 3: DNO Radar Frontend - Core Workflow (Days 5–6)
1. Implement Radar layout and sidebar navigation.
2. Build Dashboard screen (KPI cards, priority list, district map).
3. Build Opportunities list with risk sorting and filters.
4. Build Opportunity Detail screen with interactive 30/45/60 min catchment slider and ranked institutions.

### Phase 4: Mobilisation Outputs & Action Tracking (Days 7–8)
1. Build Bulletin generator with 1:1 WhatsApp square image download and QR code.
2. Build Camp Planner with prefilled details and printable camp brief.
3. Build Weekly Action Plan with [Done] toggle, completion timestamps, and note logging.
4. Build Institution Detail screen with reverse-matched opportunity radar.

### Phase 5: Monitoring, Outcomes & Verification (Days 9–10)
1. Build Outcomes comparison page with clear illustrative disclaimers.
2. Execute end-to-end integration tests:
   - District isolation: DNO Rahul cannot read or act on Varanasi data.
   - Calculation reproducibility: recalculating risk preserves history.
   - Mobile and print layout responsiveness.

---

## 10. Verification & Acceptance Criteria (Definition of Done)

The Radar is ready for production staging when:
- [ ] **Role Isolation**: A logged-in DNO can only view and act on assigned district records. Querying another district returns `403 Forbidden`.
- [ ] **KPI Mathematical Accuracy**: `Openings At Risk` equals the exact sum of openings for High and Medium risk opportunities.
- [ ] **Risk Engine Determinism**: Expired jobs are marked `CLOSED`. Zero openings do not trigger `NaN`. High risk accurately identifies 0 applications and coverage < 50% under 14 days.
- [ ] **Catchment Responsiveness**: Toggling 30 min $\to$ 45 min $\to$ 60 min instantly recalculates eligible institutions, normalized ranking, and recommended action.
- [ ] **Normalization Integrity**: Ranking scores strictly fall between 0 and 100 with no single variable skewing the distribution.
- [ ] **Mobilisation Deliverables**:
  - Bulletin exports valid 1:1 WhatsApp graphic with official PMIS QR code and no-fee notice.
  - Camp Brief prints cleanly on standard A4 paper.
  - Action items preserve notes and completion actor.
- [ ] **Data Labelling**: All demo records, approximate travel times, and illustrative outcome metrics are explicitly labelled in UI and API payloads.
- [ ] **Zero Regression**: Existing worker, officer hiring, and ITI recommendation workflows remain 100% operational.
