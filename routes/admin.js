const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Initialize with database when router is used
let db;

function initializeRouter(database) {
    db = database;
    return router;
}

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user license (admin only)
router.put('/users/:userId/license', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { hasFullLicense } = req.body;

        console.log('Update license request:', { userId, hasFullLicense, user: req.user });

        if (typeof hasFullLicense !== 'boolean') {
            console.log('Invalid hasFullLicense type:', typeof hasFullLicense);
            return res.status(400).json({ error: 'hasFullLicense must be a boolean' });
        }

        const result = await db.updateUserLicense(userId, hasFullLicense);
        console.log('Database update result:', result);
        
        if (result.changes === 0) {
            console.log('No changes made, user not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        // Get updated user info
        const user = await db.getUserById(userId);
        console.log('Updated user:', user);
        
        res.json({
            message: 'User license updated successfully',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                isAdmin: user.is_admin,
                hasFullLicense: user.has_full_license
            }
        });
    } catch (error) {
        console.error('Update license error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user admin status (admin only)
router.put('/users/:userId/admin', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { isAdmin } = req.body;

        console.log('Update admin status request:', { userId, isAdmin, user: req.user });

        // Prevent self-demotion
        if (parseInt(userId) === req.user.id && !isAdmin) {
            return res.status(400).json({ error: 'You cannot demote yourself from admin' });
        }

        if (typeof isAdmin !== 'boolean') {
            console.log('Invalid isAdmin type:', typeof isAdmin);
            return res.status(400).json({ error: 'isAdmin must be a boolean' });
        }

        const result = await db.updateUserAdminStatus(userId, isAdmin);
        console.log('Database admin update result:', result);
        
        if (result.changes === 0) {
            console.log('No changes made, user not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        // Get updated user info
        const user = await db.getUserById(userId);
        console.log('Updated user admin status:', user);
        
        res.json({
            message: `User ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully`,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                isAdmin: user.is_admin,
                hasFullLicense: user.has_full_license
            }
        });
    } catch (error) {
        console.error('Update admin status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get system statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await db.getAllUsers();
        const totalUsers = users.length;
        const fullLicenseUsers = users.filter(user => user.has_full_license).length;
        const adminUsers = users.filter(user => user.is_admin).length;
        
        // Get recent signups (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSignups = users.filter(user => 
            new Date(user.created_at) > thirtyDaysAgo
        ).length;

        res.json({
            totalUsers,
            fullLicenseUsers,
            adminUsers,
            recentSignups,
            basicUsers: totalUsers - fullLicenseUsers
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create user (admin only)
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { email, fullName, password, isAdmin = false, hasFullLicense = false } = req.body;

        // Validation
        if (!email || !fullName || !password) {
            return res.status(400).json({ error: 'Email, full name, and password are required' });
        }

        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Create new user
        const newUser = await db.createUser(email, fullName, password, isAdmin, hasFullLicense);
        
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.fullName,
                isAdmin: newUser.isAdmin,
                hasFullLicense: newUser.hasFullLicense
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = { router, initializeRouter };