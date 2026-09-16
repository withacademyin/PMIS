# Hiring Portal - Deployment Guide

This guide outlines the steps and requirements for deploying the Full-Stack Hiring Portal. The architecture consists of a Next.js frontend, an Express.js backend, and a Neon Serverless PostgreSQL database.

---

## 1. Architecture Overview

- **Frontend**: Next.js (React). Best deployed to **Vercel** or **Netlify**.
- **Backend**: Node.js + Express.js. Best deployed to **Render**, **Railway**, or **Fly.io** (platforms that support long-running processes).
- **Database**: Neon Serverless Postgres.
- **AI Models**: 
  - Uses Google Gemini API.
  - Uses `@xenova/transformers` for local embeddings. *(Note: We have dynamically configured this to cache in the OS temp directory, making it natively compatible with Serverless environments).*

---

## 2. Database Setup (Neon)

1. Create a new project in [Neon](https://neon.tech/).
2. You will be provided with a connection string. Neon uses **PgBouncer** for connection pooling, which Prisma requires special configuration for.
3. Obtain your **Pooled Connection String** and your **Direct Connection String** from the Neon dashboard.

---

## 3. Backend Deployment (Render / Railway)

The backend handles file uploads (in-memory) and interacts with the AI services.

### Environment Variables Required
Configure the following variables in your hosting provider's dashboard for the backend service:

```env
# The pooled connection string (Must include ?pgbouncer=true)
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/dbname?pgbouncer=true&sslmode=require"

# The direct connection string for Prisma migrations
DIRECT_URL="postgresql://user:password@endpoint.neon.tech/dbname?sslmode=require"

# General Backend Config
PORT="5001"
CLIENT_URL="https://your-deployed-frontend-url.vercel.app" # Used for CORS protection
JWT_SECRET="your_very_secure_random_string"

# AI Config
GEMINI_API_KEY="your_google_gemini_api_key"
```

### Build & Start Commands
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `npm run start`

*Note: The `prisma migrate deploy` command will automatically enable the required `pgvector` extension on your Neon database.*

---

## 4. Frontend Deployment (Vercel)

The frontend is a standard Next.js application that communicates with the deployed backend.

### Environment Variables Required
Configure this in Vercel for the frontend project:

```env
# Point this to your deployed Backend URL
BACKEND_API_URL="https://your-deployed-backend-url.onrender.com/api"
```

### Build & Start Commands
- **Framework Preset**: Next.js (Vercel automatically detects this).
- **Root Directory**: `frontend` (Ensure you set the root directory in Vercel settings so it builds the frontend properly).
- **Build Command**: `npm run build`

---

## 5. Security Checklist Before Going Live

1. **CORS Policy**: Ensure `CLIENT_URL` in the backend environment correctly points to your production frontend domain so that only your frontend can communicate with the API.
2. **JWT Secret**: Generate a strong, random 256-bit string for the `JWT_SECRET`. Do not use the fallback development string.
3. **API Keys**: Ensure your `GEMINI_API_KEY` is not checked into version control.

## 6. Post-Deployment Verification

1. Access the frontend URL.
2. Register a test Learner account.
3. Attempt to upload a resume on the onboarding page (This verifies that the memory storage, PDF parser, and AI extraction are working).
4. Verify the backend logs to confirm successful database connectivity and AI generation.
