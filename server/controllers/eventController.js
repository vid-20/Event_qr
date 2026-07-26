const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, maxAttendees, price, category } = req.body;
    const newEvent = new Event({
      title,
      description,
      date,
      location,
      organizerId: req.user.id,
      maxAttendees,
      price,
      category
    });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.user.id }).sort({ date: 1 }).lean();
    const Ticket = require('../models/Ticket');
    const eventsWithCounts = await Promise.all(events.map(async (event) => {
      const checkedIn = await Ticket.countDocuments({ eventId: event._id, status: 'checked-in' });
      const totalRegistered = await Ticket.countDocuments({ eventId: event._id });
      return { ...event, checkedIn, totalRegistered };
    }));
    res.json(eventsWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.user.id }).lean();
    const eventIds = events.map(e => e._id);
    
    const Ticket = require('../models/Ticket');
    
    // Aggregates
    const totalEvents = events.length;
    const totalAttendees = await Ticket.countDocuments({ eventId: { $in: eventIds } });
    
    // Checked in today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const checkedInToday = await Ticket.countDocuments({
      eventId: { $in: eventIds },
      status: 'checked-in',
      checkedInAt: { $gte: startOfDay }
    });
    
    // Revenue (only for valid tickets)
    let revenue = 0;
    const validTickets = await Ticket.find({ eventId: { $in: eventIds }, status: 'valid' }).lean();
    validTickets.forEach(ticket => {
      const event = events.find(e => e._id.toString() === ticket.eventId.toString());
      if (event && event.price) {
        revenue += event.price;
      }
    });
    
    // Upcoming Events (next 5)
    let upcomingEvents = await Event.find({ organizerId: req.user.id, date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(5)
      .lean();
      
    // Populate totalRegistered for upcoming events
    upcomingEvents = await Promise.all(upcomingEvents.map(async (event) => {
      const totalRegistered = await Ticket.countDocuments({ eventId: event._id, status: { $in: ['valid', 'checked-in'] } });
      return { ...event, totalRegistered };
    }));
      
    // Recent Checkins (last 5) for Overview page
    const recentCheckins = await Ticket.find({ eventId: { $in: eventIds }, status: 'checked-in' })
      .sort({ checkedInAt: -1 })
      .limit(5)
      .populate('eventId', 'title')
      .lean();

    // Registration Trends (last 7 days) for Analytics page
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentTickets = await Ticket.find({
      eventId: { $in: eventIds },
      status: { $in: ['valid', 'checked-in'] },
      createdAt: { $gte: sevenDaysAgo }
    }).select('createdAt').lean();
      
    res.json({
      stats: { totalEvents, totalAttendees, checkedInToday, revenue },
      upcomingEvents,
      recentCheckins,
      recentTickets
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    let isSoldOut = false;
    if (event.maxAttendees) {
      const Ticket = require('../models/Ticket');
      const currentAttendeesCount = await Ticket.countDocuments({ eventId: event._id });
      if (currentAttendeesCount >= event.maxAttendees) {
        isSoldOut = true;
      }
    }
    
    res.json({ ...event, isSoldOut });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPublicEvents = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const events = await Event.find({ date: { $gte: today } })
      .populate('organizerId', 'name')
      .sort({ date: 1 })
      .lean();
      
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, organizerId: req.user.id },
      req.body,
      { new: true }
    );
    if (!event) return res.status(404).json({ message: 'Event not found or unauthorized' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, organizerId: req.user.id });
    if (!event) return res.status(404).json({ message: 'Event not found or unauthorized' });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
