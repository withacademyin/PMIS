# Hiring Portal

A comprehensive hiring portal built with Next.js, Express, PostgreSQL, and Prisma. It connects students and recruiters, featuring AI-powered resume screening, skill assessments, and onboarding flows.

## Tech Stack
- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **AI/LLM**: OpenAI API

## Prerequisites
- Docker & Docker Compose (Recommended)
- Node.js 18+ (If running manually)
- PostgreSQL 15+ (If running manually)

## Quick Start (with Docker) - Recommended

1. **Environment Variables**:
   Copy the example environment files and fill in your secrets (specifically your `OPENAI_API_KEY`).
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Run with Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```
   This will start:
   - PostgreSQL Database on port `5432`
   - Express Backend on `http://localhost:5001`
   - Next.js Frontend on `http://localhost:3000`

   *Note: The backend container will automatically run database migrations and seed the database on startup.*

## Manual Setup (without Docker)

If you prefer to run things locally without Docker:

1. **Database**: Ensure you have a local PostgreSQL instance running and create a database named `internship_mvp`.
2. **Backend**:
   ```bash
   cd backend
   cp .env.example .env # Update DATABASE_URL and OPENAI_API_KEY
   npm install
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```
3. **Frontend**:
   ```bash
   cd ../frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
