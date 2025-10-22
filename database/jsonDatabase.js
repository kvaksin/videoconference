const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class JSONDatabase {
    constructor(dataDir = './data') {
        this.dataDir = dataDir;
        this.files = {
            users: path.join(dataDir, 'users.json'),
            meetings: path.join(dataDir, 'meetings.json'),
            availability: path.join(dataDir, 'availability.json'),
            bookings: path.join(dataDir, 'bookings.json'),
            sessions: path.join(dataDir, 'sessions.json')
        };
        this.initialize();
    }

    async initialize() {
        try {
            // Ensure data directory exists
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Initialize JSON files if they don't exist
            await this.initializeFile('users', []);
            await this.initializeFile('meetings', []);
            await this.initializeFile('availability', []);
            await this.initializeFile('bookings', []);
            await this.initializeFile('sessions', []);
            
            // Create default admin user only if enabled via environment variable
            if (process.env.CREATE_DEFAULT_ADMIN !== 'false') {
                await this.createDefaultAdmin();
            }
            
            console.log('JSON Database initialized successfully');
        } catch (error) {
            console.error('Error initializing JSON database:', error);
        }
    }

    async initializeFile(fileName, defaultData) {
        const filePath = this.files[fileName];
        try {
            await fs.access(filePath);
        } catch (error) {
            // File doesn't exist, create it
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
        }
    }

    async readFile(fileName) {
        try {
            const data = await fs.readFile(this.files[fileName], 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${fileName}:`, error);
            return [];
        }
    }

    async writeFile(fileName, data) {
        try {
            await fs.writeFile(this.files[fileName], JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Error writing ${fileName}:`, error);
            throw error;
        }
    }

    // User management
    async createDefaultAdmin() {
        const users = await this.readFile('users');
        const adminExists = users.find(user => user.is_admin === true);
        
        // Only create default admin if no admin users exist
        if (!adminExists) {
            // Use environment variable for password or skip creation
            const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
            if (!adminPassword) {
                console.log('No admin users found and no DEFAULT_ADMIN_PASSWORD set. Skipping default admin creation.');
                console.log('You can create an admin user through the registration process.');
                return;
            }

            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const adminUser = {
                id: uuidv4(),
                email: 'admin@videoconference.com',
                full_name: 'System Administrator',
                password_hash: hashedPassword,
                is_admin: true,
                has_full_license: true,
                created_at: new Date().toISOString(),
                last_login: null,
                timezone: 'UTC'
            };
            
            users.push(adminUser);
            await this.writeFile('users', users);
            console.log('Default admin user created with custom password');
            console.log('Email: admin@videoconference.com');
        } else {
            console.log('Admin user(s) already exist. Skipping default admin creation.');
        }
    }

    async createUser(email, fullName, password) {
        const users = await this.readFile('users');
        
        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: uuidv4(),
            email,
            full_name: fullName,
            password_hash: hashedPassword,
            is_admin: false,
            has_full_license: false,
            created_at: new Date().toISOString(),
            last_login: null,
            timezone: 'UTC'
        };

        users.push(newUser);
        await this.writeFile('users', users);

        return {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.full_name,
            isAdmin: newUser.is_admin,
            hasFullLicense: newUser.has_full_license
        };
    }

    async getUserByEmail(email) {
        const users = await this.readFile('users');
        return users.find(user => user.email === email);
    }

    async getUserById(id) {
        const users = await this.readFile('users');
        return users.find(user => user.id === id);
    }

    async getAllUsers() {
        return await this.readFile('users');
    }

    async updateUserLicense(userId, hasFullLicense) {
        const users = await this.readFile('users');
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        users[userIndex].has_full_license = hasFullLicense;
        await this.writeFile('users', users);
        
        return users[userIndex];
    }

    async updateUserAdminStatus(userId, isAdmin) {
        const users = await this.readFile('users');
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        users[userIndex].is_admin = isAdmin;
        await this.writeFile('users', users);
        
        return users[userIndex];
    }

    async updateUserTimezone(userId, timezone) {
        const users = await this.readFile('users');
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        users[userIndex].timezone = timezone;
        await this.writeFile('users', users);
        
        return users[userIndex];
    }

    async updateLastLogin(userId) {
        const users = await this.readFile('users');
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex].last_login = new Date().toISOString();
            await this.writeFile('users', users);
        }
    }

    // Meeting management
    async createMeeting(meetingData) {
        const meetings = await this.readFile('meetings');
        const meeting = {
            id: meetingData.id || uuidv4(),
            host_id: meetingData.hostId,
            title: meetingData.title,
            description: meetingData.description || '',
            start_time: meetingData.startTime,
            end_time: meetingData.endTime,
            timezone: meetingData.timezone || 'UTC',
            meeting_url: meetingData.meetingUrl || '',
            ics_file_path: meetingData.icsFilePath || '',
            participant_email: meetingData.participantEmail || '',
            participant_name: meetingData.participantName || '',
            created_at: new Date().toISOString()
        };

        meetings.push(meeting);
        await this.writeFile('meetings', meetings);
        
        return meeting;
    }

    async getMeetingById(meetingId) {
        const meetings = await this.readFile('meetings');
        return meetings.find(meeting => meeting.id === meetingId);
    }

    async getMeetingsByUserId(userId) {
        const meetings = await this.readFile('meetings');
        return meetings.filter(meeting => meeting.host_id === userId);
    }

    async getAllMeetings() {
        return await this.readFile('meetings');
    }

    // Availability management
    async setUserAvailability(userId, availabilitySlots) {
        const availability = await this.readFile('availability');
        
        // Remove existing availability for this user
        const filteredAvailability = availability.filter(slot => slot.user_id !== userId);
        
        // Add new availability slots
        const newSlots = availabilitySlots.map(slot => ({
            id: uuidv4(),
            user_id: userId,
            day_of_week: slot.dayOfWeek,
            start_time: slot.startTime,
            end_time: slot.endTime,
            timezone: slot.timezone || 'UTC',
            created_at: new Date().toISOString()
        }));

        filteredAvailability.push(...newSlots);
        await this.writeFile('availability', filteredAvailability);
        
        return newSlots;
    }

    async getUserAvailability(userId) {
        const availability = await this.readFile('availability');
        return availability.filter(slot => slot.user_id === userId);
    }

    // Booking management
    async createBooking(bookingData) {
        const bookings = await this.readFile('bookings');
        const booking = {
            id: uuidv4(),
            user_id: bookingData.userId,
            meeting_id: bookingData.meetingId,
            start_time: bookingData.startTime,
            end_time: bookingData.endTime,
            booker_email: bookingData.bookerEmail,
            booker_name: bookingData.bookerName,
            status: 'confirmed',
            created_at: new Date().toISOString()
        };

        bookings.push(booking);
        await this.writeFile('bookings', bookings);
        
        return booking;
    }

    async getBookingsByUserId(userId) {
        const bookings = await this.readFile('bookings');
        return bookings.filter(booking => booking.organizer_id === userId);
    }

    // Authentication method
    async authenticateUser(email, password) {
        const users = await this.readFile('users');
        const user = users.find(u => u.email === email);
        
        if (!user) return null;
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return null;
        
        // Update last login
        await this.updateLastLogin(user.id);
        
        return {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            hasFullLicense: user.has_full_license,
            isAdmin: user.is_admin,
            timezone: user.timezone
        };
    }

    // Create user with object parameter (for admin creation)
    async createUser(userData) {
        if (typeof userData === 'object') {
            // New object-based interface
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const users = await this.readFile('users');
            
            // Check if user already exists
            if (users.find(u => u.email === userData.email)) {
                throw new Error('User already exists');
            }
            
            const newUser = {
                id: uuidv4(),
                email: userData.email,
                full_name: userData.fullName,
                password_hash: hashedPassword,
                has_full_license: userData.hasFullLicense || false,
                is_admin: userData.isAdmin || false,
                timezone: userData.timezone || 'UTC',
                created_at: new Date().toISOString(),
                last_login: null
            };
            
            users.push(newUser);
            await this.writeFile('users', users);
            
            return {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.full_name,
                hasFullLicense: newUser.has_full_license,
                isAdmin: newUser.is_admin,
                timezone: newUser.timezone
            };
        } else {
            // Legacy interface with separate parameters
            return this.createUser({
                email: userData,
                fullName: arguments[1],
                password: arguments[2]
            });
        }
    }

    // Update user method
    async updateUser(userId, updates) {
        const users = await this.readFile('users');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }
        
        // Update allowed fields
        if (updates.hasFullLicense !== undefined) {
            users[userIndex].has_full_license = updates.hasFullLicense;
        }
        if (updates.isAdmin !== undefined) {
            users[userIndex].is_admin = updates.isAdmin;
        }
        if (updates.fullName !== undefined) {
            users[userIndex].full_name = updates.fullName;
        }
        if (updates.email !== undefined) {
            users[userIndex].email = updates.email;
        }
        
        await this.writeFile('users', users);
        
        return {
            id: users[userIndex].id,
            email: users[userIndex].email,
            fullName: users[userIndex].full_name,
            hasFullLicense: users[userIndex].has_full_license,
            isAdmin: users[userIndex].is_admin
        };
    }

    // Delete user method
    async deleteUser(userId) {
        const users = await this.readFile('users');
        const filteredUsers = users.filter(u => u.id !== userId);
        
        if (users.length === filteredUsers.length) {
            throw new Error('User not found');
        }
        
        await this.writeFile('users', filteredUsers);
        
        // Also clean up user's data
        const meetings = await this.readFile('meetings');
        const filteredMeetings = meetings.filter(m => m.organizer_id !== userId);
        await this.writeFile('meetings', filteredMeetings);
        
        const availability = await this.readFile('availability');
        const filteredAvailability = availability.filter(a => a.user_id !== userId);
        await this.writeFile('availability', filteredAvailability);
    }

    // Get user meetings (alias for compatibility)
    async getUserMeetings(userId) {
        return this.getMeetingsByUserId(userId);
    }

    // Add availability method
    async addAvailability(availabilityData) {
        const availability = await this.readFile('availability');
        
        const newSlot = {
            id: uuidv4(),
            user_id: availabilityData.userId,
            date: availabilityData.date,
            start_time: availabilityData.startTime,
            end_time: availabilityData.endTime,
            is_booked: false,
            created_at: new Date().toISOString()
        };
        
        availability.push(newSlot);
        await this.writeFile('availability', availability);
        
        return {
            id: newSlot.id,
            date: newSlot.date,
            startTime: newSlot.start_time,
            endTime: newSlot.end_time
        };
    }

    // Delete availability method
    async deleteAvailability(availabilityId, userId) {
        const availability = await this.readFile('availability');
        const filteredAvailability = availability.filter(a => 
            !(a.id === availabilityId && a.user_id === userId)
        );
        
        if (availability.length === filteredAvailability.length) {
            throw new Error('Availability slot not found');
        }
        
        await this.writeFile('availability', filteredAvailability);
    }

    // Delete meeting method
    async deleteMeeting(meetingId) {
        const meetings = await this.readFile('meetings');
        const filteredMeetings = meetings.filter(m => m.id !== meetingId);
        
        if (meetings.length === filteredMeetings.length) {
            throw new Error('Meeting not found');
        }
        
        await this.writeFile('meetings', filteredMeetings);
    }

    // Utility methods
    async getStats() {
        const users = await this.readFile('users');
        const meetings = await this.readFile('meetings');
        const bookings = await this.readFile('bookings');

        return {
            totalUsers: users.length,
            totalMeetings: meetings.length,
            totalBookings: bookings.length,
            adminUsers: users.filter(user => user.is_admin).length,
            fullLicenseUsers: users.filter(user => user.has_full_license).length
        };
    }

    // Close method (for compatibility - not needed for JSON files)
    async close() {
        console.log('JSON Database connection closed');
    }
}

module.exports = JSONDatabase;