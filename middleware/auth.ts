import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { User } from '../src/types';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        fullName: string;
        isAdmin: boolean;
        hasFullLicense: boolean;
    };
}

// Authentication middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || (req.session as any)?.token;

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            res.status(403).json({ error: 'Invalid or expired token' });
            return;
        }
        req.user = user;
        next();
    });
}

// Admin middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (!req.user || !req.user.isAdmin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}

// Full license middleware
export function requireFullLicense(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (!req.user || !req.user.hasFullLicense) {
        res.status(403).json({ error: 'Full license required for this feature' });
        return;
    }
    next();
}

// Generate JWT token
export function generateToken(user: User): string {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            isAdmin: user.isAdmin,
            hasFullLicense: user.hasFullLicense
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

// Validate email format
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
export function isValidPassword(password: string): boolean {
    // At least 6 characters
    return password !== undefined && password !== null && password.length >= 6;
}

export { JWT_SECRET };