#!/bin/bash

# TypeScript React Development Setup Script
# This script sets up the development environment for the TypeScript React video conference app

echo "🚀 Setting up TypeScript React Video Conference Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 16+ and try again."
    exit 1
fi

print_success "Node.js version $NODE_VERSION detected"

# Install root dependencies
print_status "Installing root project dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install root dependencies"
    exit 1
fi
print_success "Root dependencies installed"

# Install client dependencies
print_status "Installing client dependencies..."
cd client
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install client dependencies"
    exit 1
fi
print_success "Client dependencies installed"

# Run TypeScript type checking
print_status "Running TypeScript type checking..."
npm run type-check
if [ $? -ne 0 ]; then
    print_error "TypeScript type checking failed"
    exit 1
fi
print_success "TypeScript type checking passed"

# Run linting
print_status "Running code linting..."
npm run lint
if [ $? -ne 0 ]; then
    print_warning "Linting found issues (this won't prevent setup from completing)"
else
    print_success "Code linting passed"
fi

# Build the project to ensure everything works
print_status "Building the project..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Project build failed"
    exit 1
fi
print_success "Project built successfully"

cd ..

print_success "🎉 TypeScript React development environment setup complete!"
echo
echo "📚 Available Commands:"
echo "  npm run dev:full       - Start both server and client in development mode"
echo "  npm run client         - Start only the React client"
echo "  npm run dev            - Start only the server"
echo "  npm run type-check     - Run TypeScript type checking"
echo "  npm run lint           - Run ESLint code checking"
echo "  npm run build          - Build production version"
echo
echo "🔧 Development Workflow:"
echo "  1. Run 'npm run dev:full' to start both server and client"
echo "  2. Open http://localhost:3000 for the React app"
echo "  3. Server runs on http://localhost:3001"
echo "  4. Make changes to TypeScript files in client/src/"
echo "  5. Hot reload will update the browser automatically"
echo
echo "📝 TypeScript Features:"
echo "  ✅ Strict type checking enabled"
echo "  ✅ React components with TypeScript"
echo "  ✅ Comprehensive type definitions"
echo "  ✅ WebRTC and Socket.IO types"
echo "  ✅ API response typing"
echo "  ✅ ESLint integration"
echo
print_success "Happy coding! 🚀"