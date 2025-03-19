# Stage 1: Build the frontend
FROM node:18 as builder
WORKDIR /app/frontend

# Copy frontend package files
COPY package.json package-lock.json ./
# Copy frontend config files (adjust if needed based on your project)
COPY vite.config.ts tsconfig.json tsconfig.node.json tsconfig.app.json tailwind.config.js postcss.config.js index.html ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY src ./src

# Build the frontend
RUN npm run build

# Stage 2: Setup the Python backend and copy built frontend
FROM python:3.10

# Install OS dependencies (like xdg-utils if needed for PDF opening, though less relevant in container)
# RUN apt-get update && apt-get install -y xdg-utils && rm -rf /var/lib/apt/lists/*
# Keeping xdg-utils commented out as opening files directly isn't typical in server containers

WORKDIR /app

# Create directories (pdf is also needed now)
RUN mkdir -p /app/images && chmod 777 /app/images
RUN mkdir -p /app/pdf && chmod 777 /app/pdf

# Copy Python requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend application code
# Exclude frontend source and node_modules by using .dockerignore later if needed
COPY . .

# Copy the built frontend files from the builder stage
COPY --from=builder /app/frontend/dist ./dist

# Expose the port Flask will run on
EXPOSE 5000

# Run the Flask application
# Use Gunicorn or Waitress for production instead of Flask development server
# For now, run chmod on mounted dirs before starting Flask dev server:
CMD ["sh", "-c", "chmod 777 /app/pdf /app/images && python main.py"]
