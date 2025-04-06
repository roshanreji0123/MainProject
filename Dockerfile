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
FROM python:3.11-slim

# Set environment variables to prevent caching issues with pip
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required by some Python packages if necessary
# Example: RUN apt-get update && apt-get install -y --no-install-recommends some-package && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
# This includes main.py, agents.py, tasks.py, etc.
COPY . .

# Copy the necessary DejaVu font files into the /app directory
COPY DejaVuSans.ttf /app/
COPY DejaVuSans-Bold.ttf /app/
COPY DejaVuSans-Oblique.ttf /app/

# Create directories (pdf is also needed now)
RUN mkdir -p /app/images && chmod 777 /app/images
RUN mkdir -p /app/pdf && chmod 777 /app/pdf

# Copy the built frontend files from the builder stage
COPY --from=builder /app/frontend/dist ./dist

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define environment variables if needed (though often passed at runtime)
# Use key=value format for ENV
# ENV SERPAPI_API_KEY=YOUR_SERPAPI_API_KEY_HERE
# ENV OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# Run main.py when the container launches
CMD ["python", "main.py"]
