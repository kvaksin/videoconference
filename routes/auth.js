const express = require('express');
const router = express.Router();
const { 
    generateToken, 
    comparePassword, 
    isValidEmail, 
    isValidPassword,
    authenticateToken 
} = require('../middleware/auth');

// Initialize with database when router is used
let db;

function initializeRouter(database) {
    db = database;
    return router;
}

// Sign up route
router.post('/signup', async (req, res) => {
    try {
        const { email, fullName, password } = req.body;

        // Validation
        if (!email || !fullName || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        if (fullName.trim().length < 2) {
            return res.status(400).json({ error: 'Full name must be at least 2 characters long' });
        }

        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Create new user
        const newUser = await db.createUser(email, fullName.trim(), password);
        
        // Generate token
        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.fullName,
            is_admin: newUser.isAdmin,
            has_full_license: newUser.hasFullLicense
        });

        // Store token in session
        req.session.token = token;
        req.session.userId = newUser.id;

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.fullName,
                isAdmin: newUser.isAdmin,
                hasFullLicense: newUser.hasFullLicense
            },
            token
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sign in route
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user from database
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        await db.updateLastLogin(user.id);

        // Generate token
        const token = generateToken(user);

        // Store token in session
        req.session.token = token;
        req.session.userId = user.id;

        res.json({
            message: 'Sign in successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                isAdmin: user.is_admin,
                hasFullLicense: user.has_full_license
            },
            token
        });

    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sign out route
router.post('/signout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not sign out' });
        }
        res.json({ message: 'Signed out successfully' });
    });
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            isAdmin: user.is_admin,
            hasFullLicense: user.has_full_license,
            createdAt: user.created_at,
            lastLogin: user.last_login
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: {
            id: req.user.id,
            email: req.user.email,
            fullName: req.user.fullName,
            isAdmin: req.user.isAdmin,
            hasFullLicense: req.user.hasFullLicense
        }
    });
});

// Update user timezone
router.post('/update-timezone', authenticateToken, async (req, res) => {
    try {
        const { timezone } = req.body;
        
        if (!timezone) {
            return res.status(400).json({ error: 'Timezone is required' });
        }
        
        // Update user timezone in database
        await db.updateUserTimezone(req.user.id, timezone);
        
        res.json({ message: 'Timezone updated successfully' });
    } catch (error) {
        console.error('Update timezone error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password route
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All password fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New password and confirmation do not match' });
        }

        if (!isValidPassword(newPassword)) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'New password must be different from current password' });
        }

        // Update password
        try {
            await db.updateUserPassword(userId, currentPassword, newPassword);
            
            res.json({
                success: true,
                message: 'Password updated successfully'
            });

        } catch (updateError) {
            if (updateError.message === 'Current password is incorrect') {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }
            if (updateError.message === 'User not found') {
                return res.status(404).json({ error: 'User not found' });
            }
            throw updateError;
        }

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

module.exports = { router, initializeRouter };