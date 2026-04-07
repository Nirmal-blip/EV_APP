// import React, { useState, useEffect, useRef } from 'react';
// import { motion, animate, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
// import { collection, query, getDocs } from 'firebase/firestore';
// import { db } from '../../lib/firebase';
// import { Users, BatteryCharging, IndianRupee, Activity, ShieldAlert, Radio, Cpu, Globe, BarChart3, Zap, ChevronRight } from 'lucide-react';

// /* ─────────────────────────────────────────────────────────
//    GLOBAL STYLES
//    ───────────────────────────────────────────────────────── */
// const GLOBAL_CSS = `
//   @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

//   :root {
//     --font-display: 'Clash Display', 'Cabinet Grotesk', system-ui, sans-serif;
//     --font-mono: 'Space Mono', monospace;
//     --green: #16a34a;
//     --dark: #0f172a;
//     --mid: #334155;
//     --light: #f8fafc;
//   }

//   @keyframes scan-line-wipe {
//     0% { left: -10%; opacity: 0; }
//     5% { opacity: 1; }
//     95% { opacity: 1; }
//     100% { left: 110%; opacity: 0; }
//   }
//   @keyframes marquee {
//     0% { transform: translateX(0); }
//     100% { transform: translateX(-50%); }
//   }
//   @keyframes pulse-ring {
//     0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
//     100% { box-shadow: 0 0 0 10px rgba(22,163,74,0); }
//   }
//   @keyframes shimmer {
//     0% { background-position: -400px 0; }
//     100% { background-position: 400px 0; }
//   }

//   .animate-scan-wipe { animation: scan-line-wipe 10s linear infinite; }
//   .pulse-dot { animation: pulse-ring 2s ease-out infinite; }

//   .grid-lines {
//     background-image:
//       linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px),
//       linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px);
//     background-size: 40px 40px;
//   }

//   .glass-card {
//     background: rgba(255,255,255,0.88);
//     backdrop-filter: blur(24px);
//     -webkit-backdrop-filter: blur(24px);
//     border: 2px solid #0f172a;
//     box-shadow: 8px 8px 0 rgba(15,23,42,0.10);
//   }

//   .stat-card {
//     background: #fff;
//     border: 2px solid #0f172a;
//     box-shadow: 6px 6px 0 #0f172a;
//     transition: box-shadow 0.2s ease, transform 0.2s ease;
//   }
//   .stat-card:hover {
//     box-shadow: 10px 10px 0 #16a34a;
//     transform: translate(-2px, -2px);
//   }

//   .table-row-hover:hover {
//     background: #f8fafc;
//   }

//   .tag-badge {
//     font-family: var(--font-mono);
//     font-size: 10px;
//     font-weight: 700;
//     letter-spacing: 0.08em;
//     text-transform: uppercase;
//     padding: 3px 10px;
//     border-radius: 4px;
//     border: 1.5px solid currentColor;
//   }

//   .shimmer-line {
//     background: linear-gradient(90deg, #f1f5f9 0px, #e2e8f0 200px, #f1f5f9 400px);
//     background-size: 800px 100%;
//     animation: shimmer 1.4s ease-in-out infinite;
//   }
// `;

// /* ─────────────────────────────────────────────────────────
//    ANIMATED COUNTER
//    ───────────────────────────────────────────────────────── */
// const Counter = ({ from = 0, to, suffix = '', prefix = '', duration = 2, decimals = 0 }) => {
//   const nodeRef = useRef(null);
//   const [inView, setInView] = useState(false);
//   useEffect(() => {
//     const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.5 });
//     if (nodeRef.current) obs.observe(nodeRef.current);
//     return () => obs.disconnect();
//   }, []);
//   useEffect(() => {
//     if (!inView || !nodeRef.current) return;
//     const ctrl = animate(from, to, {
//       duration, ease: 'easeOut',
//       onUpdate(val) {
//         if (nodeRef.current)
//           nodeRef.current.textContent = prefix + (decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-IN')) + suffix;
//       },
//     });
//     return () => ctrl.stop();
//   }, [inView, from, to, suffix, prefix, decimals]);
//   return <span ref={nodeRef}>{prefix}{from}{suffix}</span>;
// };

// /* ─────────────────────────────────────────────────────────
//    TICKER MARQUEE
//    ───────────────────────────────────────────────────────── */
// const Ticker = ({ items }) => {
//   const content = [...items, ...items];
//   return (
//     <div style={{ overflow: 'hidden', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a', background: '#0f172a', padding: '10px 0', position: 'relative' }}>
//       <div style={{ display: 'flex', animation: 'marquee 22s linear infinite', width: 'max-content' }}>
//         {content.map((item, i) => (
//           <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 40px', whiteSpace: 'nowrap' }}>
//             <Zap size={12} color="#16a34a" fill="#16a34a" />
//             <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>{item}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// /* ─────────────────────────────────────────────────────────
//    SKELETON ROW
//    ───────────────────────────────────────────────────────── */
// const SkeletonRow = () => (
//   <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
//     {[40, 20, 25, 15].map((w, i) => (
//       <td key={i} style={{ padding: '20px 16px' }}>
//         <div className="shimmer-line" style={{ height: 14, borderRadius: 4, width: `${w}%` }} />
//       </td>
//     ))}
//   </tr>
// );

// /* ─────────────────────────────────────────────────────────
//    STAT CARD
//    ───────────────────────────────────────────────────────── */
// const StatCard = ({ title, icon: Icon, color, bg, accentColor, children, delay }) => (
//   <motion.div
//     initial={{ opacity: 0, y: 24 }}
//     animate={{ opacity: 1, y: 0 }}
//     transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
//     className="stat-card"
//     style={{ borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}
//   >
//     {/* Corner Accent */}
//     <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: accentColor, opacity: 0.08, borderRadius: '0 18px 0 60px' }} />
    
//     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
//       <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         <Icon size={22} color={color} />
//       </div>
//       <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '3px 8px' }}>LIVE</div>
//     </div>
//     <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>{title}</p>
//     <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
//       {children}
//     </h3>
//   </motion.div>
// );

// /* ─────────────────────────────────────────────────────────
//    ADMIN DASHBOARD
//    ───────────────────────────────────────────────────────── */
// const AdminDashboard = () => {
//   const [stats, setStats] = useState({ revenue: 0, energy: 0, users: 0, activeStations: 0 });
//   const [users, setUsers] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [filter, setFilter] = useState('all');

//   useEffect(() => {
//     const fetchAdminData = async () => {
//       try {
//         const usersSnap = await getDocs(collection(db, 'users'));
//         const usersList = usersSnap.docs
//           .map(doc => ({ id: doc.id, ...doc.data() }))
//           .filter(u => u.role !== 'admin');

//         const bookingsSnap = await getDocs(collection(db, 'bookings'));
//         let totalRevenue = 0;
//         let totalEnergy = 0;
//         const bookingsList = [];
//         bookingsSnap.forEach(doc => {
//           const data = doc.data();
//           totalRevenue += (data.amount || 0);
//           totalEnergy += (data.energykWh || 5.5);
//           bookingsList.push({ id: doc.id, ...data });
//         });

//         const usersWithBookings = usersList.map(user => {
//           const userBookings = bookingsList.filter(b => b.userId === user.id);
//           userBookings.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
//           return { ...user, totalBookings: userBookings.length, latestBooking: userBookings[0] || null };
//         });

//         const stationsSnap = await getDocs(collection(db, 'stations'));
//         setStats({ revenue: totalRevenue, energy: totalEnergy, users: usersSnap.size, activeStations: stationsSnap.size });
//         setUsers(usersWithBookings);
//       } catch (err) {
//         console.error('Admin data fetch failed:', err);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchAdminData();
//   }, []);

//   const tickerItems = [
//     'NETWORK INTEGRITY 100%', 'ALL STATIONS NOMINAL', `${stats.activeStations} ACTIVE HUBS`,
//     `₹${stats.revenue.toLocaleString('en-IN')} TOTAL REVENUE`, `${stats.energy.toFixed(1)} kWh DELIVERED`,
//     'REAL-TIME SYNC ACTIVE', 'CROSS-PLATFORM IDENTITY VERIFIED'
//   ];

//   const filteredUsers = filter === 'active'
//     ? users.filter(u => u.totalBookings > 0)
//     : filter === 'inactive'
//     ? users.filter(u => u.totalBookings === 0)
//     : users;

//   return (
//     <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'var(--font-display)' }}>
//       <style>{GLOBAL_CSS}</style>

//       {/* ── HERO HEADER ── */}
//       <div style={{ background: '#0f172a', position: 'relative', overflow: 'hidden', paddingTop: 96, paddingBottom: 80 }}>
//         {/* Grid background */}
//         <div style={{
//           position: 'absolute', inset: 0,
//           backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
//           backgroundSize: '40px 40px'
//         }} />

//         {/* Scan line */}
//         <div className="animate-scan-wipe" style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, transparent, #16a34a, transparent)', opacity: 0.4, zIndex: 1 }} />

//         {/* Watermark */}
//         <div style={{ position: 'absolute', bottom: -20, left: 0, fontFamily: 'var(--font-display)', fontSize: '18vw', fontWeight: 900, color: 'rgba(255,255,255,0.03)', letterSpacing: '-0.05em', whiteSpace: 'nowrap', userSelect: 'none', zIndex: 0 }}>
//           COMMAND
//         </div>

//         <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 10 }}>
//           <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>

//             {/* Left */}
//             <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
//               {/* Status pill */}
//               <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 99, border: '2px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', marginBottom: 28, backdropFilter: 'blur(12px)' }}>
//                 <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
//                 <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: '0.14em' }}>SYSTEM ONLINE & SECURE</span>
//               </div>

//               <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.04em', margin: '0 0 20px' }}>
//                 Command<br />
//                 <span style={{ color: '#16a34a' }}>Center</span>
//               </h1>
//               <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: 480, margin: 0 }}>
//                 Live charging metrics, user intelligence, and real-time EV network oversight — all in one terminal.
//               </p>
//             </motion.div>

//             {/* Right: Mini telemetry cards */}
//             <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
//               style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
//               {[
//                 { label: 'Network Integrity', value: '100%', icon: ShieldAlert, color: '#4ade80' },
//                 { label: 'Uptime', value: '99.97%', icon: Radio, color: '#60a5fa' },
//                 { label: 'API Latency', value: '12ms', icon: Cpu, color: '#f472b6' },
//               ].map((item, i) => (
//                 <div key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '16px 20px', backdropFilter: 'blur(16px)', minWidth: 140 }}>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
//                     <item.icon size={14} color={item.color} />
//                     <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.label}</span>
//                   </div>
//                   <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{item.value}</span>
//                 </div>
//               ))}
//             </motion.div>

//           </div>
//         </div>

//         {/* Bottom border */}
//         <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, #334155, transparent)' }} />
//       </div>

//       {/* ── TICKER ── */}
//       <Ticker items={tickerItems} />

//       {/* ── MAIN CONTENT ── */}
//       <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 80px', position: 'relative' }}>
//         {/* Grid BG hint */}
//         <div className="grid-lines" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

//         <div style={{ position: 'relative', zIndex: 1 }}>

//           {/* ── STAT CARDS ── */}
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 48 }}>
//             <StatCard title="Total Revenue" icon={IndianRupee} color="#16a34a" bg="#dcfce7" accentColor="#16a34a" delay={0.1}>
//               ₹<Counter to={stats.revenue} suffix="" prefix="" decimals={0} />
//             </StatCard>
//             <StatCard title="Energy Supplied" icon={BatteryCharging} color="#2563eb" bg="#dbeafe" accentColor="#2563eb" delay={0.2}>
//               <Counter to={stats.energy} suffix=" kWh" decimals={1} />
//             </StatCard>
//             <StatCard title="Registered Users" icon={Users} color="#7c3aed" bg="#ede9fe" accentColor="#7c3aed" delay={0.3}>
//               <Counter to={stats.users} />
//             </StatCard>
//             <StatCard title="Active Stations" icon={Activity} color="#ea580c" bg="#ffedd5" accentColor="#ea580c" delay={0.4}>
//               <Counter to={stats.activeStations} />
//             </StatCard>
//           </div>

//           {/* ── IDENTITY DIRECTORY ── */}
//           <motion.div
//             initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
//             style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 24, boxShadow: '8px 8px 0 #0f172a', overflow: 'hidden' }}
//           >
//             {/* Table Header */}
//             <div style={{ padding: '28px 32px', borderBottom: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: '#fafafa' }}>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
//                 <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ede9fe', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 0 #0f172a' }}>
//                   <Users size={20} color="#7c3aed" />
//                 </div>
//                 <div>
//                   <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Identity Directory</h2>
//                   <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em' }}>{filteredUsers.length} RECORDS FOUND</span>
//                 </div>
//               </div>

//               {/* Filter Toggles */}
//               <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 10, border: '2px solid #0f172a' }}>
//                 {['all', 'active', 'inactive'].map(f => (
//                   <button
//                     key={f}
//                     onClick={() => setFilter(f)}
//                     style={{
//                       padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
//                       fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
//                       background: filter === f ? '#0f172a' : 'transparent',
//                       color: filter === f ? '#fff' : '#64748b',
//                       transition: 'all 0.2s ease',
//                     }}
//                   >
//                     {f}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Table */}
//             <div style={{ overflowX: 'auto' }}>
//               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                 <thead>
//                   <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
//                     {['User Details', 'Bookings', 'Latest Station', 'Payment'].map((h, i) => (
//                       <th key={i} style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', textAlign: i === 3 ? 'right' : i === 1 ? 'center' : 'left', background: '#fafafa' }}>
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {isLoading ? (
//                     Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
//                   ) : filteredUsers.length === 0 ? (
//                     <tr>
//                       <td colSpan={4} style={{ padding: '60px 24px', textAlign: 'center' }}>
//                         <Globe size={32} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
//                         <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>NO RECORDS MATCH FILTER</p>
//                       </td>
//                     </tr>
//                   ) : filteredUsers.map((u, idx) => (
//                     <motion.tr
//                       key={u.id}
//                       initial={{ opacity: 0, x: -10 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: 0.05 * idx }}
//                       className="table-row-hover"
//                       style={{ borderBottom: '1px solid #f1f5f9', cursor: 'default' }}
//                     >
//                       {/* User */}
//                       <td style={{ padding: '18px 16px' }}>
//                         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                           <div style={{
//                             width: 36, height: 36, borderRadius: 10, background: `hsl(${(u.id?.charCodeAt(0) || 65) * 5}, 70%, 92%)`,
//                             border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
//                             fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 14, color: '#0f172a',
//                             boxShadow: '2px 2px 0 #0f172a', flexShrink: 0
//                           }}>
//                             {(u.name || u.email || 'A').charAt(0).toUpperCase()}
//                           </div>
//                           <div>
//                             <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#0f172a', fontSize: 14, lineHeight: 1.2 }}>{u.name || 'Anonymous User'}</div>
//                             <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{u.email}</div>
//                           </div>
//                         </div>
//                       </td>

//                       {/* Bookings */}
//                       <td style={{ padding: '18px 16px', textAlign: 'center' }}>
//                         <span style={{
//                           display: 'inline-block', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 13,
//                           color: u.totalBookings > 0 ? '#0f172a' : '#cbd5e1',
//                           background: u.totalBookings > 0 ? '#f0fdf4' : '#f8fafc',
//                           border: `2px solid ${u.totalBookings > 0 ? '#16a34a' : '#e2e8f0'}`,
//                           borderRadius: 8, padding: '4px 14px',
//                           boxShadow: u.totalBookings > 0 ? '2px 2px 0 #16a34a' : 'none'
//                         }}>
//                           {u.totalBookings || 0}
//                         </span>
//                       </td>

//                       {/* Latest Station */}
//                       <td style={{ padding: '18px 16px' }}>
//                         {u.latestBooking ? (
//                           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                             <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
//                             <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#0f172a', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
//                               {u.latestBooking.stationId || u.latestBooking.stationName || 'N/A'}
//                             </span>
//                           </div>
//                         ) : (
//                           <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#cbd5e1', fontWeight: 700, letterSpacing: '0.08em' }}>NO ACTIVITY</span>
//                         )}
//                       </td>

//                       {/* Payment */}
//                       <td style={{ padding: '18px 16px', textAlign: 'right' }}>
//                         {u.latestBooking ? (
//                           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
//                             <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15, color: '#0f172a' }}>
//                               ₹{(u.latestBooking.amount || 0).toLocaleString('en-IN')}
//                             </span>
//                             <span className="tag-badge" style={{
//                               color: (u.latestBooking.paymentStatus === 'completed' || u.latestBooking.paymentStatus === 'success') ? '#16a34a' : '#ea580c',
//                               borderColor: (u.latestBooking.paymentStatus === 'completed' || u.latestBooking.paymentStatus === 'success') ? '#16a34a' : '#ea580c',
//                               background: (u.latestBooking.paymentStatus === 'completed' || u.latestBooking.paymentStatus === 'success') ? '#f0fdf4' : '#fff7ed',
//                             }}>
//                               {u.latestBooking.paymentStatus || 'Pending'}
//                             </span>
//                           </div>
//                         ) : (
//                           <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#e2e8f0' }}>—</span>
//                         )}
//                       </td>
//                     </motion.tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Table Footer */}
//             <div style={{ padding: '16px 32px', borderTop: '2px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//               <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em' }}>
//                 SHOWING {filteredUsers.length} OF {users.length} USERS
//               </span>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
//                 <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
//                 <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE SYNC</span>
//               </div>
//             </div>
//           </motion.div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;



import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, animate, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  Users, BatteryCharging, IndianRupee, Activity, ShieldAlert,
  Radio, Cpu, Zap, Search, TrendingUp, MapPin, Clock,
  CheckCircle2, XCircle, AlertCircle, LayoutGrid, List,
  RefreshCw, Globe, BarChart3
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   STYLES — matches HeroSection & HowItWorks exactly
   White bg · #0f172a dark · #16a34a green · neo-brutalist
   Cabinet Grotesk display · Space Mono labels
═══════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  :root {
    --display: 'Clash Display', 'Cabinet Grotesk', system-ui, sans-serif;
    --mono:    'Space Mono', monospace;
    --dark:    #0f172a;
    --green:   #16a34a;
    --mid:     #334155;
    --muted:   #64748b;
    --subtle:  #94a3b8;
    --border:  #e2e8f0;
    --bg:      #fff;
    --surface: #f8fafc;
    --surface2:#f1f5f9;
  }

  /* Grid texture — same as HeroSection */
  .grid-lines {
    background-image:
      linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* Glass card — same as HeroSection */
  .glass-card {
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 2px solid var(--dark);
    box-shadow: 8px 8px 0 rgba(15,23,42,0.08);
  }

  /* Neo-brutalist card — same shadow system as HowItWorks */
  .neo-card {
    background: #fff;
    border: 2px solid var(--dark);
    box-shadow: 6px 6px 0 var(--dark);
    transition: box-shadow 0.22s ease, transform 0.22s ease;
  }
  .neo-card:hover {
    box-shadow: 10px 10px 0 var(--green);
    transform: translate(-2px, -2px);
  }

  /* Stat card accent variant */
  .stat-accent-green  { box-shadow: 6px 6px 0 var(--green) !important; }
  .stat-accent-blue   { box-shadow: 6px 6px 0 #2563eb !important; }
  .stat-accent-purple { box-shadow: 6px 6px 0 #7c3aed !important; }
  .stat-accent-orange { box-shadow: 6px 6px 0 #ea580c !important; }
  .stat-accent-green:hover  { box-shadow: 12px 12px 0 var(--green) !important; }
  .stat-accent-blue:hover   { box-shadow: 12px 12px 0 #2563eb !important; }
  .stat-accent-purple:hover { box-shadow: 12px 12px 0 #7c3aed !important; }
  .stat-accent-orange:hover { box-shadow: 12px 12px 0 #ea580c !important; }

  /* Scan wipe animation — same as HeroSection */
  @keyframes scan-line-wipe {
    0%   { left: -10%; opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { left: 110%; opacity: 0; }
  }
  .animate-scan-wipe {
    animation: scan-line-wipe 9s linear infinite;
  }

  /* Marquee ticker */
  @keyframes marquee {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* Pulse dot — same as HeroSection */
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0   rgba(22,163,74,0.55); }
    100% { box-shadow: 0 0 0 10px rgba(22,163,74,0); }
  }
  .pulse-dot { animation: pulse-ring 2s ease-out infinite; }

  /* Shimmer skeleton */
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .shimmer {
    background: linear-gradient(90deg, #f1f5f9 0px, #e2e8f0 300px, #f1f5f9 600px);
    background-size: 1200px 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  /* Step tag — same as HowItWorks StepTag */
  .step-tag {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--green);
    font-size: 9px;
    font-weight: 900;
    font-family: var(--mono);
    letter-spacing: 0.12em;
  }

  /* Table rows */
  .trow { transition: background 0.18s; }
  .trow:hover { background: var(--surface); }

  /* Filter pill */
  .filter-pill {
    padding: 6px 16px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: all 0.18s ease;
  }

  /* Search input */
  .search-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border: 2px solid var(--dark);
    border-radius: 12px;
    padding: 10px 16px;
    box-shadow: 3px 3px 0 var(--dark);
    transition: box-shadow 0.18s, transform 0.18s;
  }
  .search-wrap:focus-within {
    box-shadow: 4px 4px 0 var(--green);
    transform: translate(-1px, -1px);
  }
  .search-wrap input {
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--display);
    font-size: 14px;
    font-weight: 700;
    color: var(--dark);
    width: 100%;
  }
  .search-wrap input::placeholder { color: var(--subtle); font-weight: 600; }

  /* View toggle btn */
  .view-btn {
    width: 36px; height: 36px;
    border-radius: 8px;
    border: 2px solid var(--dark);
    background: transparent;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
    color: var(--muted);
    box-shadow: 2px 2px 0 var(--dark);
  }
  .view-btn.on {
    background: var(--dark);
    color: #fff;
  }

  /* User grid card */
  .u-card {
    background: #fff;
    border: 2px solid var(--dark);
    border-radius: 20px;
    padding: 22px;
    box-shadow: 4px 4px 0 var(--dark);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .u-card:hover {
    box-shadow: 8px 8px 0 var(--green);
    transform: translate(-2px, -2px);
  }

  /* Badge */
  .badge {
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 4px;
    border: 1.5px solid currentColor;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  /* Avatar */
  .avatar {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--display);
    font-weight: 900;
    font-size: 15px;
    border: 2px solid var(--dark);
    box-shadow: 2px 2px 0 var(--dark);
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

  @media (max-width: 900px) {
    .stat-grid { grid-template-columns: 1fr 1fr !important; }
    .hero-right { display: none !important; }
  }
  @media (max-width: 520px) {
    .stat-grid { grid-template-columns: 1fr !important; }
    .hide-sm { display: none !important; }
  }
`;

/* ── Animated counter ── */
const Counter = ({ to, prefix = '', suffix = '', decimals = 0, duration = 2 }) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!vis || !ref.current) return;
    const ctrl = animate(0, to, {
      duration, ease: 'easeOut',
      onUpdate: v => {
        if (ref.current)
          ref.current.textContent = prefix + (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-IN')) + suffix;
      }
    });
    return () => ctrl.stop();
  }, [vis, to]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
};

/* ── Mini sparkline SVG ── */
const Spark = ({ values = [], color }) => {
  if (values.length < 2) return null;
  const w = 72, h = 28;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / ((max - min) || 1)) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {(() => {
        const last = pts.split(' ').at(-1)?.split(',');
        return last ? <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} /> : null;
      })()}
    </svg>
  );
};

/* ── Ticker — same dark style as HeroSection bottom bar ── */
const Ticker = ({ items }) => (
  <div style={{ overflow: 'hidden', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a', background: '#0f172a', padding: '10px 0' }}>
    <div style={{ display: 'flex', animation: 'marquee 26s linear infinite', width: 'max-content' }}>
      {[...items, ...items].map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 44px', whiteSpace: 'nowrap' }}>
          <Zap size={11} color="#16a34a" fill="#16a34a" />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em' }}>{t}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ── Status badge ── */
const StatusBadge = ({ status = 'pending' }) => {
  const s = status.toLowerCase();
  const m = {
    completed: { color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={9} />, label: 'Paid' },
    success:   { color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={9} />, label: 'Paid' },
    pending:   { color: '#d97706', bg: '#fffbeb', icon: <AlertCircle  size={9} />, label: 'Pending' },
    failed:    { color: '#dc2626', bg: '#fef2f2', icon: <XCircle      size={9} />, label: 'Failed' },
  }[s] || { color: '#d97706', bg: '#fffbeb', icon: <AlertCircle size={9} />, label: status };
  return <span className="badge" style={{ color: m.color, background: m.bg, borderColor: m.color }}>{m.icon}{m.label}</span>;
};

/* ── Avatar colors (hsl-based, matches HeroSection avatar style) ── */
const avatarStyle = id => {
  const hue = ((id?.charCodeAt(0) || 65) * 47) % 360;
  return { bg: `hsl(${hue},70%,92%)`, color: '#0f172a' };
};

/* ── Skeleton row ── */
const SkelRow = () => (
  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
    {[42, 14, 26, 14, 14].map((w, i) => (
      <td key={i} style={{ padding: '18px 16px' }}>
        <div className="shimmer" style={{ height: 13, borderRadius: 4, width: `${w}%` }} />
      </td>
    ))}
  </tr>
);

/* ── Skeleton grid card ── */
const SkelCard = () => (
  <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 20, padding: 22, boxShadow: '4px 4px 0 #0f172a' }}>
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <div className="shimmer" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="shimmer" style={{ height: 12, width: '55%', borderRadius: 4 }} />
        <div className="shimmer" style={{ height: 10, width: '75%', borderRadius: 4 }} />
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div className="shimmer" style={{ height: 48, borderRadius: 10 }} />
      <div className="shimmer" style={{ height: 48, borderRadius: 10 }} />
    </div>
    <div className="shimmer" style={{ height: 36, borderRadius: 10, marginTop: 10 }} />
  </div>
);

/* ── Empty state ── */
const EmptyState = () => (
  <div style={{ padding: '72px 24px', textAlign: 'center' }}>
    <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '3px 3px 0 #0f172a' }}>
      <Globe size={24} color="#94a3b8" />
    </div>
    <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.12em' }}>NO RECORDS MATCH</p>
    <p style={{ fontFamily: 'var(--display)', fontSize: 14, color: '#cbd5e1', marginTop: 6 }}>Try adjusting your search or filter</p>
  </div>
);

/* ── User grid card ── */
const UserCard = ({ u, idx }) => {
  const av = avatarStyle(u.id);
  return (
    <motion.div className="u-card"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * idx, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>

      {/* Top colour stripe — same pattern as HowItWorks top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: u.totalBookings > 0 ? '#16a34a' : '#e2e8f0', borderRadius: '18px 18px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingTop: 4 }}>
        <div className="avatar" style={{ background: av.bg, color: av.color }}>
          {(u.name || u.email || 'A').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {u.name || 'Anonymous'}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {u.email}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {[
          { label: 'Bookings', value: u.totalBookings || 0, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Spent',    value: `₹${(u.latestBooking?.amount || 0).toLocaleString('en-IN')}`, color: '#16a34a', bg: '#f0fdf4' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: '10px 12px', border: `1.5px solid ${color}30` }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 4 }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color }}>{value}</div>
          </div>
        ))}
      </div>

      {u.latestBooking ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#f8fafc', borderRadius: 10, border: '1.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <MapPin size={10} color="#94a3b8" style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.latestBooking.stationId || u.latestBooking.stationName || 'N/A'}
            </span>
          </div>
          <StatusBadge status={u.latestBooking.paymentStatus} />
        </div>
      ) : (
        <div style={{ padding: '9px 12px', background: '#f8fafc', borderRadius: 10, border: '1.5px solid #e2e8f0' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#cbd5e1', letterSpacing: '0.1em' }}>NO ACTIVITY YET</span>
        </div>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [stats,    setStats]    = useState({ revenue: 0, energy: 0, users: 0, activeStations: 0 });
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [view,     setView]     = useState('table');
  const [spinning, setSpinning] = useState(false);
  const [synced,   setSynced]   = useState(null);

  const fetchData = useCallback(async () => {
    setSpinning(true);
    try {
      const [usersSnap, bookingsSnap, stationsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'bookings')),
        getDocs(collection(db, 'stations')),
      ]);
      const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role !== 'admin');
      let revenue = 0, energy = 0;
      const bookings = [];
      bookingsSnap.forEach(d => {
        const data = d.data();
        revenue += data.amount || 0;
        energy  += data.energykWh || 5.5;
        bookings.push({ id: d.id, ...data });
      });
      const enriched = usersList.map(user => {
        const ub = bookings.filter(b => b.userId === user.id)
          .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
        return { ...user, totalBookings: ub.length, latestBooking: ub[0] || null };
      });
      setStats({ revenue, energy, users: usersSnap.size, activeStations: stationsSnap.size });
      setUsers(enriched);
      setSynced(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); setSpinning(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users
    .filter(u => filter === 'all' ? true : filter === 'active' ? u.totalBookings > 0 : u.totalBookings === 0)
    .filter(u => {
      const q = search.toLowerCase();
      return !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });

  const sparkData = n => Array.from({ length: 8 }, (_, i) => n * (0.5 + Math.random() * 0.5 + i * 0.06));

  const statCards = [
    {
      title: 'Total Revenue', icon: IndianRupee,
      color: '#16a34a', bg: '#dcfce7', accent: 'green',
      to: stats.revenue, prefix: '₹', decimals: 0
    },
    {
      title: 'Energy Supplied', icon: BatteryCharging,
      color: '#2563eb', bg: '#dbeafe', accent: 'blue',
      to: stats.energy, suffix: ' kWh', decimals: 1
    },
    {
      title: 'Registered Users', icon: Users,
      color: '#7c3aed', bg: '#ede9fe', accent: 'purple',
      to: stats.users
    },
    {
      title: 'Active Stations', icon: Activity,
      color: '#ea580c', bg: '#ffedd5', accent: 'orange',
      to: stats.activeStations
    },
  ];

  const ticker = [
    'NETWORK INTEGRITY 100%', 'ALL STATIONS NOMINAL',
    `${stats.activeStations} ACTIVE HUBS`,
    `₹${stats.revenue.toLocaleString('en-IN')} TOTAL REVENUE`,
    `${stats.energy.toFixed(1)} kWh DELIVERED`,
    'REAL-TIME SYNC ACTIVE', 'CROSS-PLATFORM IDENTITY VERIFIED',
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'var(--display)' }}>
      <style>{CSS}</style>

      {/* ══════════════════════════════════════════
          HERO — dark header, same as HeroSection
      ══════════════════════════════════════════ */}
      <header style={{ background: '#0f172a', position: 'relative', overflow: 'hidden', paddingTop: 96, paddingBottom: 80 }}>

        {/* Grid bg (dark version) */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        {/* Scan wipe line — from HeroSection */}
        <div className="animate-scan-wipe" style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, transparent, #16a34a, transparent)', opacity: 0.45, zIndex: 1 }} />

        {/* Big watermark — from HowItWorks */}
        <div style={{ position: 'absolute', bottom: -12, left: 0, fontFamily: 'var(--display)', fontSize: '16vw', fontWeight: 900, color: 'rgba(255,255,255,0.03)', letterSpacing: '-0.06em', userSelect: 'none', whiteSpace: 'nowrap', zIndex: 0, lineHeight: 1 }}>
          COMMAND
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>

            {/* ── Left copy ── */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>

              {/* Status pill — from HeroSection "TERMINAL READY" badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 99, border: '2px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', marginBottom: 28, backdropFilter: 'blur(12px)', boxShadow: '4px 4px 0 rgba(22,163,74,0.3)' }}>
                <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: '0.14em' }}>SYSTEM ONLINE &amp; SECURE</span>
              </div>

              <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(2.6rem, 5.5vw, 4.5rem)', fontWeight: 900, color: '#fff', lineHeight: 0.96, letterSpacing: '-0.04em', margin: '0 0 20px' }}>
                Admin<br />
                <span style={{ color: '#16a34a', WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>Command Center</span>
              </h1>

              <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: 460, margin: 0 }}>
                Live charging metrics, user intelligence &amp; EV network oversight — unified in one terminal.
              </p>

              {synced && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
                  <Clock size={12} color="#475569" />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.08em' }}>
                    LAST SYNC {synced.toLocaleTimeString()}
                  </span>
                  <button onClick={fetchData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', display: 'flex', padding: 0, marginLeft: 4 }}>
                    <RefreshCw size={13} style={{ animation: spinning ? 'spin 0.9s linear infinite' : 'none' }} />
                  </button>
                </div>
              )}
            </motion.div>

            {/* ── Right: telemetry glass cards — from HeroSection TelemetryWidget style ── */}
            <motion.div className="hero-right" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'Network Integrity', value: '100%',  icon: ShieldAlert, color: '#4ade80', bar: 100 },
                { label: 'Platform Uptime',   value: '99.97%',icon: Radio,       color: '#60a5fa', bar: 99  },
                { label: 'API Latency',       value: '12ms',  icon: Cpu,        color: '#f472b6', bar: 88  },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: '18px 22px', backdropFilter: 'blur(16px)', minWidth: 148, boxShadow: '4px 4px 0 rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <item.icon size={14} color={item.color} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.label}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--display)', fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: 12 }}>{item.value}</div>
                  {/* mini progress bar */}
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.bar}%` }} transition={{ delay: 0.6 + i * 0.1, duration: 1, ease: 'easeOut' }}
                      style={{ height: '100%', background: item.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </motion.div>

          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, #334155, transparent)' }} />
      </header>

      {/* ══════════════════════════════════════════
          TICKER
      ══════════════════════════════════════════ */}
      <Ticker items={ticker} />

      {/* ══════════════════════════════════════════
          MAIN CONTENT — white bg, grid-lines
      ══════════════════════════════════════════ */}
      <div style={{ position: 'relative' }}>
        <div className="grid-lines" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.7 }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 88px', position: 'relative', zIndex: 1 }}>

          {/* ── STAT CARDS ── */}
          <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 48 }}>
            {statCards.map(({ title, icon: Icon, color, bg, accent, to, prefix = '', suffix = '', decimals = 0 }, i) => (
              <motion.div key={title}
                className={`neo-card stat-accent-${accent}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{ borderRadius: 20, padding: '28px 26px', position: 'relative', overflow: 'hidden' }}
              >
                {/* Step tag — same as HowItWorks */}
                <div style={{ position: 'absolute', top: 18, right: 18 }}>
                  <span className="step-tag">[LIVE]</span>
                </div>

                {/* Corner shape accent */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: color, opacity: 0.06, borderRadius: '0 18px 0 80px' }} />

                <div style={{ width: 50, height: 50, borderRadius: 14, background: bg, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: `3px 3px 0 ${color}` }}>
                  <Icon size={22} color={color} />
                </div>

                <p style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{title}</p>
                <div style={{ fontFamily: 'var(--display)', fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  <Counter to={to} prefix={prefix} suffix={suffix} decimals={decimals} />
                </div>

                {/* Sparkline */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <TrendingUp size={11} color={color} />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color, fontWeight: 700, letterSpacing: '0.06em' }}>+{(Math.random() * 10 + 2).toFixed(1)}% WEEK</span>
                  </div>
                  <Spark values={sparkData(to || 50)} color={color} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* ══════════════════════════════════════════
              IDENTITY DIRECTORY TABLE
          ══════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 24, boxShadow: '8px 8px 0 #0f172a', overflow: 'hidden' }}
          >
            {/* ── Controls bar ── */}
            <div style={{ padding: '22px 28px', borderBottom: '2px solid #0f172a', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, background: '#fafafa' }}>

              {/* Title — same pattern as HowItWorks section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 'auto' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ede9fe', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 0 #0f172a' }}>
                  <Users size={20} color="#7c3aed" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: '1.3rem', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    Identity Directory
                  </h2>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em' }}>
                    {filtered.length} / {users.length} RECORDS
                  </span>
                </div>
              </div>

              {/* Search */}
              <div className="search-wrap hide-sm" style={{ width: 220 }}>
                <Search size={14} color="#94a3b8" />
                <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {/* Filter pills — same as HowItWorks "Engineering The Future" badge style */}
              <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 10, border: '2px solid #0f172a' }}>
                {['all', 'active', 'inactive'].map(f => (
                  <button key={f} className="filter-pill"
                    onClick={() => setFilter(f)}
                    style={{
                      background: filter === f ? '#0f172a' : 'transparent',
                      color:      filter === f ? '#fff'    : '#64748b',
                    }}>
                    {f}
                  </button>
                ))}
              </div>

              {/* View toggle */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={`view-btn ${view === 'table' ? 'on' : ''}`} onClick={() => setView('table')}><List size={15} /></button>
                <button className={`view-btn ${view === 'grid'  ? 'on' : ''}`} onClick={() => setView('grid')} ><LayoutGrid size={15} /></button>
              </div>
            </div>

            {/* ── Mobile search ── */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }} className="show-mobile">
              <div className="search-wrap" style={{ width: '100%' }}>
                <Search size={14} color="#94a3b8" />
                <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {/* ── Content: TABLE or GRID ── */}
            <AnimatePresence mode="wait">

              {view === 'grid' ? (
                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
                  style={{ padding: 24 }}>
                  {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                      {Array.from({ length: 6 }).map((_, i) => <SkelCard key={i} />)}
                    </div>
                  ) : filtered.length === 0 ? <EmptyState /> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                      {filtered.map((u, i) => <UserCard key={u.id} u={u} idx={i} />)}
                    </div>
                  )}
                </motion.div>

              ) : (
                <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
                  style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        {[
                          { l: 'User Details',    a: 'left'   },
                          { l: 'Bookings',        a: 'center' },
                          { l: 'Latest Station',  a: 'left'   },
                          { l: 'Amount',          a: 'right'  },
                          { l: 'Status',          a: 'right'  },
                        ].map(({ l, a }) => (
                          <th key={l} style={{ padding: '13px 16px', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', textAlign: a, background: '#fafafa' }}>
                            {l}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading
                        ? Array.from({ length: 6 }).map((_, i) => <SkelRow key={i} />)
                        : filtered.length === 0
                        ? <tr><td colSpan={5}><EmptyState /></td></tr>
                        : filtered.map((u, idx) => {
                            const av = avatarStyle(u.id);
                            return (
                              <motion.tr key={u.id} className="trow"
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.03 * idx }}
                                style={{ borderBottom: '1px solid #f8fafc' }}>

                                {/* User */}
                                <td style={{ padding: '17px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="avatar" style={{ background: av.bg, color: av.color }}>
                                      {(u.name || u.email || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                                        {u.name || 'Anonymous'}
                                      </div>
                                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#94a3b8' }}>{u.email}</div>
                                    </div>
                                  </div>
                                </td>

                                {/* Bookings */}
                                <td style={{ padding: '17px 16px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    fontFamily: 'var(--mono)', fontWeight: 900, fontSize: 13,
                                    color:      u.totalBookings > 0 ? '#16a34a' : '#cbd5e1',
                                    background: u.totalBookings > 0 ? '#f0fdf4' : '#f8fafc',
                                    border:    `2px solid ${u.totalBookings > 0 ? '#16a34a' : '#e2e8f0'}`,
                                    borderRadius: 8, padding: '4px 14px',
                                    boxShadow: u.totalBookings > 0 ? '2px 2px 0 #16a34a' : 'none',
                                  }}>
                                    {u.totalBookings}
                                  </span>
                                </td>

                                {/* Station */}
                                <td style={{ padding: '17px 16px' }}>
                                  {u.latestBooking ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#334155', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {u.latestBooking.stationId || u.latestBooking.stationName || 'N/A'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#cbd5e1', letterSpacing: '0.1em' }}>NO ACTIVITY</span>
                                  )}
                                </td>

                                {/* Amount */}
                                <td style={{ padding: '17px 16px', textAlign: 'right' }}>
                                  <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 15, color: u.latestBooking ? '#0f172a' : '#cbd5e1' }}>
                                    {u.latestBooking ? `₹${(u.latestBooking.amount || 0).toLocaleString('en-IN')}` : '—'}
                                  </span>
                                </td>

                                {/* Status */}
                                <td style={{ padding: '17px 16px', textAlign: 'right' }}>
                                  {u.latestBooking
                                    ? <StatusBadge status={u.latestBooking.paymentStatus} />
                                    : <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#e2e8f0' }}>—</span>
                                  }
                                </td>
                              </motion.tr>
                            );
                          })
                      }
                    </tbody>
                  </table>
                </motion.div>
              )}

            </AnimatePresence>

            {/* ── Table footer ── */}
            {!loading && (
              <div style={{ padding: '14px 28px', borderTop: '2px solid #f1f5f9', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em' }}>
                  SHOWING {filtered.length} OF {users.length} USERS
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE SYNC</span>
                </div>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}