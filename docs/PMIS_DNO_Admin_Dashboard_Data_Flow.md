# PMIS District Opportunity Radar
## Nodal Officer Admin Dashboard — Data Flow & Implementation Specification

**Document Type:** Product + Data Flow Specification  
**Audience:** Backend Developer, Frontend Developer  
**Purpose:** Define what a District Nodal Officer (DNO) can see and do, how the dashboard flows, what data is required, and what must be seeded in the backend.

---

# 1. Product Overview

The **District Opportunity Radar** is a decision-support portal for District Nodal Officers (DNOs) and State PMU teams.

Its main purpose is simple:

> **Find internship opportunities that are at risk of going unfilled, identify nearby institutions that can provide suitable candidates, recommend the right mobilisation action, and measure the result.**

The Radar works **beside the PM Internship Scheme (PMIS) portal**. It does not replace PMIS candidate functionality and should not directly modify PMIS data.

### Core flow

```text
PMIS / Job Data
      |
      v
Open Internship Jobs
      |
      v
Risk Calculation
      |
      +--------------------+
      |                    |
      v                    v
Catchment Calculation   Qualification Matching
      |                    |
      +----------+---------+
                 |
                 v
        Matching Institutions
                 |
                 v
        Recommended Action
                 |
       +---------+----------+
       |         |          |
       v         v          v
   Bulletin   Camp Plan  Action Sheet
       |         |          |
       +---------+----------+
                 |
                 v
          Field Mobilisation
                 |
                 v
        Candidates Apply on PMIS
                 |
                 v
           Outcome Tracker
```

---

# 2. Important Prototype vs Production Note

The current prototype specification uses prepared/static data and has no login, roles, live PMIS connection, uploads, or saved user actions.

For the actual portal being developed, we should build a proper backend-driven flow with:

- Authentication
- Nodal Officer assignment
- State and district access control
- Job master data
- Institution master data
- Qualification/course mapping
- Travel-time data
- Risk calculation
- Recommendations
- Bulletin generation
- Camp planning
- Action tracking
- Outcome tracking

The prototype is the product reference; the implementation should convert its static concepts into backend APIs and database data.

---

# 3. User: District Nodal Officer

The primary user is the **District Nodal Officer (DNO)**.

A DNO should only see the district(s) assigned to them.

### Example

```text
User:
Rahul Sharma

Role:
District Nodal Officer

State:
Uttar Pradesh

District:
Gorakhpur
```

After login:

```text
Login
  |
  v
Identify User
  |
  v
Check Role = DNO
  |
  v
Get Assigned State + District
  |
  v
Load District Dashboard
```

The DNO should not be able to switch to an unrelated district unless that permission is explicitly given.

---

# 4. Recommended Sidebar

The sidebar should remain simple because the DNO's main job is to act on opportunities.

```text
┌─────────────────────────────┐
│ PMIS Opportunity Radar      │
│ Uttar Pradesh               │
├─────────────────────────────┤
│                             │
│ 🏠 Dashboard                │
│                             │
│ 📍 Opportunities             │
│                             │
│ 🏫 Institutions              │
│                             │
│ 📢 Mobilisation              │
│    ├─ Bulletins             │
│    └─ Camp Plans            │
│                             │
│ 📄 Weekly Action Plan       │
│                             │
│ 📊 Outcomes                 │
│                             │
│ ─────────────────────────── │
│ ⚙ Profile / Settings       │
│                             │
│ 👤 Rahul Sharma             │
│ District Nodal Officer     │
└─────────────────────────────┘
```

## Sidebar responsibilities

### 1. Dashboard
District overview and immediate actions.

### 2. Opportunities
All internship postings and their fill-risk status.

### 3. Institutions
Colleges, Polytechnics and ITIs available in the district/catchment.

### 4. Mobilisation
Generated bulletins and camp plans.

### 5. Weekly Action Plan
Top priorities for the current week.

### 6. Outcomes
Measure whether mobilisation improved results.

### 7. Profile / Settings
Basic user information and assigned district.

---

# 5. Dashboard

## Purpose

The dashboard answers:

> **"What needs my attention this week?"**

The DNO should understand the situation within 1–5 minutes.

---

## 5.1 Top Header

```text
District Opportunity Radar

State: Uttar Pradesh
District: Gorakhpur
Week: 28 Sep – 04 Oct 2026

Last updated: 28 Sep 2026, 09:30 AM
```

If multiple districts are allowed for a user, provide a district selector.

---

# 5.2 KPI Cards

Show:

```text
Open Opportunities       52

High Risk                12

Openings At Risk         87

Closing in Next 7 Days   8
```

### Definitions

**Open Opportunities**
All internship postings that are not closed.

**High Risk**
Opportunities meeting the High-risk rule.

**Openings At Risk**
Total openings across High + Medium risk opportunities.

**Closing in Next 7 Days**
Openings whose application window closes within 7 days.

---

# 5.3 District Map

The map should show:

- Internship locations
- Risk level
- District boundary
- Institutions
- Institution type
- Optional institution layer toggle

Example:

```text
                 DISTRICT MAP

       🏫 ITI A
             \
              \ 22 min
               \
                🔴 Internship A
                     |
                     | 35 min
                     |
                  🏫 ITI B

       🟢 Internship C

              🟡 Internship D
```

Risk must not depend only on colour. Use labels/shapes as well.

Example:

```text
🔴 HIGH
🟡 MEDIUM
🟢 LOW
```

---

# 5.4 Priority / Action Panel

Show the most important actions.

```text
Needs Attention

🔴 Electrical Maintenance Intern
12 openings / 4 applications
Closes in 6 days

Recommended:
Campus Camp at Government ITI Gorakhpur

[View Opportunity]

--------------------------------

🔴 CNC Operator Intern
10 openings / 2 applications
Closes in 9 days

Recommended:
Share Bulletin with 3 institutions

[View Opportunity]
```

This makes the dashboard action-oriented instead of only analytical.

---

# 6. Opportunity Page

Sidebar:

```text
Opportunities
```

The page contains all open internship postings available to the DNO's district.

---

## 6.1 Table

Recommended columns:

| Column | Example |
|---|---|
| Risk | High |
| Role | Electrical Maintenance Intern |
| Company | ABC Manufacturing |
| Sector | Manufacturing |
| Qualification | ITI – Electrician |
| Openings | 12 |
| Applications | 4 |
| Closing Date | 06 Oct 2026 |
| Days Left | 6 |
| Recommended Action | Campus Camp |

---

## 6.2 Filters

Required filters:

- Risk
- Sector
- Qualification
- Closing within 7 days
- Closing within 14 days
- Closing within 30 days

Default sorting:

```text
High Risk
   ↓
Medium Risk
   ↓
Low Risk
```

Within the same risk:

```text
Fewest days remaining first
```

---

# 7. Opportunity Detail Page

This is the most important operational page.

Example:

```text
Electrical Maintenance Intern

ABC Manufacturing Ltd.
Manufacturing

12 Openings
4 Applications
6 Days Left

Qualification:
ITI – Electrician

Risk:
HIGH

Reason:
"4 applications for 12 openings, closes in 6 days"
```

---

# 7.1 Internship Information

Show:

- Role title
- Company
- Sector
- Qualification
- Openings
- Applications
- Opening date
- Closing date
- Duration
- Monthly support amount
- Internship address
- Application trend

---

# 7.2 Catchment Map

Travel-time selector:

```text
Catchment

[30 min] [45 min] [60 min]
```

Default:

```text
60 minutes
```

Changing this must update:

1. Catchment
2. Matching institutions
3. Institution ranking
4. Recommended action if necessary

Example:

```text
60 minutes
--------------------------------
🏫 ITI A       22 min
🏫 ITI B       31 min
🏫 Polytechnic 42 min
🏫 College C   55 min

45 minutes
--------------------------------
🏫 ITI A       22 min
🏫 ITI B       31 min
🏫 Polytechnic 42 min

30 minutes
--------------------------------
🏫 ITI A       22 min
🏫 ITI B       31 min
```

---

# 7.3 Institution Ranking

Show maximum top 5 matching institutions.

Example:

```text
1. Government ITI Gorakhpur
   Exact Match
   22 min away
   120 seats

   Why:
   Exact trade match (Electrician),
   22 min away, 120 seats.

   [View Details] [Plan Camp]


2. Government ITI XYZ
   Related Match
   31 min away
   90 seats

   Why:
   Related trade (Wireman),
   31 min away, 90 seats.
```

---

# 7.4 Recommended Action

The system should provide one clear recommended action.

Possible actions:

### A. Campus Camp

When:

```text
Openings >= 10
AND
Top institution = Exact match
AND
Top institution seats >= 100
```

Example:

```text
Recommended Action

🏫 Campus Camp

Why:
Many openings and a large matching
institution nearby.

[Plan Camp]
```

### B. Assisted Registration Session

When the district has a low-registration flag.

### C. Share Bulletin

Default action when the other conditions do not apply.

### D. Widen Outreach / Employer Follow-up

When no matching institution is found within the catchment.

---

# 8. Institution Page

The DNO can browse all available institutions.

## Institution table

| Field | Example |
|---|---|
| Name | Government ITI Gorakhpur |
| Type | ITI |
| District | Gorakhpur |
| Location | Gorakhpur |
| Programmes | Electrician, Fitter |
| Seats | 120 |
| Matchable Opportunities | 8 |

Filters:

- ITI
- Polytechnic
- College
- District
- Trade / Course

---

# 8.1 Institution Detail

Show:

```text
Government ITI Gorakhpur

Type:
ITI

District:
Gorakhpur

Address:
Example address

Programmes:
- Electrician — 120 seats
- Fitter — 80 seats
- Welder — 60 seats

Contact:
Principal
98XXXXXX01
```

Also show:

### Matching Open Opportunities

```text
Electrical Maintenance Intern     🔴
Technician Intern                🔴
Maintenance Assistant            🟡
```

This gives the DNO the reverse view:

> "If I visit this ITI, which internships can I discuss?"

---

# 9. Bulletin Generator

Open from:

```text
Opportunity Detail
       |
       v
Create Bulletin
```

The bulletin should contain:

```text
PM INTERNSHIP OPPORTUNITY

Electrical Maintenance Intern

ABC Manufacturing

📍 Gorakhpur
🎓 ITI – Electrician
⏱ Duration: 6 Months
📅 Last Date: 06 Oct 2026

Monthly Support: ₹XXXX

How to Apply:
1. Scan QR
2. Open official PMIS portal
3. Register / login
4. Apply for the internship

[ QR CODE ]

Apply only on the official PMIS portal.
No fee is charged.
```

Outputs:

- Print / Save as PDF
- Download square image for WhatsApp

Languages:

```text
Local Language
English
```

For the UP prototype, the exact local-language content should be reviewed before production use.

---

# 10. Camp Planner

Open from:

```text
Opportunity Detail
       |
       v
Plan Camp
```

Pre-filled fields:

```text
Camp Name
Proposed Date
Proposed Time

Institution
Institution Address

Coordinator Name
Coordinator Phone

Linked Internship
```

Example:

```text
Camp Name:
Electrical Maintenance Recruitment Camp

Date:
05 Oct 2026

Time:
11:00 AM

Institution:
Government ITI Gorakhpur

Linked Opportunity:
Electrical Maintenance Intern

Coordinator:
Rahul Sharma
98XXXXXX01
```

Output:

```text
[Generate Camp Brief]
```

The prototype generates the brief; actual PMIS camp posting creation remains a PMIS-side action unless a future integration is approved.

---

# 11. Weekly Action Plan

This should be a dedicated page.

Purpose:

> Give the DNO a simple list of what to do this week.

Example:

```text
WEEKLY ACTION PLAN

District: Gorakhpur
Week: 28 Sep – 04 Oct

------------------------------------------------

1. Electrical Maintenance Intern
   🔴 High Risk

   12 openings
   4 applications
   6 days left

   Action:
   Campus Camp

   Institution:
   Government ITI Gorakhpur

   Contact:
   Principal — 98XXXXXX01

   [Done] [Add Note]

------------------------------------------------

2. CNC Operator Intern
   🔴 High Risk

   10 openings
   2 applications
   9 days left

   Action:
   Share Bulletin

   Institutions:
   ITI A
   Polytechnic B
   College C

   [Done] [Add Note]
```

The plan should support:

- Done checkbox
- Notes
- Print A4
- Generated date
- District
- Week

---

# 12. Outcomes Page

Purpose:

> Did our mobilisation actually help?

Show:

### Targeted Opportunities

vs

### Similar Untargeted Opportunities

Metrics:

```text
Applications per Opening
Applications from Catchment
Offer Acceptance Rate
Joining Rate
```

Example:

```text
Applications / Opening

Targeted       ███████████  2.1
Not Targeted   █████        0.9
```

Important:

> Outcome data should be clearly labelled as illustrative until real production data is available.

The comparison should be treated as an outcome/association view, not as proof of causation.

---

# 13. Core Risk Calculation

The backend should calculate fill risk from:

- openings
- applications
- closing date

Default target:

```text
target_applications = openings × 3

coverage = applications / target_applications

days_left = closing_date - today
```

Risk:

```text
HIGH:
applications = 0
OR
coverage < 0.5 AND days_left <= 14

MEDIUM:
not High
AND
coverage < 1.0

LOW:
coverage >= 1.0

CLOSED:
days_left < 0
```

Example:

```text
Openings = 12
Applications = 4

Target = 12 × 3
       = 36

Coverage = 4 / 36
         = 0.11

Days left = 6

=> HIGH RISK
```

The thresholds should be configurable in one backend configuration location.

---

# 14. Institution Matching Logic

Each job has a required qualification.

Each institution has programmes/trades.

A mapping table determines match strength.

```text
EXACT = 3
RELATED = 2
GENERIC = 1
```

Example:

```text
Job:
ITI Electrician

Institution:
ITI Electrician
=> EXACT

Institution:
ITI Wireman
=> RELATED

Institution:
Degree College
=> GENERIC (only where broad qualification rules allow)
```

---

# 15. Institution Ranking

For every matching institution inside the catchment:

```text
match_score
proximity_score
size_score
response_score
```

Prototype ranking:

```text
rank_score =
100 × (
  0.40 × match_score
  + 0.30 × proximity_score
  + 0.20 × size_score
  + 0.10 × response_score
)
```

Top 5 institutions should be returned.

Every institution should have a human-readable:

```text
WHY THIS INSTITUTION?
```

Example:

> Exact trade match (Electrician), 22 min away, 120 seats.

---

# 16. REQUIRED BACKEND MASTER DATA

The portal cannot work correctly without a clean master dataset.

Minimum data domains:

```text
1. States
2. Districts
3. Internship Jobs
4. Institutions
5. Institution Programmes / Trades
6. Qualification Master
7. Qualification ↔ Programme Mapping
8. Travel Times
9. District Configuration
10. Local Languages
11. Nodal Officers
```

---

# 17. State and District Master

We should seed the State → District hierarchy.

For the current scope:

```text
State
└── Uttar Pradesh
    ├── Agra
    ├── Aligarh
    ├── Ambedkar Nagar
    ├── Amethi
    ├── Amroha
    ├── Auraiya
    ├── Ayodhya
    ├── Azamgarh
    ├── Baghpat
    ├── Bahraich
    ├── Ballia
    ├── Balrampur
    ├── Banda
    ├── Barabanki
    ├── Bareilly
    ├── Basti
    ├── Bhadohi
    ├── Bijnor
    ├── Budaun
    ├── Bulandshahr
    ├── Chandauli
    ├── Chitrakoot
    ├── Deoria
    ├── Etah
    ├── Etawah
    ├── Farrukhabad
    ├── Fatehpur
    ├── Firozabad
    ├── Gautam Buddha Nagar
    ├── Ghaziabad
    ├── Ghazipur
    ├── Gonda
    ├── Gorakhpur
    ├── Hamirpur
    ├── Hapur
    ├── Hardoi
    ├── Hathras
    ├── Jalaun
    ├── Jaunpur
    ├── Jhansi
    ├── Kannauj
    ├── Kanpur Dehat
    ├── Kanpur Nagar
    ├── Kasganj
    ├── Kaushambi
    ├── Kushinagar
    ├── Lakhimpur Kheri
    ├── Lalitpur
    ├── Lucknow
    ├── Maharajganj
    ├── Mahoba
    ├── Mainpuri
    ├── Mathura
    ├── Mau
    ├── Meerut
    ├── Mirzapur
    ├── Moradabad
    ├── Muzaffarnagar
    ├── Pilibhit
    ├── Pratapgarh
    ├── Prayagraj
    ├── Rae Bareli
    ├── Rampur
    ├── Saharanpur
    ├── Sambhal
    ├── Sant Kabir Nagar
    ├── Shahjahanpur
    ├── Shamli
    ├── Shravasti
    ├── Siddharthnagar
    ├── Sitapur
    ├── Sonbhadra
    ├── Sultanpur
    ├── Unnao
    └── Varanasi
```

**Implementation note:** Verify the district master against the official government source before production seeding. The above list is the implementation starting point, not a substitute for official master-data verification.

---

# 18. ITI / Institution Seed Data

The system needs institution master data.

At minimum, for each ITI:

```text
institution_id
name
type
state
district
address
latitude
longitude
location_confidence
contact_name
contact_role
contact_phone
status
```

For each programme/trade:

```text
programme_id
institution_id
programme_code
programme_name
seats
status
```

Example:

```json
{
  "institution_id": "UP-ITI-0001",
  "name": "Government ITI Example",
  "type": "ITI",
  "state": "Uttar Pradesh",
  "district": "Gorakhpur",
  "address": "Example address",
  "latitude": 26.7606,
  "longitude": 83.3732,
  "location_confidence": "VERIFIED",
  "status": "ACTIVE"
}
```

Programme:

```json
{
  "programme_id": "UP-ITI-0001-ELEC",
  "institution_id": "UP-ITI-0001",
  "programme_code": "ITI_ELECTRICIAN",
  "programme_name": "Electrician",
  "seats": 120,
  "status": "ACTIVE"
}
```

### Important

Do **not** invent institution coordinates or official contacts.

Use verified institution data from the appropriate official/public source before production use.

---

# 19. Qualification Master Seed

Minimum qualification set for the prototype:

```text
10TH_PASS
12TH_PASS

ITI_ELECTRICIAN
ITI_FITTER
ITI_COPA
ITI_MMV
ITI_WELDER

DIPLOMA_MECHANICAL
DIPLOMA_ELECTRICAL
DIPLOMA_CIVIL

GRADUATE_BCOM
GRADUATE_BSC
GRADUATE_BA
GRADUATE_ANY
```

---

# 20. Qualification ↔ Programme Mapping

Create a mapping table.

Example:

| Job Qualification | Institution Programme | Match |
|---|---|---|
| ITI Electrician | Electrician | Exact |
| ITI Electrician | Wireman | Related |
| ITI Fitter | Fitter | Exact |
| ITI Fitter | Machinist | Related |
| Graduate Any | B.Com | Generic |
| Graduate Any | B.Sc | Generic |

Database structure:

```text
qualification_programme_mapping

id
qualification_code
programme_code
match_strength
status
```

---

# 21. Internship Job Seed — REQUIRED FIELDS

If live PMIS integration is not available initially, jobs must be seeded through backend/database.

A job should contain at least:

```text
posting_id
role_title
company_name
sector
qualification_code
qualification_label
openings
applications
applications_history
window_open_date
window_close_date
duration_months
monthly_support
address
latitude
longitude
district_code
state_code
portal_link
status
```

Recommended additional fields:

```text
description
company_logo / company_reference (optional)
work_mode
created_at
updated_at
source
source_reference
```

---

# 22. Example Job Seed

```json
{
  "posting_id": "DEMO-0007",
  "role_title": "Electrical Maintenance Intern",
  "company_name": "Purvanchal Agro Processing Ltd",
  "sector": "Manufacturing",

  "qualification_code": "ITI_ELECTRICIAN",
  "qualification_label": "ITI - Electrician",

  "openings": 12,
  "applications": 4,
  "applications_history": [0, 1, 3, 4],

  "window_open_date": "2026-09-20",
  "window_close_date": "2026-10-06",

  "duration_months": 6,
  "monthly_support": 0,

  "address": "Industrial Area, Gorakhpur",
  "latitude": 0,
  "longitude": 0,

  "state_code": "UP",
  "district_code": "GORAKHPUR",

  "portal_link": "https://pminternship.mca.gov.in/",
  "status": "OPEN",
  "source": "DEMO"
}
```

**Important:** `latitude: 0` and `longitude: 0` are placeholders only. Production data must use verified coordinates.

The prototype specification explicitly requires realistic/verified location data and fictional company names for demo postings.

---

# 23. Travel-Time Seed

For accurate institution ranking, we need travel-time information.

Minimum structure:

```text
posting_id
institution_id
road_travel_minutes
is_approximate
```

Example:

```json
{
  "posting_id": "DEMO-0007",
  "institution_id": "UP-ITI-0001",
  "road_travel_minutes": 22,
  "is_approximate": false
}
```

The UI should show:

```text
22 min
```

If approximate:

```text
22 min approx.
```

---

# 24. District Configuration

Each district should have configuration data.

```text
district_code
district_name
state_code
local_language
low_registration_flag
boundary
```

Example:

```json
{
  "district_code": "GORAKHPUR",
  "district_name": "Gorakhpur",
  "state_code": "UP",
  "local_language": "Hindi",
  "low_registration_flag": false
}
```

---

# 25. Nodal Officer Data

Minimum user structure:

```text
user_id
name
email
role
state_code
district_codes
status
```

Example:

```json
{
  "user_id": "USR-001",
  "name": "Rahul Sharma",
  "email": "rahul@example.gov.in",
  "role": "DNO",
  "state_code": "UP",
  "district_codes": ["GORAKHPUR"],
  "status": "ACTIVE"
}
```

Backend must enforce district access.

---

# 26. Recommended Backend Data Flow

```text
                         ┌──────────────────┐
                         │   PMIS / Source  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Internship Jobs  │
                         └────────┬─────────┘
                                  │
             ┌────────────────────┼─────────────────────┐
             │                    │                     │
             ▼                    ▼                     ▼
        Risk Engine        Catchment Engine      Qualification
                                                    Matching
             │                    │                     │
             └────────────────────┼─────────────────────┘
                                  ▼
                         Institution Ranking
                                  │
                                  ▼
                        Recommended Action
                                  │
                 ┌────────────────┼─────────────────┐
                 ▼                ▼                 ▼
             Bulletin         Camp Plan       Action Sheet
                 │                │                 │
                 └────────────────┼─────────────────┘
                                  ▼
                              DNO Action
                                  │
                                  ▼
                          PMIS Applications
                                  │
                                  ▼
                          Outcome Metrics
```

---

# 27. Suggested API Structure

Use a clean `/api/v1` structure.

```text
/api/v1/auth

/api/v1/dashboard
/api/v1/dashboard/summary
/api/v1/dashboard/map

/api/v1/opportunities
/api/v1/opportunities/:id
/api/v1/opportunities/:id/catchment
/api/v1/opportunities/:id/institutions
/api/v1/opportunities/:id/recommendation

/api/v1/institutions
/api/v1/institutions/:id
/api/v1/institutions/:id/opportunities

/api/v1/bulletins
/api/v1/bulletins/:id

/api/v1/camps
/api/v1/camps/:id

/api/v1/action-plans
/api/v1/action-plans/:id

/api/v1/outcomes

/api/v1/master/states
/api/v1/master/districts
/api/v1/master/qualifications
/api/v1/master/programmes
/api/v1/master/mappings
```

---

# 28. Dashboard API Example

```http
GET /api/v1/dashboard/summary?district=GORAKHPUR
```

Response:

```json
{
  "district": {
    "code": "GORAKHPUR",
    "name": "Gorakhpur",
    "state": "Uttar Pradesh"
  },
  "metrics": {
    "openOpportunities": 52,
    "highRisk": 12,
    "openingsAtRisk": 87,
    "closingNext7Days": 8
  },
  "priorityOpportunities": [
    {
      "postingId": "DEMO-0007",
      "risk": "HIGH",
      "roleTitle": "Electrical Maintenance Intern",
      "openings": 12,
      "applications": 4,
      "daysLeft": 6,
      "recommendedAction": "CAMP"
    }
  ]
}
```

---

# 29. Opportunity Detail API Flow

```text
GET /opportunities/:id
        |
        +--> Job details
        |
        +--> Risk calculation
        |
        +--> Catchment
        |
        +--> Matching institutions
        |
        +--> Institution ranking
        |
        +--> Recommended action
```

Frontend should not duplicate business logic.

The backend should return the calculated:

- risk
- reason
- days left
- matching institutions
- match strength
- travel time
- rank score
- recommendation

---

# 30. Seed Data — Initial Development Scope

For the first development/demo version, seed:

### Geography

```text
1 State:
Uttar Pradesh

All UP districts:
State → District master
```

### Institutions

Start with:

```text
Gorakhpur district
+
nearby districts needed for the catchment demo
```

Recommended prototype target:

```text
30–60 institutions
```

Mix:

```text
ITI
Polytechnic
College
```

### Jobs

Seed:

```text
40–60 internship postings
```

Target mix:

```text
~30% High Risk
~30% Medium Risk
~40% Low Risk
```

At least **3 demo-perfect opportunities** should be prepared:

```text
1. High Risk + many openings + strong ITI match
2. High Risk + multiple institutions
3. Another High Risk opportunity for bulletin/action-sheet demo
```

---

# 31. Important Data Rules

## Never fake production data

For demo:

- Company names can be fictional.
- Candidate data must not be real.
- Institution data can come from public/official sources.
- Contact details should be dummy if this is only a prototype.
- Coordinates must be verified.
- Approximate travel times must be labelled.
- Illustrative outcome data must be labelled.

## Production

Replace demo data with:

```text
PMIS job feed/API/export
+
verified institution master
+
verified programme/trade data
+
verified location data
```

---

# 32. What the DNO Can Do

The DNO can:

- View assigned district
- View district KPIs
- View district map
- Filter opportunities
- Open an opportunity
- See fill risk
- See why an opportunity is at risk
- Change catchment from 30/45/60 minutes
- See matching ITIs/colleges/polytechnics
- See institution ranking
- View institution details
- View matching opportunities for an institution
- Generate a bulletin
- Download/print bulletin
- Plan a mobilisation camp
- Generate a camp brief
- View weekly action plan
- Mark actions done
- Add notes
- View outcome metrics

---

# 33. What the DNO Should NOT Do

The Radar should not become another PMIS portal.

DNO should not use this portal to:

- Register candidates
- Apply for internships as a candidate
- Replace PMIS candidate search
- Edit PMIS internship records directly
- Create fake PMIS opportunities
- Modify official application records

The Radar is for **analysis + mobilisation + monitoring**.

---

# 34. Final End-to-End User Journey

```text
LOGIN
  |
  v
DNO Dashboard
  |
  +--> See 12 High Risk Opportunities
  |
  v
Open Opportunity
  |
  v
See:
- Openings
- Applications
- Days Left
- Risk Reason
  |
  v
Open Catchment
  |
  v
60 min
  |
  v
Find 5 Matching Institutions
  |
  v
Rank Institutions
  |
  v
System recommends:
"Campus Camp"
  |
  +----------------------+
  |                      |
  v                      v
Plan Camp            Create Bulletin
  |                      |
  v                      v
Print Brief          Share/Print
  |                      |
  +----------+-----------+
             |
             v
       Field Mobilisation
             |
             v
       Candidates Apply
             |
             v
       Next Week Dashboard
             |
             v
       Outcome Tracker
```

---

# 35. Developer Priority

## Phase 1 — Foundation

```text
1. Auth
2. DNO role
3. State/District master
4. User → District mapping
5. Job seed
6. Institution seed
7. Qualification master
8. Qualification mapping
```

## Phase 2 — Core Radar

```text
9. Dashboard
10. Risk engine
11. Opportunity list
12. Opportunity detail
13. Catchment
14. Institution matching
15. Institution ranking
16. Recommended action
```

## Phase 3 — Mobilisation

```text
17. Institution detail
18. Bulletin generator
19. Camp planner
20. Weekly action sheet
```

## Phase 4 — Monitoring

```text
21. Outcome tracker
22. Targeted vs untargeted comparison
23. Action completion / notes
```

## Phase 5 — Production Integration

```text
24. PMIS data integration
25. Automated job sync
26. Application count sync
27. Verified institution master refresh
28. Production monitoring
```

---

# 36. Final Product Principle

Every screen should answer one practical question:

```text
Dashboard:
"What needs my attention?"

Opportunities:
"Which internships are at risk?"

Opportunity Detail:
"Why is this internship at risk?"

Catchment:
"Where can suitable candidates come from?"

Institutions:
"Which institution should I contact?"

Recommendation:
"What should I do?"

Bulletin:
"What can I share with candidates?"

Camp Planner:
"How can I organise mobilisation?"

Weekly Action Plan:
"What do I need to do this week?"

Outcomes:
"Did the mobilisation work?"
```

That is the complete DNO workflow.

---

# 37. Source / Product Reference

This specification is based on the supplied **District Opportunity Radar / PM Internship Scheme prototype product document**, including its defined flow, screens, business rules, data requirements, and prototype scope.

The original prototype defines the core flow as:

**At-risk opening → catchment → matching institutions → recommended action → action outputs → field mobilisation → PMIS applications → outcome tracking.**

For implementation, static prototype data should be replaced progressively with backend-managed master data and, when available, live PMIS data.
