#!/usr/bin/env bash

# ==============================================================================
# Hiring Portal - Complete Application Launcher (Backend + Frontend)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"

# Colors for terminal output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}        🚀 Starting Hiring Portal Application        ${NC}"
echo -e "${BLUE}======================================================${NC}"

# ------------------------------------------------------------------------------
# 1. Check and Start PostgreSQL Database
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[1/4] Checking PostgreSQL database service...${NC}"

if pg_isready -h localhost -p 5432 -q 2>/dev/null; then
  echo -e "${GREEN}✓ PostgreSQL is active and accepting connections.${NC}"
else
  echo -e "${YELLOW}⚡ PostgreSQL is not running. Attempting to start service...${NC}"
  
  if command -v brew >/dev/null 2>&1; then
    brew services start postgresql@17 2>/dev/null || brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || true
  fi

  # Wait up to 10 seconds for Postgres to become ready
  RETRIES=10
  until pg_isready -h localhost -p 5432 -q 2>/dev/null || [ $RETRIES -eq 0 ]; do
    echo -e "Waiting for PostgreSQL to start... ($RETRIES attempts left)"
    sleep 1
    RETRIES=$((RETRIES - 1))
  done

  if ! pg_isready -h localhost -p 5432 -q 2>/dev/null; then
    echo -e "${RED}✗ Error: PostgreSQL could not be started on port 5432.${NC}"
    echo -e "Please start PostgreSQL manually (e.g., 'brew services start postgresql@17') and re-run."
    exit 1
  fi
  echo -e "${GREEN}✓ PostgreSQL service started successfully.${NC}"
fi

# ------------------------------------------------------------------------------
# 2. Verify Database Existence
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[2/4] Verifying database schema...${NC}"

CURRENT_USER=$(whoami)
DB_NAME="iti-portal"

if ! psql -h localhost -p 5432 -U "${CURRENT_USER}" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
  echo -e "${YELLOW}Database '${DB_NAME}' does not exist. Creating...${NC}"
  createdb -h localhost -p 5432 -U "${CURRENT_USER}" "${DB_NAME}" || true
  echo -e "${GREEN}✓ Created database '${DB_NAME}'.${NC}"
fi

# ------------------------------------------------------------------------------
# 3. Synchronize Prisma and Install Dependencies
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[3/4] Preparing Backend & Frontend environments...${NC}"

# Backend
cd "${BACKEND_DIR}"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Backend dependencies not found. Running npm install...${NC}"
  npm install
fi
echo -e "Synchronizing Backend Prisma schema..."
npx prisma generate --schema=prisma/schema.prisma >/dev/null 2>&1 || npx prisma generate
npx prisma migrate deploy --schema=prisma/schema.prisma 2>/dev/null || true

# Frontend
cd "${FRONTEND_DIR}"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Frontend dependencies not found. Running npm install...${NC}"
  npm install
fi

# ------------------------------------------------------------------------------
# 4. Launch Backend (Port 5001) & Frontend (Port 5173)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[4/4] Starting Web Server & Dedicated API...${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "  🌐 Frontend App:   ${GREEN}http://localhost:5173${NC}"
echo -e "  🎓 Student App:    ${GREEN}http://localhost:5173/dashboard/student${NC}"
echo -e "  💼 Recruiter App:  ${GREEN}http://localhost:5173/dashboard/recruiter${NC}"
echo -e "  ⚙️  Backend API:    ${GREEN}http://localhost:5001/api${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Press Ctrl+C at any time to stop all services.\n"

# Trap process exit to terminate background jobs cleanly
cleanup() {
  echo -e "\n${YELLOW}Stopping backend and frontend servers...${NC}"
  kill 0 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start backend in background
cd "${BACKEND_DIR}"
npm run dev &
BACKEND_PID=$!

# Start frontend in foreground
cd "${FRONTEND_DIR}"
npm run dev
