import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Navigation, MapPin, Zap, Activity, ShieldCheck, Timer, Leaf, Radio } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   LIQUID FILL ANIMATION
   ───────────────────────────────────────────────────────── */
const LiquidBattery = ({ level = 82 }) => (
  <div style={{ position: 'relative', width: 220, height: 220, borderRadius: '50%', border: '4px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fff' }}>
    {/* Floating Rings */}
    <div className="animate-spin-slow" style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px dashed #cbd5e1', opacity: 0.5 }} />
    
    {/* Liquid Background */}
    <div style={{ position: 'absolute', inset: 0, background: '#f8fafc' }} />
    
    {/* Dynamic Liquid Waves */}
    <motion.div
      initial={{ top: '100%' }}
      animate={{ top: `${100 - level}%` }}
      transition={{ duration: 2, ease: 'easeInOut' }}
      style={{ position: 'absolute', left: '-50%', width: '200%', height: '100%', background: '#16a34a', opacity: 0.15, borderRadius: '40%', animation: 'spin-slow 10s linear infinite' }}
    />
    <motion.div
      initial={{ top: '100%' }}
      animate={{ top: `${100 - level}%` }}
      transition={{ duration: 2.2, ease: 'easeInOut' }}
      style={{ position: 'absolute', left: '-40%', width: '180%', height: '100%', background: '#16a34a', opacity: 0.2, borderRadius: '45%', animation: 'spin-reverse 12s linear infinite' }}
    />

    <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, color: '#0f172a', margin: 0 }}>{level}%</p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Charging</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   APP PREVIEW COMPONENT
   ───────────────────────────────────────────────────────── */
const AppPreview = () => {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const floatX = useTransform(springX, [-0.5, 0.5], [-20, 20]);
  const floatY = useTransform(springY, [-0.5, 0.5], [-20, 20]);

  useEffect(() => {
    const handleMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set((e.clientX - centerX) / (rect.width / 2));
      mouseY.set((e.clientY - centerY) / (rect.height / 2));
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <section 
      id="preview" 
      ref={containerRef}
      style={{ padding: '120px 0', background: '#fff', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}
    >
      
      {/* Structural Background */}
      <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
      <div style={{ position: 'absolute', top: '20%', left: 0, right: 0, height: 1, background: '#e2e8f0' }} />
      
      <motion.div 
        style={{ x: floatX, opacity: 0.05, position: 'absolute', bottom: '-5%', left: '0', fontFamily: 'var(--font-display)', fontSize: '20vw', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.05em', whiteSpace: 'nowrap', userSelect: 'none' }}
      >
        TERMINAL-X
      </motion.div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

        {/* Header Enhancement */}
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 100px' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 99, background: '#f8fafc', border: '2px solid #0f172a', color: '#0f172a', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24, boxShadow: '4px 4px 0 #16a34a' }}
          >
            <Activity size={14} color="#16a34a" /> Live App Preview
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            Total control.<br/>
            <span style={{ color: '#16a34a' }}>Bespoke telemetry.</span>
          </motion.h2>
        </div>

        {/* 3D Ecosystem Stage */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 700 }}>
          
          <motion.div 
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 1200, position: 'relative' }}
          >
            {/* Phone Shadow */}
            <div style={{ position: 'absolute', bottom: -60, left: '10%', right: '10%', height: 40, background: 'rgba(15,23,42,0.1)', filter: 'blur(30px)', borderRadius: '50%', transform: 'translateZ(-50px)' }} />

            {/* MAIN PHONE MOCKUP */}
            <div style={{ position: 'relative', zIndex: 20, width: 330, height: 680, borderRadius: 52, border: '16px solid #0f172a', background: '#0f172a', boxShadow: '24px 24px 0 rgba(15,23,42,0.04)', overflow: 'hidden' }}>
               {/* Scanline Animation */}
               <div className="animate-scan" style={{ position: 'absolute', left: 0, right: 0, height: 100, background: 'linear-gradient(transparent, rgba(22,163,74,0.05), transparent)', zIndex: 30, pointerEvents: 'none' }} />

               {/* App Content */}
               <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: 36, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Top Stats Area */}
                  <div style={{ height: 180, background: '#0f172a', padding: '52px 28px 24px', color: '#fff' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>CURRENT FLOW</span>
                        <Radio size={16} color="#16a34a" />
                     </div>
                     <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>120<span style={{ fontSize: 18, color: '#16a34a' }}>kW/s</span></h3>
                     <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginTop: 4 }}>NJ Transit Hub // Port A4</p>
                  </div>

                  {/* Charging Analytics */}
                  <div style={{ flex: 1, padding: 32, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <LiquidBattery level={82} />
                     
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', marginTop: 32 }}>
                        <div style={{ background: '#fff', border: '2px solid #0f172a', padding: 16, borderRadius: 16, boxShadow: '4px 4px 0 rgba(15,23,42,0.08)' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <Timer size={14} color="#64748b" />
                              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b' }}>TIME LEFT</span>
                           </div>
                           <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: 0 }}>14m</p>
                        </div>
                        <div style={{ background: '#0f172a', border: '2px solid #0f172a', padding: 16, borderRadius: 16, boxShadow: '4px 4px 0 #16a34a', color: '#fff' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <ShieldCheck size={14} color="#16a34a" />
                              <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>SECURE</span>
                           </div>
                           <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: 0 }}>Active</p>
                        </div>
                     </div>

                     <motion.button 
                        whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.95 }}
                        style={{ marginTop: 32, width: '100%', height: 60, borderRadius: 16, background: '#fff', border: '3px solid #0f172a', color: '#0f172a', fontWeight: 900, fontSize: 16, boxShadow: '0 8px 0 #0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
                     >
                        STOP SESSION
                     </motion.button>
                  </div>
               </div>
            </div>

            {/* SIDE FLOATING WIDGETS (Parallaxing independently) */}
            
            {/* Widget 1: Map Snippet */}
            <motion.div 
               style={{ x: useTransform(springX, [-0.5, 0.5], [100, -250]), y: useTransform(springY, [-0.5, 0.5], [100, -100]), z: 100, position: 'absolute', top: '10%', left: '-180px' }}
            >
               <div className="glass-card" style={{ width: 220, padding: 20, borderRadius: 24, border: '2px solid #0f172a', boxShadow: '12px 12px 0 rgba(15,23,42,0.06)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                     <Navigation size={20} color="#16a34a" />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>NAVIGATION</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, margin: '4px 0' }}>NJ Hub Alpha</p>
                  <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>0.4 mi away</p>
               </div>
            </motion.div>

            {/* Widget 2: Environmental Impact */}
            <motion.div 
               style={{ x: useTransform(springX, [-0.5, 0.5], [-100, 250]), y: useTransform(springY, [-0.5, 0.5], [-100, 100]), z: 150, position: 'absolute', bottom: '15%', right: '-180px' }}
            >
               <div className="glass-card" style={{ width: 220, padding: 20, borderRadius: 24, border: '2px solid #0f172a', boxShadow: '12px 12px 0 rgba(15,23,42,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                     <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf size={18} color="#16a34a" />
                     </div>
                     <div style={{ background: '#f0fdf4', border: '1px solid #16a34a', borderRadius: 99, padding: '4px 10px', fontSize: 10, fontWeight: 800, color: '#16a34a' }}>+12.4kg</div>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>TOTAL IMPACT</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: '4px 0' }}>Carbon Offset</p>
                  <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 12 }}>
                     <motion.div animate={{ width: '64%' }} style={{ width: '40%', height: '100%', background: '#16a34a' }} />
                  </div>
               </div>
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AppPreview;