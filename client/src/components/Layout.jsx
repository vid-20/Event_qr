import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children, handleLogout }) => {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'My Events', path: '/dashboard/events', icon: '🎟️' }, 
    { name: 'Analytics', path: '/dashboard/analytics', icon: '📈' }, 
    { name: 'Scanner', path: '/dashboard/scanner', icon: '📷' }, 
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'Organizer';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <nav className="glass-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </button>
          <Link to="/dashboard" className="mono-bold" style={{ fontSize: '1.5rem', color: 'var(--text-light)', letterSpacing: '-0.05em' }}>
            EventQR<span style={{ color: 'var(--accent-amber)' }}>.pro</span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Profile */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '50px', border: '1px solid var(--divider)' }}
              onClick={() => { setShowProfile(!showProfile); }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-amber)', color: 'var(--bg-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                {userInitial}
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 500 }}>{userName}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>▼</span>
            </div>

            {showProfile && (
              <div className="dropdown-menu" style={{ width: '200px' }}>
                <Link to="/settings" className="dropdown-item" onClick={() => setShowProfile(false)}>⚙️ Account Settings</Link>
                <a className="dropdown-item" style={{ color: 'var(--accent-rose)', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); handleLogout(); }}>🚪 Logout</a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar */}
        <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{ width: '240px', background: 'var(--bg-surface)', borderRight: '1px solid var(--divider)', padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path + '/') && item.path !== '/dashboard');
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                onClick={() => setMobileMenuOpen(false)}
                style={{ 
                  padding: '12px 24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  color: isActive ? 'var(--accent-amber)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(232, 168, 85, 0.05)' : 'transparent',
                  borderRight: isActive ? '3px solid var(--accent-amber)' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  transition: 'background 0.2s, color 0.2s'
                }}
                onMouseOver={(e) => { if(!isActive) e.currentTarget.style.color = 'var(--text-light)'; }}
                onMouseOut={(e) => { if(!isActive) e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </aside>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }}
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}

        {/* Page Content */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
