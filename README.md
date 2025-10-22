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
- **User Management**: View and manage all platform users with detailed information
- **License Assignment**: Grant or revoke full licenses with instant updates
- **System Statistics**: Monitor platform usage, user growth, and system health
- **User Creation**: Create user accounts directly from admin panel with role assignment
- **Security Monitoring**: Track authentication attempts and account security

### ⚙️ Settings & Preferences
- **Personal Settings**: Comprehensive settings page with tabbed navigation
- **Profile Management**: View and manage account information and preferences
- **Security Settings**: Password management with built-in security guidance
- **Application Preferences**: Customize video quality, audio settings, and notifications
- **Timezone Configuration**: Set timezone preferences for accurate scheduling
- **Theme Preferences**: Dark/light mode support with system detection

### 📅 Calendar & Scheduling (Full License)
- **ICS Calendar Integration**: Generate calendar files compatible with Outlook
- **Availability Management**: Set your available time slots
- **Calendly-style Booking**: Public scheduling links for others to book meetings
- **Automatic Meeting Generation**: Unique meeting rooms for each booking
- **Outlook Synchronization**: Export meetings to Outlook calendar
- **Meeting Management**: View and manage all your meetings

### 🔒 Security & Performance
- **TLS/HTTPS Support**: Secure connections with SSL certificates and HTTPS redirects
- **Advanced Authentication**: Multi-layer security with JWT tokens and secure sessions
- **Password Security**: Bcrypt hashing with salt rounds and secure password policies
- **Rate Limiting**: Protection against abuse and brute force attacks
- **CORS Configuration**: Secure cross-origin requests with domain whitelisting
- **Helmet Security**: Advanced security headers and XSS protection
- **Input Validation**: Comprehensive client and server-side data validation
- **Type Safety**: Full TypeScript implementation preventing runtime errors
- **Session Management**: Secure session handling with automatic expiration
- **SQL Injection Protection**: Parameterized queries and input sanitization

### 📱 Responsive Design & Accessibility
- **Mobile-First Design**: Optimized for mobile devices with touch-friendly controls
- **Cross-Platform Compatibility**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with smooth animations and transitions
- **Dark/Light Theme Support**: Automatic system detection and manual toggle options
- **Accessibility Features**: WCAG 2.1 compliant with keyboard navigation and screen reader support
- **High Contrast Mode**: Enhanced visibility for users with visual impairments
- **Responsive Components**: Adaptive layouts that work on all screen sizes
- **Touch Optimization**: Mobile-friendly touch targets and gesture support

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

## 🔐 Admin Account Setup

The system can optionally create a default admin account on first run:

### Automatic Admin Creation
Set these environment variables to create a default admin:
```bash
CREATE_DEFAULT_ADMIN=true
DEFAULT_ADMIN_PASSWORD=your-secure-password
```

- **Email**: `admin@videoconference.com`
- **Password**: Your custom password from `DEFAULT_ADMIN_PASSWORD`

### Manual Admin Creation
To skip automatic admin creation:
```bash
CREATE_DEFAULT_ADMIN=false
```

Then create the first admin user through the registration process and manually update their admin status in the database.

**⚠️ Important**: Always use a strong password for admin accounts!

## 📖 User Guide

### For Basic Users
1. **Sign Up**: Create an account with your full name and email validation
2. **Video Conferencing**: Create or join video calls with HD quality
3. **Enhanced Video Layout**: Enjoy picture-in-picture display with professional layout
4. **Real-time Features**: Change your name during calls and use instant chat
5. **Meeting Links**: Copy and share meeting links with participants
6. **Screen Share**: Share your screen with participants during calls
7. **Account Security**: Change your password securely through Settings
8. **Personal Settings**: Customize your preferences in the Settings page

### For Full License Users
1. **Calendar Access**: Manage your calendar and meetings with full integration
2. **Set Availability**: Configure when you're available for meetings with time slots
3. **Scheduling Link**: Share your personal booking link with clients and colleagues
4. **Meeting Management**: Create, edit, and manage meetings with advanced options
5. **ICS Export**: Download calendar files for Outlook and other calendar apps
6. **Advanced Settings**: Access additional preferences and configuration options

### For Administrators
1. **User Management**: View, create, and manage all platform users
2. **License Assignment**: Grant full licenses to users and manage permissions
3. **System Monitoring**: View detailed platform statistics and usage analytics
4. **User Creation**: Create user accounts directly with role and license assignment
5. **Security Overview**: Monitor account security and authentication attempts
6. **System Configuration**: Manage global settings and security policies

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

# Admin User Configuration (Optional)
CREATE_DEFAULT_ADMIN=true              # Set to 'false' to disable default admin creation
DEFAULT_ADMIN_PASSWORD=your-admin-pass  # Required if CREATE_DEFAULT_ADMIN is true and no admin exists
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
- `POST /api/auth/signup` - Create new user account with validation
- `POST /api/auth/signin` - User login with secure authentication
- `POST /api/auth/signout` - User logout with session cleanup
- `POST /api/auth/change-password` - Secure password change with verification
- `GET /api/auth/me` - Get current user profile information
- `GET /api/auth/verify` - Verify authentication token validity
- `POST /api/auth/update-timezone` - Update user timezone preferences

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
- `/dashboard` - User dashboard with enhanced navigation
- `/settings` - Comprehensive settings page with tabbed interface
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
├── server-react.js         # Main production server file
├── server-react.ts         # TypeScript server file (development)
├── package.json           # Dependencies and scripts
├── client/                # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   │   ├── ChangePassword.tsx    # Password change component
│   │   │   ├── ChangePassword.css    # Password change styles
│   │   │   └── ...        # Other components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.tsx         # Enhanced dashboard
│   │   │   ├── Settings.tsx          # Settings page
│   │   │   ├── Settings.css          # Settings styles
│   │   │   ├── Meeting.tsx           # Enhanced meeting interface
│   │   │   └── ...        # Other pages
│   │   ├── services/      # API and authentication services
│   │   ├── types/         # TypeScript type definitions
│   │   ├── App.tsx        # Main React application
│   │   └── index.tsx      # React entry point
│   ├── public/            # Static assets
│   ├── package.json       # Client dependencies
│   └── tsconfig.json      # TypeScript configuration
├── database/
│   ├── database.js        # Database management (legacy)
│   ├── database.ts        # TypeScript database class
│   └── videoconference.db # SQLite database
├── middleware/
│   ├── auth.js           # Authentication middleware (legacy)
│   └── auth.ts           # TypeScript authentication middleware
├── routes/
│   ├── auth.js           # Authentication routes (legacy)
│   ├── auth.ts           # TypeScript authentication routes
│   ├── admin.js          # Admin routes
│   └── calendar.js       # Calendar routes
├── src/
│   └── types/            # Backend TypeScript type definitions
├── certificates/         # TLS certificates
├── scripts/
│   └── generate-certs.sh # Certificate generation
├── docs/
│   ├── PASSWORD_CHANGE_FEATURE.md    # Password change documentation
│   ├── ENHANCED_VIDEO_INTERFACE.md   # Video interface documentation
│   └── DEPLOYMENT_GUIDE.md           # Deployment guide
├── render.yaml           # Render.com deployment configuration
└── README.md             # This file
```

### Development Commands
```bash
# Server commands
npm start              # Start production server (JavaScript)
npm run start:ts       # Start TypeScript server (development)
npm run dev            # Start development server with nodemon
npm run dev:ts         # Start TypeScript development server
npm run type-check:backend  # TypeScript checking (backend)
npm run type-check:all      # TypeScript checking (full project)

# Client commands (in /client directory)
npm start             # Start React development server
npm run build         # Build production React app
npm run type-check    # TypeScript type checking (frontend)
npm test              # Run React tests

# Full stack development
npm install           # Install server dependencies
cd client && npm install  # Install client dependencies
npm run install-all   # Install all dependencies (shortcut)
npm run build         # Build complete project for production
```

### TypeScript Development

#### Type Definitions
The application includes comprehensive TypeScript definitions:

**Backend Types** (`src/types/index.ts`):
- **User Types**: Authentication, profiles, and permissions
- **Meeting Types**: Video conference and scheduling data
- **API Types**: Request/response interfaces with validation
- **Database Types**: Data models and query results
- **Security Types**: Authentication and session management

**Frontend Types** (`client/src/types/index.ts`):
- **Component Props**: React component prop types
- **Context Types**: React context interfaces
- **Form Types**: Form data and validation interfaces
- **WebRTC Types**: Video conferencing data types
- **Service Types**: API communication interfaces

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
1. **Database**: Update `database/database.ts` for new tables and TypeScript methods
2. **Backend Routes**: Add new API routes in `routes/` with TypeScript support
3. **Frontend Components**: Create new React components in `client/src/components/` with TypeScript
4. **Type Definitions**: Add new interfaces in both backend and frontend type files
5. **Pages**: Create new page components in `client/src/pages/` with proper routing
6. **Services**: Add API services in `client/src/services/` with type safety
7. **Middleware**: Add security/validation in `middleware/` with TypeScript support
8. **Authentication**: Extend auth system with new security features
9. **Styling**: Add responsive CSS with accessibility considerations
10. **Documentation**: Update feature documentation and API guides

## 🚀 Deployment

### Local Development
See [Quick Start](#-quick-start) section above for local development setup.

### Production Deployment

#### Render.com (Recommended)
For easy deployment to Render.com, see the detailed [Deployment Guide](DEPLOYMENT.md).

**⚠️ SQLite3 Deployment Fix**: If you encounter `invalid ELF header` errors, see [SQLite3 Deployment Fix Guide](DEPLOYMENT_SQLITE_FIX.md).

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

1. **SQLite3 "invalid ELF header" error**:
   - This occurs during deployment to cloud platforms
   - **Solution**: See [SQLite3 Deployment Fix Guide](DEPLOYMENT_SQLITE_FIX.md)
   - **Quick fix**: Updated build command rebuilds native binaries
   - **Alternative**: Consider PostgreSQL for production

2. **Database not created**:
   - Ensure write permissions in the project directory
   - Check `database/` folder exists

3. **Authentication issues**:
   - Verify JWT_SECRET is set
   - Check session configuration
   - Clear browser cookies

4. **Video/Audio not working**:
   - Use HTTPS in production
   - Check browser permissions
   - Verify STUN server access

5. **Calendar features not working**:
   - Ensure user has full license
   - Check authentication status
   - Verify API endpoints

### Browser Console Debugging
Open browser developer tools to see:
- Authentication status
- WebRTC connection states
- API request/response details
- Socket.IO connection events

**Console Issues?** See these guides:
- 📋 [Browser Console Troubleshooting](BROWSER_CONSOLE_TROUBLESHOOTING.md) - Fix common warnings and errors
- 🔍 [Console Filtering Guide](CONSOLE_FILTERING_GUIDE.md) - Focus on real issues vs extension noise

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
- [ ] Change default admin password immediately after deployment
- [ ] Set secure JWT_SECRET and SESSION_SECRET environment variables
- [ ] Use proper SSL certificates (not self-signed) for HTTPS
- [ ] Configure CORS for your specific domain
- [ ] Set up rate limiting to prevent abuse
- [ ] Enable HTTPS redirects for all traffic
- [ ] Implement comprehensive input validation
- [ ] Set up monitoring and logging systems
- [ ] Regular security updates and dependency management
- [ ] Database backups and disaster recovery plans
- [ ] Review and test password change functionality
- [ ] Verify video interface performance across devices
- [ ] Test accessibility features and compliance

### Privacy
- User data is stored locally in SQLite
- Video/audio data is peer-to-peer (not stored)
- Chat messages are not persisted
- Meeting recordings are not implemented

## 🆕 Recent Updates

### Latest Features (October 2025)
- ✅ **Password Change Functionality**: Secure password management with comprehensive validation
  - Current password verification before changes
  - Strong password requirements with real-time validation
  - Password confirmation to prevent typos
  - Security tips and best practices guidance
  - Encrypted storage using bcrypt hashing

- ✅ **Enhanced Settings Page**: Complete user settings interface
  - Tabbed navigation (Profile, Security, Preferences)
  - Comprehensive account information display
  - Security settings with password management
  - Application preferences and customization options
  - Responsive design with accessibility features

- ✅ **Enhanced Video Interface**: Modern picture-in-picture layout
  - Large remote video with small self-view overlay
  - Real-time name editing during calls
  - Professional video conference appearance
  - Optimized for all screen sizes and devices
  - Improved user experience with intuitive controls

### Previous Major Updates
- ✅ **Complete TypeScript Migration**: Full conversion from JavaScript to TypeScript
  - Complete type safety for all React components and backend APIs
  - Comprehensive type definitions for APIs and data structures
  - Enhanced developer experience with IntelliSense and compile-time error prevention
  - Strict type checking across frontend and backend
  - Modern development workflow with TypeScript tooling

- ✅ **React Architecture Enhancement**: Modern React with hooks and context
  - Functional components with comprehensive TypeScript support
  - Context-based state management for authentication and notifications
  - Protected routes with role-based access control
  - Responsive component design with mobile-first approach
  - Enhanced component reusability and maintainability

- ✅ **Security Improvements**: Enhanced platform security
  - Advanced authentication with JWT tokens and secure sessions
  - Password security with bcrypt hashing and validation
  - Rate limiting and abuse prevention
  - Comprehensive input validation and sanitization
  - Security headers and XSS protection

### System Features
- ✅ User authentication and authorization with role-based access
- ✅ Admin panel for comprehensive user management
- ✅ Calendar integration with ICS export for Outlook compatibility
- ✅ Calendly-style scheduling system with public booking links
- ✅ Automatic meeting room generation with unique IDs
- ✅ TLS/HTTPS support with certificate management
- ✅ Mobile responsive design with touch optimization
- ✅ Advanced security features and monitoring capabilities