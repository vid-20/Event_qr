import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

const ScannerEntry = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/events');
        // Filter to only events that haven't passed yet (optional, or just show all)
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>;

  if (events.length === 0) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📷</div>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>No Events to Scan</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>You need to create an event first before you can use the scanner.</p>
        <Link to="/dashboard/events" className="btn-primary" style={{ textDecoration: 'none', padding: '1rem 2rem', borderRadius: '8px' }}>Create Event</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '3rem', paddingTop: '2rem' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(232,168,85,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent-amber)' }}>
          <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h3"></path><path d="M20 7V4h-3"></path><path d="M4 17v3h3"></path><path d="M20 17v3h-3"></path><rect x="9" y="9" width="6" height="6"></rect></svg>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Select Event</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Choose an event to launch the check-in scanner.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {events.map(event => (
          <button 
            key={event._id}
            onClick={() => navigate(`/dashboard/events/${event._id}/scan`)}
            className="glass-card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', width: '100%', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.2s, background 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-light)', marginBottom: '0.2rem' }}>{event.title}</h3>
              <p className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
            <div style={{ background: 'var(--accent-amber)', color: '#000', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              Launch &rarr;
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScannerEntry;
