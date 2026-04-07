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
  const navLinks = currentUser ? [
    { name: isAdmin ? 'Admin Panel' : 'Dashboard', href: isAdmin ? '/admin' : '/dashboard', isRoute: true },
    { name: 'Find Chargers', href: '/find-charger', isRoute: true },
    { name: 'My Profile', href: '/profile', isRoute: true },
  ] : [
    { name: 'About App', href: '/#features' },
    { name: 'How It Works', href: '/#how-it-works' },
  ];

  const containerVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, opacity: 1,
      transition: { 
        duration: 0.8, ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.1, delayChildren: 0.2
      }
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
        {/* Scroll Progress Line */}
        <motion.div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#16a34a', scaleX, transformOrigin: '0%' }} />

        {/* Left Side: Logo & System Indicator */}
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

          {/* System Heartbeat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }} className="hidden-mobile">
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', fontFamily: 'monospace' }}>NETWORK LIVE // v1.0.4 ARC</span>
          </div>
        </motion.div>

        {/* Center: Magnetic Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 40 }} className="hidden-mobile" onMouseLeave={() => setHoveredLink(null)}>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            {navLinks.map((link) => (
              link.isRoute ? (
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
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.name)}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: hoveredLink === link.name ? '#0f172a' : '#475569',
                    textDecoration: 'none', position: 'relative', padding: '10px 20px', zIndex: 1, transition: 'color 0.2s'
                  }}
                >
                  {link.name}
                  {hoveredLink === link.name && (
                    <motion.div layoutId="nav-pill" transition={{ type: 'spring', stiffness: 350, damping: 30 }} style={{ position: 'absolute', inset: 0, background: '#f1f5f9', borderRadius: 12, border: '1px solid #e2e8f0', zIndex: -1 }} />
                  )}
                </a>
              )
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
                        display: 'flex', flexDirection: 'column', gap: 12
                      }}
                    >
                      <div 
                        onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                        style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: 4, cursor: 'pointer', borderRadius: 12, transition: 'background 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                         <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Signed in as (Edit Profile)</p>
                         <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.displayName || currentUser.email}</p>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a href="/login" style={{
                  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, color: '#0f172a',
                  textDecoration: 'none', padding: '10px 16px'
                }}>
                  Log In
                </a>
                <motion.button
                  variants={itemVariants}
                  whileHover={{ y: -2, boxShadow: '6px 6px 0 #16a34a' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/register')}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, color: '#fff',
                    background: '#0f172a', border: '2px solid #0f172a', cursor: 'pointer',
                    padding: '10px 20px', borderRadius: 12, boxShadow: '3px 3px 0 #16a34a',
                    transition: 'box-shadow 0.2s', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  Sign Up <motion.span whileHover={{ x: 3 }} transition={{ type: 'spring' }}><ChevronRight size={16} /></motion.span>
                </motion.button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile toggle */}
        <motion.button variants={itemVariants} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a', padding: 4 }} className="show-mobile">
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </motion.button>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{ position: 'absolute', top: 100, left: 24, right: 24, background: '#fff', border: '2px solid #0f172a', borderRadius: 24, padding: '24px', boxShadow: '16px 16px 0 rgba(15,23,42,0.1)', zIndex: 90, pointerEvents: 'auto' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)} style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700, color: '#0f172a', textDecoration: 'none', padding: '16px 20px', borderRadius: 16, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                  {link.name} <ChevronRight size={18} color="#16a34a" />
                </a>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                {currentUser ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: '#f1f5f9', borderRadius: 16 }}>
                      <UserIcon size={20} color="#475569" />
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                        {currentUser.displayName || currentUser.email.split('@')[0]}
                      </span>
                    </div>
                    <button onClick={async () => { await logout(); navigate('/'); setMobileMenuOpen(false); }} style={{ width: '100%', padding: '16px', borderRadius: 16, border: '2px solid #dc2626', background: '#fee2e2', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 16, color: '#dc2626', cursor: 'pointer' }}>
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} style={{ width: '100%', padding: '16px', borderRadius: 16, border: '2px solid #e2e8f0', background: '#fff', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 16, color: '#0f172a', cursor: 'pointer' }}>
                      Log In
                    </button>
                    <button onClick={() => { navigate('/register'); setMobileMenuOpen(false); }} style={{ width: '100%', padding: '16px', borderRadius: 16, border: '2px solid #0f172a', background: '#0f172a', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 16, color: '#fff', cursor: 'pointer', boxShadow: '6px 6px 0 #16a34a' }}>
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 768px) { .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hidden-mobile { display: none !important; } }
      `}</style>
    </header>
  );
};

export default Navbar;







// import React, { useState } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { Menu, X, LogOut, Plus, MapPin, BarChart3, Settings } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// const Navbar = () => {
//   const { currentUser, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [userMenuOpen, setUserMenuOpen] = useState(false);

//   const isAdmin = currentUser?.profile?.role === 'admin';
//   const isHome = location.pathname === '/';

//   const handleLogout = async () => {
//     try {
//       await logout();
//       setUserMenuOpen(false);
//       navigate('/');
//     } catch (err) {
//       console.error('Logout failed:', err);
//     }
//   };

//   // Navigation items based on auth status
//   const getNavItems = () => {
//     if (!currentUser) {
//       return [
//         { label: 'Login', href: '/login' },
//         { label: 'Register', href: '/register' }
//       ];
//     }

//     if (isAdmin) {
//       return [
//         { label: 'Dashboard', href: '/admin', icon: BarChart3 },
//         { label: 'Add Station', href: '/add-station', icon: Plus },
//         { label: 'Profile', href: '/profile', icon: Settings }
//       ];
//     }

//     return [
//       { label: 'Find Charger', href: '/find-charger', icon: MapPin },
//       { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
//       { label: 'Profile', href: '/profile', icon: Settings }
//     ];
//   };

//   const navItems = getNavItems();
//   const isActive = (href) => location.pathname === href;

//   return (
//     <nav style={{ 
//       position: 'fixed', 
//       top: 0, 
//       left: 0, 
//       right: 0, 
//       zIndex: 1000,
//       fontFamily: 'var(--font-body)'
//     }}>
//       <style>{`
//         :root {
//           --font-display: 'Clash Display', 'Cabinet Grotesk', system-ui, sans-serif;
//           --font-body: 'Cabinet Grotesk', system-ui, sans-serif;
//         }
//       `}</style>

//       {/* Glass Background */}
//       <div style={{
//         position: 'absolute',
//         inset: 0,
//         background: 'rgba(255, 255, 255, 0.7)',
//         backdropFilter: 'blur(24px)',
//         WebkitBackdropFilter: 'blur(24px)',
//         borderBottom: '2px solid #0f172a',
//         zIndex: -1
//       }} />

//       <div style={{
//         maxWidth: 1360,
//         margin: '0 auto',
//         padding: '0 24px',
//         height: 80,
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         position: 'relative'
//       }}>
        
//         {/* Logo */}
//         <Link 
//           to="/" 
//           style={{
//             fontSize: '1.5rem',
//             fontWeight: 900,
//             color: '#0f172a',
//             textDecoration: 'none',
//             display: 'flex',
//             alignItems: 'center',
//             gap: 8,
//             fontFamily: 'var(--font-display)',
//             letterSpacing: '-0.02em'
//           }}
//         >
//           <div style={{
//             width: 36,
//             height: 36,
//             borderRadius: 8,
//             background: '#16a34a',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             color: '#fff',
//             fontWeight: 900,
//             fontSize: 20
//           }}>
//             ⚡
//           </div>
//           EV Hub
//         </Link>

//         {/* Desktop Menu */}
//         <div style={{
//           display: 'none',
//           '@media (min-width: 768px)': {
//             display: 'flex'
//           }
//         }} className="items-center hidden gap-2 md:flex">
//           {navItems.map((item) => (
//             <Link
//               key={item.href}
//               to={item.href}
//               style={{
//                 padding: '10px 16px',
//                 borderRadius: 12,
//                 textDecoration: 'none',
//                 fontWeight: 800,
//                 fontSize: '0.95rem',
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 6,
//                 transition: 'all 0.3s ease',
//                 background: isActive(item.href) ? '#16a34a' : 'transparent',
//                 color: isActive(item.href) ? '#fff' : '#0f172a',
//                 border: isActive(item.href) ? '2px solid #16a34a' : '2px solid transparent'
//               }}
//               onMouseEnter={(e) => {
//                 if (!isActive(item.href)) {
//                   e.currentTarget.style.background = '#f8fafc';
//                   e.currentTarget.style.borderColor = '#0f172a';
//                 }
//               }}
//               onMouseLeave={(e) => {
//                 if (!isActive(item.href)) {
//                   e.currentTarget.style.background = 'transparent';
//                   e.currentTarget.style.borderColor = 'transparent';
//                 }
//               }}
//             >
//               {item.icon && <item.icon size={18} />}
//               {item.label}
//             </Link>
//           ))}
//         </div>

//         {/* Right Side */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: 16
//         }}>
//           {currentUser && (
//             <div style={{ position: 'relative' }}>
//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={() => setUserMenuOpen(!userMenuOpen)}
//                 style={{
//                   width: 44,
//                   height: 44,
//                   borderRadius: 12,
//                   background: '#16a34a',
//                   border: '2px solid #0f172a',
//                   color: '#fff',
//                   fontWeight: 900,
//                   fontSize: 16,
//                   cursor: 'pointer',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   boxShadow: '4px 4px 0 rgba(15,23,42,0.1)'
//                 }}
//               >
//                 {(currentUser.displayName || currentUser.email || 'User').charAt(0).toUpperCase()}
//               </motion.button>

//               <AnimatePresence>
//                 {userMenuOpen && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -10 }}
//                     style={{
//                       position: 'absolute',
//                       top: 'calc(100% + 8px)',
//                       right: 0,
//                       background: '#fff',
//                       border: '2px solid #0f172a',
//                       borderRadius: 16,
//                       boxShadow: '12px 12px 0 rgba(15,23,42,0.08)',
//                       minWidth: 200,
//                       overflow: 'hidden',
//                       zIndex: 100
//                     }}
//                   >
//                     <div style={{
//                       padding: '16px',
//                       borderBottom: '2px solid #e2e8f0'
//                     }}>
//                       <p style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>
//                         {currentUser.displayName || 'User'}
//                       </p>
//                       <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
//                         {currentUser.email}
//                       </p>
//                       {isAdmin && (
//                         <span style={{
//                           display: 'inline-block',
//                           marginTop: 8,
//                           padding: '4px 12px',
//                           background: '#16a34a',
//                           color: '#fff',
//                           borderRadius: 6,
//                           fontSize: '0.75rem',
//                           fontWeight: 900,
//                           letterSpacing: '0.05em'
//                         }}>
//                           ADMIN
//                         </span>
//                       )}
//                     </div>
//                     <Link
//                       to="/profile"
//                       onClick={() => setUserMenuOpen(false)}
//                       style={{
//                         display: 'block',
//                         padding: '12px 16px',
//                         textDecoration: 'none',
//                         color: '#0f172a',
//                         fontWeight: 700,
//                         borderBottom: '1px solid #e2e8f0',
//                         transition: 'background-color 0.2s ease'
//                       }}
//                       onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
//                       onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
//                     >
//                       📋 Profile
//                     </Link>
//                     <button
//                       onClick={handleLogout}
//                       style={{
//                         width: '100%',
//                         padding: '12px 16px',
//                         background: 'transparent',
//                         border: 'none',
//                         textAlign: 'left',
//                         color: '#ef4444',
//                         fontWeight: 700,
//                         cursor: 'pointer',
//                         display: 'flex',
//                         alignItems: 'center',
//                         gap: 8,
//                         transition: 'background-color 0.2s ease',
//                         fontSize: '0.95rem'
//                       }}
//                       onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
//                       onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
//                     >
//                       <LogOut size={18} /> Logout
//                     </button>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           )}

//           {/* Mobile Menu Toggle */}
//           <button
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//             style={{
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               width: 44,
//               height: 44,
//               borderRadius: 12,
//               background: '#f8fafc',
//               border: '2px solid #0f172a',
//               cursor: 'pointer',
//               fontSize: 20
//             }}
//             className="md:hidden"
//           >
//             {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       <AnimatePresence>
//         {mobileMenuOpen && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: 'auto' }}
//             exit={{ opacity: 0, height: 0 }}
//             style={{
//               background: 'rgba(255, 255, 255, 0.95)',
//               backdropFilter: 'blur(24px)',
//               borderBottom: '2px solid #0f172a',
//               overflow: 'hidden'
//             }}
//             className="md:hidden"
//           >
//             <div style={{
//               padding: '16px 24px',
//               display: 'flex',
//               flexDirection: 'column',
//               gap: 8
//             }}>
//               {navItems.map((item) => (
//                 <Link
//                   key={item.href}
//                   to={item.href}
//                   onClick={() => setMobileMenuOpen(false)}
//                   style={{
//                     padding: '12px 16px',
//                     borderRadius: 12,
//                     textDecoration: 'none',
//                     fontWeight: 800,
//                     fontSize: '0.95rem',
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: 8,
//                     background: isActive(item.href) ? '#16a34a' : '#f8fafc',
//                     color: isActive(item.href) ? '#fff' : '#0f172a',
//                     border: '2px solid #0f172a'
//                   }}
//                 >
//                   {item.icon && <item.icon size={18} />}
//                   {item.label}
//                 </Link>
//               ))}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </nav>
//   );
// };

// export default Navbar;