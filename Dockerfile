FROM python:3.10

# Install dependencies
RUN apt-get update && \
    apt-get install -y \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create images directory and set permissions
RUN mkdir -p /app/images && chmod 777 /app/images

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run the application
CMD ["python", "main.py"]
