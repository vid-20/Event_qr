import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axiosInstance';

const RegisterEvent = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTestPayment, setShowTestPayment] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await api.get(`/events/${id}`);
        setEvent(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Event not found');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post(`/events/${id}/register`, {
        attendeeName: formData.name,
        attendeeEmail: formData.email
      });
      
      if (data.order) {
        // Paid Event Flow
        if (data.key === 'mock') {
          // Trigger Test Mode Payment Modal
          setShowTestPayment({ order: data.order, ticketId: data.ticketId });
          return;
        }

        const res = await loadRazorpay();
        if (!res) {
          setError('Razorpay SDK failed to load. Please check your connection.');
          return;
        }

        const options = {
          key: data.key,
          amount: data.order.amount,
          currency: data.order.currency,
          name: event.title,
          description: "Event Ticket",
          order_id: data.order.id,
          handler: async function (response) {
            try {
              const verifyRes = await api.post(`/events/${id}/verify-payment`, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                ticketId: data.ticketId
              });
              
              setTicket({
                attendeeName: formData.name,
                ticketCode: verifyRes.data.qrPayload
              });
            } catch (err) {
              setError('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
          },
          theme: {
            color: "#E8A855"
          }
        };
        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', function (response) {
           setError(`Payment failed: ${response.error.description}. Try again.`);
        });
        paymentObject.open();
      } else {
        // Free Event Flow
        setTicket({
          attendeeName: formData.name,
          ticketCode: data.qrPayload
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading event details...</div>;
  if (!event) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--accent-rose)' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-navy)' }}>
      {/* Navbar */}
      <nav className="glass-nav" style={{ padding: '1.5rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="mono-bold" style={{ fontSize: '1.5rem', color: 'var(--text-light)', textDecoration: 'none', letterSpacing: '-0.05em' }}>
          EventQR<span style={{ color: 'var(--accent-amber)' }}>.pro</span>
        </Link>
      </nav>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 5%' }}>
        
        {!ticket ? (
          /* Registration Layout */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', maxWidth: '1000px', width: '100%' }}>
            {/* Event Info */}
            <div>
              {event.isSoldOut ? (
                <span className="badge" style={{ background: 'var(--accent-rose)', color: '#fff', marginBottom: '1rem', display: 'inline-block' }}>🚫 Sold Out</span>
              ) : (
                <span className="badge" style={{ background: 'var(--accent-amber)', color: 'var(--bg-navy)', marginBottom: '1rem', display: 'inline-block' }}>🎟️ Registration Open</span>
              )}
              <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }}>{event.title}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>{event.description || 'Join us for this exclusive event. Secure your ticket now.'}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--divider)', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.5rem' }}>📅</div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-light)' }}>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Starts at 9:00 AM</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.5rem' }}>📍</div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-light)' }}>{event.location}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Venue details sent via email</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.5rem' }}>💳</div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>{event.price ? `₹${event.price}` : 'Free'}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>General Admission</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div style={{ background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--divider)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {event.isSoldOut ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.8 }}>🛑</div>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Capacity Reached</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>This event is completely booked. Thank you for your interest!</p>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Reserve Your Spot</h3>
                  {error && <div style={{ background: 'rgba(214,107,107,0.1)', color: 'var(--accent-rose)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid var(--accent-rose)' }}>{error}</div>}
                  
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--divider)', borderRadius: '8px', color: 'var(--text-light)' }}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--divider)', borderRadius: '8px', color: 'var(--text-light)' }}
                        placeholder="jane@example.com"
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '1rem', marginTop: '1rem', borderRadius: '8px', fontSize: '1.1rem' }}>
                      Confirm Registration
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ) : (
          /* VIP Ticket Success State */
          <div style={{ textAlign: 'center', width: '100%' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-light)', marginBottom: '3rem' }}>You're on the list!</h2>
            
            <div className="vip-ticket">
              {/* Left Stub */}
              <div className="vip-ticket-left">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                  <div>
                    <p style={{ color: 'var(--ink-stamp)', opacity: 0.7, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>VIP Boarding Pass</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{event.title}</h3>
                  </div>
                  <div style={{ border: '2px solid var(--ink-stamp)', color: 'var(--ink-stamp)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', transform: 'rotate(15deg)', opacity: 0.85 }}>
                    ADMIT ONE
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Attendee Name</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{ticket.attendeeName}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Date</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Venue</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{event.location}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Gate / Zone</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>GATE 4 • GA</p>
                  </div>
                </div>

                <div className="barcode-strip"></div>
              </div>

              {/* Perforation */}
              <div className="vip-ticket-divider"></div>

              {/* Right Stub (QR) */}
              <div className="vip-ticket-right">
                <p style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1.5rem', textTransform: 'uppercase', color: 'var(--ink-stamp)' }}>Scan at Entry</p>
                <div style={{ background: '#FFF', padding: '16px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                  <QRCodeSVG value={ticket.ticketCode} size={200} level="H" fgColor="#3B4252" />
                </div>
                <p className="mono" style={{ marginTop: '1.5rem', fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--ink-stamp)' }}>{ticket.ticketCode.substring(0, 12).toUpperCase()}</p>
                <p style={{ marginTop: 'auto', fontSize: '0.7rem', opacity: 0.6, paddingTop: '1rem', color: 'var(--ink-stamp)', fontWeight: 600 }}>Issued: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            
            <p style={{ marginTop: '3rem', color: 'var(--text-muted)' }}>Take a screenshot to save your ticket.</p>
          </div>
        )}

      </div>

      {/* Test Payment Modal */}
      {showTestPayment && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ textAlign: 'center', background: '#fff', color: '#111', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#111' }}>Test Payment Gateway</h2>
            <div style={{ background: 'rgba(232, 168, 85, 0.1)', borderLeft: '4px solid var(--accent-amber)', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', color: '#333' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Because no Razorpay keys were found in the server configuration, the app is running in <strong>Development Test Mode</strong>. 
              </p>
              <br/><br/>
              Clicking below will simulate a successful payment verification from a banking gateway.
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#111' }}>
              Amount: ₹{showTestPayment.order.amount / 100}
            </div>
            
            <button 
              style={{ background: '#2B84EA', color: 'white', padding: '1rem 2rem', borderRadius: '8px', width: '100%', fontSize: '1.1rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={async () => {
                try {
                  const verifyRes = await api.post(`/events/${id}/verify-payment`, {
                    razorpay_payment_id: 'mock_payment',
                    razorpay_order_id: showTestPayment.order.id,
                    razorpay_signature: 'mock_signature',
                    ticketId: showTestPayment.ticketId
                  });
                  setTicket({ attendeeName: formData.name, ticketCode: verifyRes.data.qrPayload });
                  setShowTestPayment(null);
                } catch (err) {
                  setError('Mock payment failed.');
                  setShowTestPayment(null);
                }
              }}
            >
              Simulate Successful Payment
            </button>
            <button 
              style={{ background: 'transparent', color: '#666', marginTop: '1rem', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setShowTestPayment(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterEvent;
