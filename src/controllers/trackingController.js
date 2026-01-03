/**
 * GeoGuard Tracking Controller
 * Handles GPS heartbeats and SMS-based location tracking
 * MIGRATED TO PRISMA ORM - Zero functional regression
 */

const { PrismaClient } = require('@prisma/client');
const geoService = require('../utils/geoService');
const unwiredService = require('../services/unwiredService');
const smsService = require('../services/sms.service');

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Process a single location heartbeat
 * @param {string} userId - User UUID
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} timestamp - ISO timestamp
 * @param {boolean} isOfflineSync - Whether this is from batch upload
 * @param {string} locationMethod - GPS, CELL, PHONE, WIFI
 * @returns {Promise<Object>} Processing result
 */
async function processHeartbeat(userId, lat, lng, timestamp, isOfflineSync = false, locationMethod = 'GPS') {
  try {
    console.log(userId, lat, lng, timestamp);
    
    // Fetch user and site information
    // PRISMA: Replaced Supabase .from('users').select().eq().single()
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        sites: {
          select: {
            id: true,
            name: true,
            center_lat: true,
            center_lng: true,
            radius_meters: true
          }
        }
      }
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    if (!user.site_id || !user.sites) {
      throw new Error(`User ${userId} is not assigned to a site`);
    }

    const site = user.sites;

    // Calculate geofence status
    const geofenceResult = geoService.checkGeofence(
      lat,
      lng,
      parseFloat(site.center_lat),
      parseFloat(site.center_lng),
      site.radius_meters
    );

    // Insert into attendance_logs
    // PRISMA: Replaced Supabase .from('attendance_logs').insert().select().single()
    const logData = await prisma.attendance_logs.create({
      data: {
        user_id: userId,
        timestamp: new Date(timestamp),
        lat: lat,
        lng: lng,
        is_offline_sync: isOfflineSync,
        distance_meters: geofenceResult.distance,
        is_inside_geofence: geofenceResult.isInside,
        location_method: locationMethod,
      }
    });

    // Update live_status (only if this is the most recent timestamp)
    // For batch uploads, we'll update with the latest timestamp after processing all logs
    if (!isOfflineSync) {
      await updateLiveStatus(userId, lat, lng, geofenceResult.isInside);
    }

    return {
      success: true,
      userId: userId,
      timestamp: timestamp,
      isInside: geofenceResult.isInside,
      distance: geofenceResult.distance,
      logId: logData.id,
    };
  } catch (error) {
    console.error('[Tracking] Error processing heartbeat:', error.message);
    return {
      success: false,
      userId: userId,
      timestamp: timestamp,
      error: error.message,
    };
  }
}

/**
 * Update live status for a user
 * @param {string} userId - User UUID
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {boolean} isInside - Whether inside geofence
 */
async function updateLiveStatus(userId, lat, lng, isInside) {
  try {
    // PRISMA: Replaced Supabase .from('live_status').upsert()
    await prisma.live_status.upsert({
      where: { user_id: userId },
      update: {
        last_lat: lat,
        last_lng: lng,
        is_inside: isInside,
        last_seen: new Date(),
      },
      create: {
        user_id: userId,
        last_lat: lat,
        last_lng: lng,
        is_inside: isInside,
        last_seen: new Date(),
      }
    });
  } catch (error) {
    console.error('[Tracking] Error updating live status:', error);
  }
}

/**
 * POST /api/track/heartbeat
 * Handle single or batch GPS heartbeats from smartphones
 */
async function handleHeartbeat(req, res) {
  try {
    let body = req.body;
    const { userId, lat, lng, timestamp } = body;
    // console.log(userId, lat,lng,timestamp);
    body.logs = [{ lat: lat, lng: lng, timestamp: timestamp }];
    // console.log(body.logs);
    
    // Check if this is a single heartbeat or batch
    if (Array.isArray(body.logs)) {
      // Batch upload (offline sync)
      console.log("batch upload");
      const { userId, logs } = body;
      console.log(logs);
      
      if (!userId || !logs || logs.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'userId and logs array are required for batch upload',
        });
      }

      console.log(`[Tracking] Processing batch upload for user ${userId}: ${logs.length} logs`);

      // Process all logs
      const results = [];
      let latestLog = null;
      let latestTimestamp = null;

      for (const log of logs) {
        const { lat, lng, timestamp } = log;

        if (!lat || !lng || !timestamp) {
          results.push({
            success: false,
            timestamp: timestamp || 'unknown',
            error: 'Missing required fields: lat, lng, timestamp',
          });
          continue;
        }

        const result = await processHeartbeat(userId, lat, lng, timestamp, true, 'GPS');
        results.push(result);

        // Track the latest timestamp
        if (!latestTimestamp || new Date(timestamp) > new Date(latestTimestamp)) {
          latestTimestamp = timestamp;
          latestLog = { lat, lng, isInside: result.isInside };
        }
      }

      // Update live_status with the most recent log
      if (latestLog) {
        await updateLiveStatus(userId, latestLog.lat, latestLog.lng, latestLog.isInside);
      }

      const successCount = results.filter((r) => r.success).length;

      return res.json({
        success: true,
        message: `Processed ${successCount}/${logs.length} logs successfully`,
        results: results,
      });
    } else {
      // Single heartbeat
      const { userId, lat, lng, timestamp } = body;

      if (!userId || !lat || !lng || !timestamp) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, lat, lng, timestamp',
        });
      }

      console.log(`[Tracking] Processing single heartbeat for user ${userId}`);

      const result = await processHeartbeat(userId, lat, lng, timestamp, false, 'GPS');

      if (result.success) {
        return res.json({
          success: true,
          message: 'Heartbeat processed successfully',
          data: result,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    }
  } catch (error) {
    console.error('[Tracking] Error in handleHeartbeat:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}


/**
 * POST /api/webhooks/sms
 * Handle SMS webhook from TextBee for feature phones
 */
async function handleSmsWebhook(req, res) {
  try {
    // Log the entire request for debugging
    console.log('[SMS Webhook] Request headers:', req.headers);
    console.log('[SMS Webhook] Request body:', req.body);
    console.log('[SMS Webhook] Request query:', req.query);

    // Handle different webhook formats
    let sender, message;

    if (req.body && typeof req.body === 'object') {
      // JSON body
      sender = req.body.sender || req.body.from || req.body.phone;
      message = req.body.message || req.body.text || req.body.body;
    } else if (req.query) {
      // Query parameters
      sender = req.query.sender || req.query.from || req.query.phone;
      message = req.query.message || req.query.text || req.query.body;
    }

    if (!sender || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sender, message',
      });
    }

    console.log(`[SMS Webhook] Received from ${sender}: ${message}`);

    // Parse cell tower data from SMS
    const cellData = unwiredService.parseCellDataFromSMS(message);

    if (!cellData) {
      console.log(`[SMS Webhook] Invalid SMS format from ${sender}`);
      await smsService.sendSMS(
        sender,
        'Invalid format. Please send: ATT CID:xxxx LAC:yyyy'
      );
      return res.json({
        success: false,
        error: 'Invalid SMS format',
      });
    }

    // Find user by phone number
    // PRISMA: Replaced Supabase .from('users').select().eq().single()
    const user = await prisma.users.findUnique({
      where: { phone: sender },
      select: {
        id: true,
        name: true,
        phone: true,
        site_id: true
      }
    });

    if (!user) {
      console.log(`[SMS Webhook] User not found: ${sender}`);
      await smsService.sendSMS(
        sender,
        'You are not registered in the system. Please contact your manager.'
      );
      return res.json({
        success: false,
        error: 'User not found',
      });
    }

    // Resolve location using Unwired Labs
    console.log(`[SMS Webhook] Resolving location for CID:${cellData.cid} LAC:${cellData.lac}`);
    
    let location;
    
    // TESTING: Use fixed location for specific phone number
    if (sender === '+919566794604') {
      console.log(`[SMS Webhook] Using fixed location for test phone ${sender} (Avadi, Chennai)`);
      location = {
        lat: 13.1143, // Avadi, Chennai
        lng: 80.1018,
        accuracy: 100 // 100m accuracy for test location
      };
    } else {
      // Use Unwired Labs for other phones
      location = await unwiredService.resolveLocation(
        cellData.cid,
        cellData.lac,
        parseInt(process.env.DEFAULT_MCC) || 404,
        parseInt(process.env.DEFAULT_MNC) || 45
      );
    }

    // Process as heartbeat
    const result = await processHeartbeat(
      user.id,
      location.lat,
      location.lng,
      new Date().toISOString(),
      false,
      'CELL'
    );

    // Send confirmation SMS
    if (result.success) {
      const status = result.isInside ? 'INSIDE' : 'OUTSIDE';
      const distance = Math.round(result.distance);
      await smsService.sendSMS(
        sender,
        `Attendance recorded. Status: ${status} geofence (${distance}m from site)`
      );
    } else {
      await smsService.sendSMS(
        sender,
        'Error recording attendance. Please try again or contact your manager.'
      );
    }

    return res.json({
      success: result.success,
      message: result.success ? 'SMS processed successfully' : 'Error processing SMS',
      data: {
        user: user.name,
        location: { lat: location.lat, lng: location.lng },
        isInside: result.isInside,
        distance: result.distance,
      },
    });
  } catch (error) {
    console.error('[SMS Webhook] Error:', error);
    
    // Try to send error SMS if we have sender
    if (req.body && req.body.sender) {
      await smsService.sendSMS(
        req.body.sender,
        'System error. Please try again later or contact your manager.'
      );
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  handleHeartbeat,
  handleSmsWebhook,
  processHeartbeat,
  updateLiveStatus,
};
