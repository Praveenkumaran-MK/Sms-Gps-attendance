const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const smsService = require('../services/sms.service');

/**
 * Admin authentication middleware
 */
function authenticateAdmin(req, res, next) {
  const adminSecret = req.headers['x-admin-secret'] || req.query.adminSecret;
  
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

/**
 * Register new employee
 */
router.post('/employees', authenticateAdmin, async (req, res) => {
  try {
    const { phone, name, work_lat, work_lng, geofence_radius } = req.body;

    if (!phone || !name || !work_lat || !work_lng) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cleanPhone = smsService.formatPhoneNumber(phone);

    const { data, error } = await supabaseAdmin
      .from('employees')
      .insert({
        phone: cleanPhone,
        name: name,
        work_lat: parseFloat(work_lat),
        work_lng: parseFloat(work_lng),
        geofence_radius: geofence_radius || 200
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send welcome SMS
    await smsService.sendSMS(
      cleanPhone,
      `Welcome to SMS Attendance System!\n\nYou have been registered successfully.\n\nCommands:\nCHECKIN - Mark arrival\nCHECKOUT - Mark departure\nSTATUS - Check status\nHELP - Show help`
    );

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Register employee error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all employees
 */
router.get('/employees', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update employee
 */
router.put('/employees/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.phone) {
      updateData.phone = smsService.formatPhoneNumber(updateData.phone);
    }

    const { data, error } = await supabaseAdmin
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete employee
 */
router.delete('/employees/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all attendance records with filters
 */
router.get('/attendance', authenticateAdmin, async (req, res) => {
  try {
    const { employeeId, startDate, endDate, checkType } = req.query;

    let query = supabaseAdmin
      .from('attendance')
      .select(`
        *,
        employees (
          name,
          phone
        )
      `)
      .order('timestamp', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    if (checkType) {
      query = query.eq('check_type', checkType);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Send broadcast SMS to all employees
 */
router.post('/broadcast', authenticateAdmin, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get all employee phone numbers
    const { data: employees, error } = await supabaseAdmin
      .from('employees')
      .select('phone');

    if (error) {
      throw error;
    }

    const phoneNumbers = employees.map(emp => emp.phone);

    // Send bulk SMS
    const result = await smsService.sendBulkSMS(phoneNumbers, message);

    res.json({
      success: result.success,
      recipientCount: phoneNumbers.length,
      data: result.data
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
