# Admin Account Configuration Guide

This guide explains how to configure admin account creation for the video conferencing platform.

## Overview

The platform supports flexible admin account configuration through environment variables, allowing you to:
- Skip default admin creation entirely
- Create a default admin with a custom password
- Create admin accounts manually through the registration process

## Configuration Options

### Option 1: No Default Admin (Manual Setup)

To start the database without any default admin account:

```bash
CREATE_DEFAULT_ADMIN=false npm run start:ts
```

**Benefits:**
- No hardcoded credentials
- Complete control over admin account creation
- Enhanced security through manual setup

**Setup Process:**
1. Start the application with `CREATE_DEFAULT_ADMIN=false`
2. Register a new user through the normal registration process
3. Manually update the user's admin status in the database:

```sql
UPDATE users SET is_admin = 1, has_full_license = 1 WHERE email = 'your-email@example.com';
```

### Option 2: Custom Default Admin Password

To create a default admin with your own secure password:

```bash
DEFAULT_ADMIN_PASSWORD=your-secure-password npm run start:ts
```

**Benefits:**
- Automated admin account creation
- Custom password instead of default
- Ready-to-use admin access

**Admin Credentials:**
- Email: `admin@videoconference.com`
- Password: Your custom password from `DEFAULT_ADMIN_PASSWORD`

### Option 3: Disable Admin Creation with Existing Database

If you already have admin users in your database, the system will automatically skip admin creation regardless of environment variables:

```bash
npm run start:ts
```

The system checks for existing admin users and only creates a default admin if none exist.

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `CREATE_DEFAULT_ADMIN` | `true` | Set to `false` to disable default admin creation |
| `DEFAULT_ADMIN_PASSWORD` | None | Required if `CREATE_DEFAULT_ADMIN` is true and no admin exists |

## Security Best Practices

### For Development
```bash
# Use a development password
DEFAULT_ADMIN_PASSWORD=dev-admin-123 npm run dev:ts
```

### For Production
```bash
# Use environment variables for security
export CREATE_DEFAULT_ADMIN=true
export DEFAULT_ADMIN_PASSWORD=$(openssl rand -base64 32)
npm start
```

### For High-Security Environments
```bash
# Disable automatic admin creation
export CREATE_DEFAULT_ADMIN=false
npm start
```

Then create admin accounts manually with proper security procedures.

## Database Behavior

### SQLite Database (database.ts)
- Checks for existing admin users before creating default admin
- Uses bcrypt hashing with 10 salt rounds
- Creates admin with full license automatically

### JSON Database (jsonDatabase.js)  
- Checks for existing admin users before creating default admin
- Uses bcrypt hashing with 10 salt rounds
- Creates admin with full license and proper timestamps

## Startup Messages

The application will display different messages based on your configuration:

### Manual Setup Mode
```
=== Manual Admin Setup ===
Default admin creation disabled.
Create your first admin user through the registration process.
==========================
```

### Custom Password Mode
```
=== Default Admin Account ===
Email: admin@videoconference.com
Password: (from DEFAULT_ADMIN_PASSWORD env var)
Please change the password after first login!
=============================
```

### No Password Provided
```
=== Admin Setup Required ===
No DEFAULT_ADMIN_PASSWORD environment variable set.
Either:
1. Set DEFAULT_ADMIN_PASSWORD environment variable, or
2. Set CREATE_DEFAULT_ADMIN=false and create admin manually
============================
```

## Troubleshooting

### Problem: Admin account not created
**Solution:** Check that `CREATE_DEFAULT_ADMIN` is not set to `false` and `DEFAULT_ADMIN_PASSWORD` is provided.

### Problem: Cannot login with default admin
**Solution:** Verify the `DEFAULT_ADMIN_PASSWORD` environment variable value matches what you're entering.

### Problem: Multiple admin accounts created
**Solution:** The system prevents this by checking for existing admins. If you see multiple admins, they were created manually.

## Migration from Legacy Setup

If you're upgrading from a version that always created `admin123` password:

1. **Immediate Action Required:** Change any existing admin passwords
2. **New Deployments:** Use `DEFAULT_ADMIN_PASSWORD` for custom passwords
3. **Security Review:** Consider using `CREATE_DEFAULT_ADMIN=false` for production

## Examples

### Development Environment
```bash
# .env file
CREATE_DEFAULT_ADMIN=true
DEFAULT_ADMIN_PASSWORD=dev-admin-password-123

# Start server
npm run dev:ts
```

### Production Environment
```bash
# Environment variables
export CREATE_DEFAULT_ADMIN=true
export DEFAULT_ADMIN_PASSWORD="$(openssl rand -base64 32)"
export JWT_SECRET="$(openssl rand -base64 32)"
export SESSION_SECRET="$(openssl rand -base64 32)"

# Start server
npm start
```

### High-Security Environment
```bash
# No default admin - manual setup only
export CREATE_DEFAULT_ADMIN=false
export JWT_SECRET="$(openssl rand -base64 32)"
export SESSION_SECRET="$(openssl rand -base64 32)"

# Start server
npm start

# Then create admin manually through registration + database update
```

## Verification

To verify your admin setup:

1. **Check Database:**
   ```sql
   SELECT email, full_name, is_admin, has_full_license FROM users WHERE is_admin = 1;
   ```

2. **Test Login:**
   - Navigate to `http://localhost:3001/login`
   - Use admin credentials
   - Verify access to admin panel at `http://localhost:3001/admin`

3. **Security Check:**
   - Ensure default passwords are changed
   - Verify strong password requirements
   - Confirm admin users have full licenses