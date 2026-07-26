import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../api/axiosInstance';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
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

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading analytics...</div>;

  if (!data || data.stats.totalEvents === 0) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📉</div>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>No Analytics Available</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>Create events and get registrations to unlock powerful analytics.</p>
      </div>
    );
  }

  // Transform data for charts
  
  // Chart 1: Registrations over the last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  }

  const registrationsByDay = (data.recentTickets || []).reduce((acc, ticket) => {
    const date = new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const registrationChartData = last7Days.map(date => ({
    date,
    registrations: registrationsByDay[date] || 0
  }));

  // Chart 2: Upcoming Events Capacity
  const capacityChartData = data.upcomingEvents.map(event => ({
    name: event.title.substring(0, 15) + (event.title.length > 15 ? '...' : ''),
    capacity: event.maxAttendees || 0, // 0 if unlimited, handled in chart visually
    registered: event.totalRegistered || 0
  }));

  return (
    <div className="container">
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '2rem' }}>Analytics</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Registration Trends Chart */}
        <div className="glass-card" style={{ padding: '2rem', minHeight: '400px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Registration Trends (Last 7 Days)</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationChartData}>
                <defs>
                  <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-amber)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--accent-amber)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-navy)', border: '1px solid var(--divider)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--accent-amber)' }}
                />
                <Area type="monotone" dataKey="registrations" stroke="var(--accent-amber)" strokeWidth={3} fillOpacity={1} fill="url(#colorRegs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity Chart */}
        <div className="glass-card" style={{ padding: '2rem', minHeight: '400px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Upcoming Events Capacity</h2>
          {capacityChartData.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>No upcoming events to analyze.</div>
          ) : (
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityChartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-navy)', border: '1px solid var(--divider)', borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="capacity" fill="rgba(255,255,255,0.1)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="registered" fill="var(--accent-amber)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Analytics;
