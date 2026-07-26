const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const verifyToken = require('../middleware/verifyToken');

// Public route for attendees to register and verify payments
router.post('/events/:eventId/register', ticketController.registerAttendee);
router.post('/events/:eventId/verify-payment', ticketController.verifyPayment);

// Organizer routes
router.post('/events/:eventId/checkin', verifyToken, ticketController.checkinTicket);
router.get('/events/:eventId/attendees', verifyToken, ticketController.getEventAttendees);
router.get('/events/:eventId/export', verifyToken, ticketController.exportAttendeesCSV);

module.exports = router;
