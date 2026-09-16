FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5001

# The startup script should run migrations, seed, and then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
