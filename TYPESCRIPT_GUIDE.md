# TypeScript Development Guide

## 🎯 Overview

This video conference application has been fully migrated to TypeScript, providing enhanced type safety, better IDE support, and improved developer experience.

## 🏗️ Project Structure

```
videoconference/
├── client/                    # React TypeScript Frontend
│   ├── src/
│   │   ├── components/       # Reusable React components (.tsx)
│   │   ├── context/          # React context providers (.tsx)
│   │   ├── pages/            # Page components (.tsx)
│   │   ├── services/         # API and authentication services (.ts)
│   │   ├── types/            # TypeScript type definitions (.ts)
│   │   ├── App.tsx           # Main React application
│   │   └── index.tsx         # React entry point
│   ├── public/               # Static assets
│   ├── package.json          # Client dependencies
│   └── tsconfig.json         # TypeScript configuration
├── server-react.js           # Node.js server (serves React build)
├── routes/                   # API routes (JavaScript)
├── database/                 # Database management (JavaScript)
└── package.json              # Root dependencies
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm 8+
- TypeScript knowledge (basic to intermediate)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd videoconference
   chmod +x setup-typescript.sh
   ./setup-typescript.sh
   ```

2. **Start development environment:**
   ```bash
   npm run dev:full
   ```

3. **Access the application:**
   - React App: http://localhost:3000
   - Server API: http://localhost:3001

## 📝 Available Scripts

### Root Level Scripts

```bash
# Development
npm run dev                 # Start server only
npm run client             # Start React client only  
npm run dev:full           # Start both server and client

# TypeScript & Quality
npm run type-check         # Run TypeScript type checking
npm run lint               # Run ESLint code checking
npm run lint:fix           # Fix auto-fixable linting issues

# Building
npm run build              # Build production version
npm run build:prod         # Build with type checking

# Installation
npm run install-all        # Install all dependencies
```

### Client-Specific Scripts

```bash
cd client

# Development
npm start                  # Start development server
npm run dev                # Alias for start

# TypeScript & Quality
npm run type-check         # Type check without emitting
npm run type-check:watch   # Type check in watch mode
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues

# Building
npm run build              # Production build
npm run build:prod         # Production build with type checking
npm run clean              # Clean build directory

# Testing
npm test                   # Run tests
```

## 🎨 TypeScript Features

### Type Definitions

All types are centralized in `client/src/types/index.ts`:

```typescript
// User authentication and profile data
interface User {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  role?: 'admin' | 'user';
  hasFullLicense?: boolean;
  isAdmin?: boolean;
  // ... more properties
}

// Meeting data structure
interface Meeting {
  id: string;
  title?: string;
  dateTime: string;
  roomId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  // ... more properties
}

// API response typing
interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
}
```

### Typed API Calls

```typescript
import { fetchAPI } from '../services/api';
import { User, Meeting } from '../types';

// Type-safe API calls
const users = await fetchAPI<User[]>('/api/users');
const meeting = await fetchAPI<Meeting>('/api/meetings/123');
```

### React Component Typing

```typescript
import React from 'react';

interface ComponentProps {
  title: string;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

const MyComponent: React.FC<ComponentProps> = ({ 
  title, 
  onSubmit, 
  isLoading = false 
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Type-safe form handling
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>{title}</h1>
      {/* Component JSX */}
    </form>
  );
};

export default MyComponent;
```

### Context Providers with Types

```typescript
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 🛠️ Development Workflow

### 1. Type-First Development

Always define types before implementing:

```typescript
// 1. Define the interface
interface BookingFormData {
  bookerName: string;
  bookerEmail: string;
  title: string;
  description: string;
}

// 2. Create the component
const BookingForm: React.FC = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    bookerName: '',
    bookerEmail: '',
    title: '',
    description: ''
  });
  
  // TypeScript will ensure type safety
};
```

### 2. Type Checking During Development

Run type checking while developing:

```bash
# Watch mode for continuous type checking
npm run type-check:watch

# Single type check
npm run type-check
```

### 3. Adding New Features

1. **Add types** in `types/index.ts`
2. **Create/update API services** with proper typing
3. **Implement components** with typed props
4. **Test type safety** with `npm run type-check`
5. **Lint code** with `npm run lint`

## 🔧 Configuration Files

### TypeScript Configuration (`client/tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src"
  ]
}
```

### ESLint Configuration

ESLint is configured to work with TypeScript and React. Configuration is in `client/package.json`:

```json
{
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  }
}
```

## 🎯 Best Practices

### 1. Type Safety

```typescript
// ✅ Good: Explicit typing
interface Props {
  data: User[];
  onSelect: (user: User) => void;
}

// ❌ Avoid: Using 'any'
interface Props {
  data: any;
  onSelect: (user: any) => void;
}
```

### 2. Event Handling

```typescript
// ✅ Good: Typed event handlers
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // Handle form submission
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};
```

### 3. Optional Properties

```typescript
// ✅ Good: Use optional properties appropriately
interface ComponentProps {
  title: string;              // Required
  subtitle?: string;          // Optional
  onClose?: () => void;       // Optional callback
}
```

### 4. Generic Functions

```typescript
// ✅ Good: Generic API functions
const fetchData = async <T>(url: string): Promise<T> => {
  const response = await fetchAPI<T>(url);
  return response;
};

// Usage
const users = await fetchData<User[]>('/api/users');
```

## 🐛 Troubleshooting

### Common TypeScript Errors

1. **"Property does not exist on type"**
   ```typescript
   // ❌ Error: Property 'fullName' does not exist
   user.fullName
   
   // ✅ Fix: Use optional chaining or check
   user.fullName || user.name
   user?.fullName
   ```

2. **"Type 'null' is not assignable"**
   ```typescript
   // ❌ Error: Possible null reference
   const element = document.getElementById('myId');
   element.style.display = 'none';
   
   // ✅ Fix: Null check
   const element = document.getElementById('myId');
   if (element) {
     element.style.display = 'none';
   }
   ```

3. **"Argument of type 'string | undefined'"**
   ```typescript
   // ❌ Error: Possible undefined
   const userId = user.id;
   deleteUser(userId);
   
   // ✅ Fix: Type guard
   if (user.id) {
     deleteUser(user.id);
   }
   ```

### Build Issues

1. **Type checking fails:**
   ```bash
   npm run type-check
   # Fix reported errors
   ```

2. **ESLint errors:**
   ```bash
   npm run lint:fix  # Auto-fix what's possible
   npm run lint      # Check remaining issues
   ```

3. **Build fails:**
   ```bash
   npm run clean     # Clear build cache
   npm run build     # Try building again
   ```

## 📚 Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript with React](https://www.typescriptlang.org/docs/handbook/react.html)

## 🔄 Migration Status

✅ **Completed:**
- TypeScript configuration
- Type definitions
- React components conversion
- Context providers
- API services
- Build scripts
- Development tools

🔄 **Optional Future Work:**
- Backend TypeScript conversion
- Advanced ESLint rules
- Type-safe testing setup

---

Happy TypeScript development! 🚀