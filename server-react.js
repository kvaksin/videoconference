const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Import JSON database and routes
const JSONDatabase = require('./database/jsonDatabase');
const { initializeRouter: initAuthRouter } = require('./routes/auth');
const { initializeRouter: initAdminRouter } = require('./routes/admin');
const { initializeRouter: initCalendarRouter } = require('./routes/calendar');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001; // Backend port
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const NODE_ENV = process.env.NODE_ENV || 'development';

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
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
} else {
    // Development: serve API only, React dev server runs separately
    app.get('/', (req, res) => {
        res.json({ 
            message: 'WebRTC Video Conference API',
            environment: 'development',
            frontend: 'http://localhost:3000',
            backend: `http://localhost:${PORT}`
        });
    });
}

// Health check endpoint
// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.authenticateUser(email, password);
        
        if (user) {
            req.session.userId = user.id;
            req.session.isAuthenticated = true;
            res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    hasFullLicense: user.hasFullLicense,
                    isAdmin: user.isAdmin
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/signout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: 'Logout failed' });
        } else {
            res.clearCookie('connect.sid');
            res.json({ success: true });
        }
    });
});

app.get('/api/auth/verify', async (req, res) => {
    if (req.session.isAuthenticated && req.session.userId) {
        try {
            const user = await db.getUserById(req.session.userId);
            if (user) {
                res.json({ 
                    authenticated: true, 
                    user: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        hasFullLicense: user.hasFullLicense,
                        isAdmin: user.isAdmin
                    }
                });
            } else {
                res.json({ authenticated: false });
            }
        } catch (error) {
            res.json({ authenticated: false });
        }
    } else {
        res.json({ authenticated: false });
    }
});

app.get('/api/auth/me', async (req, res) => {
    if (!req.session.isAuthenticated || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const user = await db.getUserById(req.session.userId);
        if (user) {
            res.json({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                hasFullLicense: user.hasFullLicense,
                isAdmin: user.isAdmin
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.isAuthenticated || !req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Middleware to check admin access
const requireAdmin = async (req, res, next) => {
    if (!req.session.isAuthenticated || !req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const user = await db.getUserById(req.session.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify admin access' });
    }
};

// Middleware to check full license
const requireFullLicense = async (req, res, next) => {
    if (!req.session.isAuthenticated || !req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const user = await db.getUserById(req.session.userId);
        if (!user || !user.hasFullLicense) {
            return res.status(403).json({ error: 'Full license required' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify license' });
    }
};

// Meetings routes
app.get('/api/meetings', requireAuth, async (req, res) => {
    try {
        const meetings = await db.getUserMeetings(req.session.userId);
        res.json(meetings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get meetings' });
    }
});

app.post('/api/meetings', requireAuth, async (req, res) => {
    try {
        const meeting = await db.createMeeting({
            ...req.body,
            organizerId: req.session.userId
        });
        res.json(meeting);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create meeting' });
    }
});

app.get('/api/meetings/export', requireFullLicense, async (req, res) => {
    try {
        const meetings = await db.getUserMeetings(req.session.userId);
        
        // Generate ICS content
        let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//VideoConference//EN\n';
        
        meetings.forEach(meeting => {
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
app.get('/api/availability', requireFullLicense, async (req, res) => {
    try {
        const availability = await db.getUserAvailability(req.session.userId);
        res.json(availability);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get availability' });
    }
});

app.post('/api/availability', requireFullLicense, async (req, res) => {
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

app.delete('/api/availability/:id', requireFullLicense, async (req, res) => {
    try {
        await db.deleteAvailability(req.params.id, req.session.userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete availability' });
    }
});

// Admin routes
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get users' });
    }
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const user = await db.createUser(req.body);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const user = await db.updateUser(req.params.id, req.body);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        if (req.params.id === req.session.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        await db.deleteUser(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.get('/api/admin/meetings', requireAdmin, async (req, res) => {
    try {
        const meetings = await db.getAllMeetings();
        res.json(meetings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get meetings' });
    }
});

app.delete('/api/admin/meetings/:id', requireAdmin, async (req, res) => {
    try {
        await db.deleteMeeting(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete meeting' });
    }
});

// Public booking routes
app.get('/api/booking/:userId/organizer', async (req, res) => {
    try {
        const user = await db.getUserById(req.params.userId);
        if (!user || !user.hasFullLicense) {
            return res.status(404).json({ error: 'Organizer not found or not available for booking' });
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

app.get('/api/booking/:userId/availability', async (req, res) => {
    try {
        const user = await db.getUserById(req.params.userId);
        if (!user || !user.hasFullLicense) {
            return res.status(404).json({ error: 'Organizer not found or not available for booking' });
        }
        
        const availability = await db.getUserAvailability(req.params.userId);
        // Filter out past availability
        const now = new Date();
        const futureAvailability = availability.filter(slot => {
            const slotDate = new Date(`${slot.date}T${slot.startTime}`);
            return slotDate > now;
        });
        
        res.json(futureAvailability);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get availability' });
    }
});

app.post('/api/booking', async (req, res) => {
    try {
        const { organizerId, availabilityId, bookerName, bookerEmail, title, description } = req.body;
        
        // Verify organizer exists and has full license
        const organizer = await db.getUserById(organizerId);
        if (!organizer || !organizer.hasFullLicense) {
            return res.status(404).json({ error: 'Organizer not found or not available for booking' });
        }
        
        // Get availability slot
        const availability = await db.getUserAvailability(organizerId);
        const slot = availability.find(a => a.id === availabilityId);
        if (!slot) {
            return res.status(404).json({ error: 'Availability slot not found' });
        }
        
        // Create meeting
        const meeting = await db.createMeeting({
            title: title || 'Booked Meeting',
            description,
            dateTime: `${slot.date}T${slot.startTime}`,
            organizerId,
            bookerName,
            bookerEmail,
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
const io = socketIo(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
});

// Socket.IO connection handling
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (data) => {
        const { roomId } = data;
        socket.join(roomId);
        
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(socket.id);
        
        console.log(`User ${socket.id} joined room: ${roomId}`);
        socket.to(roomId).emit('user-joined', { userId: socket.id });
    });

    socket.on('leave-room', (data) => {
        const { roomId } = data;
        socket.leave(roomId);
        
        if (rooms.has(roomId)) {
            rooms.get(roomId).delete(socket.id);
            if (rooms.get(roomId).size === 0) {
                rooms.delete(roomId);
                console.log(`Room deleted: ${roomId}`);
            }
        }
        
        console.log(`User ${socket.id} left room: ${roomId}`);
        socket.to(roomId).emit('user-left', { userId: socket.id });
    });

    // WebRTC signaling
    socket.on('offer', (data) => {
        const { roomId, offer } = data;
        console.log('Offer sent in room:', roomId);
        socket.to(roomId).emit('offer', { offer });
    });

    socket.on('answer', (data) => {
        const { roomId, answer } = data;
        console.log('Answer sent in room:', roomId);
        socket.to(roomId).emit('answer', { answer });
    });

    socket.on('ice-candidate', (data) => {
        const { roomId, candidate } = data;
        socket.to(roomId).emit('ice-candidate', { candidate });
    });

    // Chat messaging
    socket.on('message', (data) => {
        const { roomId, message } = data;
        socket.to(roomId).emit('message', { 
            message, 
            sender: socket.id, 
            timestamp: new Date().toISOString() 
        });
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
let httpsServer;
const certPath = path.join(__dirname, 'certificates', 'certificate.pem');
const keyPath = path.join(__dirname, 'certificates', 'private-key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    try {
        const privateKey = fs.readFileSync(keyPath, 'utf8');
        const certificate = fs.readFileSync(certPath, 'utf8');
        const credentials = { key: privateKey, cert: certificate };
        
        httpsServer = https.createServer(credentials, app);
        
        // Initialize Socket.IO for HTTPS as well
        const httpsIo = socketIo(httpsServer, {
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
    
    // Display default admin credentials
    console.log('\n=== Default Admin Credentials ===');
    console.log('Email: admin@videoconference.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');
    console.log('==================================\n');
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

module.exports = app;