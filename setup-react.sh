#!/bin/bash

echo "🚀 Starting React + Node.js VideoConference Migration"

# Install root dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install client dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

echo "✅ Installation complete!"
echo ""
echo "To start development:"
echo "1. Backend: npm run dev (port 3001)"
echo "2. Frontend: npm run client (port 3000)"
echo ""
echo "Or run both with: npm run dev & npm run client"