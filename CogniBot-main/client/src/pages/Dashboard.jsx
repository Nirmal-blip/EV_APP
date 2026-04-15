import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Activity, Zap, ArrowRight, Radio, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
// Switched to onSnapshot for real-time updates
import { collection, query, where, onSnapshot } from 'firebase/firestore'; 
import { db } from '../lib/firebase';

/* ─────────────────────────────────────────────────────────
   GLOBAL STYLES (Unchanged)
   ───────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  :root {
    --font-display: 'Clash Display', 'Cabinet Grotesk', system-ui, sans-serif;
    --font-body:    'Cabinet Grotesk', system-ui, sans-serif;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(1.5); }
  }

  @keyframes bar-grow {
    from { width: 0%; }
  }

  .grid-lines {
    background-image:
      linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .hard-card {
    background: #fff;
    border: 2px solid #0f172a;
    box-shadow: 8px 8px 0 rgba(15,23,42,0.08);
    border-radius: 24px;
  }

  .hard-card-dark {
    background: #0f172a;
    border: 2px solid #0f172a;
    box-shadow: 8px 8px 0 rgba(22,163,74,0.25);
    border-radius: 24px;
  }

  .status-pill {
    font-family: var(--font-body);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 99px;
    border: 1.5px solid;
  }

  .booking-card:hover {
    box-shadow: 12px 12px 0 rgba(22,163,74,0.18);
    border-color: #16a34a;
    transform: translateY(-3px);
  }

  .booking-card {
    background: #fff;
    border: 2px solid #0f172a;
    box-shadow: 6px 6px 0 rgba(15,23,42,0.07);
    border-radius: 20px;
    transition: all 0.2s ease;
  }
`;

/* ─────────────────────────────────────────────────────────
   STATUS COLOR MAP (Unchanged)
   ───────────────────────────────────────────────────────── */
const statusStyle = (status = '') => {
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'active' || s === 'completed')
    return { color: '#16a34a', borderColor: '#16a34a', background: '#f0fdf4' };
  if (s === 'pending')
    return { color: '#d97706', borderColor: '#d97706', background: '#fffbeb' };
  if (s === 'cancelled')
    return { color: '#dc2626', borderColor: '#dc2626', background: '#fef2f2' };
  return { color: '#64748b', borderColor: '#64748b', background: '#f8fafc' };
};

/* ─────────────────────────────────────────────────────────
   STAT CARD (Unchanged)
   ───────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, accent = false, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    className={accent ? 'hard-card-dark' : 'hard-card'}
    style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: accent ? '#16a34a' : '#f8fafc',
        border: accent ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {React.cloneElement(icon, { size: 16, color: accent ? '#fff' : '#0f172a' })}
      </div>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 800,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: accent ? '#94a3b8' : '#64748b',
      }}>{label}</span>
    </div>
    <span style={{
      fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, lineHeight: 1,
      color: accent ? '#fff' : '#0f172a',
    }}>{value}</span>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────
   BOOKING CARD (Unchanged)
   ───────────────────────────────────────────────────────── */
const BookingCard = ({ booking, idx }) => {
  const st = statusStyle(booking.status || booking.bookingStatus); // Support both status naming conventions
  const dateStr = booking.createdAt?.seconds
    ? new Date(booking.createdAt.seconds * 1000).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Unknown Date';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.055, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="booking-card"
      style={{ padding: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: '#0f172a', border: '2px solid #0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Zap size={20} color="#16a34a" />
          </div>
          <div>
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
              color: '#0f172a', margin: 0, letterSpacing: '-0.02em',
            }}>
              {booking.stationName || `Station ${booking.stationId?.substring(0, 8).toUpperCase()}`}
            </p>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              color: '#94a3b8', margin: '3px 0 0',
            }}>
              {dateStr}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22,
            color: '#0f172a', margin: 0, lineHeight: 1,
          }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>₹</span>
            {booking.amount}
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: '#f1f5f9', margin: '0 0 16px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            TXN ID
          </span>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b', margin: '3px 0 0', letterSpacing: '0.04em' }}>
            {booking.id.substring(0, 16)}
          </p>
        </div>
        <span
          className="status-pill"
          style={st}
        >
          {booking.status || booking.bookingStatus}
        </span>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────
   EMPTY STATE (Unchanged)
   ───────────────────────────────────────────────────────── */
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 300, textAlign: 'center', gap: 16,
    }}
  >
    <div style={{
      width: 80, height: 80, borderRadius: 20, border: '2px dashed #cbd5e1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Activity size={32} color="#cbd5e1" />
    </div>
    <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
      No Bookings Found
    </p>
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#94a3b8', margin: 0 }}>
      Head to the Live Map to book an EV charging slot
    </p>
    <motion.button
      whileHover={{ y: -3, boxShadow: '6px 6px 0 #16a34a' }}
      whileTap={{ scale: 0.97 }}
      style={{
        marginTop: 8, padding: '14px 28px', borderRadius: 14,
        background: '#0f172a', color: '#fff', border: '2px solid #0f172a',
        fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14,
        boxShadow: '4px 4px 0 #16a34a', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      Find Charging Hubs <ArrowRight size={16} />
    </motion.button>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────
   DASHBOARD (Updated Logic)
   ───────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Real-time listener replaces getDocs
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const raw = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort locally to avoid Firebase index requirement for real-time listeners
      raw.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setBookings(raw);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const totalSpent = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingTop: 96, paddingBottom: 80, position: 'relative', overflow: 'hidden' }}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="grid-lines" style={{ position: 'absolute', inset: 0 }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 48 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '7px 16px', borderRadius: 99,
            background: '#f8fafc', border: '2px solid #0f172a', marginBottom: 20,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#16a34a',
              animation: 'pulse-dot 2s infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 800, color: '#0f172a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              TELEMETRY LIVE
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 6vw, 5rem)',
            fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em',
            lineHeight: 0.95, margin: 0,
          }}>
            My Bookings<br />
            <span style={{ color: '#16a34a' }}>Dashboard</span>
          </h1>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 20, marginBottom: 48,
        }}>
          <StatCard icon={<Activity />} label="Total Trips" value={bookings.length} delay={0.1} />
          <StatCard icon={<Zap />}      label="Credits Spent" value={`₹${totalSpent}`} accent delay={0.18} />
          <StatCard icon={<Radio />}    label="Active Now"   value={bookings.filter(b => (b.status || b.bookingStatus)?.toLowerCase() === 'active').length} delay={0.26} />
          <StatCard icon={<Cpu />}      label="Completed"      value={bookings.filter(b => (b.status || b.bookingStatus)?.toLowerCase() === 'completed').length} delay={0.34} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hard-card"
          style={{ padding: '36px 36px 40px' }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #f1f5f9',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              color: '#0f172a', margin: 0, letterSpacing: '-0.03em',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 10, background: '#0f172a',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Calendar size={16} color="#16a34a" />
              </span>
              Recent Activity
            </h2>
            <div style={{
              padding: '6px 16px', borderRadius: 99, border: '2px solid #0f172a',
              background: '#f8fafc',
            }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: '#0f172a', letterSpacing: '0.08em' }}>
                {bookings.length} RECORDS
              </span>
            </div>
          </div>

          {bookings.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}>
              {bookings.map((booking, idx) => (
                <BookingCard key={booking.id} booking={booking} idx={idx} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;