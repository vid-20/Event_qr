const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const ticketRoutes = require('../routes/ticketRoutes');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');

jest.mock('../models/Ticket');
jest.mock('../models/Event');
jest.mock('../middleware/verifyToken', () => (req, res, next) => {
  req.user = { id: 'mockUserId' };
  next();
});

const app = express();
app.use(express.json());
app.use('/', ticketRoutes);

describe('Ticket Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. Duplicate check-in is rejected (409)', async () => {
    const eventId = new mongoose.Types.ObjectId().toString();
    const mockTicket = {
      _id: new mongoose.Types.ObjectId(),
      eventId,
      attendeeName: 'Test User',
      ticketCode: 'testcode123',
      status: 'checked-in',
      save: jest.fn()
    };
    
    Ticket.findOne.mockResolvedValue(mockTicket);

    const qrPayload = jwt.sign({ ticketCode: mockTicket.ticketCode, eventId }, 'fallback_secret');

    const res = await request(app)
      .post(`/events/${eventId}/checkin`)
      .send({ qrPayload });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Already checked in');
  });

  it('2. Forged payment signatures are rejected (400)', async () => {
    const eventId = new mongoose.Types.ObjectId().toString();
    
    const res = await request(app)
      .post(`/events/${eventId}/verify-payment`)
      .send({
        razorpay_order_id: 'order_invalid',
        razorpay_payment_id: 'pay_invalid',
        razorpay_signature: 'fake_signature_that_does_not_match',
        ticketId: new mongoose.Types.ObjectId().toString()
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid payment signature');
  });
});
