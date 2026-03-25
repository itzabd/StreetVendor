const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { authenticate, optionalAuthenticate, requireAdmin } = require('../middleware/auth');

// Public route to get all vendors
router.get('/vendors', publicController.getAllVendors);

// Public/Guest allowed routes
router.post('/rate', optionalAuthenticate, publicController.submitRating);
router.post('/report', publicController.submitReport);

// Admin only management of guest reports
router.get('/reports', authenticate, requireAdmin, publicController.getReports);
router.patch('/reports/:id', authenticate, requireAdmin, publicController.updateReportStatus);

// Authenticated REQUIRED routes
router.post('/favorite', authenticate, publicController.toggleFavorite);
router.get('/favorites', authenticate, publicController.getFavorites);



module.exports = router;
