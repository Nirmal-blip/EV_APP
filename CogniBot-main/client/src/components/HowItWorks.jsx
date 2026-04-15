import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Search, Zap, Activity, CheckCircle, Navigation, Satellite, Radio, CreditCard, Cpu } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   MICRO-TAG COMPONENT
   ───────────────────────────────────────────────────────── */
const StepTag = ({ text }) => (
  <div style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#16a34a', fontSize: 9, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: 12 }}>
    [{text}]
  </div>
);

/* ─────────────────────────────────────────────────────────
   SINGLE STEP COMPONENT
   ───────────────────────────────────────────────────────── */
const TimelineStep = ({ step, idx, isEven }) => (
  <div style={{ 
    gridColumn: isEven ? '1' : '2', 
    display: 'flex', flexDirection: 'column', 
    alignItems: isEven ? 'flex-end' : 'flex-start',
    marginTop: isEven ? 0 : 160, 
    textAlign: isEven ? 'right' : 'left',
    position: 'relative',
    paddingBottom: 80
  }}>
    {/* Timeline Dot with Breathing Glow */}
    <div style={{ 
      position: 'absolute', top: 44, 
      [isEven ? 'right' : 'left']: -58, 
      transform: isEven ? 'translateX(50%)' : 'translateX(-50%)',
      zIndex: 20
    }}>
      <motion.div 
        initial={{ scale: 0 }} 
        whileInView={{ scale: 1 }} 
        viewport={{ once: false, amount: 0.8 }}
        style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', border: '4px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#16a34a' }} />
      </motion.div>
    </div>

    {/* Wireframe Number Background */}
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 0.15, scale: 1 }}
      viewport={{ once: true }}
      style={{ 
        position: 'absolute', top: -30, [isEven ? 'right' : 'left']: isEven ? 40 : 40,
        fontFamily: 'var(--font-display)', fontSize: '10rem', fontWeight: 900, color: 'transparent', 
        WebkitTextStroke: '2px #0f172a', zIndex: 0, pointerEvents: 'none' 
      }}
    >
      {step.num}
    </motion.div>

    {/* Content Card */}
    <motion.div
      initial={{ opacity: 0, x: isEven ? -60 : 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card"
      style={{ position: 'relative', zIndex: 10, padding: 40, borderRadius: 32, minWidth: 380, border: '3px solid #0f172a', boxShadow: '16px 16px 0 #0f172a' }}
    >
      <StepTag text={step.tag} />
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, alignSelf: isEven ? 'flex-end' : 'flex-start' }}>
        {step.icon}
      </div>
      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', lineHeight: 1 }}>{step.title}</h4>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.15rem', color: '#64748b', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>{step.desc}</p>
    </motion.div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   MAIN HOW IT WORKS COMPONENT
   ───────────────────────────────────────────────────────── */
const HowItWorks = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start end", "end start"] });
  const springProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  
  const lineHeight = useTransform(springProgress, [0.1, 0.9], ["0%", "100%"]);
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-200, 200]);
  const parallaxRev = useTransform(scrollYProgress, [0, 1], [200, -200]);

  const steps = [
    { num: "01", title: "LOCATE", tag: "SEARCHING...", icon: <Satellite size={28} color="#16a34a" />, desc: "Find the best charging spots near you with real-time availability updates." },
    { num: "02", title: "SYNC", tag: "CONNECTING...", icon: <Cpu size={28} color="#16a34a" />, desc: "Connect your vehicle to any charger instantly with our smart sync technology." },
    { num: "03", title: "STREAM", tag: "LIVE_DATA", icon: <Activity size={28} color="#16a34a" />, desc: "Track your charging speed and battery level in real-time on your dashboard." },
    { num: "04", title: "SETTLE", tag: "DONE", icon: <CreditCard size={28} color="#16a34a" />, desc: "Pay automatically when you're finished and get back on the road in seconds." }
  ];

  return (
    <section ref={targetRef} id="how-it-works" style={{ position: 'relative', padding: '160px 0', background: '#fff', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      
      {/* Background Frame Architecture */}
      <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '8%', top: 0, bottom: 0, width: 1, background: '#e2e8f0', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '92%', top: 0, bottom: 0, width: 1, background: '#e2e8f0', pointerEvents: 'none' }} />
      
      {/* Floating Parallax Background Text */}
      <motion.div style={{ y: parallaxY, position: 'absolute', top: '10%', right: '-4%', fontSize: '18vw', fontWeight: 900, fontFamily: 'var(--font-display)', color: '#f1f5f9', whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none', writingMode: 'vertical-rl', transform: 'rotate(180deg)', opacity: 0.6 }}>
        SYSTEM_PROCESS
      </motion.div>
      <motion.div style={{ y: parallaxRev, position: 'absolute', bottom: '10%', left: '-2%', fontSize: '15vw', fontWeight: 900, fontFamily: 'var(--font-display)', color: '#f8fafc', whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none', zIndex: 0 }}>
        PROTOCOL_v1
      </motion.div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 120px' }}>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} style={{ display: 'inline-flex', padding: '8px 20px', borderRadius: 99, border: '2px solid #0f172a', background: '#fff', color: '#0f172a', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 32, boxShadow: '6px 6px 0 #16a34a' }}>
            Engineering The Future
          </motion.div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 800, color: '#0f172a', lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: 32 }}>
            Designed To <br/>
            <span style={{ color: '#16a34a', WebkitTextStroke: '1px #0f172a' }}>Work Silently.</span>
          </h2>
          <p style={{ fontSize: '1.35rem', color: '#64748b', fontWeight: 600, lineHeight: 1.4, maxWidth: 540, margin: '0 auto' }}>
            We removed the noise. The result is a radically minimal infrastructure that runs with technical precision.
          </p>
        </div>

        {/* Cinematic Timeline */}
        <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto' }}>
          
          {/* Main Structural Progress Line */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 4, background: '#f1f5f9', transform: 'translateX(-50%)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div style={{ width: '100%', height: lineHeight, background: '#0f172a', borderRadius: 4 }} />
            <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: lineHeight, background: '#16a34a', opacity: 0.4, filter: 'blur(8px)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', width: '100%' }}>
            {steps.map((step, idx) => (
              <TimelineStep key={idx} step={step} idx={idx} isEven={idx % 2 === 0} />
            ))}
          </div>
        </div>

      </div>

      {/* Decorative End */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(to top, #fff, transparent)', zIndex: 20 }} />
    </section>
  );
};

export default HowItWorks;
