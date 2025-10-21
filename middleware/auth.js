const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.session.token;

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Admin middleware
function requireAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Full license middleware
function requireFullLicense(req, res, next) {
    if (!req.user || !req.user.hasFullLicense) {
        return res.status(403).json({ error: 'Full license required for this feature' });
    }
    next();
}

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            isAdmin: user.is_admin,
            hasFullLicense: user.has_full_license
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// Hash password
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Compare password
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password) {
    // At least 6 characters
    return password && password.length >= 6;
}

module.exports = {
    authenticateToken,
    requireAdmin,
    requireFullLicense,
    generateToken,
    hashPassword,
    comparePassword,
    isValidEmail,
    isValidPassword,
    JWT_SECRET
};