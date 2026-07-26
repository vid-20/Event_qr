import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api/axiosInstance';

const Scan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'duplicate' | 'invalid', message: string }
  const [animationClass, setAnimationClass] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [manualCode, setManualCode] = useState('');

  const processCheckIn = async (code) => {
    try {
      const { data } = await api.post(`/events/${id}/checkin`, { qrPayload: code });
      const attendeeName = data.ticket.attendeeName;
      setScanResult({ type: 'success', message: `${attendeeName} successfully checked in!` });
      setAnimationClass('flash-success');
      
      setRecentScans(prev => [
        { id: Date.now(), name: attendeeName, status: 'Success', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...prev
      ].slice(0, 4));

    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid QR Code';
      if (msg.toLowerCase().includes('already checked in')) {
        setScanResult({ type: 'duplicate', message: msg });
        setAnimationClass('flash-duplicate');
      } else {
        setScanResult({ type: 'invalid', message: msg });
        setAnimationClass('shake-invalid');
      }
    }

    setTimeout(() => {
      setScanResult(null);
      setAnimationClass('');
    }, 2000);
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } }, 
      /* verbose= */ false
    );

    let isScanning = true;

    scanner.render(
      async (decodedText) => {
        if (!isScanning) return;
        isScanning = false; 

        await processCheckIn(decodedText);
        
        setTimeout(() => {
          isScanning = true;
        }, 2000);
      },
      (err) => {
        // ignore continuous scan errors
      }
    );

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, [id]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processCheckIn(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className={`scanner-container ${animationClass}`}>
      <div id="reader"></div>
      
      {/* Top Bar for Navigation */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1.5rem', zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <button onClick={() => navigate(`/dashboard/events/${id}`)} className="btn-secondary" style={{ background: 'rgba(18,20,31,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '50px', padding: '0.6rem 1.2rem', fontWeight: 600 }}>
          &larr; Exit Scanner
        </button>

        {/* Recent Scans Panel */}
        {recentScans.length > 0 && (
          <div style={{ background: 'rgba(18,20,31,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', width: '250px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem', fontWeight: 600 }}>Recent Scans</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {recentScans.map(scan => (
                <div key={scan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{scan.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{scan.time}</p>
                  </div>
                  <span style={{ color: 'var(--bg-navy)', background: 'var(--accent-amber)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>OK</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Fallback at Bottom */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 20, width: '90%', maxWidth: '400px' }}>
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(18,20,31,0.8)', backdropFilter: 'blur(10px)', padding: '0.5rem', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <input 
            type="text" 
            placeholder="Manual ticket code..." 
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', padding: '0.5rem 1rem', fontSize: '1rem' }}
          />
          <button type="submit" style={{ background: 'var(--text-light)', color: 'var(--bg-navy)', border: 'none', borderRadius: '50px', padding: '0 1.2rem', fontWeight: 700, cursor: 'pointer' }}>
            Enter
          </button>
        </form>
      </div>

      {/* Result Message Overlay */}
      {scanResult && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: scanResult.type === 'success' ? 'var(--accent-amber)' : 'var(--accent-rose)',
          color: scanResult.type === 'success' ? 'var(--bg-navy)' : '#FFF',
          padding: '24px 48px',
          borderRadius: '16px',
          fontWeight: 'bold',
          fontSize: '1.5rem',
          zIndex: 30,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {scanResult.type === 'success' ? '✅' : scanResult.type === 'duplicate' ? '⚠️' : '❌'}
          </div>
          {scanResult.message}
        </div>
      )}
    </div>
  );
};

export default Scan;
