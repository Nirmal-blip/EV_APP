import React, { useState, useEffect } from 'react';
import { Menu, X, Zap, ChevronRight, Activity, User as UserIcon, LogOut } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = currentUser?.profile?.role === 'admin';

  // Dynamic Links based on role
  const navLinks = currentUser ? [
    { name: isAdmin ? 'Admin Panel' : 'Dashboard', href: isAdmin ? '/admin' : '/dashboard', isRoute: true },
    { 
      name: isAdmin ? 'Manage Stations' : 'Find Chargers', 
      href: isAdmin ? '/deploy-charger' : '/find-charger', 
      isRoute: true 
    },
    { name: 'My Profile', href: '/profile', isRoute: true },
  ] : [
    { name: 'About App', href: '/#features' },
    { name: 'How It Works', href: '/#how-it-works' },
  ];

  const containerVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '20px 24px', pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          width: '100%', maxWidth: 1200,
          background: isScrolled ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20, border: '2px solid #0f172a',
          boxShadow: isScrolled ? '12px 12px 0 rgba(15, 23, 42, 0.08)' : '6px 6px 0 rgba(15, 23, 42, 0.04)',
          padding: isScrolled ? '12px 24px' : '16px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          pointerEvents: 'auto', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative', overflow: 'visible'
        }}
      >
        <motion.div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#16a34a', scaleX, transformOrigin: '0%' }} />

        <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0] }}
              style={{
                width: 40, height: 40, borderRadius: 12, background: '#16a34a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #0f172a', boxShadow: '3px 3px 0 #0f172a'
              }}>
              <Zap size={22} color="#fff" fill="#fff" />
            </motion.div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>ChargeMap</span>
          </a>
        </motion.div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 40 }} className="hidden-mobile" onMouseLeave={() => setHoveredLink(null)}>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => navigate(link.href)}
                onMouseEnter={() => setHoveredLink(link.name)}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: hoveredLink === link.name ? '#0f172a' : '#475569',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  position: 'relative', padding: '10px 20px', zIndex: 1, transition: 'color 0.2s'
                }}
              >
                {link.name}
                {hoveredLink === link.name && (
                  <motion.div layoutId="nav-pill" transition={{ type: 'spring', stiffness: 350, damping: 30 }} style={{ position: 'absolute', inset: 0, background: '#f1f5f9', borderRadius: 12, border: '1px solid #e2e8f0', zIndex: -1 }} />
                )}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {currentUser ? (
              <div style={{ position: 'relative' }}>
                <div onClick={() => setProfileOpen(!profileOpen)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#f1f5f9', borderRadius: 20, cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                  <UserIcon size={16} color="#475569" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    {currentUser.displayName || currentUser.email.split('@')[0]}
                  </span>
                </div>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', top: 50, right: 0, width: 260,
                        background: '#fff', borderRadius: 20, border: '2px solid #0f172a',
                        boxShadow: '8px 8px 0 rgba(15, 23, 42, 0.08)', padding: 16, zIndex: 110,
                        display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'auto'
                      }}
                    >
                      <div 
                        onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                        style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: 4, cursor: 'pointer', borderRadius: 12 }}
                      >
                         <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Signed in as</p>
                         <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{currentUser.displayName || currentUser.email}</p>
                         <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '8px 12px', borderRadius: 12 }}>
                           <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Wallet</span>
                           <span style={{ fontSize: 14, fontWeight: 900, color: '#047857' }}>₹{(currentUser.profile?.walletBalance || 0).toFixed(2)}</span>
                         </div>
                      </div>

                      <button 
                        onClick={() => { setProfileOpen(false); navigate(isAdmin ? '/admin' : '/dashboard'); }}
                        style={{ border: 'none', background: '#f8fafc', padding: '10px', borderRadius: 12, fontWeight: 700, color: '#0f172a', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                         <Activity size={16} /> {isAdmin ? 'Admin Portal' : 'My Dashboard'}
                      </button>

                      <button 
                        onClick={async () => { setProfileOpen(false); await logout(); navigate('/'); }}
                        style={{ border: 'none', background: '#fee2e2', padding: '10px', borderRadius: 12, fontWeight: 800, color: '#dc2626', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                         <LogOut size={16} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* ... Log In / Sign Up buttons remain same ... */
              null
            )}
          </div>
        </nav>
      </motion.div>
    </header>
  );
};

export default Navbar;