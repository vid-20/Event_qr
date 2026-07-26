import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axiosInstance';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [analytics, setAnalytics] = useState({ totalRegistered: 0, totalCheckedIn: 0, checkInRate: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    fetchAttendees();

    const socket = io(`http://${window.location.hostname}:5000`);
    socket.emit('joinEventRoom', id);

    socket.on('attendeeCheckedIn', (updatedTicket) => {
      setAttendees(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
      setAnalytics(prev => {
        const newCheckedIn = prev.totalCheckedIn + 1;
        const newRate = prev.totalRegistered > 0 ? ((newCheckedIn / prev.totalRegistered) * 100).toFixed(1) : 0;
        return { ...prev, totalCheckedIn: newCheckedIn, checkInRate: newRate };
      });
    });

    return () => socket.disconnect();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendees = async () => {
    try {
      const { data } = await api.get(`/events/${id}/attendees`);
      setAttendees(data.attendees);
      setAnalytics(data.analytics);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await api.delete(`/events/${id}`);
        navigate('/dashboard');
      } catch (err) {
        console.error(err);
        alert('Failed to delete event');
      }
    }
  };

  const handleCopyLink = () => {
    const publicLink = `${window.location.origin}/events/${event._id}/register`;
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/events/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendees-${event.title.replace(/\s+/g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export CSV');
    }
  };

  if (!event) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading Event Data...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Header & Quick Actions */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--divider)', paddingBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-light)' }}>{event.title}</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '50px', fontSize: '0.85rem', color: 'var(--text-muted)', border: '1px solid var(--divider)' }}>
              📅 {new Date(event.date).toLocaleDateString()}
            </span>
            <span style={{ background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '50px', fontSize: '0.85rem', color: 'var(--text-muted)', border: '1px solid var(--divider)' }}>
              📍 {event.location}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleDeleteEvent} className="btn-secondary" style={{ padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', background: 'rgba(214, 107, 107, 0.1)', cursor: 'pointer' }}>
            🗑️ Delete Event
          </button>
          <button onClick={handleExportCSV} className="btn-secondary" style={{ padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid var(--divider)', background: 'var(--bg-surface)', color: 'var(--text-light)', cursor: 'pointer' }}>
            📥 Export CSV
          </button>
          <button onClick={handleCopyLink} className="btn-secondary" style={{ padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid var(--divider)', background: 'var(--bg-surface)', color: 'var(--text-light)', cursor: 'pointer' }}>
            {copied ? '✅ Copied!' : '🔗 Copy Public Link'}
          </button>
          <Link to={`/dashboard/events/${event._id}/scan`} style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📷 Open Scanner
            </button>
          </Link>
        </div>
      </section>

      {/* 2. Live Analytics & Capacity */}
      <section>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Live Analytics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--divider)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Registered</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <p className="mono" style={{ fontSize: '3rem', color: 'var(--text-light)', lineHeight: 1 }}>{analytics.totalRegistered}</p>
              {event.maxAttendees && <span style={{ color: 'var(--text-muted)' }}>/ {event.maxAttendees} cap</span>}
            </div>
          </div>
          
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--divider)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Checked-In</p>
            <p className="mono" style={{ fontSize: '3rem', color: 'var(--accent-amber)', lineHeight: 1 }}>{analytics.totalCheckedIn}</p>
          </div>
          
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--divider)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Check-In Rate</p>
            <p className="mono" style={{ fontSize: '3rem', color: 'var(--text-light)', lineHeight: 1 }}>{analytics.checkInRate}<span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>%</span></p>
          </div>
        </div>

        {/* Thick Capacity Bar */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--divider)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Event Capacity Fill</span>
            <span className="mono" style={{ fontSize: '0.9rem', color: 'var(--accent-amber)' }}>{analytics.checkInRate}%</span>
          </div>
          <div style={{ width: '100%', height: '16px', background: 'var(--bg-navy)', borderRadius: '8px', overflow: 'hidden', border: '1px inset rgba(255,255,255,0.05)' }}>
            <div style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, #E8A855 0%, #F5C582 100%)', 
              width: `${analytics.checkInRate}%`,
              transition: 'width 0.5s ease-out'
            }}></div>
          </div>
        </div>
      </section>

      {/* 3. Attendee Roster Table */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Attendee Roster</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: '50px' }}>
            🟢 Live Updates Active
          </span>
        </div>

        <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--divider)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--divider)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket Code</th>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map(a => (
                <tr key={a._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.2rem 1.5rem', fontWeight: 500, color: 'var(--text-light)' }}>{a.attendeeName}</td>
                  <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{a.attendeeEmail}</td>
                  <td style={{ padding: '1.2rem 1.5rem' }}>
                    <span className="mono" style={{ background: 'var(--bg-navy)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--divider)', color: 'var(--text-muted)' }}>
                      {a.ticketCode.substring(0, 10).toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem 1.5rem' }}>
                    {a.status === 'checked-in' ? (
                      <span style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--accent-amber)', color: 'var(--bg-navy)', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                        CHECKED IN
                      </span>
                    ) : (
                      <span style={{ display: 'inline-block', padding: '6px 12px', background: 'transparent', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="mono" style={{ padding: '1.2rem 1.5rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {a.checkedInAt ? new Date(a.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </td>
                </tr>
              ))}
              {attendees.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👻</div>
                    No attendees registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
    </div>
  );
};

export default EventDetail;
