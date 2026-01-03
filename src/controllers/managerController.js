/**
 * GeoGuard Manager Controller
 * Handles employee management and live dashboard
 * MIGRATED TO PRISMA ORM - Zero functional regression
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * POST /api/manager/employees
 * Add a new worker to the system
 */
async function addEmployee(req, res) {
  try {
    const { name, phone, phoneType, siteId, password } = req.body;

    // Validate required fields
    if (!name || !phone || !phoneType || !siteId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, phone, phoneType, siteId',
      });
    }

    // Validate phone type
    if (!['SMART', 'FEATURE'].includes(phoneType)) {
      return res.status(400).json({
        success: false,
        error: 'phoneType must be either SMART or FEATURE',
      });
    }

    // Check if phone already exists
    // PRISMA: Replaced Supabase .from('users').select().eq().single()
    const existingUser = await prisma.users.findUnique({
      where: { phone: phone },
      select: { id: true }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Phone number already registered',
      });
    }

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Insert new worker and initialize live_status in a transaction
    // PRISMA: Replaced separate Supabase inserts with transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          name: name,
          phone: phone,
          phone_type: phoneType,
          site_id: siteId,
          role: 'WORKER',
          password_hash: passwordHash,
          is_active: true,
        }
      });

      // Initialize live_status for the new worker
      await tx.live_status.create({
        data: {
          user_id: user.id,
          is_inside: false,
        }
      });

      return user;
    });

    console.log(`[Manager] Added new employee: ${name} (${phone})`);

    return res.json({
      success: true,
      message: 'Employee added successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        phoneType: newUser.phone_type,
        siteId: newUser.site_id,
      },
    });
  } catch (error) {
    console.error('[Manager] Error in addEmployee:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

/**
 * DELETE /api/manager/employees/:id
 * Remove a worker from the system
 */
async function removeEmployee(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required',
      });
    }

    // Check if employee exists
    // PRISMA: Replaced Supabase .from('users').select().eq().single()
    const employee = await prisma.users.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        role: true
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Prevent deletion of managers
    if (employee.role === 'MANAGER') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete manager accounts',
      });
    }

    // Delete employee (cascade will handle related records)
    // PRISMA: Replaced Supabase .from('users').delete().eq()
    await prisma.users.delete({
      where: { id: id }
    });

    console.log(`[Manager] Deleted employee: ${employee.name} (${id})`);

    return res.json({
      success: true,
      message: 'Employee removed successfully',
    });
  } catch (error) {
    console.error('[Manager] Error in removeEmployee:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

/**
 * PUT /api/manager/site-config/:siteId
 * Update site configuration (radius and rest interval)
 */
async function updateSiteConfig(req, res) {
  try {
    const { siteId } = req.params;
    const { radiusMeters, restIntervalMinutes } = req.body;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: 'Site ID is required',
      });
    }

    // Build update object
    const updates = {};
    if (radiusMeters !== undefined) {
      if (radiusMeters < 50 || radiusMeters > 5000) {
        return res.status(400).json({
          success: false,
          error: 'Radius must be between 50 and 5000 meters',
        });
      }
      updates.radius_meters = radiusMeters;
    }

    if (restIntervalMinutes !== undefined) {
      if (restIntervalMinutes < 0 || restIntervalMinutes > 480) {
        return res.status(400).json({
          success: false,
          error: 'Rest interval must be between 0 and 480 minutes (8 hours)',
        });
      }
      updates.rest_interval_minutes = restIntervalMinutes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
      });
    }

    // Update site
    // PRISMA: Replaced Supabase .from('sites').update().eq().select().single()
    const updatedSite = await prisma.sites.update({
      where: { id: siteId },
      data: updates
    });

    console.log(`[Manager] Updated site config for ${siteId}:`, updates);

    return res.json({
      success: true,
      message: 'Site configuration updated successfully',
      data: {
        id: updatedSite.id,
        name: updatedSite.name,
        radiusMeters: updatedSite.radius_meters,
        restIntervalMinutes: updatedSite.rest_interval_minutes,
      },
    });
  } catch (error) {
    console.error('[Manager] Error in updateSiteConfig:', error);
    
    // Handle Prisma not found error
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

/**
 * GET /api/manager/live-dashboard/:siteId
 * Get real-time dashboard for all workers at a site
 */
async function getLiveDashboard(req, res) {
  try {
    const { siteId } = req.params;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: 'Site ID is required',
      });
    }

    // Fetch site information
    // PRISMA: Replaced Supabase .from('sites').select().eq().single()
    const site = await prisma.sites.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        name: true,
        radius_meters: true,
        rest_interval_minutes: true
      }
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }

    // Fetch all workers for this site with their live status
    // PRISMA: Replaced Supabase .from('users').select() with nested relation
    const workers = await prisma.users.findMany({
      where: {
        site_id: siteId,
        role: 'WORKER',
        is_active: true
      },
      select: {
        id: true,
        name: true,
        phone: true,
        phone_type: true,
        live_status: {
          select: {
            last_lat: true,
            last_lng: true,
            is_inside: true,
            last_seen: true,
            battery_level: true
          }
        }
      }
    });

    // Format worker data for dashboard
    const now = new Date();
    const formattedWorkers = workers.map((worker) => {
      const liveStatus = worker.live_status;
      
      // Calculate time since last seen
      let lastSeenText = 'Never';
      let isOffline = true;
      
      if (liveStatus && liveStatus.last_seen) {
        const lastSeen = new Date(liveStatus.last_seen);
        const diffMs = now - lastSeen;
        const diffMinutes = Math.floor(diffMs / 60000);
        
        if (diffMinutes < 1) {
          lastSeenText = 'Just now';
          isOffline = false;
        } else if (diffMinutes < 60) {
          lastSeenText = `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
          isOffline = diffMinutes > 30;
        } else {
          const diffHours = Math.floor(diffMinutes / 60);
          lastSeenText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
          isOffline = true;
        }
        
        // Add offline flag for feature phones
        if (isOffline && worker.phone_type === 'SMART') {
          lastSeenText += ' (OFFLINE?)';
        }
      }

      // Determine status color
      let status = 'RED'; // Default: outside or never seen
      if (liveStatus && liveStatus.is_inside && !isOffline) {
        status = 'GREEN';
      }

      // Battery warning for smartphones
      const batteryWarning = 
        worker.phone_type === 'SMART' && 
        liveStatus && 
        liveStatus.battery_level !== null && 
        liveStatus.battery_level < 20;

      return {
        name: worker.name,
        type: worker.phone_type,
        status: status,
        last_seen: lastSeenText,
        battery_warning: batteryWarning,
        battery_level: liveStatus?.battery_level || null,
      };
    });

    return res.json({
      success: true,
      site_name: site.name,
      workers: formattedWorkers,
      summary: {
        total_workers: formattedWorkers.length,
        inside_geofence: formattedWorkers.filter((w) => w.status === 'GREEN').length,
        outside_geofence: formattedWorkers.filter((w) => w.status === 'RED').length,
      },
    });
  } catch (error) {
    console.error('[Manager] Error in getLiveDashboard:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  addEmployee,
  removeEmployee,
  updateSiteConfig,
  getLiveDashboard,
};
