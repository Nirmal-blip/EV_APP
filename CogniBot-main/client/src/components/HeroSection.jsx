import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, animate, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, MapPin, Navigation, BatteryCharging, CheckCircle, Search, Crosshair, ChevronRight, Activity, Globe, Radio, Cpu, BarChart3 } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   GLOBAL STYLES (injected once)
   ───────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  :root {
    --font-display: 'Clash Display', 'Cabinet Grotesk', system-ui, sans-serif;
    --font-body:    'Cabinet Grotesk', system-ui, sans-serif;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  @keyframes float-alt {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(12px); }
  }
  @keyframes scan-line-wipe {
    0% { left: -10%; opacity: 0; }
    5% { opacity: 1; }
    95% { opacity: 1; }
    100% { left: 110%; opacity: 0; }
  }
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-float-delayed { animation: float-alt 7s ease-in-out infinite 1s; }
  .animate-scan-wipe { animation: scan-line-wipe 8s linear infinite; }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 2px solid #0f172a;
    box-shadow: 12px 12px 0 rgba(15,23,42,0.08);
  }

  .grid-lines {
    background-image: 
      linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }
`;

/* ─────────────────────────────────────────────────────────
   TYPEWRITER COMPONENT
   ───────────────────────────────────────────────────────── */
const Typewriter = ({ words, delay = 2000 }) => {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout;
    const currentWord = words[index];
    
    if (isDeleting) {
      timeout = setTimeout(() => {
        setDisplayText(currentWord.substring(0, displayText.length - 1));
      }, 50);
    } else {
      timeout = setTimeout(() => {
        setDisplayText(currentWord.substring(0, displayText.length + 1));
      }, 100);
    }

    if (!isDeleting && displayText === currentWord) {
      timeout = setTimeout(() => setIsDeleting(true), delay);
    } else if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, index, words, delay]);

  return (
    <span style={{ color: '#16a34a', borderRight: '3px solid #16a34a', paddingRight: '4px' }}>
      {displayText}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   ANIMATED COUNTER
   ───────────────────────────────────────────────────────── */
const Counter = ({ from = 0, to, suffix = '', duration = 2 }) => {
  const nodeRef = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true); }, { threshold: 0.5 });
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!inView || !nodeRef.current) return;
    const ctrl = animate(from, to, {
      duration, ease: 'easeOut',
      onUpdate(val) { if (nodeRef.current) nodeRef.current.textContent = Math.round(val).toLocaleString() + suffix; },
    });
    return () => ctrl.stop();
  }, [inView, from, to, suffix]);
  return <span ref={nodeRef}>{from}{suffix}</span>;
};

/* ─────────────────────────────────────────────────────────
   WIDGETS
   ───────────────────────────────────────────────────────── */
const SearchWidget = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.5, duration: 0.8 }}
    style={{
      background: '#fff', borderRadius: 20, padding: 12,
      border: '2px solid #0f172a', boxShadow: '8px 8px 0 #0f172a',
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 440,
      marginTop: 40, position: 'relative', zIndex: 20
    }}
  >
    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Crosshair size={20} color="#0f172a" />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Smart Routing</p>
      <input type="text" placeholder="Scanning for hubs..." disabled style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '2px 0 0', padding: 0 }} />
    </div>
    <button style={{ height: 44, padding: '0 20px', borderRadius: 12, background: '#0f172a', color: '#fff', border: 'none', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
      Find Hubs
    </button>
  </motion.div>
);


const TelemetryWidget = ({ floatX, floatY }) => (
  <motion.div
    style={{ x: floatX, y: floatY, position: 'absolute', left: '-14rem', top: '20%', zIndex: 40 }}
    className="animate-float-delayed"
  >
    <div className="glass-card md:block hidden" style={{ padding: '24px', borderRadius: 24, minWidth: 260 }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 12px #16a34a' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', letterSpacing: '0.12em' }}>SYSTEM TELEMETRY</span>
       </div>
       <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { l: 'Network Load', v: '94%', c: '#16a34a', icon: <Activity size={12} /> },
            { l: 'Data Flow', v: '12GB/s', c: '#0f172a', icon: <BarChart3 size={12} /> }
          ].map((item, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                   <span style={{ color: '#94a3b8' }}>{item.icon}</span>
                   <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{item.l}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, color: item.c }}>{item.v}</span>
              </div>
              <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <motion.div animate={{ width: ['40%', '90%', '60%'] }} transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }} style={{ height: '100%', background: item.c }} />
              </div>
            </div>
          ))}
       </div>
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────
   PHONE MOCKUP
   ───────────────────────────────────────────────────────── */
const PhoneMockup = () => (
  <div style={{ position: 'relative', width: 320, height: 650, borderRadius: 52, border: '16px solid #0f172a', background: '#0f172a', boxShadow: '32px 32px 0 rgba(15,23,42,0.04)', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 90, height: 26, background: '#000', borderRadius: 99, zIndex: 30 }} />
    <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: 36, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ height: '60%', position: 'relative', background: '#f8fafc' }}>
        <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M 40,300 Q 150,250 240,80" fill="none" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" strokeDasharray="12 12" />
        </svg>
        <div style={{ position: 'absolute', left: 40, top: 300, width: 24, height: 24, borderRadius: '50%', border: '2px solid #0f172a', background: '#0f172a' }} />
        <div style={{ position: 'absolute', left: 240, top: 80, width: 32, height: 32, borderRadius: '50%', border: '4px solid #fff', background: '#16a34a', boxShadow: '0 8px 16px rgba(22,163,74,0.3)' }} />
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 4, margin: '0 auto 20px' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>EV Fast Hub</h3>
        <p style={{ color: '#64748b', fontSize: 14 }}>1.2 mi away • Open Now</p>
        <button style={{ width: '100%', height: 56, marginTop: 40, borderRadius: 16, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Navigation size={18} /> GO
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   HERO SECTION
   ───────────────────────────────────────────────────────── */
const HeroSection = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const floatX = useTransform(springX, [-0.5, 0.5], [-24, 24]);
  const floatY = useTransform(springY, [-0.5, 0.5], [-24, 24]);
  const textX = useTransform(springX, [-0.5, 0.5], [30, -30]);

  useEffect(() => {
    const handleMove = (e) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <section style={{ position: 'relative', minHeight: '100vh', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', paddingTop: 80 }}>
      <style>{GLOBAL_CSS}</style>
      
      {/* Background Layer */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.8 }} />
        <motion.div 
          style={{ x: textX, y: floatY, position: 'absolute', top: '50%', left: '-5%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '22vw', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.05em', whiteSpace: 'nowrap', userSelect: 'none' }}
        >
          INFRASTRUCTURE
        </motion.div>
        <div className="animate-scan-wipe" style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, transparent, #16a34a, transparent)', opacity: 0.5, zIndex: 1 }} />
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10, width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80, alignItems: 'center' }}>
          
          {/* Left Side */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderRadius: 99, background: '#f8fafc', border: '2px solid #0f172a', marginBottom: 32, alignSelf: 'flex-start', width: 'fit-content' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', animation: 'pulse-ring 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', letterSpacing: '0.1em' }}>TERMINAL READY</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', fontWeight: 800, color: '#0f172a', lineHeight: 0.95, letterSpacing: '-0.04em', margin: '0 0 24px' }}>
              Built To <br/>
              <Typewriter words={["Charge.", "Sync.", "Route.", "Connect."]} />
            </h1>

            <p style={{ fontSize: '1.25rem', color: '#64748b', lineHeight: 1.6, maxWidth: 480, margin: '0 0 40px' }}>
              The most advanced EV charging infrastructure terminal. Real-time telemetry, smart routing, and global connectivity.
            </p>

            <div style={{ display: 'flex', gap: 16 }}>
               <motion.button whileHover={{ y: -4, boxShadow: '12px 12px 0 #16a34a' }} whileTap={{ scale: 0.98 }} style={{ padding: '18px 36px', borderRadius: 16, background: '#0f172a', color: '#fff', border: '2px solid #0f172a', fontWeight: 800, fontSize: 16, boxShadow: '8px 8px 0 #16a34a', cursor: 'pointer', transition: 'box-shadow 0.2s ease' }}>Get Started</motion.button>
               <motion.button whileHover={{ background: '#f8fafc', y: -2 }} style={{ padding: '18px 36px', borderRadius: 16, background: 'transparent', color: '#0f172a', border: '2px solid #0f172a', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>Watch System</motion.button>
            </div>

            <SearchWidget />
          </motion.div>

          {/* Right Side: 3D ECOSYSTEM */}
          <div style={{ position: 'relative', height: 750, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div style={{ rotateX, rotateY, x: floatX, y: floatY, transformStyle: 'preserve-3d', transformPerspective: 1200, position: 'relative' }}>
              <PhoneMockup />
              <TelemetryWidget floatX={floatX} floatY={floatY} />
              
              <motion.div style={{ x: floatX, y: floatY, position: 'absolute', bottom: '4rem', right: '-80px', zIndex: 10 }}>
                 <div className="glass-card" style={{ padding: '12px 18px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Globe size={18} color="#16a34a" />
                    <div>
                       <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', display: 'block', lineHeight: 1 }}>CONNECTED TO</span>
                       <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>SYD_NORTH_HUB</span>
                    </div>
                 </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Decorative Floor */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%', background: 'linear-gradient(to top, #fff, transparent)', borderTop: '1px solid #e2e8f0', zIndex: 0 }} />
    </section>
  );
};

export default HeroSection;