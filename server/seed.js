const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/User');
const Event = require('./models/Event');
const Ticket = require('./models/Ticket');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Ticket.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Organizer
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    const organizer = new User({
      name: 'Test Organizer',
      email: 'organizer@test.com',
      passwordHash,
      role: 'organizer'
    });
    await organizer.save();
    console.log('Organizer created (organizer@test.com / password123)');

    // 2. Create Event
    const event = new Event({
      title: 'Tech Meetup 2026',
      description: 'A great event for tech enthusiasts to network and learn.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      location: 'Innovation Hub, Downtown',
      organizerId: organizer._id,
      maxAttendees: 100
    });
    await event.save();
    console.log(`Event created: ${event.title}`);

    // 3. Create sample tickets
    const ticket1 = new Ticket({
      eventId: event._id,
      attendeeName: 'Alice Johnson',
      attendeeEmail: 'alice@example.com',
      ticketCode: 'mockcode123alice',
      status: 'valid'
    });
    const ticket2 = new Ticket({
      eventId: event._id,
      attendeeName: 'Bob Smith',
      attendeeEmail: 'bob@example.com',
      ticketCode: 'mockcode456bob',
      status: 'checked-in',
      checkedInAt: new Date()
    });
    await ticket1.save();
    await ticket2.save();
    console.log('Sample tickets generated.');

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
