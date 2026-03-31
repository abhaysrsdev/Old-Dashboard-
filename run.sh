l#!/bin/bash

echo "🚀 Starting Production Monitoring System..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install it first."
    exit 1
fi

# Create virtual environment if it doesn't exist (optional but good practice)
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
if [ -f "requirements.txt" ]; then
    echo "📦 Installing dependencies from requirements.txt..."
    pip install -r requirements.txt
else
    echo "⚠️ requirements.txt not found!"
fi

# Kill existing uvicorn processes
echo "🛑 Killing old processes..."
pkill -f uvicorn || true
sleep 1

# Start the uvicorn server
echo "🔥 Starting Uvicorn Server..."
echo "👉 Dashboard available at: http://localhost:8000"

# Use uvicorn directly. --reload is useful for development.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
