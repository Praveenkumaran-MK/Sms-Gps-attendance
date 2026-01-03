/**
 * GeoGuard Manager Routes
 * Routes for manager dashboard and employee management
 */

const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');

// Middleware to verify admin/manager access
const verifyAdmin = (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'] || req.query.adminSecret;
  
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid or missing admin secret',
    });
  }
  
  next();
};

// Apply admin middleware to all routes
router.use(verifyAdmin);

// POST /api/manager/employees - Add new worker
router.post('/employees', managerController.addEmployee);

// DELETE /api/manager/employees/:id - Remove worker
router.delete('/employees/:id', managerController.removeEmployee);

// PUT /api/manager/site-config/:siteId - Update site configuration
router.put('/site-config/:siteId', managerController.updateSiteConfig);

// GET /api/manager/live-dashboard/:siteId - Get live dashboard
router.get('/live-dashboard/:siteId', managerController.getLiveDashboard);

module.exports = router;
