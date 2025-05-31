# Development stage
FROM node:20-slim

WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Set development environment
ENV NODE_ENV=development

# Set API URL (can be overridden by docker-compose)
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# Expose the port the app runs on
EXPOSE 3000

# The command will be overridden by docker-compose
CMD ["npm", "run", "dev"]
