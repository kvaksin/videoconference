# 🎥 Advanced WebRTC Video Conference Platform

A comprehensive video conferencing platform with authentication, calendar integration, scheduling, admin management, and advanced security features. Built with TypeScript, React, WebRTC, Node.js, Socket.IO, and SQLite.

## ✨ Features

### 🎥 Video Conferencing
- **HD Video & Audio**: High-quality peer-to-peer video calls with adaptive quality
- **Picture-in-Picture Layout**: Professional layout with large remote video and small self-view overlay
- **Real-time Name Editing**: Change your display name during calls, visible to all participants instantly
- **Real-time Chat**: Messaging during video calls using WebRTC data channels
- **Screen Sharing**: Share your screen with other participants
- **Media Controls**: Toggle video/audio, mute/unmute functionality with visual feedback
- **Room-based Meetings**: Create and join private meeting rooms with unique IDs
- **Meeting Links**: Copy shareable meeting links for easy access
- **Responsive Video Layout**: Optimized for desktop, tablet, and mobile devices
- **Connection Status**: Real-time connection quality indicators

### 👤 User Management & Authentication
- **User Registration**: Sign up with full name and email validation
- **Secure Authentication**: JWT-based authentication with encrypted sessions
- **Password Security**: Secure password change functionality with validation
- **User Profiles**: Personal dashboards with comprehensive account settings
- **License Management**: Basic and Full license tiers with feature restrictions
- **Session Management**: Secure session handling with automatic cleanup

### 🔒 Security & Account Management
- **Password Change**: Secure password update with current password verification
- **Password Validation**: Minimum length requirements and strength indicators
- **Account Security**: Built-in security tips and best practices guidance
- **Session Security**: Automatic session invalidation and secure token handling
- **Data Protection**: Encrypted password storage using bcrypt hashing

### 🛠️ Admin Panel
- **User Management**: View and manage all users
- **License Assignment**: Grant or revoke full licenses
- **System Statistics**: Monitor platform usage
- **User Creation**: Create users directly from admin panel

### 📅 Calendar & Scheduling (Full License)
- **ICS Calendar Integration**: Generate calendar files compatible with Outlook
- **Availability Management**: Set your available time slots
- **Calendly-style Booking**: Public scheduling links for others to book meetings
- **Automatic Meeting Generation**: Unique meeting rooms for each booking
- **Outlook Synchronization**: Export meetings to Outlook calendar
- **Meeting Management**: View and manage all your meetings

### 🔒 Security & Performance
- **TLS/HTTPS Support**: Secure connections with SSL certificates
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **Helmet Security**: Advanced security headers
- **Input Validation**: Comprehensive data validation
- **Type Safety**: Full TypeScript implementation for better code quality

### 📱 Responsive Design
- **Mobile-friendly**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with animations
- **Dark/Light themes**: Adaptive design elements

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- TypeScript (installed globally or via npx)
- OpenSSL (for TLS certificates)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd videoconference
```

2. **Install dependencies**:
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. **TypeScript Build** (Client):
```bash
cd client
npm run build
cd ..
```

4. **Generate TLS certificates** (optional for HTTPS):
```bash
chmod +x scripts/generate-certs.sh
./scripts/generate-certs.sh
```

5. **Start the server**:
```bash
npm start
```

6. **Development mode** (with TypeScript compilation):
```bash
# Start server in development mode
npm run dev

# In another terminal, start React development server
cd client
npm start
```

7. **Access the application**:
- Development: `http://localhost:3000` (React dev server)
- Production HTTP: `http://localhost:3000`
- Production HTTPS: `https://localhost:3443` (if certificates are generated)

## 🔐 Default Admin Account

The system creates a default admin account on first run:
- **Email**: `admin@videoconference.com`
- **Password**: `admin123`

**⚠️ Important**: Change the password immediately after first login!

## 📖 User Guide

### For Basic Users
1. **Sign Up**: Create an account with your full name and email
2. **Video Conferencing**: Create or join video calls
3. **Meeting Links**: Copy and share meeting links with participants
4. **Chat**: Send messages during video calls
5. **Screen Share**: Share your screen with participants

### For Full License Users
1. **Calendar Access**: Manage your calendar and meetings
2. **Set Availability**: Configure when you're available for meetings
3. **Scheduling Link**: Share your personal booking link
4. **Meeting Management**: Create and manage meetings
5. **ICS Export**: Download calendar files for Outlook integration

### For Administrators
1. **User Management**: View and manage all platform users
2. **License Assignment**: Grant full licenses to users
3. **System Monitoring**: View platform statistics and usage
4. **User Creation**: Create user accounts directly

## 🔧 Advanced Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
HTTPS_PORT=3443
NODE_ENV=production

# Security
JWT_SECRET=your-secret-key-change-in-production
SESSION_SECRET=your-session-secret-change-in-production

# Database (SQLite file location)
DB_PATH=./database/videoconference.db
```

### TLS/HTTPS Setup

#### Development (Self-signed certificates)
```bash
./scripts/generate-certs.sh
```

#### Production (Proper SSL certificates)
1. Obtain SSL certificates from a Certificate Authority
2. Place them in the `certificates/` directory:
   - `private-key.pem` - Private key
   - `certificate.pem` - Certificate file

### Database

The application uses SQLite for simplicity and portability. The database file is created automatically at `database/videoconference.db`.

#### Database Schema
- **users**: User accounts and authentication
- **meetings**: Meeting records and details
- **meeting_participants**: Meeting participant tracking
- **user_availability**: User availability schedules
- **booking_slots**: Available booking time slots

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/verify` - Verify authentication token

### Admin Endpoints (Admin Only)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/license` - Update user license
- `GET /api/admin/stats` - System statistics
- `POST /api/admin/users` - Create new user

### Calendar Endpoints (Full License)
- `GET /api/calendar/availability` - Get user availability
- `POST /api/calendar/availability` - Set user availability
- `GET /api/calendar/meetings` - Get user meetings
- `POST /api/calendar/meetings` - Create new meeting
- `GET /api/calendar/meetings/:id` - Get meeting details

### Public Scheduling
- `GET /api/calendar/schedule/:userId` - Get available time slots
- `POST /api/calendar/schedule/:userId/book` - Book a meeting

## 🔗 URL Structure

### Public Pages
- `/` - Main video conference interface
- `/login` - Authentication page
- `/schedule/:userId` - Public scheduling page

### Authenticated Pages
- `/dashboard` - User dashboard
- `/calendar` - Calendar and scheduling (Full License)
- `/admin` - Admin panel (Admin only)

### Meeting Pages
- `/meeting/:meetingId` - Individual meeting room
- `/booking-confirmation/:meetingId` - Booking confirmation

## 📱 Mobile Usage

The platform is fully responsive and works on mobile devices:
- Touch-friendly interface
- Mobile video controls
- Responsive chat interface
- Mobile-optimized scheduling

## 🔧 Development

### Project Structure
```
videoconference/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── client/                # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   ├── services/      # API and authentication services
│   │   ├── types/         # TypeScript type definitions
│   │   ├── App.tsx        # Main React application
│   │   └── index.tsx      # React entry point
│   ├── public/            # Static assets
│   ├── package.json       # Client dependencies
│   └── tsconfig.json      # TypeScript configuration
├── database/
│   ├── database.js        # Database management
│   └── videoconference.db # SQLite database
├── middleware/
│   └── auth.js            # Authentication middleware
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── admin.js          # Admin routes
│   └── calendar.js       # Calendar routes
├── certificates/         # TLS certificates
└── scripts/
    └── generate-certs.sh # Certificate generation
```

### Development Commands
```bash
# Server commands
npm start              # Start production server
npm run dev           # Start development server with nodemon

# Client commands (in /client directory)
npm start             # Start React development server
npm run build         # Build production React app
npm run type-check    # TypeScript type checking
npm test              # Run React tests

# Full stack development
npm install           # Install server dependencies
cd client && npm install  # Install client dependencies
```

### TypeScript Development

#### Type Definitions
The application includes comprehensive TypeScript definitions in `client/src/types/index.ts`:

- **User Types**: User authentication and profile data
- **Meeting Types**: Video conference meeting data
- **API Types**: Request/response interfaces
- **Component Props**: React component prop types
- **Context Types**: React context interfaces
- **WebRTC Types**: Video conferencing data types

#### TypeScript Configuration
- **Strict Mode**: Enabled for maximum type safety
- **ES2020 Target**: Modern JavaScript features
- **JSX Support**: React component support
- **Path Mapping**: Clean import paths
- **Type Checking**: Full compile-time validation

#### Development Workflow
1. **Type-First Development**: Define interfaces before implementation
2. **Strict Typing**: All functions and components are typed
3. **Error Prevention**: Compile-time error catching
4. **IntelliSense**: Enhanced IDE support
5. **Refactoring Safety**: Type-safe code changes

### Adding Features
1. **Database**: Update `database/database.js` for new tables
2. **Backend Routes**: Add new API routes in `routes/`
3. **Frontend Components**: Create new React components in `client/src/components/`
4. **Type Definitions**: Add new interfaces in `client/src/types/index.ts`
5. **Pages**: Create new page components in `client/src/pages/`
6. **Services**: Add API services in `client/src/services/`
7. **Middleware**: Add security/validation in `middleware/`

## 🚀 Deployment

### Local Development
See [Quick Start](#-quick-start) section above for local development setup.

### Production Deployment

#### Render.com (Recommended)
For easy deployment to Render.com, see the detailed [Deployment Guide](DEPLOYMENT.md).

Quick deployment steps:
1. Push your code to GitHub
2. Connect repository to Render
3. Use the included `render.yaml` configuration
4. Set environment variables (JWT_SECRET, SESSION_SECRET)
5. Deploy and test!

#### Heroku Deployment
1. Create `Procfile`:
```
web: node server.js
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

#### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup for Production
```bash
export NODE_ENV=production
export JWT_SECRET=your-secure-secret
export SESSION_SECRET=your-session-secret
export PORT=3000
```

## 🛠️ Troubleshooting

### Common Issues

1. **Database not created**:
   - Ensure write permissions in the project directory
   - Check `database/` folder exists

2. **Authentication issues**:
   - Verify JWT_SECRET is set
   - Check session configuration
   - Clear browser cookies

3. **Video/Audio not working**:
   - Use HTTPS in production
   - Check browser permissions
   - Verify STUN server access

4. **Calendar features not working**:
   - Ensure user has full license
   - Check authentication status
   - Verify API endpoints

### Browser Console Debugging
Open browser developer tools to see:
- Authentication status
- WebRTC connection states
- API request/response details
- Socket.IO connection events

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check server logs for backend issues
4. Verify database connectivity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔐 Security Considerations

### Production Checklist
- [ ] Change default admin password
- [ ] Set secure JWT_SECRET and SESSION_SECRET
- [ ] Use proper SSL certificates (not self-signed)
- [ ] Configure CORS for your domain
- [ ] Set up rate limiting
- [ ] Enable HTTPS redirects
- [ ] Implement input validation
- [ ] Set up monitoring and logging
- [ ] Regular security updates
- [ ] Database backups

### Privacy
- User data is stored locally in SQLite
- Video/audio data is peer-to-peer (not stored)
- Chat messages are not persisted
- Meeting recordings are not implemented

## 🆕 Recent Updates

- ✅ **TypeScript Migration**: Full conversion from JavaScript to TypeScript
  - Complete type safety for all React components
  - Comprehensive type definitions for APIs and data structures
  - Enhanced developer experience with IntelliSense
  - Compile-time error prevention
- ✅ **React Architecture**: Modern React with hooks and context
  - Functional components with TypeScript
  - Context-based state management
  - Protected routes with role-based access
  - Responsive component design
- ✅ User authentication and authorization
- ✅ Admin panel for user management
- ✅ Calendar integration with ICS export
- ✅ Calendly-style scheduling system
- ✅ Meeting room generation
- ✅ TLS/HTTPS support
- ✅ Mobile responsive design
- ✅ Enhanced security features