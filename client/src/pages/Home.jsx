import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';

const Home = ({ isAuth }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
        const { data } = await api.get('/events/public');
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicEvents();
  }, []);

  const validCategories = ['Technology', 'Music', 'Workshop', 'Business', 'Sports', 'Social', 'Other'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>
        {`
          .event-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 2rem;
          }
          @media (min-width: 768px) {
            .event-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (min-width: 1024px) {
            .event-grid { grid-template-columns: repeat(3, 1fr); gap: 2.5rem; }
          }
          .event-card {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          }
          .event-card:hover {
            transform: translateY(-6px) scale(1.01);
            box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.05);
          }
          .card-date {
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            margin-bottom: 1rem;
            text-transform: uppercase;
          }
          .card-title {
            font-size: 1.5rem;
            margin-bottom: 0.8rem;
            line-height: 1.2;
            font-weight: 700;
          }
        `}
      </style>

      {/* Public Navbar */}
      <nav className="glass-nav" style={{ padding: '1.5rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" className="mono-bold" style={{ fontSize: '1.5rem', color: 'var(--text-light)', textDecoration: 'none', letterSpacing: '-0.05em' }}>
          EventQR<span style={{ color: 'var(--accent-amber)' }}>.pro</span>
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {!isAuth ? (
            <>
              <Link to="/login" style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
              <Link to="/login" className="btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '50px', textDecoration: 'none' }}>Get Started</Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '50px', textDecoration: 'none' }}>Go to Dashboard &rarr;</Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ padding: '9rem 5% 8rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(232,168,85,0.15) 0%, rgba(18,20,31,0) 70%)', zIndex: -1 }}></div>
        <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--text-light)' }}>
          The Modern Standard for <br />
          <span style={{ color: 'var(--accent-amber)' }}>Event Ticketing.</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 4rem', lineHeight: 1.6 }}>
          Create stunning event pages, distribute secure QR-based VIP passes, and check-in attendees at lightning speed with our professional gate scanner.
        </p>
        <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center' }}>
          <Link to="/login" className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', borderRadius: '50px', textDecoration: 'none', fontWeight: 600 }}>Host an Event</Link>
          <a href="#explore" className="btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', borderRadius: '50px', background: 'rgba(255,255,255,0.05)', textDecoration: 'none', fontWeight: 600 }}>Explore Events</a>
        </div>
      </header>

      {/* Featured Events Marketplace */}
      <section id="explore" style={{ padding: '5rem 5% 8rem', flex: 1 }}>
        <div style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Upcoming Events</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Discover trending experiences happening near you.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', borderRadius: '20px', border: '1px dashed var(--divider)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-light)' }}>No upcoming events yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Check back soon for new experiences, or be the first to host one!</p>
            <Link to="/login" className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }}>Host an Event</Link>
          </div>
        ) : (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="event-grid">
              {events.slice(0, 6).map(event => {
                
                // Organizer formatting fallback
                let orgName = event.organizerId?.name || '';
                if (orgName.length < 3) orgName = 'Verified Organizer';
                const orgInitial = orgName.charAt(0).toUpperCase() || 'V';

                return (
                  <div key={event._id} className="event-card ticket-paper-card">
                    {/* Event Details (Left Side / Main Ticket) */}
                    <div style={{ padding: '2.5rem', flex: 1, display: 'flex', flexDirection: 'column', zIndex: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <p className="mono card-date">
                          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <div className="stamp-badge">
                          {event.category || 'Other'}
                        </div>
                      </div>
                      
                      <h3 className="card-title">{event.title}</h3>
                      <p style={{ opacity: 0.8, fontSize: '0.95rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, fontWeight: 500 }}>
                        <span>📍</span> {event.location}
                      </p>
                      
                      {/* Organizer Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid rgba(59,66,82,0.15)', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--ink-stamp)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                            {orgInitial}
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{orgName}</span>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                          {event.price ? `₹${event.price}` : 'FREE'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Ticket Perforation */}
                    <div className="ticket-divider-ink" style={{ margin: '0' }}></div>
                    
                    {/* Ticket Stub (Bottom) */}
                    <div style={{ padding: '1.5rem', background: 'rgba(59,66,82,0.05)', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontWeight: 800, letterSpacing: '0.1em', fontSize: '0.85rem' }}>ADMIT ONE</span>
                         <Link to={`/events/${event._id}/register`} style={{ color: 'var(--bg-navy)', background: 'var(--accent-amber)', fontSize: '0.9rem', fontWeight: 800, textDecoration: 'none', padding: '8px 20px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Get Tickets
                         </Link>
                       </div>
                       <div className="barcode-strip-ink" style={{ height: '30px', marginTop: '1.5rem' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {events.length > 6 && (
              <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <a href="#explore" className="btn-secondary" style={{ padding: '1rem 2rem', borderRadius: '50px', textDecoration: 'none', fontSize: '1rem', fontWeight: 600 }}>View All Events</a>
              </div>
            )}
          </div>
        )}
      </section>

      <footer style={{ padding: '3rem 5%', textAlign: 'center', borderTop: '1px solid var(--divider)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        &copy; 2026 EventQR Pro. Ticketing Platform.
      </footer>
    </div>
  );
};

export default Home;
