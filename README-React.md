# Video Conference Application - React Migration

This application has been migrated from a static HTML/CSS/JS frontend to a modern React-based architecture.

## Architecture

### Frontend (React - Port 3000)
- **Framework**: React 18 with React Router
- **State Management**: Context API (Auth, Notifications)
- **Styling**: CSS with responsive design
- **WebRTC**: Socket.IO client for real-time communication
- **Components**: Modular component structure

### Backend (Node.js - Port 3001)
- **Framework**: Express.js
- **Database**: JSON file storage (replacing SQLite)
- **Real-time**: Socket.IO for WebRTC signaling
- **Authentication**: JWT-based sessions
- **API**: RESTful endpoints for all operations

## Features

### 🎥 Video Conferencing
- WebRTC peer-to-peer video calls
- Screen sharing capabilities
- Real-time chat during meetings
- Audio/video controls (mute, camera toggle)
- Meeting room creation and joining

### 📅 Calendar Management (Full License)
- Personal availability scheduling
- Meeting booking system
- ICS file export
- Public booking links
- Time slot management

### 👥 User Management
- User authentication and authorization
- Basic and Full license tiers
- Administrator dashboard
- User profile management

### 📊 Admin Features
- User management (create, edit, delete)
- Meeting oversight
- License management
- System administration

## User Types

1. **Basic License Users**
   - Create and join video meetings
   - Access to basic video conferencing features
   - Screen sharing and chat

2. **Full License Users**
   - All Basic features
   - Calendar integration
   - Meeting scheduling
   - Availability management
   - ICS exports
   - Public booking pages

3. **Administrators**
   - All Full License features
   - User management
   - System administration
   - Meeting oversight

## Development Setup

### Prerequisites
- Node.js 16+ and npm 8+
- Modern web browser with WebRTC support

### Quick Start

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Start Development Servers**
   
   Terminal 1 (Backend):
   ```bash
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   npm run client
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Development Workflow

- **Frontend development**: React dev server on port 3000 with hot reload
- **Backend development**: Node.js server on port 3001 with nodemon
- **Proxy configuration**: Frontend proxies API calls to backend
- **Database**: JSON files in `/database` directory

## File Structure

```
videoconference/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Main application pages
│   │   ├── context/          # React Context providers
│   │   ├── services/         # API service layer
│   │   └── App.js            # Main app component
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
├── database/                 # JSON database files
│   ├── jsonDatabase.js       # Database interface
│   ├── users.json           # User data
│   ├── meetings.json        # Meeting data
│   └── availability.json    # Availability data
├── server-react.js           # Express server for React
├── package.json             # Backend dependencies
└── setup-react.sh          # Setup script
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Meetings
- `GET /api/meetings` - Get user meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/export` - Export calendar

### Availability (Full License)
- `GET /api/availability` - Get availability
- `POST /api/availability` - Add availability
- `DELETE /api/availability/:id` - Remove availability

### Booking (Public)
- `GET /api/booking/:userId/organizer` - Get organizer info
- `GET /api/booking/:userId/availability` - Get public availability
- `POST /api/booking` - Book meeting

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/meetings` - List all meetings
- `DELETE /api/admin/meetings/:id` - Delete meeting

## Production Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

The production server serves the React build files and provides API endpoints on the same port.

## WebRTC Configuration

The application uses public STUN servers for ICE candidate discovery:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

For production environments with firewalls, consider configuring TURN servers.

## Database Migration

The application now uses JSON files instead of SQLite:
- **Users**: `database/users.json`
- **Meetings**: `database/meetings.json`
- **Availability**: `database/availability.json`

The JSON database maintains the same interface as the original SQLite implementation for seamless migration.

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

WebRTC features require modern browser support and user permissions for camera/microphone access.

## Security Features

- JWT-based authentication
- CORS protection
- Helmet security headers
- Rate limiting
- Input validation
- XSS protection

## Troubleshooting

### Common Issues

1. **WebRTC Connection Issues**
   - Check firewall settings
   - Verify camera/microphone permissions
   - Try different browsers

2. **Development Server Issues**
   - Ensure ports 3000 and 3001 are available
   - Check Node.js version compatibility
   - Verify npm dependencies

3. **Build Issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall
   - Check for version conflicts

### Getting Help

- Check browser console for errors
- Verify backend logs in terminal
- Test API endpoints directly
- Review network requests in DevTools

## Migration Notes

### From Static HTML to React

The migration involved:
- Converting HTML pages to React components
- Implementing React Router for navigation
- Creating Context providers for state management
- Updating API service layer
- Modernizing UI components
- Maintaining WebRTC functionality

### Database Changes

- SQLite → JSON file storage
- Maintained same data structure
- Compatible API interface
- Improved development workflow
- Simplified deployment

This migration provides a modern, maintainable, and scalable foundation for future development.