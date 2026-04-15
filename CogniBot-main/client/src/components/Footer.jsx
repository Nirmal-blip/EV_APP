import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Globe, Cpu, Activity, Clock, Terminal, ShieldCheck, BarChart3, Radio } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   MICRO-COMPONENTS (System Dashboard Style)
   ───────────────────────────────────────────────────────── */
const SystemMetric = ({ label, value, color = '#16a34a' }) => (
  <div style={{ padding: '12px 24px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: 'monospace' }}>[{value}]</span>
  </div>
);

const DigitalClock = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderLeft: '1px solid #e2e8f0' }}>
       <Clock size={14} color="#16a34a" />
       <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{time}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN SYSTEM FOOTER
   ───────────────────────────────────────────────────────── */
const Footer = () => {
  const [latency, setLatency] = useState(24);
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(18, Math.min(32, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const navGroups = [
    { title: 'Infrastucture', links: ['Live Hubs', 'Latency Map', 'API Terminal', 'Network Logs'] },
    { title: 'Protocol', links: ['Smart Routing', 'Handshake ISO', 'Fleet Sync', 'Security'] },
    { title: 'Global', links: ['Careers', 'Contact Hub', 'Legal docs', 'System Status'] },
  ];

  return (
    <footer style={{ background: '#fff', fontFamily: 'var(--font-body)', position: 'relative', overflow: 'hidden', borderTop: '2px solid #0f172a' }}>
      
      {/* Architectural Frame Base */}
      <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '8%', width: 1, background: '#e2e8f0', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '92%', width: 1, background: '#e2e8f0', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        
        {/* TOP STATUS BAR (Network Dashboard) */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
           <SystemMetric label="Server Hub" value="US-EAST-GLOBAL" />
           <SystemMetric label="API Latency" value={`${latency}ms`} color={latency > 28 ? '#ef4444' : '#16a34a'} />
           <SystemMetric label="Uptime" value="99.998%" />
           <SystemMetric label="Current Version" value="v1.0.42_STABLE" />
           <div style={{ flex: 1 }} />
           <DigitalClock />
        </div>

        {/* MAIN NAV SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', minHeight: 400 }}>
          
          {/* Brand & Stats Block */}
          <div style={{ padding: '80px 60px 80px 0', borderRight: '1px solid #e2e8f0' }}>
             <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, textDecoration: 'none', marginBottom: 32 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#16a34a', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '4px 4px 0 #0f172a' }}>
                  <Zap size={24} color="#fff" fill="#fff" />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>ChargeMap</span>
             </a>
             <p style={{ fontSize: '1.05rem', color: '#64748b', fontWeight: 600, lineHeight: 1.6, maxWidth: 340, marginBottom: 40 }}>
                High-performance EV charging infrastructure terminal. Real-time telemetry, smart routing, and global connectivity.
             </p>
             
             {/* Security Badge Pill */}
             <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 12, border: '2px solid #0f172a', background: '#fff', boxShadow: '6px 6px 0 #0f172a' }}>
                <ShieldCheck size={18} color="#16a34a" />
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.05em' }}>ISO_15118_CERTIFIED</span>
             </div>
          </div>

          {/* Dynamic Link Groups */}
          {navGroups.map((group, i) => (
            <div key={i} style={{ padding: '80px 0 80px 48px', borderRight: i < navGroups.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
               <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 32 }}>
                  {group.title}
               </h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 {group.links.map((link, j) => (
                   <motion.a 
                    key={j} href="#" 
                    whileHover={{ x: 6, color: '#16a34a' }}
                    style={{ textDecoration: 'none', color: '#64748b', fontSize: 14, fontWeight: 700, transition: 'color 0.2s' }}
                   >
                     {link}
                   </motion.a>
                 ))}
               </div>
            </div>
          ))}
        </div>

        {/* BOTTOM TERMINAL FOOTNOTE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 0', borderTop: '1px solid #e2e8f0' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Terminal size={16} color="#16a34a" />
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', margin: 0 }}>
                 &copy; {new Date().getFullYear()} ChargeMap Terminal Inc. SYNCING_GLOBAL_ACTIVE
              </p>
           </div>

           {/* Architectural Social Boxes */}
           <div style={{ display: 'flex', gap: 8 }}>
              {['X_SYS', 'IG_HLD', 'LI_CORP', 'GH_DEV'].map((tag, i) => (
                <motion.a 
                  key={i} href="#" 
                  whileHover={{ y: -4, borderColor: '#16a34a', color: '#16a34a', boxShadow: '4px 4px 0 #16a34a' }}
                  style={{ padding: '8px 12px', border: '2px solid #e2e8f0', borderRadius: 8, background: '#fff', textDecoration: 'none', fontSize: 10, fontWeight: 900, color: '#94a3b8', fontFamily: 'monospace', transition: 'all 0.2s' }}
                >
                  {tag}
                </motion.a>
              ))}
           </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;