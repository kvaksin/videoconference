import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import https from 'https';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Import types
import {
  User,
  Meeting,
  CreateMeetingData,
  ApiResponse,
  AuthenticatedRequest,
  AdminRequest,
  SessionData,
  SocketUser,
  SocketMessage,
  WebRTCSignal,
  AppConfig,
  EnvironmentVariables
} from './src/types';

// Import JSON database and routes
const JSONDatabase = require('./database/jsonDatabase');
const { initializeRouter: initCalendarRouter } = require('./routes/calendar');

// Import TypeScript routes
import { initializeRouter as initAuthRouter } from './routes/auth';
import { initializeRouter as initAdminRouter } from './routes/admin';

// Environment variables with types
const PORT: number = parseInt(process.env.PORT || '3001', 10);
const HTTPS_PORT: number = parseInt(process.env.HTTPS_PORT || '3443', 10);
const NODE_ENV: string = process.env.NODE_ENV || 'development';

const app: Application = express();

// Initialize JSON database
const db = new JSONDatabase('./database');

// Enable trust proxy for production
if (NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Security middleware
if (NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                connectSrc: ["'self'", "ws:", "wss:"],
                mediaSrc: ["'self'", "blob:"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false
    }));
} else {
    // Development - more permissive CSP
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.socket.io", "http://localhost:3000"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
                connectSrc: ["'self'", "ws:", "wss:", "http://localhost:3000", "ws://localhost:3000"],
                mediaSrc: ["'self'", "blob:"],
                fontSrc: ["'self'"]
            }
        },
        crossOriginEmbedderPolicy: false
    }));
}

// CORS configuration
const corsOptions = {
    origin: NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || false
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Extend session data interface
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userEmail?: string;
    isAuthenticated?: boolean;
  }
}

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize routes with database
app.use('/api/auth', initAuthRouter(db));
app.use('/api/admin', initAdminRouter(db));
app.use('/api/calendar', initCalendarRouter(db));

// Serve React build files in production
if (NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
} else {
    // Development: serve API only, React dev server runs separately
    app.get('/', (req: Request, res: Response) => {
        res.json({ 
            message: 'WebRTC Video Conference API',
            environment: 'development',
            frontend: 'http://localhost:3000',
            backend: `http://localhost:${PORT}`
        });
    });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running', 
        timestamp: new Date().toISOString() 
    });
});

// NOTE: Authentication routes are handled by TypeScript routes in routes/auth.ts
// NOTE: Admin routes are handled by TypeScript routes in routes/admin.ts

// Simple auth middleware for session-based routes (legacy support)
const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (req.session.isAuthenticated && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// Middleware to check full license
const requireFullLicense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.session.isAuthenticated || !req.session.userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    
    try {
        const user: User = await db.getUserById(req.session.userId);
        if (!user || !user.hasFullLicense) {
            res.status(403).json({ error: 'Full license required' });
            return;
        }
        (req as any).user = user;
        (req as any).userId = user.id;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify license' });
    }
};

// Meetings routes
app.get('/api/meetings', requireAuth, async (req: Request, res: Response) => {
    try {
        const meetings: Meeting[] = await db.getUserMeetings(req.session.userId);
        res.json(meetings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get meetings' });
    }
});

app.post('/api/meetings', requireAuth, async (req: Request, res: Response) => {
    try {
        const meetingData: CreateMeetingData = {
            ...req.body,
            createdBy: req.session.userId
        };
        const meeting: Meeting = await db.createMeeting(meetingData);
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create meeting' });
    }
});

app.get('/api/meetings/export', requireFullLicense, async (req: Request, res: Response) => {
    try {
        const meetings: Meeting[] = await db.getUserMeetings(req.session.userId);
        
        // Generate ICS content
        let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//VideoConference//EN\n';
        
        meetings.forEach((meeting: Meeting) => {
            const startDate = new Date(meeting.dateTime);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour
            
            icsContent += 'BEGIN:VEVENT\n';
            icsContent += `UID:${meeting.id}@videoconference.com\n`;
            icsContent += `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\n`;
            icsContent += `DTEND:${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\n`;
            icsContent += `SUMMARY:${meeting.title || 'Video Meeting'}\n`;
            icsContent += `DESCRIPTION:Meeting Room: ${meeting.roomId}\\nJoin: ${req.protocol}://${req.get('host')}/meeting/${meeting.roomId}\n`;
            icsContent += 'END:VEVENT\n';
        });
        
        icsContent += 'END:VCALENDAR';
        
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
        res.send(icsContent);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export calendar' });
    }
});

// Availability routes (Full License required)
app.get('/api/availability', requireFullLicense, async (req: Request, res: Response) => {
    try {
        const availability = await db.getUserAvailability(req.session.userId);
        res.json(availability);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get availability' });
    }
});

app.post('/api/availability', requireFullLicense, async (req: Request, res: Response) => {
    try {
        const availability = await db.addAvailability({
            ...req.body,
            userId: req.session.userId
        });
        res.json(availability);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add availability' });
    }
});

app.delete('/api/availability/:id', requireFullLicense, async (req: Request, res: Response) => {
    try {
        await db.deleteAvailability(req.params.id, req.session.userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete availability' });
    }
});

// NOTE: Admin routes are handled by TypeScript routes in routes/admin.ts

// Public booking routes
app.get('/api/booking/:userId/organizer', async (req: Request, res: Response) => {
    try {
        const user: User = await db.getUserById(req.params.userId);
        if (!user || !user.hasFullLicense) {
            res.status(404).json({ error: 'Organizer not found or not available for booking' });
            return;
        }
        
        res.json({
            id: user.id,
            fullName: user.fullName,
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get organizer' });
    }
});

app.get('/api/booking/:userId/availability', async (req: Request, res: Response) => {
    try {
        const user: User = await db.getUserById(req.params.userId);
        if (!user || !user.hasFullLicense) {
            res.status(404).json({ error: 'Organizer not found or not available for booking' });
            return;
        }
        
        const availability = await db.getUserAvailability(req.params.userId);
        // Filter out past availability
        const now = new Date();
        const futureAvailability = availability.filter((slot: any) => {
            const slotDate = new Date(`${slot.date}T${slot.startTime}`);
            return slotDate > now;
        });
        
        res.json(futureAvailability);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get availability' });
    }
});

app.post('/api/booking', async (req: Request, res: Response) => {
    try {
        const { organizerId, availabilityId, bookerName, bookerEmail, title, description } = req.body;
        
        // Verify organizer exists and has full license
        const organizer: User = await db.getUserById(organizerId);
        if (!organizer || !organizer.hasFullLicense) {
            res.status(404).json({ error: 'Organizer not found or not available for booking' });
            return;
        }
        
        // Get availability slot
        const availability = await db.getUserAvailability(organizerId);
        const slot = availability.find((a: any) => a.id === availabilityId);
        if (!slot) {
            res.status(404).json({ error: 'Availability slot not found' });
            return;
        }
        
        // Create meeting
        const meetingData: CreateMeetingData = {
            title: title || 'Booked Meeting',
            description,
            dateTime: `${slot.date}T${slot.startTime}`,
            createdBy: organizerId,
            bookerName,
            bookerEmail
        };
        
        const meeting: Meeting = await db.createMeeting({
            ...meetingData,
            status: 'confirmed'
        });
        
        // Remove the availability slot
        await db.deleteAvailability(availabilityId, organizerId);
        
        res.json(meeting);
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Failed to book meeting' });
    }
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
});

// Socket.IO connection handling
const rooms = new Map<string, Set<string>>();

interface SocketData {
    roomId?: string;
    userId?: string;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (data: { roomId: string }) => {
        const { roomId } = data;
        socket.join(roomId);
        
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(socket.id);
        
        console.log(`User ${socket.id} joined room: ${roomId}`);
        socket.to(roomId).emit('user-joined', { userId: socket.id });
    });

    socket.on('leave-room', (data: { roomId: string }) => {
        const { roomId } = data;
        socket.leave(roomId);
        
        if (rooms.has(roomId)) {
            rooms.get(roomId)!.delete(socket.id);
            if (rooms.get(roomId)!.size === 0) {
                rooms.delete(roomId);
                console.log(`Room deleted: ${roomId}`);
            }
        }
        
        console.log(`User ${socket.id} left room: ${roomId}`);
        socket.to(roomId).emit('user-left', { userId: socket.id });
    });

    // WebRTC signaling
    socket.on('offer', (data: { roomId: string; offer: any }) => {
        const { roomId, offer } = data;
        console.log('Offer sent in room:', roomId);
        socket.to(roomId).emit('offer', { offer });
    });

    socket.on('answer', (data: { roomId: string; answer: any }) => {
        const { roomId, answer } = data;
        console.log('Answer sent in room:', roomId);
        socket.to(roomId).emit('answer', { answer });
    });

    socket.on('ice-candidate', (data: { roomId: string; candidate: any }) => {
        const { roomId, candidate } = data;
        socket.to(roomId).emit('ice-candidate', { candidate });
    });

    // Chat messaging
    socket.on('message', (data: { roomId: string; message: string }) => {
        const { roomId, message } = data;
        socket.to(roomId).emit('message', { 
            message, 
            sender: socket.id, 
            timestamp: new Date().toISOString() 
        });
    });

    // Handle name changes
    socket.on('name-change', (data: { roomId: string; userId: string; newName: string }) => {
        const { roomId, userId, newName } = data;
        console.log(`User ${userId} changed name to ${newName} in room ${roomId}`);
        socket.to(roomId).emit('name-changed', { userId, newName });
    });

    // Handle chat messages with user info
    socket.on('chat-message', (data: { roomId: string; userId: string; userName: string; message: string }) => {
        const { roomId, userId, userName, message } = data;
        socket.to(roomId).emit('chat-message', { userId, userName, message });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove user from all rooms
        rooms.forEach((users, roomId) => {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                socket.to(roomId).emit('user-left', { userId: socket.id });
                
                if (users.size === 0) {
                    rooms.delete(roomId);
                    console.log(`Room deleted: ${roomId}`);
                }
            }
        });
    });
});

// Try to create HTTPS server if certificates exist
let httpsServer: https.Server | undefined;
const certPath = path.join(__dirname, 'certificates', 'certificate.pem');
const keyPath = path.join(__dirname, 'certificates', 'private-key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    try {
        const privateKey = fs.readFileSync(keyPath, 'utf8');
        const certificate = fs.readFileSync(certPath, 'utf8');
        const credentials = { key: privateKey, cert: certificate };
        
        httpsServer = https.createServer(credentials, app);
        
        // Initialize Socket.IO for HTTPS as well
        const httpsIo = new SocketIOServer(httpsServer, {
            cors: corsOptions,
            transports: ['websocket', 'polling']
        });
        
        // Copy all socket handlers to HTTPS server
        httpsIo.on('connection', (socket) => {
            // Reuse the same connection logic
            io.emit('connection', socket);
        });
        
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
            console.log(`Access via: https://localhost:${HTTPS_PORT}`);
        });
    } catch (error) {
        console.error('Error starting HTTPS server:', error);
        console.log('Continuing with HTTP only...');
    }
} else {
    console.log('HTTPS certificates not found (for development only)');
    console.log('For production, add SSL certificates to /certificates/ directory');
}

// Start HTTP server
server.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
    if (NODE_ENV === 'development') {
        console.log(`Backend API: http://localhost:${PORT}`);
        console.log(`Frontend: http://localhost:3000 (React dev server)`);
    } else {
        console.log(`Application: http://localhost:${PORT}`);
    }
    
    // Display admin setup information
    if (process.env.CREATE_DEFAULT_ADMIN !== 'false') {
        if (process.env.DEFAULT_ADMIN_PASSWORD) {
            console.log('\n=== Default Admin Account ===');
            console.log('Email: admin@videoconference.com');
            console.log('Password: (from DEFAULT_ADMIN_PASSWORD env var)');
            console.log('Please change the password after first login!');
            console.log('=============================\n');
        } else {
            console.log('\n=== Admin Setup Required ===');
            console.log('No DEFAULT_ADMIN_PASSWORD environment variable set.');
            console.log('Either:');
            console.log('1. Set DEFAULT_ADMIN_PASSWORD environment variable, or');
            console.log('2. Set CREATE_DEFAULT_ADMIN=false and create admin manually');
            console.log('============================\n');
        }
    } else {
        console.log('\n=== Manual Admin Setup ===');
        console.log('Default admin creation disabled.');
        console.log('Create your first admin user through the registration process.');
        console.log('==========================\n');
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully');
    
    server.close(() => {
        console.log('HTTP server closed');
        if (httpsServer) {
            httpsServer.close(() => {
                console.log('HTTPS server closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    });
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;