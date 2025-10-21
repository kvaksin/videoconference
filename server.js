const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// Import database and routes
const Database = require('./database/database');
const { initializeRouter: initAuthRouter } = require('./routes/auth');
const { initializeRouter: initAdminRouter } = require('./routes/admin');
const { initializeRouter: initCalendarRouter } = require('./routes/calendar');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Security middleware
if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "https://cdn.socket.io"],
                styleSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                connectSrc: ["'self'", "ws:", "wss:"],
                mediaSrc: ["'self'", "blob:"],
                frameSrc: ["'self'"],
                fontSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"]
            }
        }
    }));
} else {
    // Development mode - more permissive CSP
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.socket.io"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "https://localhost:*"],
                mediaSrc: ["'self'", "blob:"],
                frameSrc: ["'self'"],
                fontSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"]
            }
        }
    }));
}

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize database
const db = new Database();

// Initialize routes
app.use('/api/auth', initAuthRouter(db));
app.use('/api/admin', initAdminRouter(db));
app.use('/api/calendar', initCalendarRouter(db));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve ICS files
app.use('/ics', express.static(path.join(__dirname, 'public', 'ics')));

// Create HTTPS server if certificates exist
let server;
const certPath = path.join(__dirname, 'certificates');
const keyPath = path.join(certPath, 'private-key.pem');
const certFilePath = path.join(certPath, 'certificate.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certFilePath)) {
    const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certFilePath)
    };
    server = https.createServer(options, app);
    console.log('HTTPS server created with SSL certificates');
} else {
    server = http.createServer(app);
    console.log('HTTP server created (for development only)');
    console.log('For production, add SSL certificates to /certificates/ directory');
}

const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve main application pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/calendar', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'calendar.html'));
});

app.get('/schedule/:userId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'schedule.html'));
});

app.get('/meeting/:meetingId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'meeting.html'));
});

app.get('/booking-confirmation/:meetingId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'booking-confirmation.html'));
});

// Store room information
const rooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Create a new room
    socket.on('create-room', () => {
        const roomId = generateRoomId();
        socket.join(roomId);
        
        rooms.set(roomId, {
            id: roomId,
            users: [socket.id],
            createdAt: new Date()
        });
        
        socket.emit('room-created', roomId);
        console.log(`Room created: ${roomId} by user: ${socket.id}`);
    });
    
    // Join an existing room
    socket.on('join-room', (roomId) => {
        const room = rooms.get(roomId);
        
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }
        
        if (room.users.length >= 2) {
            socket.emit('error', 'Room is full');
            return;
        }
        
        socket.join(roomId);
        room.users.push(socket.id);
        
        socket.emit('room-joined', roomId);
        socket.to(roomId).emit('user-joined');
        
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });
    
    // Handle WebRTC offer
    socket.on('offer', (data) => {
        const { roomId, offer } = data;
        socket.to(roomId).emit('offer', offer);
        console.log(`Offer sent in room: ${roomId}`);
    });
    
    // Handle WebRTC answer
    socket.on('answer', (data) => {
        const { roomId, answer } = data;
        socket.to(roomId).emit('answer', answer);
        console.log(`Answer sent in room: ${roomId}`);
    });
    
    // Handle ICE candidate
    socket.on('ice-candidate', (data) => {
        const { roomId, candidate } = data;
        socket.to(roomId).emit('ice-candidate', candidate);
    });
    
    // Handle leaving room
    socket.on('leave-room', (roomId) => {
        handleUserLeave(socket, roomId);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Remove user from all rooms
        rooms.forEach((room, roomId) => {
            if (room.users.includes(socket.id)) {
                handleUserLeave(socket, roomId);
            }
        });
    });
});

function handleUserLeave(socket, roomId) {
    const room = rooms.get(roomId);
    
    if (room) {
        room.users = room.users.filter(id => id !== socket.id);
        socket.to(roomId).emit('user-left');
        socket.leave(roomId);
        
        // Delete room if empty
        if (room.users.length === 0) {
            rooms.delete(roomId);
            console.log(`Room deleted: ${roomId}`);
        }
        
        console.log(`User ${socket.id} left room: ${roomId}`);
    }
}

function generateRoomId() {
    return Math.random().toString(36).substr(2, 9);
}

// Clean up old empty rooms periodically
setInterval(() => {
    const now = new Date();
    rooms.forEach((room, roomId) => {
        if (room.users.length === 0) {
            const hoursSinceCreated = (now - room.createdAt) / (1000 * 60 * 60);
            if (hoursSinceCreated > 24) { // Remove rooms older than 24 hours
                rooms.delete(roomId);
                console.log(`Cleaned up old room: ${roomId}`);
            }
        }
    });
}, 60 * 60 * 1000); // Check every hour

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

if (server.constructor.name === 'Server') {
    // HTTP server
    server.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT}`);
        console.log(`Open http://localhost:${PORT} in your browser`);
        console.log('\n=== Default Admin Credentials ===');
        console.log('Email: admin@videoconference.com');
        console.log('Password: admin123');
        console.log('Please change the password after first login!');
        console.log('==================================\n');
    });
} else {
    // HTTPS server
    server.listen(HTTPS_PORT, () => {
        console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
        console.log(`Open https://localhost:${HTTPS_PORT} in your browser`);
        console.log('\n=== Default Admin Credentials ===');
        console.log('Email: admin@videoconference.com');
        console.log('Password: admin123');
        console.log('Please change the password after first login!');
        console.log('==================================\n');
    });
    
    // Also start HTTP server for redirect
    const httpApp = express();
    httpApp.use((req, res) => {
        res.redirect(`https://${req.headers.host.replace(/:\d+$/, `:${HTTPS_PORT}`)}${req.url}`);
    });
    httpApp.listen(PORT, () => {
        console.log(`HTTP redirect server running on port ${PORT}`);
    });
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        db.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        db.close();
        process.exit(0);
    });
});