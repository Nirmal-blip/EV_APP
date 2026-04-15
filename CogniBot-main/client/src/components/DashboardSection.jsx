import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BatteryCharging, Zap, Map, TrendingUp, Radio, Terminal, Settings, Activity } from 'lucide-react';

const DashboardSection = () => {
  const [activeModule, setActiveModule] = useState('Overview');

  const navLinks = [
    { label: 'Overview', Icon: TrendingUp },
    { label: 'Map Layer', Icon: Map },
    { label: 'Live Data', Icon: Zap },
    { label: 'Stations', Icon: BatteryCharging },
  ];

  const renderContent = () => {
    switch (activeModule) {
      case 'Overview':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key="overview">
            {/* Top Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32, position: 'relative', zIndex: 10 }}>
              <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '2px solid #0f172a', boxShadow: '6px 6px 0 rgba(15,23,42,0.1)' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Available Bays</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>1,048</p>
              </div>
              <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '2px solid #0f172a', boxShadow: '6px 6px 0 rgba(15,23,42,0.1)' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Energy Delivered</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>4.2<span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>MW</span></p>
              </div>
              <div style={{ background: '#16a34a', padding: 24, borderRadius: 16, border: '2px solid #0f172a', boxShadow: '6px 6px 0 #0f172a', color: '#fff' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: '#dcfce7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Network Status</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>99.9%</p>
              </div>
            </div>

            {/* Chart Wireframe */}
            <div style={{ background: '#fff', borderRadius: 16, border: '2px solid #0f172a', height: 300, position: 'relative', zIndex: 10, padding: 24, boxShadow: '6px 6px 0 rgba(15,23,42,0.1)', overflow: 'hidden' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 24px 0' }}>KW Consumption</p>
              <div style={{ position: 'absolute', left: 24, bottom: 24, right: 24, height: 2, background: '#e2e8f0' }} />
              <div style={{ position: 'absolute', left: 24, top: 60, bottom: 24, width: 2, background: '#e2e8f0' }} />
              <svg style={{ position: 'absolute', left: 24, right: 24, bottom: 26, top: 60, width: 'calc(100% - 48px)', height: 'calc(100% - 86px)' }} preserveAspectRatio="none" viewBox="0 0 100 100">
                <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} d="M 0,90 L 10,70 L 25,75 L 40,40 L 55,60 L 70,20 L 85,30 L 100,10" fill="none" stroke="#0f172a" strokeWidth="3" />
                {[10, 25, 40, 55, 70, 85, 100].map((x, i) => (<line key={i} x1={x} y1="0" x2={x} y2="100" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2" />))}
                {[[10, 70], [25, 75], [40, 40], [55, 60], [70, 20], [85, 30], [100, 10]].map(([cx, cy], i) => (<circle key={i} cx={cx} cy={cy} r="2" fill="#16a34a" stroke="#0f172a" strokeWidth="1" />))}
              </svg>
            </div>
          </motion.div>
        );
      case 'Map Layer':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} key="map" style={{ height: '100%', position: 'relative' }}>
            <div style={{ background: '#fff', borderRadius: 24, border: '4px solid #0f172a', height: '100%', position: 'relative', overflow: 'hidden', boxShadow: '8px 8px 0 rgba(15,23,42,0.05)' }}>
              {/* stylized map dots/grid */}
              <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />

              {/* Station Markers */}
              {[
                { t: '20%', l: '30%', s: 'active' },
                { t: '60%', l: '50%', s: 'active' },
                { t: '40%', l: '80%', s: 'occupy' },
                { t: '75%', l: '20%', s: 'active' }
              ].map((m, i) => (
                <motion.div key={i} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} style={{ position: 'absolute', top: m.t, left: m.l, width: 24, height: 24, borderRadius: '50%', background: m.s === 'active' ? '#16a34a' : '#fff', border: '4px solid #0f172a', zIndex: 10 }} />
              ))}

              {/* Tracking Lines */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <path d="M 120 120 L 300 250 L 500 300" fill="none" stroke="#0f172a" strokeWidth="1" strokeDasharray="10 10" />
              </svg>

              {/* Floating UI overlay */}
              <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}>
                <div style={{ background: '#0f172a', color: '#fff', padding: '10px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                  <Activity size={16} color="#4ade80" /> SCANNING REGION: NORTHEAST_V4
                </div>
              </div>

              <div style={{ position: 'absolute', bottom: 24, right: 24, background: '#fff', border: '2px solid #0f172a', padding: 16, borderRadius: 12, boxShadow: '4px 4px 0 #0f172a' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>Map Legend</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', border: '1px solid #0f172a' }} /> Available
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', border: '1px solid #0f172a' }} /> Occupied
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'Live Data':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="live" style={{ height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: '100%' }}>
              {/* Column 1: Telemetry */}
              <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 24, padding: 32, boxShadow: '8px 8px 0 rgba(15,23,42,0.05)', position: 'relative' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: '0 0 24px 0' }}>Data Streams</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {[
                    { label: 'Network Latency', val: '42ms', color: '#16a34a' },
                    { label: 'Packet Throughput', val: '8.4 GB/s', color: '#0f172a' },
                    { label: 'Sync Status', val: 'ESTABLISHED', color: '#16a34a' },
                    { label: 'Auth Handshakes', val: '1,204', color: '#0f172a' }
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{s.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.val}</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.random() * 40 + 60}%` }} style={{ height: '100%', background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Terminal Output */}
              <div style={{ background: '#0f172a', color: '#fff', borderRadius: 24, padding: 32, fontFamily: 'var(--font-display)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: '#16a34a' }}>
                  <Terminal size={18} />
                  <span style={{ fontSize: 12, fontWeight: 800 }}>LIVE LOGS</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: '#94a3b8' }}>
                  <p>&gt; Initiating secure handshake...</p>
                  <p style={{ color: '#16a34a' }}>&gt; AUTH SUCCESSFUL [ID_38592]</p>
                  <p>&gt; Polling local hubs [Zip: 90210]</p>
                  <p>&gt; Recieved telemetry: Station 04</p>
                  <p>&gt; Load balancing active...</p>
                  <p style={{ color: '#fff' }}>[SYSTEM] Refresh triggered (200ms)</p>
                  <motion.div animate={{ opacity: [0, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }} style={{ display: 'inline-block', width: 8, height: 16, background: '#16a34a', verticalAlign: 'middle', marginLeft: 4 }} />
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'Stations':
        return (
          <motion.div initial={{ opacity: 0, filter: 'blur(10px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} key="stations" style={{ height: '100%' }}>
            <div style={{ background: '#fff', border: '4px solid #0f172a', borderRadius: 24, height: '100%', overflow: 'hidden', boxShadow: '12px 12px 0 rgba(15,23,42,0.05)' }}>
              {/* Header list header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '20px 32px', borderBottom: '2px solid #0f172a', background: '#f8fafc', color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <span>Hub Location</span>
                <span>Status</span>
                <span>Power Output</span>
                <span>Load</span>
              </div>
              {/* List items */}
              {[
                { l: 'NYC 5th Ave Hub', s: 'Available', p: '350kW', ld: '12%', active: true },
                { l: 'NJ Turnpike Plaza', s: 'Charging', p: '150kW', ld: '84%', active: false },
                { l: 'Boston Seaport', s: 'Available', p: '350kW', ld: '04%', active: true },
                { l: 'Philly Center', s: 'Maintenance', p: '25kW', ld: '--', active: false },
                { l: 'D.C. Capitol Hill', s: 'Available', p: '150kW', ld: '40%', active: false }
              ].map((st, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '24px 32px', borderBottom: i === 4 ? 'none' : '1px solid #e2e8f0', fontSize: 15, fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-display)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.s === 'Available' ? '#16a34a' : (st.s === 'Charging' ? '#334155' : '#cbd5e1') }} />
                    {st.l}
                  </div>
                  <span style={{ color: st.s === 'Available' ? '#16a34a' : '#0f172a' }}>{st.s}</span>
                  <span>{st.p}</span>
                  <span>{st.ld}</span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <section style={{ padding: '120px 0', background: '#fff', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>

      {/* Background Frame */}
      <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.8, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '20%', left: 0, right: 0, height: 1, background: '#e2e8f0', pointerEvents: 'none' }} />

      {/* Huge Background Text */}
      <div style={{ position: 'absolute', bottom: '-5%', left: '0', pointerEvents: 'none', fontFamily: 'var(--font-display)', fontSize: '18vw', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.05em', whiteSpace: 'nowrap', userSelect: 'none' }}>
        ANALYTICS
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 80px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 99, background: '#f8fafc', border: '1px solid #16a34a', color: '#16a34a', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>
            Omnipotent Analytics
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Fleet-level visibility.<br />
            Zero blind spots.
          </motion.h2>
        </div>

        {/* Dashboard Mockup - Strict Architectural Borders */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            maxWidth: 1140, margin: '0 auto',
            background: '#fff',
            borderRadius: 24, border: '4px solid #0f172a',
            boxShadow: '24px 24px 0 rgba(15,23,42,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Header Bar */}
          <div style={{ height: 56, background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['#0f172a', '#0f172a', '#0f172a'].map((c, i) => (<div key={i} style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #0f172a' }} />))}
            </div>
            <div style={{ border: '2px solid #0f172a', height: 32, padding: '0 16px', borderRadius: 8, display: 'flex', alignItems: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#0f172a', letterSpacing: '0.05em' }}>
              DASHBOARD v1.0.4
            </div>
            <div style={{ width: 36, height: 36, border: '2px solid #0f172a', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
              <Zap size={16} color="#fff" style={{ margin: 'auto' }} />
            </div>
          </div>

          <div style={{ display: 'flex', height: 620 }}>

            {/* Sidebar */}
            <div style={{ width: 240, background: '#fff', borderRight: '2px solid #0f172a', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Modules</p>
              {navLinks.map(({ label, Icon }) => {
                const isActive = activeModule === label;
                return (
                  <div
                    key={label}
                    onClick={() => setActiveModule(label)}
                    style={{
                      padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
                      background: isActive ? '#0f172a' : 'transparent', color: isActive ? '#fff' : '#0f172a',
                      fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    className="sidebar-item"
                  >
                    <Icon size={18} /> {label}
                  </div>
                );
              })}
            </div>

            {/* Main Area */}
            <div style={{ flex: 1, padding: 32, background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
              <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />

              <AnimatePresence mode="wait">
                {renderContent()}
              </AnimatePresence>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardSection;