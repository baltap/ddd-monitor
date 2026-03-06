# Use a base image with Node.js and Chromium dependencies
FROM node:18-slim

# Install system dependencies for Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (all files)
COPY . .

# Build frontend (client)
RUN npm run build

# Expose ports (Vite/Client and Express/Server)
# In production, we usually serve the build via Express
EXPOSE 3001

# Run the server which serves both API and Client
CMD ["npm", "run", "dev:server"]
