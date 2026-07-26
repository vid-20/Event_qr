const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Parser } = require('json2csv');
const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

const sendTicketEmail = async (email, ticket, eventTitle, qrPayload) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Skipping email delivery.');
      return;
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const qrDataURL = await QRCode.toDataURL(qrPayload);
    const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, "");

    const mailOptions = {
      from: `"EventQR Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Ticket for ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #f4f4f4;">
          <div style="background: #fff; padding: 30px; border-radius: 8px; text-align: center;">
            <h2 style="color: #333;">You're on the list!</h2>
            <p style="color: #666; font-size: 16px;">Hi ${ticket.attendeeName},</p>
            <p style="color: #666; font-size: 16px;">Your registration for <strong>${eventTitle}</strong> is confirmed.</p>
            <p style="color: #666; font-size: 16px;">Please present this QR code at the entrance.</p>
            <div style="margin: 30px 0;">
              <img src="cid:qrcode" alt="Ticket QR Code" style="width: 250px; height: 250px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
            </div>
            <p style="color: #999; font-family: monospace; font-size: 14px; letter-spacing: 2px;">${ticket.ticketCode.substring(0, 12).toUpperCase()}</p>
            <p style="color: #666; font-size: 16px; margin-top: 20px;">See you there!</p>
          </div>
        </div>
      `,
      attachments: [{
        filename: 'qrcode.png',
        content: base64Data,
        encoding: 'base64',
        cid: 'qrcode'
      }]
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email delivery failed:', error);
  }
};

exports.registerAttendee = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendeeName, attendeeEmail } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check max attendees limit
    if (event.maxAttendees) {
      const currentAttendeesCount = await Ticket.countDocuments({ eventId });
      if (currentAttendeesCount >= event.maxAttendees) {
        return res.status(400).json({ message: 'This event is fully booked. Registration is closed.' });
      }
    }

    // Generate unique ticket code (used for DB lookup and manual entry)
    const ticketCode = crypto.randomBytes(16).toString('hex');
    
    const newTicket = new Ticket({
      eventId,
      attendeeName,
      attendeeEmail,
      ticketCode
    });

    if (event.price > 0) {
      const isTestMode = !process.env.RAZORPAY_KEY_ID;
      let orderId = `mock_order_${crypto.randomBytes(4).toString('hex')}`;
      let order = { amount: event.price * 100, currency: 'INR', id: orderId };

      if (!isTestMode) {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        const options = {
          amount: event.price * 100, // paise
          currency: "INR",
          receipt: `receipt_${crypto.randomBytes(4).toString('hex')}`
        };
        order = await razorpay.orders.create(options);
        orderId = order.id;
      }
      
      newTicket.status = 'pending_payment';
      newTicket.razorpayOrderId = orderId;
      await newTicket.save();

      return res.status(201).json({
        message: 'Payment required',
        order,
        ticketId: newTicket._id,
        key: isTestMode ? 'mock' : process.env.RAZORPAY_KEY_ID
      });
    }

    // Free event flow
    await newTicket.save();

    // Generate cryptographically signed QR payload
    const qrPayload = jwt.sign(
      { ticketCode, eventId }, 
      process.env.JWT_SECRET || 'fallback_secret'
    );

    // Send email asynchronously
    sendTicketEmail(attendeeEmail, newTicket, event.title, qrPayload);

    res.status(201).json({ 
      message: 'Registration successful', 
      ticketId: newTicket._id,
      qrPayload: qrPayload 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.checkinTicket = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { qrPayload } = req.body;

    let ticket;

    // Check if it's a JWT (3 parts separated by dots)
    if (qrPayload.includes('.')) {
      try {
        const decoded = jwt.verify(qrPayload, process.env.JWT_SECRET || 'fallback_secret');
        if (decoded.eventId !== eventId) {
          return res.status(400).json({ message: 'Invalid or tampered ticket' });
        }
        ticket = await Ticket.findOne({ ticketCode: decoded.ticketCode, eventId });
      } catch (err) {
        return res.status(400).json({ message: 'Invalid or tampered ticket' });
      }
    } else {
      // Manual entry: payload is the first 12 characters uppercase
      const regex = new RegExp(`^${qrPayload.trim()}`, 'i');
      ticket = await Ticket.findOne({ ticketCode: regex, eventId });
    }

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // 3. Check duplicate
    if (ticket.status === 'checked-in') {
      return res.status(409).json({ message: 'Already checked in' });
    }

    // 4. Check-in successful
    ticket.status = 'checked-in';
    ticket.checkedInAt = new Date();
    await ticket.save();

    // 5. Emit real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.to(eventId).emit('attendeeCheckedIn', ticket);
      
      const event = await Event.findById(eventId);
      if (event) {
        // Broadcast to the organizer's global dashboard room
        io.to(`organizer_${event.organizerId.toString()}`).emit('dashboardCheckIn', { 
          ticket, 
          eventId: event._id, 
          eventTitle: event.title 
        });
      }
    }

    res.json({ message: 'Check-in successful', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEventAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Optional: verify the event belongs to the organizer
    const event = await Event.findOne({ _id: eventId, organizerId: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found or unauthorized' });

    const attendees = await Ticket.find({ eventId }).sort({ createdAt: -1 });
    
    const totalRegistered = attendees.length;
    const totalCheckedIn = attendees.filter(t => t.status === 'checked-in').length;
    const checkInRate = totalRegistered > 0 ? ((totalCheckedIn / totalRegistered) * 100).toFixed(1) : 0;

    res.json({
      attendees,
      analytics: {
        totalRegistered,
        totalCheckedIn,
        checkInRate
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.exportAttendeesCSV = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Verify event ownership
    const event = await Event.findOne({ _id: eventId, organizerId: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found or unauthorized' });

    const attendees = await Ticket.find({ eventId }).sort({ createdAt: -1 });

    const fields = ['attendeeName', 'attendeeEmail', 'ticketCode', 'status', 'checkedInAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(attendees);

    res.header('Content-Type', 'text/csv');
    res.attachment(`attendees-${eventId}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, ticketId } = req.body;
    
    // Bypass signature check if it's a test mode payment
    if (razorpay_payment_id !== 'mock_payment') {
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test');
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid payment signature' });
      }
    }

    const ticket = await Ticket.findById(ticketId).populate('eventId');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'valid';
    await ticket.save();

    const qrPayload = jwt.sign(
      { ticketCode: ticket.ticketCode, eventId: ticket.eventId._id || ticket.eventId }, 
      process.env.JWT_SECRET || 'fallback_secret'
    );

    // Send email asynchronously
    sendTicketEmail(ticket.attendeeEmail, ticket, ticket.eventId.title || 'Event', qrPayload);

    res.json({ message: 'Payment verified successfully', qrPayload });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
