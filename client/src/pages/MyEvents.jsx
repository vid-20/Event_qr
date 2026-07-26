import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', location: '', maxAttendees: '', price: '', category: 'Other' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', {
        ...formData,
        price: formData.price ? Number(formData.price) : 0
      });
      setShowForm(false);
      setFormData({ title: '', description: '', date: '', location: '', maxAttendees: '', price: '', category: 'Other' });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>My Events</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', fontSize: '1rem', display: 'flex', gap: '8px', alignItems: 'center', border: 'none', cursor: 'pointer' }}>
          <span>➕</span> New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--divider)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Events Yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Create your first event to start accepting registrations.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Create Event</button>
        </div>
      ) : (
        <div className="grid">
          {events.map(event => (
            <div key={event._id} className="ticket-paper-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', lineHeight: 1.2, fontWeight: 800 }}>{event.title}</h3>
                <p className="mono" style={{ color: 'var(--ink-stamp)', opacity: 0.8, fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 700 }}>{new Date(event.date).toLocaleString()}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-stamp)', opacity: 0.7, marginBottom: '1.5rem', fontWeight: 500 }}>📍 {event.location}</p>
                
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--ink-stamp)', fontWeight: 700, textTransform: 'uppercase' }}>
                    <span>Capacity</span>
                    <span className="mono">{event.checkedIn || 0} / {event.maxAttendees || event.totalRegistered || '∞'}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(59,66,82,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      background: 'var(--ink-stamp)', 
                      width: `${event.maxAttendees ? Math.min(((event.checkedIn || 0) / event.maxAttendees) * 100, 100) : ((event.checkedIn || 0)/(event.totalRegistered || 1))*100}%` 
                    }}></div>
                  </div>
                </div>

                <div className="ticket-divider-ink" style={{ margin: '1.5rem -1.5rem' }}></div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link to={`/dashboard/events/${event._id}`} style={{ flex: 1, textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', border: '1px solid var(--ink-stamp)', background: 'transparent', color: 'var(--ink-stamp)', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>Analytics</button>
                  </Link>
                  <Link to={`/dashboard/events/${event._id}/scan`} style={{ flex: 1, textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', border: 'none', background: 'var(--ink-stamp)', color: 'var(--ticket-paper)', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>Scanner</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating Event */}
      {showForm && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="modal-content" style={{ background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '500px', border: '1px solid var(--divider)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>Create New Event</h2>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Event Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--divider)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Description</label>
                  <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--divider)', borderRadius: '8px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--divider)', borderRadius: '8px', color: '#fff' }}>
                    <option value="Technology">Technology</option>
                    <option value="Music">Music</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Business">Business</option>
                    <option value="Sports">Sports</option>
                    <option value="Social">Social</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Date & Time</label>
                  <input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--divider)', borderRadius: '8px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Max Capacity</label>
                  <input type="number" value={formData.maxAttendees} onChange={e => setFormData({...formData, maxAttendees: e.target.value})} placeholder="Unlimited" style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--divider)', borderRadius: '8px', color: '#fff' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Location / Venue</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--divider)', borderRadius: '8px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Ticket Price (₹)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0 (Free)" min="0" style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--divider)', borderRadius: '8px', color: '#fff' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--divider)', background: 'transparent', color: '#fff', cursor: 'pointer' }} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
