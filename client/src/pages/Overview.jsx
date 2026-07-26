import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { io } from 'socket.io-client';

const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    const socket = io(`http://${window.location.hostname}:5000`);
    
    // Join global organizer room
    socket.emit('joinOrganizerRoom', user.id);

    socket.on('dashboardCheckIn', (payload) => {
      // Add to recent checkins feed
      setData(prev => {
        if (!prev) return prev;
        const newFeedItem = {
          _id: Math.random().toString(), // temporary id
          attendeeName: payload.ticket.attendeeName,
          ticketCode: payload.ticket.ticketCode,
          checkedInAt: new Date().toISOString(),
          eventId: { _id: payload.eventId, title: payload.eventTitle }
        };
        
        return {
          ...prev,
          stats: {
            ...prev.stats,
            checkedInToday: prev.stats.checkedInToday + 1
          },
          recentCheckins: [newFeedItem, ...prev.recentCheckins].slice(0, 5)
        };
      });
    });

    return () => socket.disconnect();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/events/dashboard-stats');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading dashboard...</div>;

  if (!data || data.stats.totalEvents === 0) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📈</div>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome to EventQR Pro</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>You don't have any events yet. Create one to see your analytics here.</p>
        <Link to="/dashboard/events" className="btn-primary" style={{ textDecoration: 'none', padding: '1rem 2rem', borderRadius: '8px' }}>Go to My Events</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '2rem' }}>Dashboard Overview</h1>
      
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Events</p>
          <h3 style={{ fontSize: '2.5rem', color: 'var(--text-light)' }}>{data.stats.totalEvents}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Attendees</p>
          <h3 style={{ fontSize: '2.5rem', color: 'var(--text-light)' }}>{data.stats.totalAttendees}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Checked-In Today</p>
          <h3 style={{ fontSize: '2.5rem', color: 'var(--accent-amber)' }}>{data.stats.checkedInToday}</h3>
        </div>
        {data.stats.revenue > 0 && (
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(56, 239, 125, 0.3)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</p>
            <h3 style={{ fontSize: '2.5rem', color: '#38ef7d' }}>₹{data.stats.revenue.toLocaleString()}</h3>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {/* Upcoming Events */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Upcoming Events</h2>
            <Link to="/dashboard/events" style={{ color: 'var(--accent-amber)', fontSize: '0.9rem', textDecoration: 'none' }}>View All</Link>
          </div>
          {data.upcomingEvents.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--divider)', borderRadius: '8px' }}>
               <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No upcoming events.</p>
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.upcomingEvents.map(event => (
                <Link key={event._id} to={`/dashboard/events/${event._id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--divider)', textDecoration: 'none' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-light)', marginBottom: '0.2rem' }}>{event.title}</h4>
                    <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                  <span style={{ color: 'var(--accent-amber)' }}>&rarr;</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Live Feed */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--accent-amber)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px var(--accent-amber)' }}></span>
              Live Check-Ins
            </h2>
          </div>
          {data.recentCheckins.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--divider)', borderRadius: '8px' }}>
               <p style={{ color: 'var(--text-muted)' }}>No recent check-ins.</p>
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.recentCheckins.map(ticket => (
                <div key={ticket._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--divider)' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-light)', marginBottom: '0.2rem' }}>{ticket.attendeeName}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Checked into <strong style={{ color: 'var(--text-light)' }}>{ticket.eventId.title}</strong></p>
                  </div>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                    {new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
