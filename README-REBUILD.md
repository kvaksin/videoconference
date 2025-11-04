# Video Conference Application - Complete Rebuild Guide

## 🎯 Overview
This is a stable, production-ready video conference application rebuilt from scratch with modern best practices.

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express + TypeScript
- **Database**: JSON file-based storage
- **API Documentation**: OpenAPI 3.0 / Swagger
- **Real-time**: Socket.io + WebRTC
- **Authentication**: JWT tokens
- **Styling**: CSS Modules / Styled Components

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. **Clone and navigate to project**
   ```bash
   cd /Users/kvaksin/Documents/GitHub/videoconference
   ```

2. **Run the rebuild setup script**
   ```bash
   chmod +x rebuild-setup.sh
   ./rebuild-setup.sh
   ```

3. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

4. **Configure environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your settings
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API: http://localhost:3001
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:3001/api-docs

## 📁 Project Structure

```
videoconference/
├── server/                 # Backend application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Server entry point
│   ├── data/              # JSON database files
│   └── tsconfig.json      # TypeScript config
│
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React contexts
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   ├── assets/        # Static assets
│   │   ├── App.tsx        # Root component
│   │   └── main.tsx       # Entry point
│   ├── public/            # Public assets
│   ├── index.html         # HTML template
│   ├── vite.config.ts     # Vite configuration
│   └── tsconfig.json      # TypeScript config
│
├── docs/                  # Documentation
│   └── openapi.yaml       # OpenAPI specification
│
├── package.json           # Root package file
├── tsconfig.json          # Root TypeScript config
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🔧 Available Scripts

### Root Directory
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run start` - Start production server
- `npm run lint` - Lint all TypeScript files
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type check all TypeScript files

### Server Only
- `npm run server:dev` - Start backend in development mode
- `npm run server:build` - Build backend
- `npm run server:start` - Start production backend

### Client Only
- `npm run client:dev` - Start frontend in development mode
- `npm run client:build` - Build frontend
- `npm run client:preview` - Preview production build

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Database
DB_PATH=./server/data

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Socket.io
SOCKET_PATH=/socket.io
```

## 🌐 API Documentation

Once the server is running, access the interactive API documentation at:
- Swagger UI: http://localhost:3001/api-docs
- OpenAPI Spec: http://localhost:3001/api-docs.json

## 👥 Default Users

After first startup, the following admin user is created:

- **Email**: admin@videoconference.com
- **Password**: admin123
- **Role**: Administrator

**⚠️ Important**: Change the admin password immediately in production!

## 🎨 Features

### Core Features
- ✅ User authentication (JWT-based)
- ✅ Admin panel for user management
- ✅ Video conferencing with WebRTC
- ✅ Real-time chat with Socket.io
- ✅ Calendar and booking system
- ✅ Meeting scheduling
- ✅ User availability management

### Technical Features
- ✅ Type-safe API with TypeScript
- ✅ OpenAPI documentation
- ✅ JSON file-based database
- ✅ Rate limiting and security
- ✅ Error handling and logging
- ✅ CORS configuration
- ✅ Hot reload in development

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- CORS protection
- Input validation
- Secure session management

## 🧪 Development

### Code Style
- ESLint for linting
- Prettier for formatting
- TypeScript strict mode enabled

### Best Practices
- Separation of concerns
- Dependency injection
- Error boundaries
- Type safety throughout
- Consistent naming conventions

## 📦 Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment**
   ```bash
   export NODE_ENV=production
   ```

3. **Start the server**
   ```bash
   npm start
   ```

The production build will:
- Optimize and minify frontend assets
- Compile TypeScript to JavaScript
- Serve static files from backend

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Dependencies issues
```bash
# Clean install
rm -rf node_modules client/node_modules
rm package-lock.json client/package-lock.json
npm install
cd client && npm install
```

### TypeScript errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run typecheck
```

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ using React, TypeScript, and modern web technologies**
