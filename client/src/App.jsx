import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Overview from './pages/Overview';
import MyEvents from './pages/MyEvents';
import EventDetail from './pages/EventDetail';
import Scan from './pages/Scan';
import ScannerEntry from './pages/ScannerEntry';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import RegisterEvent from './pages/RegisterEvent';

const PrivateRoute = ({ children, isAuth }) => {
  return isAuth ? children : <Navigate to="/login" />;
};

const AppContent = ({ isAuth, handleLogout, setIsAuth }) => {
  const location = useLocation();
  const isScanner = location.pathname.includes('/scan');

  const renderWithLayout = (Component) => {
    if (isScanner) return <Component />;
    return <Layout handleLogout={handleLogout}><Component /></Layout>;
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Home isAuth={isAuth} />} />
        <Route path="/login" element={isAuth ? <Navigate to="/dashboard" /> : <Login setAuth={setIsAuth} />} />
        
        {/* Organizer Routes */}
        <Route path="/dashboard" element={
          <PrivateRoute isAuth={isAuth}>{renderWithLayout(Overview)}</PrivateRoute>
        } />
        <Route path="/dashboard/events" element={
          <PrivateRoute isAuth={isAuth}>{renderWithLayout(MyEvents)}</PrivateRoute>
        } />
        <Route path="/dashboard/analytics" element={
          <PrivateRoute isAuth={isAuth}>{renderWithLayout(Analytics)}</PrivateRoute>
        } />
        <Route path="/dashboard/scanner" element={
          <PrivateRoute isAuth={isAuth}>{renderWithLayout(ScannerEntry)}</PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute isAuth={isAuth}>{renderWithLayout(Settings)}</PrivateRoute>
        } />
        <Route path="/dashboard/events/:id" element={
          <PrivateRoute isAuth={isAuth}>{renderWithLayout(EventDetail)}</PrivateRoute>
        } />
        <Route path="/dashboard/events/:id/scan" element={
          <PrivateRoute isAuth={isAuth}>{renderWithLayout(Scan)}</PrivateRoute>
        } />

        {/* Public Routes */}
        <Route path="/events/:id/register" element={<RegisterEvent />} />
      </Routes>
    </>
  );
};

function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuth(false);
  };

  return (
    <Router>
      <AppContent isAuth={isAuth} handleLogout={handleLogout} setIsAuth={setIsAuth} />
    </Router>
  );
}

export default App;
