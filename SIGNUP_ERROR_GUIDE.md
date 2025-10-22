# 🚫 Signup Error: Email Already Exists

## Problem
You're getting a **409 Conflict** error when trying to sign up. This means the email address is already registered in the system.

## Current Registered Users
Based on the database check, these emails are already registered:
- `admin@videoconference.com` (Admin account)
- `kv@ex.com` (Regular user account)

## Solutions

### ✅ **Option 1: Use a Different Email**
Try signing up with a new email address:
```
Examples:
• test@example.com
• user@demo.com  
• yourname@domain.com
```

### ✅ **Option 2: Sign In with Existing Account** 
If you already have an account, switch to the "Sign In" tab:

**For Admin Access:**
- Email: `admin@videoconference.com`
- Password: `admin123`

**For Regular User:**
- Email: `kv@ex.com`
- Password: (the password you set when creating this account)

### ✅ **Option 3: Reset/Clear Database (Development Only)**
If you're in development and want to start fresh:

1. Stop the servers (Ctrl+C in terminals)
2. Delete the user database:
   ```bash
   rm /Users/kvaksin/Documents/GitHub/videoconference/database/users.json
   ```
3. Restart the servers
4. Try signing up again

## Improvements Made

I've enhanced the error handling to:
1. **Provide clearer error messages** with suggestions
2. **Auto-suggest switching to Sign In** when email exists
3. **Better user experience** with helpful guidance

## Quick Test

Try these steps:
1. Use a completely new email (like `test123@example.com`)
2. Or switch to "Sign In" tab and use existing credentials
3. The error should now be more helpful and guide you to the solution

The application is working correctly - it's just protecting against duplicate accounts! 🛡️