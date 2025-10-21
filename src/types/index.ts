// Backend Type Definitions for Video Conference Platform
import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  password?: string;
  passwordHash?: string;
  role?: 'admin' | 'user';
  hasFullLicense?: boolean;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  email: string;
  name?: string;
  fullName?: string;
  password: string;
  role?: 'admin' | 'user';
  hasFullLicense?: boolean;
}

export interface Meeting {
  id: string;
  title?: string;
  description?: string;
  dateTime: string;
  endDateTime?: string;
  roomId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdBy?: string;
  bookerName?: string;
  bookerEmail?: string;
  participants?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMeetingData {
  title?: string;
  description?: string;
  dateTime: string;
  endDateTime?: string;
  roomId?: string;
  bookerName?: string;
  bookerEmail?: string;
  createdBy?: string;
}

export interface BookingSlot {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked?: boolean;
  meetingId?: string;
  createdAt?: string;
}

export interface UserAvailability {
  id: string;
  userId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId?: string;
  participantName?: string;
  participantEmail?: string;
  joinedAt?: string;
  leftAt?: string;
  status: 'invited' | 'joined' | 'left';
}

// Database operation result types
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface QueryResult {
  changes?: number;
  lastID?: number;
}

// API Request/Response types
export interface ApiRequest extends Request {
  user?: User;
  userId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
  fullName?: string;
}

export interface UpdateUserLicenseRequest {
  hasFullLicense: boolean;
}

export interface CreateMeetingRequest {
  title?: string;
  description?: string;
  dateTime: string;
  endDateTime?: string;
  bookerName?: string;
  bookerEmail?: string;
}

export interface BookMeetingRequest {
  dateTime: string;
  endDateTime?: string;
  bookerName: string;
  bookerEmail: string;
  title?: string;
  description?: string;
}

export interface SetAvailabilityRequest {
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[];
}

// Session types
export interface SessionData {
  userId?: string;
  userEmail?: string;
  isAuthenticated?: boolean;
}

// Socket.IO types
export interface SocketUser {
  id: string;
  socketId: string;
  roomId?: string;
  name?: string;
  email?: string;
}

export interface SocketMessage {
  type: 'chat' | 'system' | 'user-joined' | 'user-left';
  message: string;
  sender?: string;
  timestamp: string;
  roomId: string;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  signal: any;
  from: string;
  to: string;
  roomId: string;
}

// Configuration types
export interface AppConfig {
  port: number;
  httpsPort?: number;
  jwtSecret: string;
  sessionSecret: string;
  dbPath: string;
  environment: 'development' | 'production' | 'test';
  corsOrigin: string | string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

// Error types
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Utility types
export type DatabaseOperationType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

export interface LogContext {
  userId?: string;
  operation: string;
  details?: any;
  timestamp: string;
}

// Express middleware types
export interface AuthenticatedRequest extends Request {
  user: User;
  userId: string;
}

export interface AdminRequest extends Request {
  user: User & { isAdmin: true };
}

// Calendar/ICS types
export interface ICSEvent {
  uid: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  organizer?: string;
  attendees?: string[];
}

export interface CalendarExport {
  events: ICSEvent[];
  timezone?: string;
  calendarName?: string;
}

// Statistics types
export interface SystemStats {
  totalUsers: number;
  totalMeetings: number;
  activeMeetings: number;
  totalBookings: number;
  usersWithFullLicense: number;
  meetingsToday: number;
  meetingsThisWeek: number;
  meetingsThisMonth: number;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

// File upload types (for potential future features)
export interface FileUploadInfo {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Environment variable types
export interface EnvironmentVariables {
  NODE_ENV?: string;
  PORT?: string;
  HTTPS_PORT?: string;
  JWT_SECRET?: string;
  SESSION_SECRET?: string;
  DB_PATH?: string;
  CORS_ORIGIN?: string;
}

// Type exports are handled individually above