const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken, requireFullLicense } = require('../middleware/auth');

// Initialize with database when router is used
let db;

function initializeRouter(database) {
    db = database;
    return router;
}

// ICS file generation utility
function generateICSFile(meeting, participant = null) {
    const startDate = moment(meeting.start_time).utc().format('YYYYMMDDTHHmmss') + 'Z';
    const endDate = moment(meeting.end_time).utc().format('YYYYMMDDTHHmmss') + 'Z';
    const now = moment().utc().format('YYYYMMDDTHHmmss') + 'Z';
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VideoConference//Meeting//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${meeting.id}@videoconference.com
DTSTART:${startDate}
DTEND:${endDate}
DTSTAMP:${now}
SUMMARY:${meeting.title}
DESCRIPTION:${meeting.description}\\n\\nJoin meeting: ${meeting.meeting_url}
LOCATION:Video Conference - ${meeting.meeting_url}
STATUS:CONFIRMED
TRANSP:OPAQUE
ORGANIZER;CN=${meeting.host_name}:MAILTO:${meeting.host_email}
${participant ? `ATTENDEE;CN=${participant.name}:MAILTO:${participant.email}` : ''}
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Meeting reminder: ${meeting.title}
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
}

// Get user availability
router.get('/availability', authenticateToken, requireFullLicense, async (req, res) => {
    try {
        const availability = await db.getUserAvailability(req.user.id);
        res.json(availability);
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Set user availability
router.post('/availability', authenticateToken, requireFullLicense, async (req, res) => {
    try {
        const { availability } = req.body;
        
        if (!Array.isArray(availability)) {
            return res.status(400).json({ error: 'Availability must be an array' });
        }

        // Validate availability slots
        for (const slot of availability) {
            if (!slot.dayOfWeek || !slot.startTime || !slot.endTime || !slot.timezone) {
                return res.status(400).json({ error: 'Each availability slot must have dayOfWeek, startTime, endTime, and timezone' });
            }
            
            if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
                return res.status(400).json({ error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' });
            }
        }

        await db.setUserAvailability(req.user.id, availability);
        
        res.json({ message: 'Availability updated successfully' });
    } catch (error) {
        console.error('Set availability error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's meetings
router.get('/meetings', authenticateToken, requireFullLicense, async (req, res) => {
    try {
        const meetings = await db.getUserMeetings(req.user.id);
        res.json(meetings);
    } catch (error) {
        console.error('Get meetings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new meeting
router.post('/meetings', authenticateToken, requireFullLicense, async (req, res) => {
    try {
        const { title, description, startTime, endTime, timezone, participantEmail, participantName } = req.body;
        
        // Validation
        if (!title || !startTime || !endTime || !timezone) {
            return res.status(400).json({ error: 'Title, start time, end time, and timezone are required' });
        }

        const meetingId = uuidv4();
        const meetingUrl = `${req.protocol}://${req.get('host')}/meeting/${meetingId}`;
        
        // Create meeting in database
        const meetingData = {
            id: meetingId,
            hostId: req.user.id,
            title,
            description: description || '',
            startTime,
            endTime,
            timezone,
            meetingUrl
        };

        await db.createMeeting(meetingData);

        // Generate ICS file
        const meeting = await db.getMeetingById(meetingId);
        const icsContent = generateICSFile(meeting, { email: participantEmail, name: participantName });
        
        // Save ICS file
        const icsDir = path.join(__dirname, '..', 'public', 'ics');
        await fs.mkdir(icsDir, { recursive: true });
        const icsFilePath = path.join(icsDir, `${meetingId}.ics`);
        await fs.writeFile(icsFilePath, icsContent);

        res.status(201).json({
            message: 'Meeting created successfully',
            meeting: {
                id: meetingId,
                title,
                description,
                startTime,
                endTime,
                timezone,
                meetingUrl,
                icsDownloadUrl: `${req.protocol}://${req.get('host')}/ics/${meetingId}.ics`
            }
        });

    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get meeting details
router.get('/meetings/:meetingId', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const meeting = await db.getMeetingById(meetingId);
        
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        res.json({
            id: meeting.id,
            title: meeting.title,
            description: meeting.description,
            startTime: meeting.start_time,
            endTime: meeting.end_time,
            timezone: meeting.timezone,
            status: meeting.status,
            meetingUrl: meeting.meeting_url,
            hostName: meeting.host_name,
            hostEmail: meeting.host_email,
            icsDownloadUrl: `${req.protocol}://${req.get('host')}/ics/${meetingId}.ics`
        });
    } catch (error) {
        console.error('Get meeting error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available time slots for a user (public scheduling)
router.get('/schedule/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { date, timezone = 'UTC' } = req.query;
        
        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

        // Get user info
        const user = await db.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.has_full_license) {
            return res.status(403).json({ error: 'User does not have scheduling enabled' });
        }

        // Get user availability for the requested date
        const requestedDate = moment(date);
        const dayOfWeek = requestedDate.day(); // 0 = Sunday, 6 = Saturday
        
        const availability = await db.getUserAvailability(userId);
        const dayAvailability = availability.filter(slot => slot.day_of_week === dayOfWeek);
        
        if (dayAvailability.length === 0) {
            return res.json({
                date,
                dayOfWeek,
                userName: user.full_name,
                availableSlots: []
            });
        }

        // Generate time slots (30-minute intervals)
        const availableSlots = [];
        
        for (const slot of dayAvailability) {
            const startTime = moment(`${date} ${slot.start_time}`, 'YYYY-MM-DD HH:mm');
            const endTime = moment(`${date} ${slot.end_time}`, 'YYYY-MM-DD HH:mm');
            
            let currentSlot = startTime.clone();
            while (currentSlot.clone().add(30, 'minutes').isSameOrBefore(endTime)) {
                const slotStart = currentSlot.format('HH:mm');
                const slotEnd = currentSlot.clone().add(30, 'minutes').format('HH:mm');
                
                availableSlots.push({
                    startTime: slotStart,
                    endTime: slotEnd,
                    datetime: currentSlot.toISOString()
                });
                
                currentSlot.add(30, 'minutes');
            }
        }

        res.json({
            date,
            dayOfWeek,
            userName: user.full_name,
            userEmail: user.email,
            timezone,
            availableSlots
        });

    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Book a meeting slot (public)
router.post('/schedule/:userId/book', async (req, res) => {
    try {
        const { userId } = req.params;
        const { date, startTime, endTime, participantName, participantEmail, meetingTitle, meetingDescription } = req.body;
        
        // Validation
        if (!date || !startTime || !endTime || !participantName || !participantEmail || !meetingTitle) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Get user info
        const user = await db.getUserById(userId);
        if (!user || !user.has_full_license) {
            return res.status(404).json({ error: 'User not found or scheduling not available' });
        }

        // Create meeting
        const meetingId = uuidv4();
        const meetingUrl = `${req.protocol}://${req.get('host')}/meeting/${meetingId}`;
        
        const startDateTime = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm').toISOString();
        const endDateTime = moment(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm').toISOString();
        
        const meetingData = {
            id: meetingId,
            hostId: userId,
            title: meetingTitle,
            description: meetingDescription || `Meeting with ${participantName}`,
            startTime: startDateTime,
            endTime: endDateTime,
            timezone: 'UTC', // Default to UTC for booked meetings
            meetingUrl
        };

        await db.createMeeting(meetingData);

        // Generate ICS file
        const meeting = await db.getMeetingById(meetingId);
        const icsContent = generateICSFile(meeting, { email: participantEmail, name: participantName });
        
        // Save ICS file
        const icsDir = path.join(__dirname, '..', 'public', 'ics');
        await fs.mkdir(icsDir, { recursive: true });
        const icsFilePath = path.join(icsDir, `${meetingId}.ics`);
        await fs.writeFile(icsFilePath, icsContent);

        res.status(201).json({
            message: 'Meeting booked successfully',
            meeting: {
                id: meetingId,
                title: meetingTitle,
                description: meetingData.description,
                startTime: startDateTime,
                endTime: endDateTime,
                meetingUrl,
                hostName: user.full_name,
                hostEmail: user.email,
                participantName,
                participantEmail,
                icsDownloadUrl: `${req.protocol}://${req.get('host')}/ics/${meetingId}.ics`
            }
        });

    } catch (error) {
        console.error('Book meeting error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = { router, initializeRouter };