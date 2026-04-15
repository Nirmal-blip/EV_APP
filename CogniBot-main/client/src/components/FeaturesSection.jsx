import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Zap, CreditCard, Clock, BatteryCharging, Radio, BatteryMedium, Key, Activity, ShieldCheck, ChevronRight, Cpu } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   MICRO-COMPONENTS (Bespoke Hardware Aesthetic)
   ───────────────────────────────────────────────────────── */
const MicroTag = ({ text, top, right, bottom, left, color = '#94a3b8' }) => (
  <div style={{ position: 'absolute', top, right, bottom, left, fontFamily: 'monospace', fontSize: 9, fontWeight: 800, color, letterSpacing: '0.1em', padding: '4px 8px', borderRadius: 4, zIndex: 20 }}>
    [{text}]
  </div>
);

const GrainOverlay = () => (
  <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none', mixBlendMode: 'multiply', backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
);

/* ─────────────────────────────────────────────────────────
   MAIN FEATURES SECTION
   ───────────────────────────────────────────────────────── */
const FeaturesSection = () => {
  const [activeCard, setActiveCard] = useState(null);

  const cardVariants = {
    hover: { y: -8, scale: 1.01, boxShadow: '24px 24px 0 rgba(15,23,42,0.1)' }
  };

  return (
    <section id="features" style={{ padding: '140px 0', background: '#fff', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <GrainOverlay />
      
      {/* Background Frame */}
      <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
      <div style={{ position: 'absolute', top: '15%', left: 0, right: 0, height: 1, background: '#e2e8f0' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 80px' }}>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 99, background: '#f8fafc', border: '2px solid #0f172a', color: '#0f172a', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24, boxShadow: '4px 4px 0 #16a34a' }}>
            <Cpu size={14} color="#16a34a" /> Hardware & Platform
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
            Architectural Core.<br/>
            <span style={{ color: '#64748b' }}>Technical Precision.</span>
          </motion.h2>
        </div>

        {/* Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 32 }}>

          {/* LARGE CARD: Universal Plug & Charge */}
          <motion.div 
            onHoverStart={() => setActiveCard('universal')} onHoverEnd={() => setActiveCard(null)}
            variants={cardVariants} whileHover="hover"
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ gridColumn: '1 / -1', background: '#fff', borderRadius: 32, border: '3px solid #0f172a', padding: '56px 64px', position: 'relative', overflow: 'hidden', boxShadow: '16px 16px 0 #0f172a', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, alignItems: 'center' }}
          >
            <MicroTag text="HW_CORE_v2.1" top={24} right={24} />
            <MicroTag text="AUTH_TLS_1.3" bottom={24} left={64} />
            
            <div>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
                <BatteryCharging size={32} color="#16a34a" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 20px 0', lineHeight: 1.1 }}>Universal Plug & Charge</h3>
              <p style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500, lineHeight: 1.6, margin: '0 0 40px' }}>
                Automated vehicle-to-grid handshakes. Secure, instant authentication across all major connector standards.
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {['AUTOAUTH', 'ISO_15118', 'PLUG_ONLY'].map((tag, i) => (
                  <div key={i} style={{ padding: '8px 14px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{tag}</div>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative', width: '100%', height: 400, background: '#f8fafc', borderRadius: 24, border: '2px solid #0f172a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
               <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', width: 500, height: 500, border: '1px dashed #cbd5e1', borderRadius: '50%' }} />
               
               {/* Technical Blueprint SVG */}
               <svg width="240" height="240" viewBox="0 0 200 200" style={{ position: 'relative', zIndex: 10 }}>
                 <rect x="70" y="80" width="60" height="100" rx="8" stroke="#0f172a" strokeWidth="4" fill="#fff" />
                 <path d="M50,40 h100 v30 a20,20 0 0,1 -20,20 h-60 a20,20 0 0,1 -20,-20 v-30 z" stroke="#0f172a" strokeWidth="4" fill="#fff" />
                 <circle cx="80" cy="55" r="10" fill="#16a34a" />
                 <circle cx="120" cy="55" r="10" fill="#16a34a" />
                 <motion.path animate={{ pathLength: [0, 1] }} d="M 100,180 L 100,240" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" />
               </svg>

               <div style={{ position: 'absolute', bottom: 24, right: 24, background: '#16a34a', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 900, fontFamily: 'monospace' }}>350kW_PEAK</div>
            </div>
          </motion.div>

          {/* MEDIUM CARD: Real-time Telemetry */}
          <motion.div 
            variants={cardVariants} whileHover="hover"
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{ gridColumn: 'span 7', background: '#0f172a', borderRadius: 32, padding: 48, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '16px 16px 0 rgba(15,23,42,0.1)' }}
          >
            <MicroTag text="DATA_LINK_v3" top={24} right={24} color="rgba(255,255,255,0.4)" />
            <div className="animate-scan" style={{ position: 'absolute', left: 0, right: 0, height: 120, background: 'linear-gradient(transparent, rgba(22,163,74,0.08), transparent)', pointerEvents: 'none' }} />
            
            <div style={{ width: 56, height: 56, borderRadius: 16, border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
              <Radio size={28} color="#16a34a" />
            </div>
            
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 16px 0', lineHeight: 1.1 }}>Live Ingestion</h3>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500, lineHeight: 1.6, maxWidth: 380, margin: '0 0 40px 0' }}>
              We track charger health from 150+ networks in 5-second intervals. Guaranteed 99.9% terminal uptime.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, background: '#16a34a', borderRadius: '50%', boxShadow: '0 0 10px #16a34a' }} />
                    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}>STREAM_ACTIVE</span>
                 </div>
                 <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b' }}>426ms_LATENCY</span>
               </div>
               <div style={{ height: 60, display: 'flex', alignItems: 'end', gap: 4 }}>
                 {[30, 60, 40, 90, 50, 70, 40, 80, 100, 60, 40, 85].map((h, i) => (
                   <motion.div key={i} animate={{ height: [`${h}%`, `${Math.max(20, Math.random()*100)}%`, `${h}%`] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }} style={{ flex: 1, background: '#16a34a', borderRadius: 2 }} />
                 ))}
               </div>
            </div>
          </motion.div>

          {/* MEDIUM CARD: Dynamic Pricing */}
          <motion.div 
            variants={cardVariants} whileHover="hover"
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            style={{ gridColumn: 'span 5', background: '#16a34a', borderRadius: 32, border: '3px solid #0f172a', padding: 48, position: 'relative', overflow: 'hidden', boxShadow: '16px 16px 0 #0f172a' }}
          >
            <MicroTag text="LEDGER_STRICT" top={24} right={24} color="#0f172a" />
            
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fff', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
              <CreditCard size={28} color="#0f172a" />
            </div>
            
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', lineHeight: 1.1 }}>Transparent</h3>
            <p style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700, lineHeight: 1.5, opacity: 0.8, margin: '0 0 40px 0' }}>
              Real-time rate forecasting. See exactly what you pay before the cable is plugged.
            </p>

            <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: 20, padding: 24, boxShadow: '6px 6px 0 rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                 <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>EST. RATE</span>
                 <span style={{ fontSize: 11, fontWeight: 900, color: '#16a34a' }}>+0.2% AVG</span>
               </div>
               <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: '#0f172a', margin: 0 }}>$0.34<span style={{ fontSize: 14, color: '#94a3b8' }}>/kWh</span></p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
