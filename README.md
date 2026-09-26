# ITI Portal 🛠️🏛️

An intelligent employment, placement, and governance portal connecting **ITI (Industrial Training Institute) certified workers**, **District / Nodal Placement Officers**, and **System Administrators**. Built with Next.js 16 (App Router), Express.js, PostgreSQL with PostGIS & pgvector, and hybrid AI/NLP for trade skill matching.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture & Tech Stack](#system-architecture--tech-stack)
- [User Roles & Workflows](#user-roles--workflows)
- [Core Engines](#core-engines)
  - [PostGIS Spatial Radius Matching](#1-postgis-spatial-radius-matching)
  - [Two-Track Resume Parsing & Semantic Skill Extraction](#2-two-track-resume-parsing--semantic-skill-extraction)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Option A: Automated Launcher (Recommended)](#option-a-automated-launcher-recommended)
  - [Option B: Docker Compose](#option-b-docker-compose)
  - [Option C: Manual Local Setup](#option-c-manual-local-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Default Seed & Testing Credentials](#default-seed--testing-credentials)
- [License](#license)

---

## Overview

The **ITI Portal** modernizes vocational technician placement across Industrial Training Institutes. It replaces disconnected offline hiring drives with a centralized, data-driven platform featuring:

- **Geo-Aware Talent Discovery**: Locate qualified electricians, fitters, welders, machinists, and technicians within a specific geographic radius (e.g. 50 km) of industrial hubs or project sites.
- **Automated Resume & Skill Extraction**: Instant multi-format resume parsing (PDF, DOCX, DOC) that normalizes vocational trade skills while generating compact NLP context blobs for LLM evaluation without token bloat.
- **District Governance**: Granular role-based workflows for district nodal officers to publish trade requirements, manage candidate shortlists, and track onboarding to active placement.
- **Administrative Registry Control**: Comprehensive institutional registry for government and private ITIs, system-wide trade catalogs, and verified worker certification checks.

---

## Key Features

- 📍 **Spatial PostGIS Matching**: Filter candidates by trade, district, and exact distance using PostgreSQL geography point coordinates (`ST_DWithin` and `ST_Distance`).
- 📄 **Two-Track Hybrid Parser**: Blazingly fast deterministic trade/skill standardizer paired with NLP context condensation (`compromise`) and vector embeddings (`@xenova/transformers`).
- 🔐 **Tokenized Nodal Officer Onboarding**: Administrative email invitations with secure SHA-256 hashed invite tokens scoped to assigned districts.
- ⚡ **Real-Time Verification Workflows**: Admins can verify worker credentials, toggle authenticity status, and audit institutional affiliation.
- 📊 **Opportunity & Shortlist Management**: District officers create trade-specific work requirements, shortlist prospective technicians, and oversee placement stages.
- ⚙️ **Configurable System Settings**: Admin-managed lists for approved trades (e.g., Electrician, Fitter, Welder, Mechanic, Turner, COPA, Plumber), ITIs, and email domains.

---

## System Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, Lucide React, Framer Motion, Recharts |
| **Backend** | [Node.js](https://nodejs.org/) (ES Modules), [Express.js 4](https://expressjs.com/), JWT Authentication, Multer |
| **Database & ORM** | [PostgreSQL 15+](https://www.postgresql.org/) (Neon Serverless compatible), [Prisma ORM 6.4](https://www.prisma.io/) |
| **Database Extensions** | **PostGIS** (spatial geography points & proximity calculations), **pgvector** (semantic skill embeddings) |
| **AI / NLP & Extraction** | `@xenova/transformers` (local ONNX `all-MiniLM-L6-v2` embeddings), [OpenAI API](https://openai.com/) (`gpt-4o` for screening/verification), `compromise` NLP, `pdf-parse`, `mammoth`, `word-extractor` |
| **Email Services** | ZeptoMail API, Nodemailer |

---

## User Roles & Workflows

### 1. 🛠️ Worker (`WORKER`)
- **Target**: Certified ITI graduates and trade technicians.
- **Capabilities**:
  - Sign up with trade specialization, ITI institution selection, and experience history.
  - Resume upload with automated extraction of trade certifications, skills, and languages.
  - Profile management (toggle availability: `AVAILABLE`, `ASSIGNED`, `UNAVAILABLE`).
  - View matched trade opportunities and invitation statuses.

### 2. 🏛️ Nodal Placement Officer (`OFFICER`)
- **Target**: District placement officers and institutional hiring authorities.
- **Capabilities**:
  - Onboard via invitation token scoped to their district.
  - Post work requirements specifying trade, description, and technical criteria.
  - Discover candidates via PostGIS spatial search (radius filter in kilometers) and trade filters.
  - Shortlist workers, monitor candidate statuses (`SHORTLISTED` → `SELECTED` → `ACCEPTED`), and track placements.

### 3. 🛡️ System Administrator (`ADMIN`)
- **Target**: State/platform administrators.
- **Capabilities**:
  - Manage the master ITI institution directory (add government/private ITIs with coordinates, districts, and codes).
  - Review all registered workers and toggle official verification (`isVerified`).
  - Generate and send district-scoped officer invitations.
  - Configure global system settings (allowed trades, authorized ITIs, domain restrictions).

---

## Core Engines

### 1. PostGIS Spatial Radius Matching
Worker profiles and ITI institutes store geospatial location points (`geography(Point,4326)`). Officer candidate queries can execute high-speed spatial queries:
```sql
SELECT w.id, w."fullName", w.trade,
       ROUND(ST_Distance(
         COALESCE(w.location, i.location)::geography,
         ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
       )) as "distanceMeters"
FROM "WorkerProfile" w
LEFT JOIN "ITI" i ON w."itiId" = i.id
WHERE ST_DWithin(
  COALESCE(w.location, i.location)::geography,
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
  radiusMeters
)
ORDER BY "distanceMeters" ASC;
```

### 2. Two-Track Resume Parsing & Semantic Skill Extraction
1. **Track 1 (Deterministic Standardizer)**: Scans documents via `pdf-parse`, `mammoth`, and `word-extractor` using canonical trade dictionaries to immediately capture standard trades, licenses, and technical competencies in under 5ms.
2. **Track 2 (NLP Context Blob)**: Uses `compromise` NLP to strip grammatical noise and summarize relevant experience into a lightweight "context blob".
3. **Semantic Skill Matching**: Embeds skills and trade taxonomies using local ONNX pipelines (`@xenova/transformers` with `all-MiniLM-L6-v2`) cached to the system temporary directory for serverless runtime compatibility.

---

## Directory Structure

```text
iti-portal/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma schema with PostGIS & pgvector extensions
│   │   ├── seed.js             # Initial database seed (admin & default trade list)
│   │   └── migrations/         # Database migrations
│   ├── src/
│   │   ├── config/             # Prisma client & environment configuration
│   │   ├── controllers/        # Route controllers (worker, officer, iti, auth, admin, etc.)
│   │   ├── middlewares/        # JWT authentication & role-based access guards
│   │   ├── routes/             # Express API v1 endpoints
│   │   ├── services/           # AI service, emailer, matching engine, semantic resolver
│   │   ├── utils/              # Coordinates formatting & helpers
│   │   └── server.js           # Express app bootstrap & route registration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router (auth, dashboard, onboarding)
│   │   ├── components/         # Radix / Tailwind UI components & layout wrappers
│   │   ├── context/            # AuthContext (state, tokens, role detection)
│   │   ├── lib/                # Centralized API client & utility methods
│   │   └── views/              # Role-specific dashboard views (AdminView, OfficerView, WorkerView)
│   └── package.json
├── docs/                       # Architectural specifications & technical flowcharts
├── UP_ITIs_from_PDF.csv        # Master institutional dataset of ITIs
├── docker-compose.yml          # Container configuration for full-stack deployment
├── run.sh                      # One-click startup script for local development
└── DEPLOYMENT.md               # Cloud production deployment guidelines (Neon + Railway/Vercel)
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v20.9.0` or higher
- **PostgreSQL**: `15+` with `postgis` and `vector` extensions enabled
- **npm** or **pnpm** / **yarn**

---

### Option A: Automated Launcher (Recommended)

The root [`run.sh`](run.sh) script automatically starts PostgreSQL, verifies the `iti-portal` database, installs dependencies, synchronizes Prisma migrations, and spins up the backend and frontend concurrently:

```bash
chmod +x run.sh
./run.sh
```

- **Frontend App**: `http://localhost:5173` (or `http://localhost:3000`)
- **Backend API**: `http://localhost:5001/api`
- **Health Check**: `http://localhost:5001/api/v1/health`

---

### Option B: Docker Compose

Launch the entire stack (PostgreSQL, Express Backend, Next.js Frontend) in isolated containers:

```bash
# 1. Provide environment configurations
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Build and start services
docker-compose up -d --build
```

---

### Option C: Manual Local Setup

#### 1. Database Setup
Create a PostgreSQL database named `iti-portal` and ensure PostGIS is installed:
```bash
createdb iti-portal
psql -d iti-portal -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS vector;"
```

#### 2. Backend Setup
```bash
cd backend

# Create .env based on the environment variables section below
npm install

# Run migrations and seed default admin & trades
npx prisma migrate dev
npx prisma db seed

# Run in development mode
npm run dev
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Create .env.local
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5001
CLIENT_URL="http://localhost:5173"
JWT_SECRET="your_very_secure_jwt_secret"

# PostgreSQL connection strings (Supports Neon Serverless & local Postgres)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/iti-portal?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/iti-portal?schema=public"

# AI / Extraction Configuration
OPENAI_API_KEY="sk-..."

# Admin Seed Defaults (Optional)
ADMIN_EMAIL="admin@hiringportal.com"
ADMIN_PASSWORD="Admin@123"

# Email Delivery (ZeptoMail / Nodemailer)
ZEPTOMAIL_SEND_MAIL_TOKEN="your_zeptomail_token"
MAIL_SENDER_EMAIL="noreply@example.com"
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:5001/api"
BACKEND_API_URL="http://localhost:5001/api"
```

---

## API Reference

All primary endpoints are mounted under `/api/v1` (with `/api` fallback aliases):

| Domain | Method | Endpoint | Description | Auth Required |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | Register new Worker or Officer | Public |
| | `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT token | Public |
| | `GET` | `/api/v1/auth/me` | Fetch currently logged in user & profile | Authenticated |
| | `POST` | `/api/v1/auth/accept-invite` | Accept nodal officer invitation token | Public |
| **Workers** | `GET` | `/api/v1/workers` | List workers with trade/district filters | Authenticated |
| | `GET` | `/api/v1/workers/search` | Spatial PostGIS radius search (`lat`, `lng`, `radiusKm`, `trade`) | Authenticated |
| | `GET` | `/api/v1/workers/:id` | Fetch detailed worker profile | Authenticated |
| | `POST` | `/api/v1/workers` | Create new worker profile | Authenticated |
| | `PATCH` | `/api/v1/workers/:id` | Update profile attributes & availability | Worker/Admin |
| | `PATCH` | `/api/v1/workers/:id/verify`| Toggle worker verification status | Admin Only |
| | `DELETE`| `/api/v1/workers/:id` | Remove worker record | Admin Only |
| **Nodal Officers** | `GET` | `/api/v1/officers/me` | Retrieve officer's profile & district scope | Officer |
| | `PATCH`| `/api/v1/officers/me` | Update officer details | Officer |
| | `GET` | `/api/v1/officers` | List all district officers | Admin Only |
| | `POST` | `/api/v1/officers/invite` | Send officer invitation with district assignment | Admin Only |
| **Requirements** | `GET` | `/api/v1/requirements` | Get officer's work requirements | Officer |
| | `POST` | `/api/v1/requirements` | Publish new trade work requirement | Officer |
| | `GET` | `/api/v1/requirements/:id`| Retrieve single work requirement details | Officer |
| | `PUT` | `/api/v1/requirements/:id`| Update work requirement details | Officer |
| | `DELETE`| `/api/v1/requirements/:id`| Delete work requirement | Officer |
| **Shortlists** | `GET` | `/api/v1/shortlists` | View shortlisted candidates and status | Officer |
| | `POST` | `/api/v1/shortlists` | Shortlist a candidate for requirement | Officer |
| | `PUT` | `/api/v1/shortlists/:id` | Update candidate recruitment status | Officer |
| | `DELETE`| `/api/v1/shortlists/:id`| Remove candidate from shortlist | Officer |
| **ITIs** | `GET` | `/api/v1/itis` | List registered ITI institutes | Authenticated |
| | `GET` | `/api/v1/itis/:id` | Get individual ITI record & coordinates | Authenticated |
| | `POST` | `/api/v1/itis` | Register new ITI institute | Admin Only |
| | `PUT` | `/api/v1/itis/:id` | Update ITI details or coordinates | Admin Only |
| | `DELETE`| `/api/v1/itis/:id` | Delete ITI record | Admin Only |
| **Settings** | `GET` | `/api/v1/settings` | Get allowed trades & institutions | Authenticated |
| | `PATCH`| `/api/v1/settings` | Update system-level settings | Admin Only |
| **System** | `GET` | `/api/v1/health` | Service health status check | Public |

---

## Default Seed & Testing Credentials

When running `npx prisma db seed` (or starting via [`run.sh`](run.sh)):

- **Default Administrator**:
  - **Email**: `admin@hiringportal.com` *(or configured `ADMIN_EMAIL`)*
  - **Password**: `Admin@123` *(or configured `ADMIN_PASSWORD`)*
  - **Role**: `ADMIN`
  - **Dashboard**: `/dashboard/admin`
- **Default Seeded Trades**:
  - `Electrician`, `Fitter`, `Welder`, `Mechanic`, `Turner`, `Machinist`, `COPA`, `Plumber`
- **Testing Nodal Officer**:
  - Can be invited through the Admin Dashboard (`Districts / Nodes` tab) or registered via `/api/v1/auth/register`.

---

## License

This project is licensed under the [MIT License](LICENSE).
