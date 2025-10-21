const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'videoconference.db');

class Database {
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

    initializeTables() {
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

        // Create default admin user
        this.createDefaultAdmin();
    }

    async createDefaultAdmin() {
        const adminEmail = 'admin@videoconference.com';
        const adminPassword = 'admin123';
        const saltRounds = 10;

        try {
            const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
            
            this.db.run(
                `INSERT OR IGNORE INTO users (email, full_name, password_hash, is_admin, has_full_license) 
                 VALUES (?, ?, ?, TRUE, TRUE)`,
                [adminEmail, 'System Administrator', hashedPassword],
                function(err) {
                    if (err) {
                        console.error('Error creating admin user:', err);
                    } else if (this.changes > 0) {
                        console.log('Default admin user created:');
                        console.log('Email: admin@videoconference.com');
                        console.log('Password: admin123');
                        console.log('Please change the password after first login!');
                    }
                }
            );
        } catch (error) {
            console.error('Error hashing admin password:', error);
        }
    }

    // User methods
    async createUser(email, fullName, password, isAdmin = false, hasFullLicense = false) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO users (email, full_name, password_hash, is_admin, has_full_license) 
                 VALUES (?, ?, ?, ?, ?)`,
                [email, fullName, hashedPassword, isAdmin, hasFullLicense],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, email, fullName, isAdmin, hasFullLicense });
                    }
                }
            );
        });
    }

    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE email = ?',
                [email],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    async getUserById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    async getAllUsers() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT id, email, full_name, is_admin, has_full_license, created_at, last_login FROM users ORDER BY created_at DESC',
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    async updateUserLicense(userId, hasFullLicense) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET has_full_license = ? WHERE id = ?',
                [hasFullLicense, userId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }

    async updateUserAdminStatus(userId, isAdmin) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET is_admin = ? WHERE id = ?',
                [isAdmin, userId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }

    async updateUserTimezone(userId, timezone) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET timezone = ? WHERE id = ?',
                [timezone, userId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }

    async updateLastLogin(userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [userId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }

    // Meeting methods
    async createMeeting(meetingData) {
        const { id, hostId, title, description, startTime, endTime, timezone, meetingUrl, icsFilePath } = meetingData;
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO meetings (id, host_id, title, description, start_time, end_time, timezone, meeting_url, ics_file_path) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, hostId, title, description, startTime, endTime, timezone, meetingUrl, icsFilePath],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id, hostId, title, startTime, endTime });
                    }
                }
            );
        });
    }

    async getMeetingById(meetingId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT m.*, u.full_name as host_name, u.email as host_email 
                 FROM meetings m 
                 JOIN users u ON m.host_id = u.id 
                 WHERE m.id = ?`,
                [meetingId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    async getUserMeetings(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM meetings WHERE host_id = ? ORDER BY start_time ASC',
                [userId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    // Availability methods
    async setUserAvailability(userId, availability) {
        // First, clear existing availability
        await new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM user_availability WHERE user_id = ?',
                [userId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Insert new availability
        const insertPromises = availability.map(slot => {
            return new Promise((resolve, reject) => {
                this.db.run(
                    `INSERT INTO user_availability (user_id, day_of_week, start_time, end_time, timezone) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [userId, slot.dayOfWeek, slot.startTime, slot.endTime, slot.timezone],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });
        });

        return Promise.all(insertPromises);
    }

    async getUserAvailability(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM user_availability WHERE user_id = ? AND is_active = TRUE ORDER BY day_of_week, start_time',
                [userId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

module.exports = Database;