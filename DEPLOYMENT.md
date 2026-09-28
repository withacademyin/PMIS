# Hiring Portal - Deployment Guide

This guide outlines the steps and requirements for deploying the Full-Stack Hiring Portal. The architecture consists of a Next.js frontend, an Express.js backend, and a Neon Serverless PostgreSQL database.

---

## 1. Architecture Overview

- **Frontend**: Next.js (React). Best deployed to **Vercel** or **Netlify**.
- **Backend**: Node.js + Express.js. Best deployed to **Render**, **Railway**, or **Fly.io** (platforms that support long-running processes).
- **Database**: Neon Serverless Postgres.
- **AI Models**: 
  - Uses OpenAI API.
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
OPENAI_API_KEY="your_openai_api_key"
```

### Build & Start Commands
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `npm run start`

*Note: The `prisma migrate deploy` command will automatically enable the required `pgvector` extension on your Neon database.*

---

## 4. Frontend Deployment (Vercel)

The frontend is a standard Next.js application that communicates with the deployed backend.

### Environment Variables Required
Configure these in Vercel / Netlify for the frontend:

```env
# Point this to your deployed Backend URL
BACKEND_API_URL="https://your-deployed-backend-url.onrender.com/api"
NEXT_PUBLIC_API_URL="https://your-deployed-backend-url.onrender.com/api"

# Carto Basemaps API Key (For Live Real Radar Map)
NEXT_PUBLIC_CARTO_API_KEY="cb1_40zk_1_8df9d09851341ba1a4182945"
```

### Build & Deploy Settings (Vercel)
- **Framework Preset**: Next.js (automatically detected)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
### Git & Deployment Flow (Simple, No CI/CD)
This project is configured for direct, simple deployment without complex CI/CD pipelines:
- Simply push your code directly to GitHub: `git push origin <branch>`
- Connect your GitHub repository directly to **Vercel** (for frontend) and **Render** / **Railway** (for backend).
- Both platforms auto-deploy whenever you push changes to your branch.
- To populate a fresh Neon database with the 1,538 ITIs and coordinates:
  ```bash
  cd backend
  DATABASE_URL="your-neon-url" npm run db:init
  ```

---

## 5. Security Checklist Before Going Live

1. **CORS Policy**: Ensure `CLIENT_URL` in the backend environment correctly points to your production frontend domain so that only your frontend can communicate with the API.
2. **JWT Secret**: Generate a strong, random 256-bit string for the `JWT_SECRET`. Do not use the fallback development string.
3. **API Keys**: Ensure your `OPENAI_API_KEY` is not checked into version control.

## 6. Post-Deployment Verification

1. Access the frontend URL.
2. Register a test Learner account.
3. Attempt to upload a resume on the onboarding page (This verifies that the memory storage, PDF parser, and AI extraction are working).
4. Verify the backend logs to confirm successful database connectivity and AI generation.
