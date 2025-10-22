// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  role?: 'admin' | 'user';
  hasFullLicense?: boolean;
  isAdmin?: boolean;
  avatar?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

// Meeting types
export interface Meeting {
  id: string;
  title?: string;
  description?: string;
  dateTime: string;
  roomId: string;
  organizerId: string;
  organizerName?: string;
  bookerName?: string;
  bookerEmail?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

// Availability types
export interface AvailabilitySlot {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked?: boolean;
  createdAt: string;
}

// API response types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token?: string;
}

export interface AuthVerifyResponse {
  authenticated: boolean;
  user?: User;
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

// Context types
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  success: (message: string) => number;
  error: (message: string) => number;
  warning: (message: string) => number;
  info: (message: string) => number;
  removeNotification: (id: number) => void;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface BookingFormData {
  bookerName: string;
  bookerEmail: string;
  title: string;
  description: string;
}

export interface AvailabilityFormData {
  date: string;
  startTime: string;
  endTime: string;
}

// WebRTC types
export interface RTCConfiguration {
  iceServers: RTCIceServer[];
}

export interface ParticipantData {
  userId: string;
  userName: string;
  socketId?: string;
}

export interface ChatMessage {
  id: number;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

// Socket.IO event types
export interface SocketEvents {
  'join-room': (data: { roomId: string; userId: string; userName: string }) => void;
  'user-joined': (data: ParticipantData) => void;
  'user-left': (data: ParticipantData) => void;
  'offer': (data: { roomId: string; offer: RTCSessionDescriptionInit }) => void;
  'answer': (data: { roomId: string; answer: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { roomId: string; candidate: RTCIceCandidateInit }) => void;
  'chat-message': (data: { roomId: string; userId: string; userName: string; message: string }) => void;
  'participants-update': (data: { participants: ParticipantData[] }) => void;
}

// Component props
export interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requireAdmin?: boolean;
  requireFullLicense?: boolean;
}

export interface LoadingSpinnerProps {
  message?: string;
}

export interface NotificationContainerProps {
  // No props needed - uses context
}

// Utility types
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface FetchAPIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  totalMeetings: number;
  totalBookings: number;
  adminUsers: number;
  fullLicenseUsers: number;
}

// Booking types
export interface BookingData {
  organizerId: string;
  availabilityId: string;
  bookerName: string;
  bookerEmail: string;
  title?: string;
  description?: string;
}

export interface OrganizerInfo {
  id: string;
  fullName: string;
  email: string;
}