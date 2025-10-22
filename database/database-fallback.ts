import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import {
  User,
  CreateUserData,
  Meeting,
  CreateMeetingData,
  BookingSlot,
  UserAvailability,
  MeetingParticipant,
  DatabaseResult,
  QueryResult
} from '../src/types';

// Try to import SQLite3, fall back to JSON if it fails
let sqlite3: any = null;
let useSQLite = true;

try {
  sqlite3 = require('sqlite3');
  console.log('✅ SQLite3 loaded successfully');
} catch (error: any) {
  console.warn('⚠️  SQLite3 failed to load, falling back to JSON storage:', error?.message || error);
  useSQLite = false;
}

// JSON file paths
const dataDir = path.join(__dirname);
const usersFile = path.join(dataDir, 'users.json');
const meetingsFile = path.join(dataDir, 'meetings.json');
const availabilityFile = path.join(dataDir, 'availability.json');
const bookingsFile = path.join(dataDir, 'bookings.json');

// JSON file helpers
const ensureFile = (filePath: string, defaultData: any = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

const readJsonFile = (filePath: string, defaultData: any = []) => {
  ensureFile(filePath, defaultData);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
};

const writeJsonFile = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
};

export class Database {
  private db: any = null;
  private sqliteReady: boolean = false;

  constructor() {
    if (useSQLite && sqlite3) {
      this.initializeSQLite();
    } else {
      this.initializeJSON();
    }
  }

  private initializeSQLite(): void {
    const dbPath = path.join(__dirname, 'videoconference.db');
    
    this.db = new sqlite3.Database(dbPath, (err: any) => {
      if (err) {
        console.error('❌ Error opening SQLite database:', err);
        console.log('🔄 Falling back to JSON storage...');
        this.sqliteReady = false;
        this.initializeJSON();
      } else {
        console.log('✅ Connected to SQLite database');
        this.sqliteReady = true;
        this.initializeSQLiteTables();
      }
    });
  }

  private initializeJSON(): void {
    console.log('📁 Initializing JSON file storage...');
    
    // Ensure all JSON files exist
    ensureFile(usersFile, []);
    ensureFile(meetingsFile, []);
    ensureFile(availabilityFile, []);
    ensureFile(bookingsFile, []);
    
    // Create default admin if needed
    this.createDefaultAdminJSON();
    
    console.log('✅ JSON storage initialized');
  }

  private initializeSQLiteTables(): void {
    if (!this.sqliteReady || !this.db) return;

    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        has_full_license BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        timezone TEXT DEFAULT 'UTC'
      )
    `);

    // Meetings table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        host_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        timezone TEXT NOT NULL,
        status TEXT DEFAULT 'scheduled',
        meeting_url TEXT,
        ics_file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (host_id) REFERENCES users (id)
      )
    `);

    // Meeting participants table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id TEXT NOT NULL,
        participant_email TEXT NOT NULL,
        participant_name TEXT,
        status TEXT DEFAULT 'invited',
        joined_at DATETIME,
        FOREIGN KEY (meeting_id) REFERENCES meetings (id)
      )
    `);

    // User availability table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        timezone TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Booking slots table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS booking_slots (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        slot_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_booked BOOLEAN DEFAULT FALSE,
        booked_by_email TEXT,
        booked_by_name TEXT,
        meeting_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (meeting_id) REFERENCES meetings (id)
      )
    `);

    // Create default admin user only if enabled via environment variable
    if (process.env.CREATE_DEFAULT_ADMIN !== 'false') {
      this.createDefaultAdmin();
    }
  }

  private async createDefaultAdminJSON(): Promise<void> {
    try {
      const users = readJsonFile(usersFile, []);
      
      // Check if any admin user already exists
      const hasAdmin = users.some((user: any) => user.isAdmin);
      
      if (!hasAdmin) {
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
        if (!adminPassword) {
          console.log('No admin users found and no DEFAULT_ADMIN_PASSWORD set. Skipping default admin creation.');
          return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const admin = {
          id: '1',
          email: 'admin@videoconference.com',
          fullName: 'Administrator',
          password_hash: hashedPassword,
          isAdmin: true,
          hasFullLicense: true,
          createdAt: new Date().toISOString()
        };

        users.push(admin);
        writeJsonFile(usersFile, users);
        console.log('Default admin user created with custom password (JSON)');
        console.log('Email: admin@videoconference.com');
      }
    } catch (error) {
      console.error('Error creating default admin (JSON):', error);
    }
  }

  private async createDefaultAdmin(): Promise<void> {
    if (!this.sqliteReady || !this.db) return;

    try {
      // Check if any admin user already exists
      this.db.get(`SELECT COUNT(*) as count FROM users WHERE is_admin = 1`, [], (err: any, row: any) => {
        if (err) {
          console.error('Error checking for existing admins:', err);
          return;
        }

        // Only create default admin if no admin users exist
        if (row.count === 0) {
          // Use environment variable for password or skip creation
          const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
          if (!adminPassword) {
            console.log('No admin users found and no DEFAULT_ADMIN_PASSWORD set. Skipping default admin creation.');
            console.log('You can create an admin user through the registration process.');
            return;
          }

          bcrypt.hash(adminPassword, 10).then((hashedPassword) => {
            this.db.run(`
              INSERT INTO users (email, full_name, password_hash, is_admin, has_full_license)
              VALUES (?, ?, ?, ?, ?)
            `, ['admin@videoconference.com', 'Administrator', hashedPassword, true, true], (insertErr: any) => {
              if (insertErr) {
                console.error('Error creating default admin:', insertErr);
              } else {
                console.log('Default admin user created with custom password');
                console.log('Email: admin@videoconference.com');
              }
            });
          }).catch((hashError) => {
            console.error('Error hashing admin password:', hashError);
          });
        } else {
          console.log('Admin user(s) already exist. Skipping default admin creation.');
        }
      });
    } catch (error) {
      console.error('Error in createDefaultAdmin:', error);
    }
  }

  // User management methods
  async authenticateUser(email: string, password: string): Promise<User | null> {
    if (this.sqliteReady && this.db) {
      return this.authenticateUserSQLite(email, password);
    } else {
      return this.authenticateUserJSON(email, password);
    }
  }

  private async authenticateUserSQLite(email: string, password: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT id, email, full_name as fullName, password_hash, is_admin as isAdmin, 
               has_full_license as hasFullLicense, created_at as createdAt
        FROM users WHERE email = ?
      `, [email], async (err: any, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }

        try {
          const isValid = await bcrypt.compare(password, row.password_hash);
          if (isValid) {
            // Update last login
            this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
            
            const user: User = {
              id: row.id.toString(),
              email: row.email,
              fullName: row.fullName,
              isAdmin: Boolean(row.isAdmin),
              hasFullLicense: Boolean(row.hasFullLicense),
              createdAt: row.createdAt
            };
            resolve(user);
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async authenticateUserJSON(email: string, password: string): Promise<User | null> {
    try {
      const users = readJsonFile(usersFile, []);
      const user = users.find((u: any) => u.email === email);
      
      if (!user) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (isValid) {
        // Update last login
        user.last_login = new Date().toISOString();
        writeJsonFile(usersFile, users);
        
        return {
          id: user.id.toString(),
          email: user.email,
          fullName: user.fullName,
          isAdmin: Boolean(user.isAdmin),
          hasFullLicense: Boolean(user.hasFullLicense),
          createdAt: user.createdAt
        };
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    if (this.sqliteReady && this.db) {
      return this.getUserByIdSQLite(id);
    } else {
      return this.getUserByIdJSON(id);
    }
  }

  private async getUserByIdSQLite(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT id, email, full_name as fullName, is_admin as isAdmin, 
               has_full_license as hasFullLicense, created_at as createdAt
        FROM users WHERE id = ?
      `, [id], (err: any, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }

        const user: User = {
          id: row.id.toString(),
          email: row.email,
          fullName: row.fullName,
          isAdmin: Boolean(row.isAdmin),
          hasFullLicense: Boolean(row.hasFullLicense),
          createdAt: row.createdAt
        };
        resolve(user);
      });
    });
  }

  private async getUserByIdJSON(id: string): Promise<User | null> {
    try {
      const users = readJsonFile(usersFile, []);
      const user = users.find((u: any) => u.id.toString() === id);
      
      if (!user) {
        return null;
      }

      return {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        isAdmin: Boolean(user.isAdmin),
        hasFullLicense: Boolean(user.hasFullLicense),
        createdAt: user.createdAt
      };
    } catch (error) {
      throw error;
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    if (this.sqliteReady && this.db) {
      return this.createUserSQLite(userData);
    } else {
      return this.createUserJSON(userData);
    }
  }

  private async createUserSQLite(userData: CreateUserData): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        this.db.run(`
          INSERT INTO users (email, full_name, password_hash, is_admin, has_full_license)
          VALUES (?, ?, ?, ?, ?)
        `, [
          userData.email, 
          userData.fullName || userData.name, 
          hashedPassword, 
          userData.role === 'admin', 
          userData.hasFullLicense || false
        ], function(this: any, err: any) {
          if (err) {
            reject(err);
            return;
          }
          
          const user: User = {
            id: this.lastID.toString(),
            email: userData.email,
            fullName: userData.fullName || userData.name,
            isAdmin: userData.role === 'admin',
            hasFullLicense: userData.hasFullLicense || false
          };
          resolve(user);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async createUserJSON(userData: CreateUserData): Promise<User> {
    try {
      const users = readJsonFile(usersFile, []);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Generate new ID
      const newId = (Math.max(...users.map((u: any) => parseInt(u.id) || 0), 0) + 1).toString();
      
      const user = {
        id: newId,
        email: userData.email,
        fullName: userData.fullName || userData.name,
        password_hash: hashedPassword,
        isAdmin: userData.role === 'admin',
        hasFullLicense: userData.hasFullLicense || false,
        createdAt: new Date().toISOString()
      };
      
      users.push(user);
      writeJsonFile(usersFile, users);
      
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        hasFullLicense: user.hasFullLicense,
        createdAt: user.createdAt
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (this.sqliteReady && this.db) {
      return this.getAllUsersSQLite();
    } else {
      return this.getAllUsersJSON();
    }
  }

  private async getAllUsersSQLite(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT id, email, full_name as fullName, is_admin as isAdmin, 
               has_full_license as hasFullLicense, created_at as createdAt
        FROM users ORDER BY created_at DESC
      `, [], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const users: User[] = rows.map(row => ({
          id: row.id.toString(),
          email: row.email,
          fullName: row.fullName,
          isAdmin: Boolean(row.isAdmin),
          hasFullLicense: Boolean(row.hasFullLicense),
          createdAt: row.createdAt
        }));
        resolve(users);
      });
    });
  }

  private async getAllUsersJSON(): Promise<User[]> {
    try {
      const users = readJsonFile(usersFile, []);
      return users.map((user: any) => ({
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        isAdmin: Boolean(user.isAdmin),
        hasFullLicense: Boolean(user.hasFullLicense),
        createdAt: user.createdAt
      })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (this.sqliteReady && this.db) {
      return this.updateUserSQLite(id, updates);
    } else {
      return this.updateUserJSON(id, updates);
    }
  }

  private async updateUserSQLite(id: string, updates: Partial<User>): Promise<User> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];
      
      if (updates.fullName !== undefined) {
        fields.push('full_name = ?');
        values.push(updates.fullName);
      }
      if (updates.hasFullLicense !== undefined) {
        fields.push('has_full_license = ?');
        values.push(updates.hasFullLicense);
      }
      if (updates.isAdmin !== undefined) {
        fields.push('is_admin = ?');
        values.push(updates.isAdmin);
      }
      
      values.push(id);
      
      this.db.run(`
        UPDATE users SET ${fields.join(', ')} WHERE id = ?
      `, values, (err: any) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.getUserById(id).then(user => {
          if (user) {
            resolve(user);
          } else {
            reject(new Error('User not found after update'));
          }
        }).catch(reject);
      });
    });
  }

  private async updateUserJSON(id: string, updates: Partial<User>): Promise<User> {
    try {
      const users = readJsonFile(usersFile, []);
      const userIndex = users.findIndex((u: any) => u.id.toString() === id);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      if (updates.fullName !== undefined) {
        users[userIndex].fullName = updates.fullName;
      }
      if (updates.hasFullLicense !== undefined) {
        users[userIndex].hasFullLicense = updates.hasFullLicense;
      }
      if (updates.isAdmin !== undefined) {
        users[userIndex].isAdmin = updates.isAdmin;
      }
      
      writeJsonFile(usersFile, users);
      
      return {
        id: users[userIndex].id.toString(),
        email: users[userIndex].email,
        fullName: users[userIndex].fullName,
        isAdmin: Boolean(users[userIndex].isAdmin),
        hasFullLicense: Boolean(users[userIndex].hasFullLicense),
        createdAt: users[userIndex].createdAt
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    if (this.sqliteReady && this.db) {
      return this.deleteUserSQLite(id);
    } else {
      return this.deleteUserJSON(id);
    }
  }

  private async deleteUserSQLite(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM users WHERE id = ?', [id], (err: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  private async deleteUserJSON(id: string): Promise<void> {
    try {
      const users = readJsonFile(usersFile, []);
      const filteredUsers = users.filter((u: any) => u.id.toString() !== id);
      writeJsonFile(usersFile, filteredUsers);
    } catch (error) {
      throw error;
    }
  }

  async updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    if (this.sqliteReady && this.db) {
      return this.updateUserPasswordSQLite(id, currentPassword, newPassword);
    } else {
      return this.updateUserPasswordJSON(id, currentPassword, newPassword);
    }
  }

  private async updateUserPasswordSQLite(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // First verify the current password
        this.db.get(`
          SELECT password_hash FROM users WHERE id = ?
        `, [id], async (err: any, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            reject(new Error('User not found'));
            return;
          }

          try {
            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, row.password_hash);
            if (!isCurrentPasswordValid) {
              reject(new Error('Current password is incorrect'));
              return;
            }

            // Hash new password
            const newHashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password in database
            this.db.run(`
              UPDATE users SET password_hash = ? WHERE id = ?
            `, [newHashedPassword, id], (updateErr: any) => {
              if (updateErr) {
                reject(updateErr);
                return;
              }
              resolve(true);
            });

          } catch (hashError) {
            reject(hashError);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async updateUserPasswordJSON(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const users = readJsonFile(usersFile, []);
      const user = users.find((u: any) => u.id.toString() === id);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      user.password_hash = newHashedPassword;
      
      writeJsonFile(usersFile, users);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Meeting management methods (simplified implementations)
  async createMeeting(meetingData: CreateMeetingData): Promise<Meeting> {
    const meetingId = this.generateMeetingId();
    
    const meeting: Meeting = {
      id: meetingId,
      title: meetingData.title || 'Video Meeting',
      description: meetingData.description,
      dateTime: meetingData.dateTime,
      endDateTime: meetingData.endDateTime || new Date(new Date(meetingData.dateTime).getTime() + 60 * 60 * 1000).toISOString(),
      roomId: meetingId,
      status: 'pending',
      createdBy: meetingData.createdBy,
      bookerName: meetingData.bookerName,
      bookerEmail: meetingData.bookerEmail
    };

    if (this.sqliteReady && this.db) {
      return new Promise((resolve, reject) => {
        this.db.run(`
          INSERT INTO meetings (id, host_id, title, description, start_time, end_time, timezone, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          meetingId,
          meetingData.createdBy,
          meetingData.title || 'Video Meeting',
          meetingData.description || '',
          meetingData.dateTime,
          meeting.endDateTime,
          'UTC',
          'scheduled'
        ], function(err: any) {
          if (err) {
            reject(err);
            return;
          }
          resolve(meeting);
        });
      });
    } else {
      const meetings = readJsonFile(meetingsFile, []);
      meetings.push({
        ...meeting,
        host_id: meetingData.createdBy,
        start_time: meetingData.dateTime,
        end_time: meeting.endDateTime,
        created_at: new Date().toISOString()
      });
      writeJsonFile(meetingsFile, meetings);
      return meeting;
    }
  }

  async getUserMeetings(userId: string): Promise<Meeting[]> {
    if (this.sqliteReady && this.db) {
      return new Promise((resolve, reject) => {
        this.db.all(`
          SELECT id, title, description, start_time as dateTime, end_time as endDateTime, 
                 status, host_id as createdBy
          FROM meetings WHERE host_id = ? ORDER BY start_time ASC
        `, [userId], (err: any, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          
          const meetings: Meeting[] = rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            dateTime: row.dateTime,
            endDateTime: row.endDateTime,
            roomId: row.id,
            status: row.status as Meeting['status'],
            createdBy: row.createdBy?.toString()
          }));
          resolve(meetings);
        });
      });
    } else {
      const meetings = readJsonFile(meetingsFile, []);
      return meetings
        .filter((m: any) => m.host_id?.toString() === userId)
        .map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          dateTime: m.start_time,
          endDateTime: m.end_time,
          roomId: m.id,
          status: m.status || 'pending',
          createdBy: m.host_id?.toString()
        }))
        .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }
  }

  async getAllMeetings(): Promise<Meeting[]> {
    if (this.sqliteReady && this.db) {
      return new Promise((resolve, reject) => {
        this.db.all(`
          SELECT m.id, m.title, m.description, m.start_time as dateTime, 
                 m.end_time as endDateTime, m.status, m.host_id as createdBy,
                 u.full_name as hostName
          FROM meetings m
          LEFT JOIN users u ON m.host_id = u.id
          ORDER BY m.start_time ASC
        `, [], (err: any, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          
          const meetings: Meeting[] = rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            dateTime: row.dateTime,
            endDateTime: row.endDateTime,
            roomId: row.id,
            status: row.status as Meeting['status'],
            createdBy: row.createdBy?.toString()
          }));
          resolve(meetings);
        });
      });
    } else {
      const meetings = readJsonFile(meetingsFile, []);
      return meetings
        .map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          dateTime: m.start_time,
          endDateTime: m.end_time,
          roomId: m.id,
          status: m.status || 'pending',
          createdBy: m.host_id?.toString()
        }))
        .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }
  }

  async deleteMeeting(id: string): Promise<void> {
    if (this.sqliteReady && this.db) {
      return new Promise((resolve, reject) => {
        this.db.run('DELETE FROM meetings WHERE id = ?', [id], (err: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    } else {
      const meetings = readJsonFile(meetingsFile, []);
      const filteredMeetings = meetings.filter((m: any) => m.id !== id);
      writeJsonFile(meetingsFile, filteredMeetings);
    }
  }

  // Availability methods (simplified)
  async getUserAvailability(userId: string): Promise<UserAvailability[]> {
    if (this.sqliteReady && this.db) {
      return new Promise((resolve, reject) => {
        this.db.all(`
          SELECT id, user_id as userId, day_of_week as dayOfWeek, 
                 start_time as startTime, end_time as endTime, 
                 is_active as isActive
          FROM user_availability WHERE user_id = ? AND is_active = 1
        `, [userId], (err: any, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          
          const availability: UserAvailability[] = rows.map(row => ({
            id: row.id.toString(),
            userId: row.userId.toString(),
            dayOfWeek: row.dayOfWeek,
            startTime: row.startTime,
            endTime: row.endTime,
            isActive: Boolean(row.isActive)
          }));
          resolve(availability);
        });
      });
    } else {
      const availability = readJsonFile(availabilityFile, []);
      return availability
        .filter((a: any) => a.userId?.toString() === userId && a.isActive !== false)
        .map((a: any) => ({
          id: a.id?.toString(),
          userId: a.userId?.toString(),
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          isActive: Boolean(a.isActive !== false)
        }));
    }
  }

  async addAvailability(availabilityData: Omit<UserAvailability, 'id'>): Promise<UserAvailability> {
    if (this.sqliteReady && this.db) {
      return new Promise((resolve, reject) => {
        this.db.run(`
          INSERT INTO user_availability (user_id, day_of_week, start_time, end_time, timezone, is_active)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          availabilityData.userId,
          availabilityData.dayOfWeek,
          availabilityData.startTime,
          availabilityData.endTime,
          'UTC',
          availabilityData.isActive
        ], function(this: any, err: any) {
          if (err) {
            reject(err);
            return;
          }
          
          const availability: UserAvailability = {
            id: this.lastID.toString(),
            ...availabilityData
          };
          resolve(availability);
        });
      });
    } else {
      const availability = readJsonFile(availabilityFile, []);
      const newId = (Math.max(...availability.map((a: any) => parseInt(a.id) || 0), 0) + 1).toString();
      
      const newAvailability: UserAvailability = {
        id: newId,
        ...availabilityData
      };
      
      availability.push(newAvailability);
      writeJsonFile(availabilityFile, availability);
      return newAvailability;
    }
  }

  async deleteAvailability(id: string, userId: string): Promise<void> {
    if (this.sqliteReady && this.db) {
      return new Promise((resolve, reject) => {
        this.db.run(
          'DELETE FROM user_availability WHERE id = ? AND user_id = ?', 
          [id, userId], 
          (err: any) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          }
        );
      });
    } else {
      const availability = readJsonFile(availabilityFile, []);
      const filteredAvailability = availability.filter((a: any) => 
        !(a.id?.toString() === id && a.userId?.toString() === userId)
      );
      writeJsonFile(availabilityFile, filteredAvailability);
    }
  }

  private generateMeetingId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Close database connection
  close(): void {
    if (this.db && this.sqliteReady) {
      this.db.close((err: any) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    } else {
      console.log('JSON storage - no database connection to close');
    }
  }
}

export default Database;