#!/bin/bash

# SQLite3 Deployment Fix Script
# This script ensures SQLite3 is properly rebuilt for the deployment environment

echo "🔧 Starting SQLite3 deployment fix..."

# Check if we're in a deployment environment
if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Production environment detected"
    
    # Remove existing SQLite3 binaries
    echo "🗑️  Removing existing SQLite3 binaries..."
    rm -rf node_modules/sqlite3/build/
    rm -rf node_modules/sqlite3/lib/binding/
    
    # Clear npm cache
    echo "🧹 Clearing npm cache..."
    npm cache clean --force
    
    # Reinstall SQLite3 from source
    echo "🔨 Rebuilding SQLite3 from source..."
    npm rebuild sqlite3 --build-from-source --sqlite=/usr/include
    
    # Verify SQLite3 installation
    echo "✅ Verifying SQLite3 installation..."
    node -e "try { require('sqlite3'); console.log('SQLite3 loaded successfully'); } catch(e) { console.error('SQLite3 load failed:', e.message); process.exit(1); }"
    
    echo "🎉 SQLite3 deployment fix completed successfully"
else
    echo "🏠 Development environment - running basic rebuild..."
    npm rebuild sqlite3
fi

echo "✨ Script completed"