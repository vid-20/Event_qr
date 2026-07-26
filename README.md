EventQR Pro 🎟️

A full-stack event management platform with secure QR-based ticketing and real-time check-in tracking.

What It Does

Organizers create events and manage attendees through a dashboard; attendees register and receive a unique QR ticket; organizers scan tickets at the door using a camera-based scanner, with instant duplicate and invalid-ticket detection. Check-in status updates live across the dashboard via WebSockets — no page refresh needed.

Key Features
JWT-based organizer authentication with bcrypt password hashing
Unique, non-guessable QR ticket generation per attendee registration
Camera-based ticket scanning (html5-qrcode) with instant success/duplicate/invalid feedback
Real-time check-in dashboard powered by Socket.io — attendance updates live as scans happen
Manual check-in fallback (ticket code entry) if the camera scanner is unavailable
Overbooking prevention — registrations are blocked once an event reaches max capacity
Custom "ticket-stub" design system — event cards and QR tickets are styled to look like physical event passes, not generic UI cards
Tech Stack

Frontend: React (Vite), React Router, Axios, vanilla CSS Backend: Node.js, Express.js, MongoDB (Mongoose) Auth: JWT, bcrypt Real-time: Socket.io QR: qrcode.react (generation), html5-qrcode (scanning)

Architecture
Attendee registers for an event
        │
        ▼
Server generates a unique, secure ticket code → stored in MongoDB
        │
        ▼
QR code rendered client-side, containing the ticket code
        │
        ▼
Organizer scans ticket at the door (camera or manual entry)
        │
        ▼
Server validates ticket status:
  - Not found      → "Invalid ticket"
  - Already used   → "Already checked in" (409)
  - Valid          → marked checked-in, timestamp recorded
        │
        ▼
Socket.io broadcasts the check-in event to the organizer's dashboard in real time
Running Locally

Backend

bash
cd server
npm install
# create a .env file — see Environment Variables below
npm run dev

Frontend

bash
cd client
npm install
npm run dev
Environment Variables

Create a .env file in /server (see .env.example):

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
Requirements
Node.js v18+
MongoDB (local or Atlas)
