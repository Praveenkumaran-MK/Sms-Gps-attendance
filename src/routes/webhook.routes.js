const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendance.service');
const smsService = require('../services/sms.service');

/**
 * TextBee webhook endpoint for incoming SMS
 */
router.post('/sms-received', async (req, res) => {
  try {
    console.log('Received SMS webhook:', req.body);

    const { from, message, deviceId, timestamp } = req.body;

    if (!from || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cleanPhone = smsService.formatPhoneNumber(from);
    const command = message.trim().toUpperCase();

    // Check if employee exists
    const employee = await attendanceService.getEmployeeByPhone(cleanPhone);

    if (!employee) {
      await smsService.sendSMS(
        from,
        '❌ You are not registered in the system.\nPlease contact your administrator.'
      );
      return res.status(200).json({ status: 'not_registered' });
    }

    // Handle commands
    if (command === 'CHECKIN' || command === 'CHECKOUT') {
      // Generate unique session ID
      const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);

      // Get today's status
      const todayStatus = await attendanceService.getTodayStatus(cleanPhone);

      // Validate command based on current status
      if (command === 'CHECKIN' && todayStatus.hasCheckedIn) {
        await smsService.sendSMS(
          from,
          '⚠️ You have already checked in today.\nUse CHECKOUT when leaving.'
        );
        return res.status(200).json({ status: 'already_checked_in' });
      }

      if (command === 'CHECKOUT' && !todayStatus.hasCheckedIn) {
        await smsService.sendSMS(
          from,
          '⚠️ You must check in first before checking out.'
        );
        return res.status(200).json({ status: 'not_checked_in' });
      }

      if (command === 'CHECKOUT' && todayStatus.hasCheckedOut) {
        await smsService.sendSMS(
          from,
          '⚠️ You have already checked out today.'
        );
        return res.status(200).json({ status: 'already_checked_out' });
      }

      // Send location request link
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const locationUrl = `${appUrl}/location?phone=${encodeURIComponent(cleanPhone)}&type=${command}&session=${sessionId}`;

      await smsService.sendSMS(
        from,
        `📍 Click to share your location for ${command}:\n${locationUrl}\n\nLink valid for 10 minutes.`
      );

      res.status(200).json({ 
        status: 'location_requested',
        sessionId: sessionId 
      });
    } else if (command === 'STATUS') {
      // Check today's attendance status
      const todayStatus = await attendanceService.getTodayStatus(cleanPhone);
      
      let statusMsg = '📊 Today\'s Attendance:\n\n';
      statusMsg += `Check-in: ${todayStatus.hasCheckedIn ? '✅ Done' : '❌ Pending'}\n`;
      statusMsg += `Check-out: ${todayStatus.hasCheckedOut ? '✅ Done' : '❌ Pending'}\n\n`;
      statusMsg += 'Reply with:\nCHECKIN - to mark arrival\nCHECKOUT - to mark departure';

      await smsService.sendSMS(from, statusMsg);
      res.status(200).json({ status: 'status_sent' });
    } else if (command === 'HELP') {
      const helpMsg = '📖 Available Commands:\n\n' +
        'CHECKIN - Mark your arrival\n' +
        'CHECKOUT - Mark your departure\n' +
        'STATUS - Check today\'s status\n' +
        'HELP - Show this message';

      await smsService.sendSMS(from, helpMsg);
      res.status(200).json({ status: 'help_sent' });
    } else {
      await smsService.sendSMS(
        from,
        '❌ Invalid command.\n\nAvailable commands:\nCHECKIN, CHECKOUT, STATUS, HELP\n\nReply HELP for more info.'
      );
      res.status(200).json({ status: 'invalid_command' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
