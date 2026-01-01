const { supabase } = require('../config/supabase');
const { isWithinGeofence } = require('../utils/distance');
const smsService = require('./sms.service');

class AttendanceService {
  /**
   * Get employee by phone number
   */
  async getEmployeeByPhone(phone) {
    const cleanPhone = smsService.formatPhoneNumber(phone);
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (error) {
      console.error('Get employee error:', error);
      return null;
    }

    return data;
  }

  /**
   * Mark attendance
   */
  async markAttendance(phone, checkType, lat, lng, locationMethod = 'GPS') {
    try {
      const employee = await this.getEmployeeByPhone(phone);

      if (!employee) {
        return {
          success: false,
          message: 'Employee not found'
        };
      }

      // Validate location
      const { isValid, distance } = isWithinGeofence(
        lat,
        lng,
        employee.work_lat,
        employee.work_lng,
        employee.geofence_radius
      );

      // Insert attendance record
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          phone: smsService.formatPhoneNumber(phone),
          check_type: checkType,
          gps_lat: lat,
          gps_lng: lng,
          distance_meters: distance,
          is_valid: isValid,
          location_method: locationMethod
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Send confirmation SMS
      const timestamp = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const confirmMessage = isValid
        ? `✅ ${checkType} successful at ${timestamp}\nDistance: ${Math.round(distance)}m from work location`
        : `❌ ${checkType} failed!\nYou are ${Math.round(distance)}m away from work.\nMaximum allowed: ${employee.geofence_radius}m`;

      await smsService.sendSMS(phone, confirmMessage);

      return {
        success: isValid,
        distance: distance,
        timestamp: data.timestamp,
        message: isValid
          ? 'Attendance marked successfully'
          : `Outside work location (${Math.round(distance)}m away)`,
        data: data
      };
    } catch (error) {
      console.error('Mark attendance error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get attendance records for employee
   */
  async getAttendanceRecords(phone, startDate, endDate) {
    const cleanPhone = smsService.formatPhoneNumber(phone);

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('phone', cleanPhone)
      .order('timestamp', { ascending: false });

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get attendance error:', error);
      return [];
    }

    return data;
  }

  /**
   * Get today's attendance status
   */
  async getTodayStatus(phone) {
    const cleanPhone = smsService.formatPhoneNumber(phone);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('phone', cleanPhone)
      .gte('timestamp', today.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Get today status error:', error);
      return null;
    }

    return {
      hasCheckedIn: data.some(r => r.check_type === 'CHECKIN'),
      hasCheckedOut: data.some(r => r.check_type === 'CHECKOUT'),
      records: data
    };
  }
}

module.exports = new AttendanceService();
