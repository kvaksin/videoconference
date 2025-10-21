# 🎥 Advanced WebRTC Video Conference Platform

A comprehensive video conferencing platform with authentication, calendar integration, scheduling, and admin management. Built with WebRTC, Node.js, Socket.IO, and SQLite.

## ✨ Features

### 🎥 Video Conferencing
- **HD Video & Audio**: High-quality peer-to-peer video calls
- **Real-time Chat**: Messaging during video calls using WebRTC data channels
- **Screen Sharing**: Share your screen with other participants
- **Media Controls**: Toggle video/audio, mute/unmute functionality
- **Room-based Meetings**: Create and join private meeting rooms
- **Meeting Links**: Copy shareable meeting links for easy access

### 👤 User Management & Authentication
- **User Registration**: Sign up with full name and email
- **Secure Authentication**: JWT-based authentication with sessions
- **User Profiles**: Personal dashboards and settings
- **License Management**: Basic and Full license tiers

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

### 📱 Responsive Design
- **Mobile-friendly**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with animations
- **Dark/Light themes**: Adaptive design elements

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenSSL (for TLS certificates)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd videoconference
```

2. **Install dependencies**:
```bash
npm install
```

3. **Generate TLS certificates** (optional for HTTPS):
```bash
chmod +x scripts/generate-certs.sh
./scripts/generate-certs.sh
```

4. **Start the server**:
```bash
npm start
```

5. **Access the application**:
- HTTP: `http://localhost:3000`
- HTTPS: `https://localhost:3443` (if certificates are generated)

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
├── database/
│   ├── database.js        # Database management
│   └── videoconference.db # SQLite database
├── middleware/
│   └── auth.js            # Authentication middleware
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── admin.js          # Admin routes
│   └── calendar.js       # Calendar routes
├── public/               # Frontend files
│   ├── *.html           # HTML pages
│   ├── *.css            # Stylesheets
│   ├── *.js             # JavaScript files
│   └── ics/             # Generated ICS files
├── certificates/         # TLS certificates
└── scripts/
    └── generate-certs.sh # Certificate generation
```

### Development Commands
```bash
npm start              # Start production server
npm run dev           # Start development server with nodemon
npm install           # Install dependencies
npm audit             # Check for vulnerabilities
```

### Adding Features
1. **Database**: Update `database/database.js` for new tables
2. **Routes**: Add new API routes in `routes/`
3. **Frontend**: Create new pages in `public/`
4. **Middleware**: Add security/validation in `middleware/`

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

- ✅ User authentication and authorization
- ✅ Admin panel for user management
- ✅ Calendar integration with ICS export
- ✅ Calendly-style scheduling system
- ✅ Meeting room generation
- ✅ TLS/HTTPS support
- ✅ Mobile responsive design
- ✅ Enhanced security features