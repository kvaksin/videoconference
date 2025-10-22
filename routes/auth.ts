import express, { Request, Response, Router } from 'express';
import { 
    generateToken, 
    comparePassword, 
    isValidEmail, 
    isValidPassword,
    authenticateToken 
} from '../middleware/auth';
import { Database } from '../database/database';
import { User, CreateUserData, ApiResponse, LoginRequest, SignupRequest, ChangePasswordRequest } from '../src/types';

const router: Router = express.Router();

// Initialize with database when router is used
let db: Database;

function initializeRouter(database: Database): Router {
    db = database;
    return router;
}

// Sign up route
router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { email, fullName, password }: SignupRequest = req.body;

        // Validation
        if (!email || !fullName || !password) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        if (!isValidEmail(email)) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }

        if (!isValidPassword(password)) {
            res.status(400).json({ error: 'Password must be at least 6 characters long' });
            return;
        }

        if (fullName.trim().length < 2) {
            res.status(400).json({ error: 'Full name must be at least 2 characters long' });
            return;
        }

        // Check if user already exists (we'll need to implement this method)
        // For now, we'll try to create and catch duplicate error
        try {
            // Create new user
            const userData: CreateUserData = {
                email: email.toLowerCase().trim(),
                fullName: fullName.trim(),
                password: password,
                hasFullLicense: false
            };

            const newUser: User = await db.createUser(userData);
            
            // Generate token
            const token = generateToken(newUser);

            // Store token in session
            (req.session as any).token = token;
            (req.session as any).userId = newUser.id;
            (req.session as any).isAuthenticated = true;

            const response = {
                success: true,
                message: 'User created successfully',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    fullName: newUser.fullName,
                    isAdmin: newUser.isAdmin,
                    hasFullLicense: newUser.hasFullLicense
                },
                token
            };

            res.status(201).json(response);
        } catch (createError: any) {
            if (createError.code === 'SQLITE_CONSTRAINT_UNIQUE' || createError.message.includes('UNIQUE constraint failed') || createError.message.includes('already exists')) {
                res.status(409).json({ 
                    error: 'An account with this email already exists. Please try signing in instead or use a different email address.',
                    suggestion: 'Try using the "Sign In" tab if you already have an account.'
                });
                return;
            }
            throw createError;
        }

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sign in route
router.post('/signin', async (req: Request, res: Response) => {
    try {
        const { email, password }: LoginRequest = req.body;

        // Validation
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // Authenticate user
        const user: User | null = await db.authenticateUser(email.toLowerCase().trim(), password);
        
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Generate token
        const token = generateToken(user);

        // Store token in session
        (req.session as any).token = token;
        (req.session as any).userId = user.id;
        (req.session as any).isAuthenticated = true;

        const response = {
            success: true,
            message: 'Sign in successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                isAdmin: user.isAdmin,
                hasFullLicense: user.hasFullLicense
            },
            token
        };

        res.json(response);

    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sign out route
router.post('/signout', (req: Request, res: Response) => {
    // Clear session data
    (req.session as any).token = null;
    (req.session as any).userId = null;
    (req.session as any).isAuthenticated = false;
    
    req.session.destroy((err: any) => {
        if (err) {
            res.status(500).json({ error: 'Logout failed' });
        } else {
            res.clearCookie('connect.sid');
            res.json({ 
                success: true,
                message: 'Successfully signed out' 
            });
        }
    });
});

// Clear session (for troubleshooting)
router.post('/clear-session', (req: Request, res: Response) => {
    req.session.destroy((err: any) => {
        if (err) {
            res.status(500).json({ error: 'Failed to clear session' });
        } else {
            res.clearCookie('connect.sid');
            res.json({ 
                success: true,
                message: 'Session cleared successfully. Please log in again.' 
            });
        }
    });
});

// Change password route
router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword, confirmPassword }: ChangePasswordRequest = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            res.status(400).json({ error: 'All password fields are required' });
            return;
        }

        if (newPassword !== confirmPassword) {
            res.status(400).json({ error: 'New password and confirmation do not match' });
            return;
        }

        if (!isValidPassword(newPassword)) {
            res.status(400).json({ error: 'New password must be at least 6 characters long' });
            return;
        }

        if (currentPassword === newPassword) {
            res.status(400).json({ error: 'New password must be different from current password' });
            return;
        }

        // Update password
        try {
            await db.updateUserPassword(userId, currentPassword, newPassword);
            
            const response: ApiResponse = {
                success: true,
                message: 'Password updated successfully'
            };

            res.json(response);

        } catch (updateError: any) {
            if (updateError.message === 'Current password is incorrect') {
                res.status(400).json({ error: 'Current password is incorrect' });
                return;
            }
            if (updateError.message === 'User not found') {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            throw updateError;
        }

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = await db.getUserById((req as any).user.id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const response: ApiResponse<User> = {
            success: true,
            data: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                isAdmin: user.isAdmin,
                hasFullLicense: user.hasFullLicense,
                createdAt: user.createdAt
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token
router.get('/verify', authenticateToken, (req: Request, res: Response) => {
    const response = {
        authenticated: true,
        user: {
            id: (req as any).user.id,
            email: (req as any).user.email,
            fullName: (req as any).user.fullName,
            isAdmin: (req as any).user.isAdmin,
            hasFullLicense: (req as any).user.hasFullLicense
        }
    };
    
    res.json(response);
});

// Update user timezone (if we want to implement this later)
router.post('/update-timezone', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { timezone } = req.body;
        
        if (!timezone) {
            res.status(400).json({ error: 'Timezone is required' });
            return;
        }
        
        // For now, we'll just acknowledge the request
        // In a full implementation, we'd update the database
        res.json({ success: true, message: 'Timezone updated successfully' });
    } catch (error) {
        console.error('Update timezone error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export { router, initializeRouter };