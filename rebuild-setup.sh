#!/bin/bash

# Video Conference App - Complete Rebuild Script
# This script will create a fresh, stable application from scratch

echo "🚀 Starting Video Conference App Rebuild..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create new project directory
PROJECT_NAME="videoconference-v2"
echo -e "${BLUE}Creating new project: $PROJECT_NAME${NC}"

# Clean up old files (if needed)
# Uncomment if you want to start completely fresh
# rm -rf node_modules client/node_modules package-lock.json client/package-lock.json

# Create directory structure
echo -e "${GREEN}✓${NC} Creating directory structure..."
mkdir -p server/src/{routes,controllers,services,middleware,models,utils,types,config}
mkdir -p server/data
mkdir -p client/src/{components,pages,services,hooks,contexts,types,utils,assets}
mkdir -p client/public
mkdir -p docs

echo -e "${GREEN}✓${NC} Project structure created successfully!"

echo ""
echo "📋 Next steps:"
echo "1. Copy the configuration files provided"
echo "2. Run 'npm install' in root directory"
echo "3. Run 'cd client && npm install'"
echo "4. Run 'npm run dev' to start development servers"
echo ""
echo "✨ Setup complete! Check the documentation for detailed instructions."
