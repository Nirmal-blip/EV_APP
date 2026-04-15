// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import { Link, useNavigate } from 'react-router-dom';
// import { Mail, Lock, Zap, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';
// import toast from 'react-hot-toast';
// import { FcGoogle } from 'react-icons/fc';

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const { login, signInWithGoogle } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       setError('');
//       setIsLoading(true);
//       await login(email, password);
//       toast.success('Successfully logged in!', {
//         icon: '⚡',
//         style: {
//           borderRadius: '16px',
//           background: '#0f172a',
//           color: '#fff',
//         },
//       });
//       navigate('/');
//     } catch (err) {
//       setError('Failed to sign in. Please check your credentials.');
//       toast.error('Authentication Error', {
//         style: {
//           borderRadius: '16px',
//           background: '#fee2e2',
//           color: '#991b1b',
//         },
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleGoogleSignIn = async () => {
//     try {
//       setError('');
//       setIsLoading(true);
//       await signInWithGoogle();
//       toast.success('Successfully logged in with Google!', {
//         icon: '⚡',
//         style: {
//           borderRadius: '16px',
//           background: '#0f172a',
//           color: '#fff',
//         },
//       });
//       navigate('/');
//     } catch (err) {
//       setError('Failed to sign in with Google. Please try again.');
//       toast.error('Authentication Error', {
//         style: {
//           borderRadius: '16px',
//           background: '#fee2e2',
//           color: '#991b1b',
//         },
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="relative flex items-center justify-center min-h-screen p-4 pt-24 overflow-hidden bg-slate-50">
//       {/* Decorative background elements */}
//       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
//         <motion.div 
//           animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
//           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
//           className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-green-200/40 blur-[80px]"
//         />
//         <motion.div 
//           animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
//           transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
//           className="absolute top-[40%] -right-[10%] w-[600px] h-[600px] rounded-full bg-blue-200/40 blur-[100px]"
//         />
//       </div>

//       <motion.div 
//         initial={{ opacity: 0, y: 30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
//         className="relative z-10 w-full max-w-md"
//       >
//         <div className="p-8 border shadow-xl bg-white/80 backdrop-blur-xl border-slate-200 rounded-3xl shadow-slate-200/50">
//           <div className="flex flex-col items-center mb-8">
//             <motion.div 
//               whileHover={{ rotate: 10, scale: 1.05 }}
//               className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center border-2 border-slate-900 shadow-[4px_4px_0_#0f172a] mb-6"
//             >
//               <Zap size={32} color="#fff" fill="#fff" />
//             </motion.div>
//             <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome Back</h2>
//             <p className="mt-2 font-medium text-slate-500">Power up your journey</p>
//           </div>

//           {error && (
//             <motion.div 
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: 'auto' }}
//               className="flex items-center gap-3 p-4 mb-6 text-red-600 border border-red-200 bg-red-50 rounded-xl"
//             >
//               <AlertCircle size={20} className="shrink-0" />
//               <p className="text-sm font-semibold">{error}</p>
//             </motion.div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-5">
//             <div className="space-y-1.5">
//               <label className="ml-1 text-sm font-bold text-slate-700">Email Address</label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//                   <Mail size={20} className="text-slate-400" />
//                 </div>
//                 <input
//                   type="email"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all font-medium text-slate-900 placeholder:text-slate-400"
//                   placeholder="you@example.com"
//                 />
//               </div>
//             </div>

//             <div className="space-y-1.5">
//               <div className="flex items-center justify-between ml-1">
//                 <label className="text-sm font-bold text-slate-700">Password</label>
//                 <a href="#" className="text-sm font-semibold text-green-600 transition-colors hover:text-green-700">Forgot?</a>
//               </div>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
//                   <Lock size={20} className="text-slate-400" />
//                 </div>
//                 <input
//                   type="password"
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all font-medium text-slate-900 placeholder:text-slate-400"
//                   placeholder="••••••••"
//                 />
//               </div>
//             </div>

//             <motion.button
//               whileHover={{ scale: 1.01 }}
//               whileTap={{ scale: 0.98 }}
//               disabled={isLoading}
//               className="w-full py-4 mt-2 bg-slate-900 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 border-2 border-slate-900 shadow-[4px_4px_0_#16a34a] hover:shadow-[6px_6px_0_#16a34a] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
//             >
//               {isLoading ? (
//                 <Loader2 size={24} className="animate-spin" />
//               ) : (
//                 <>
//                   Sign In 
//                   <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
//                 </>
//               )}
//             </motion.button>
//           </form>

//           <div className="flex items-center justify-center gap-4 mt-6">
//             <div className="h-[1px] flex-1 bg-slate-200"></div>
//             <span className="text-sm font-medium text-slate-400">or continue with</span>
//             <div className="h-[1px] flex-1 bg-slate-200"></div>
//           </div>

//           <motion.button
//             type="button"
//             onClick={handleGoogleSignIn}
//             whileHover={{ scale: 1.01 }}
//             whileTap={{ scale: 0.98 }}
//             disabled={isLoading}
//             className="w-full py-3.5 mt-6 bg-white text-slate-700 rounded-xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
//           >
//             <FcGoogle size={24} className="transition-transform group-hover:scale-110" />
//             <span className="tracking-wide">Sign In with Google</span>
//           </motion.button>

//           <div className="pt-6 mt-8 text-center border-t border-slate-200">
//             <p className="font-medium tracking-wide text-slate-500">
//               Don't have an account?{' '}
//               <Link to="/register" className="relative inline-block font-bold transition-colors text-slate-900 hover:text-green-600">
//                 Sign up here
//                 <span className="absolute bottom-0 left-0 w-full h-[2px] bg-green-500 origin-left scale-x-0 transition-transform group-hover:scale-x-100" />
//               </Link>
//             </p>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default Login;



import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, ArrowRight, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';

/* ─────────────────────────────────────────────────────────
   GLOBAL STYLES
   ───────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  :root {
    --font-display: 'Clash Display', 'Cabinet Grotesk', system-ui, sans-serif;
    --font-body:    'Cabinet Grotesk', system-ui, sans-serif;
  }

  @keyframes scan-line {
    0% { left: -10%; opacity: 0; }
    5% { opacity: 1; }
    95% { opacity: 1; }
    100% { left: 110%; opacity: 0; }
  }

  @keyframes pulse-ring {
    0% { box-shadow: 0 0 8px #16a34a; }
    50% { box-shadow: 0 0 16px #16a34a; }
    100% { box-shadow: 0 0 8px #16a34a; }
  }

  @keyframes float-up {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 2px solid #0f172a;
    box-shadow: 16px 16px 0 rgba(15,23,42,0.08);
  }

  .grid-lines {
    background-image: 
      linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .animate-scan { animation: scan-line 8s linear infinite; }
  .animate-float-up { animation: float-up 6s ease-in-out infinite; }
  .pulse-dot { animation: pulse-ring 2s infinite; }
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
   LOGIN COMPONENT
   ───────────────────────────────────────────────────────── */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // 3D mouse tracking for subtle parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  const floatX = useTransform(springX, [-0.5, 0.5], [-20, 20]);
  const floatY = useTransform(springY, [-0.5, 0.5], [-20, 20]);

  useEffect(() => {
    const handleMove = (e) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setIsLoading(true);
      await login(email, password);
      toast.success('Successfully logged in!', {
        icon: '⚡',
        style: {
          borderRadius: '16px',
          background: '#0f172a',
          color: '#fff',
          fontWeight: 800,
          border: '2px solid #16a34a',
        },
      });
      navigate('/');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      toast.error('Authentication Error', {
        style: {
          borderRadius: '16px',
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: 800,
          border: '2px solid #dc2626',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsLoading(true);
      await signInWithGoogle();
      toast.success('Successfully logged in with Google!', {
        icon: '⚡',
        style: {
          borderRadius: '16px',
          background: '#0f172a',
          color: '#fff',
          fontWeight: 800,
          border: '2px solid #16a34a',
        },
      });
      navigate('/');
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      toast.error('Authentication Error', {
        style: {
          borderRadius: '16px',
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: 800,
          border: '2px solid #dc2626',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
      <style>{GLOBAL_CSS}</style>

      {/* Background Grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
        <div className="animate-scan" style={{ position: 'absolute', top: 0, bottom: 0, width: 3, background: 'linear-gradient(to bottom, transparent, #16a34a, transparent)', opacity: 0.4, zIndex: 1 }} />
      </div>



      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ x: floatX, y: floatY, position: 'relative', zIndex: 10 }}
        className="w-full max-w-lg px-6"
      >
        {/* Status Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '8px 16px', borderRadius: 99, background: '#f8fafc', border: '2px solid #0f172a', width: 'fit-content', margin: '0 auto 40px' }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} className="pulse-dot" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', letterSpacing: '0.1em' }}>SECURE GATEWAY</span>
        </motion.div>

        {/* Card Container */}
        <div className="glass-card" style={{ padding: 48, borderRadius: 32 }}>
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48 }}
          >
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              style={{ width: 64, height: 64, background: '#16a34a', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a', boxShadow: '8px 8px 0 #0f172a', marginBottom: 28, cursor: 'pointer' }}
            >
              <Zap size={36} color="#fff" fill="#fff" />
            </motion.div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Power Up
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 12, fontWeight: 600, letterSpacing: '0.05em' }}>
              Access your <Typewriter words={["dashboard", "network", "terminal", "hub"]} delay={1500} />
            </p>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ background: '#fee2e2', border: '2px solid #dc2626', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 28 }}
            >
              <AlertCircle size={20} color="#991b1b" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', margin: 0, lineHeight: 1.5 }}>{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Email Input */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <Mail size={18} color="#94a3b8" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: 50,
                    paddingRight: 16,
                    paddingTop: 16,
                    paddingBottom: 16,
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#0f172a',
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.background = '#fff';
                    e.target.style.borderColor = '#16a34a';
                    e.target.style.boxShadow = '0 0 0 4px rgba(22, 163, 74, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = '#f8fafc';
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="you@example.com"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>PASSWORD</label>
                <a href="#" style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#15803d'} onMouseLeave={(e) => e.target.style.color = '#16a34a'}>
                  Forgot?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <Lock size={18} color="#94a3b8" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: 50,
                    paddingRight: 16,
                    paddingTop: 16,
                    paddingBottom: 16,
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#0f172a',
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    letterSpacing: '0.1em',
                  }}
                  onFocus={(e) => {
                    e.target.style.background = '#fff';
                    e.target.style.borderColor = '#16a34a';
                    e.target.style.boxShadow = '0 0 0 4px rgba(22, 163, 74, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = '#f8fafc';
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="••••••••"
                />
              </div>
            </motion.div>

            {/* Sign In Button */}
            <motion.button
              type="submit"
              whileHover={{ y: -4, boxShadow: '12px 12px 0 #16a34a' }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              style={{
                width: '100%',
                padding: '18px 24px',
                marginTop: 12,
                background: '#0f172a',
                color: '#fff',
                border: '2px solid #0f172a',
                borderRadius: 16,
                fontFamily: 'var(--font-body)',
                fontWeight: 800,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: '8px 8px 0 #16a34a',
                transition: 'all 0.3s ease',
              }}
            >
              {isLoading ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} style={{ transition: 'transform 0.3s' }} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0' }}
          >
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </motion.div>

          {/* Google Sign In */}
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            whileHover={{ y: -2, boxShadow: '0 8px 16px rgba(15, 23, 42, 0.15)' }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#f8fafc',
              color: '#0f172a',
              border: '2px solid #e2e8f0',
              borderRadius: 16,
              fontFamily: 'var(--font-body)',
              fontWeight: 800,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.3s ease',
            }}
          >
            <FcGoogle size={20} />
            <span>Sign In with Google</span>
          </motion.button>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            style={{ marginTop: 32, paddingTop: 28, borderTop: '2px solid #e2e8f0', textAlign: 'center' }}
          >
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, fontWeight: 600 }}>
              New to the system?{' '}
              <Link 
                to="/register" 
                style={{ 
                  color: '#0f172a', 
                  fontWeight: 800, 
                  textDecoration: 'none',
                  borderBottom: '2px solid #16a34a',
                  paddingBottom: 2,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#16a34a'}
                onMouseLeave={(e) => e.target.style.color = '#0f172a'}
              >
                Create Account
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Floating Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          style={{ marginTop: 32, padding: '14px 20px', borderRadius: 14, background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d', lineHeight: 1.4 }}>Secured with enterprise-grade encryption</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;