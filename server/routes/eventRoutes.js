const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const verifyToken = require('../middleware/verifyToken');

// Organizer routes
router.post('/', verifyToken, eventController.createEvent);
router.get('/dashboard-stats', verifyToken, eventController.getDashboardStats);
router.get('/', verifyToken, eventController.getEvents);
router.put('/:id', verifyToken, eventController.updateEvent);
router.delete('/:id', verifyToken, eventController.deleteEvent);

// Public route for landing page to view all upcoming events
router.get('/public', eventController.getPublicEvents);

// Public route for attendees to view event details
router.get('/:id', eventController.getEventById);

module.exports = router;
