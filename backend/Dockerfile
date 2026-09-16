FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (force dev dependencies so Prisma CLI is installed even if NODE_ENV=production)
RUN npm ci --include=dev

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5001

# The startup script should run migrations, seed, and then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
