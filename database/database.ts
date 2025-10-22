import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
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

const dbPath = path.join(__dirname, 'videoconference.db');

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  private initializeTables(): void {
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

  private async createDefaultAdmin(): Promise<void> {
    try {
      // Check if any admin user already exists
      this.db.get(`SELECT COUNT(*) as count FROM users WHERE is_admin = 1`, [], (err, row: any) => {
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
            `, ['admin@videoconference.com', 'Administrator', hashedPassword, true, true], (insertErr) => {
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
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT id, email, full_name as fullName, password_hash, is_admin as isAdmin, 
               has_full_license as hasFullLicense, created_at as createdAt
        FROM users WHERE email = ?
      `, [email], async (err, row: any) => {
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

  async getUserById(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT id, email, full_name as fullName, is_admin as isAdmin, 
               has_full_license as hasFullLicense, created_at as createdAt
        FROM users WHERE id = ?
      `, [id], (err, row: any) => {
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

  async createUser(userData: CreateUserData): Promise<User> {
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
        ], function(err) {
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

  async getAllUsers(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT id, email, full_name as fullName, is_admin as isAdmin, 
               has_full_license as hasFullLicense, created_at as createdAt
        FROM users ORDER BY created_at DESC
      `, [], (err, rows: any[]) => {
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

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
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
      `, values, (err) => {
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

  async deleteUser(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // First verify the current password
        this.db.get(`
          SELECT password_hash FROM users WHERE id = ?
        `, [id], async (err, row: any) => {
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
            `, [newHashedPassword, id], (updateErr) => {
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

  // Meeting management methods
  async createMeeting(meetingData: CreateMeetingData): Promise<Meeting> {
    return new Promise((resolve, reject) => {
      const meetingId = this.generateMeetingId();
      
      this.db.run(`
        INSERT INTO meetings (id, host_id, title, description, start_time, end_time, timezone, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        meetingId,
        meetingData.createdBy,
        meetingData.title || 'Video Meeting',
        meetingData.description || '',
        meetingData.dateTime,
        meetingData.endDateTime || new Date(new Date(meetingData.dateTime).getTime() + 60 * 60 * 1000).toISOString(),
        'UTC',
        'scheduled'
      ], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        const meeting: Meeting = {
          id: meetingId,
          title: meetingData.title || 'Video Meeting',
          description: meetingData.description,
          dateTime: meetingData.dateTime,
          endDateTime: meetingData.endDateTime,
          roomId: meetingId,
          status: 'pending',
          createdBy: meetingData.createdBy,
          bookerName: meetingData.bookerName,
          bookerEmail: meetingData.bookerEmail
        };
        resolve(meeting);
      });
    });
  }

  async getUserMeetings(userId: string): Promise<Meeting[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT id, title, description, start_time as dateTime, end_time as endDateTime, 
               status, host_id as createdBy
        FROM meetings WHERE host_id = ? ORDER BY start_time ASC
      `, [userId], (err, rows: any[]) => {
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
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT m.id, m.title, m.description, m.start_time as dateTime, 
               m.end_time as endDateTime, m.status, m.host_id as createdBy,
               u.full_name as hostName
        FROM meetings m
        LEFT JOIN users u ON m.host_id = u.id
        ORDER BY m.start_time ASC
      `, [], (err, rows: any[]) => {
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
  }

  async deleteMeeting(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM meetings WHERE id = ?', [id], (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  // Availability methods
  async getUserAvailability(userId: string): Promise<UserAvailability[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT id, user_id as userId, day_of_week as dayOfWeek, 
               start_time as startTime, end_time as endTime, 
               is_active as isActive
        FROM user_availability WHERE user_id = ? AND is_active = 1
      `, [userId], (err, rows: any[]) => {
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
  }

  async addAvailability(availabilityData: Omit<UserAvailability, 'id'>): Promise<UserAvailability> {
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
      ], function(err) {
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
  }

  async deleteAvailability(id: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM user_availability WHERE id = ? AND user_id = ?', 
        [id, userId], 
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  private generateMeetingId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Close database connection
  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

export default Database;