# 🔧 SQLite3 Deployment Fix Guide

## Problem Description

The error `invalid ELF header` occurs when SQLite3 native binaries are compiled for a different architecture than the deployment environment. This commonly happens when:

1. Developing on macOS/Windows and deploying to Linux
2. Using pre-compiled binaries that don't match the target platform
3. Node modules weren't properly rebuilt for the deployment environment

## ✅ Solutions Applied

### 1. Updated Build Command (render.yaml)
```yaml
buildCommand: npm ci && npm rebuild sqlite3 && npm run build
```

### 2. Added Rebuild Scripts (package.json)
```json
"postinstall": "npm rebuild sqlite3",
"rebuild-native": "npm rebuild sqlite3"
```

## 🚀 Deployment Steps for Render.com

### Method 1: Automatic Rebuild (Recommended)
The updated configuration should automatically fix the issue:

1. **Push changes to GitHub**:
```bash
git add .
git commit -m "Fix SQLite3 native binary compatibility for Render deployment"
git push origin main
```

2. **Redeploy on Render**:
- Go to your Render dashboard
- Click "Manual Deploy" → "Deploy latest commit"
- Or wait for auto-deploy if enabled

### Method 2: Clear Build Cache
If the automatic rebuild doesn't work:

1. **In Render Dashboard**:
- Go to your service
- Settings → "Clear build cache"
- Redeploy

### Method 3: Force Rebuild
Add this environment variable in Render:
```
RENDER_REBUILD_SQLITE3=true
```

## 🔄 Alternative Database Options

If SQLite3 continues to cause issues, consider these alternatives:

### Option A: Better SQLite3 (More Reliable)
```bash
npm uninstall sqlite3
npm install better-sqlite3
```

Then update your database code to use `better-sqlite3` which has better native compilation support.

### Option B: PostgreSQL (Recommended for Production)
Render offers managed PostgreSQL which eliminates native binary issues:

1. **Add PostgreSQL service** in render.yaml:
```yaml
databases:
  - name: videoconference-postgres
    databaseName: videoconference
    user: videoconference_user
```

2. **Install PostgreSQL client**:
```bash
npm install pg
npm install @types/pg --save-dev
```

3. **Update database connection** to use PostgreSQL instead of SQLite

### Option C: In-Memory Fallback
For testing purposes, you can use in-memory storage:

```javascript
// In your database configuration
const dbPath = process.env.NODE_ENV === 'production' 
  ? ':memory:' 
  : './database/videoconference.db';
```

## 🛠️ Troubleshooting Commands

### Check Node/NPM Versions
```bash
node --version
npm --version
```

### Manual SQLite3 Rebuild
```bash
npm rebuild sqlite3 --build-from-source
```

### Clear NPM Cache
```bash
npm cache clean --force
```

### Verify SQLite3 Installation
```bash
npm ls sqlite3
```

## 📋 Pre-Deployment Checklist

- [ ] Updated render.yaml with rebuild command
- [ ] Added postinstall script to package.json  
- [ ] Committed and pushed changes to GitHub
- [ ] Cleared Render build cache
- [ ] Set environment variables properly
- [ ] Tested local build with production settings

## 🔍 Verification Steps

After deployment, check that:

1. **Build logs** show successful SQLite3 rebuild
2. **Application starts** without ELF header errors
3. **Database operations** work correctly
4. **Health check** endpoint responds

## 🆘 If Issues Persist

### Immediate Workaround
Use this environment variable to skip SQLite3 for now:
```
USE_MEMORY_DB=true
```

### Long-term Solutions
1. **Migrate to PostgreSQL** for better cloud compatibility
2. **Use better-sqlite3** as a drop-in replacement
3. **Implement database abstraction** to support multiple backends

## 📞 Support Resources

- **Render SQLite3 Guide**: [Render Docs - Native Dependencies](https://render.com/docs/native-dependencies)
- **SQLite3 NPM Issues**: Check GitHub issues for similar problems
- **Alternative Databases**: Consider managed database solutions

## 🔄 Quick Recovery Commands

If deployment fails, run these locally to test:

```bash
# Clean install and rebuild
rm -rf node_modules package-lock.json
npm install
npm rebuild sqlite3

# Test production build
NODE_ENV=production npm start
```

This should resolve the SQLite3 ELF header error and ensure smooth deployment to Render.com.