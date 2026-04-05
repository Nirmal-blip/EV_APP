import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

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
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden pt-24">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-green-200/40 blur-[80px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] -right-[10%] w-[600px] h-[600px] rounded-full bg-blue-200/40 blur-[100px]"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center border-2 border-slate-900 shadow-[4px_4px_0_#0f172a] mb-6"
            >
              <Zap size={32} color="#fff" fill="#fff" />
            </motion.div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 mt-2 font-medium">Power up your journey</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 flex items-center gap-3 mb-6"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <a href="#" className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors">Forgot?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full py-4 mt-2 bg-slate-900 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 border-2 border-slate-900 shadow-[4px_4px_0_#16a34a] hover:shadow-[6px_6px_0_#16a34a] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Sign In 
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-[1px] flex-1 bg-slate-200"></div>
            <span className="text-sm font-medium text-slate-400">or continue with</span>
            <div className="h-[1px] flex-1 bg-slate-200"></div>
          </div>

          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="w-full py-3.5 mt-6 bg-white text-slate-700 rounded-xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            <FcGoogle size={24} className="group-hover:scale-110 transition-transform" />
            <span className="tracking-wide">Sign In with Google</span>
          </motion.button>

          <div className="mt-8 text-center border-t border-slate-200 pt-6">
            <p className="text-slate-500 font-medium tracking-wide">
              Don't have an account?{' '}
              <Link to="/register" className="text-slate-900 font-bold hover:text-green-600 transition-colors relative inline-block">
                Sign up here
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-green-500 origin-left scale-x-0 transition-transform group-hover:scale-x-100" />
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
