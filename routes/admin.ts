import express, { Request, Response, Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { Database } from '../database/database';
import { User, ApiResponse } from '../src/types';

const router: Router = express.Router();

// Initialize with database when router is used
let db: Database;

function initializeRouter(database: Database): Router {
    db = database;
    return router;
}

// Extend Request interface for authenticated requests
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        fullName: string;
        isAdmin: boolean;
        hasFullLicense: boolean;
    };
}

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users: User[] = await db.getAllUsers();
        
        const response: ApiResponse<User[]> = {
            success: true,
            data: users.map(user => ({
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                isAdmin: user.isAdmin,
                hasFullLicense: user.hasFullLicense,
                createdAt: user.createdAt
            }))
        };
        
        res.json(response);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user license (admin only)
router.put('/users/:userId/license', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { hasFullLicense } = req.body;

        console.log('Update license request:', { userId, hasFullLicense, user: req.user });

        if (typeof hasFullLicense !== 'boolean') {
            console.log('Invalid hasFullLicense type:', typeof hasFullLicense);
            res.status(400).json({ error: 'hasFullLicense must be a boolean' });
            return;
        }

        // Update user license
        const updatedUser = await db.updateUser(userId, { hasFullLicense });
        
        if (!updatedUser) {
            console.log('User not found:', userId);
            res.status(404).json({ error: 'User not found' });
            return;
        }

        console.log('Updated user:', updatedUser);
        
        const response: ApiResponse<User> = {
            success: true,
            message: 'User license updated successfully',
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                isAdmin: updatedUser.isAdmin,
                hasFullLicense: updatedUser.hasFullLicense,
                createdAt: updatedUser.createdAt
            }
        };
        
        res.json(response);
    } catch (error) {
        console.error('Update license error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user admin status (admin only)
router.put('/users/:userId/admin', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { isAdmin } = req.body;

        console.log('Update admin status request:', { userId, isAdmin, user: req.user });

        // Prevent self-demotion
        if (userId === req.user?.id && !isAdmin) {
            res.status(400).json({ error: 'You cannot demote yourself from admin' });
            return;
        }

        if (typeof isAdmin !== 'boolean') {
            console.log('Invalid isAdmin type:', typeof isAdmin);
            res.status(400).json({ error: 'isAdmin must be a boolean' });
            return;
        }

        // Update user admin status
        const updatedUser = await db.updateUser(userId, { isAdmin });
        
        if (!updatedUser) {
            console.log('User not found:', userId);
            res.status(404).json({ error: 'User not found' });
            return;
        }

        console.log('Updated user admin status:', updatedUser);
        
        const response: ApiResponse<User> = {
            success: true,
            message: `User ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully`,
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                isAdmin: updatedUser.isAdmin,
                hasFullLicense: updatedUser.hasFullLicense,
                createdAt: updatedUser.createdAt
            }
        };
        
        res.json(response);
    } catch (error) {
        console.error('Update admin status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get system statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users: User[] = await db.getAllUsers();
        const totalUsers = users.length;
        const fullLicenseUsers = users.filter(user => user.hasFullLicense).length;
        const adminUsers = users.filter(user => user.isAdmin).length;
        
        // Get recent signups (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSignups = users.filter(user => 
            user.createdAt && new Date(user.createdAt) > thirtyDaysAgo
        ).length;

        const stats = {
            totalUsers,
            fullLicenseUsers,
            adminUsers,
            recentSignups,
            basicUsers: totalUsers - fullLicenseUsers
        };

        const response: ApiResponse<typeof stats> = {
            success: true,
            data: stats
        };

        res.json(response);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all meetings (admin only)
router.get('/meetings', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const meetings = await db.getAllMeetings();
        
        const response: ApiResponse<typeof meetings> = {
            success: true,
            data: meetings
        };
        
        res.json(response);
    } catch (error) {
        console.error('Get meetings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create user (admin only)
router.post('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { email, fullName, password, isAdmin = false, hasFullLicense = false } = req.body;

        // Validation
        if (!email || !fullName || !password) {
            res.status(400).json({ error: 'Email, full name, and password are required' });
            return;
        }

        // Create new user
        const userData = {
            email: email.toLowerCase().trim(),
            fullName: fullName.trim(),
            password: password,
            role: isAdmin ? 'admin' as const : 'user' as const,
            hasFullLicense: hasFullLicense
        };

        const newUser = await db.createUser(userData);
        
        const response: ApiResponse<User> = {
            success: true,
            message: 'User created successfully',
            data: {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.fullName,
                isAdmin: newUser.isAdmin,
                hasFullLicense: newUser.hasFullLicense,
                createdAt: newUser.createdAt
            }
        };

        res.status(201).json(response);

    } catch (error: any) {
        if (error.message && error.message.includes('already exists')) {
            res.status(409).json({ error: 'User with this email already exists' });
            return;
        }
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export { router, initializeRouter };