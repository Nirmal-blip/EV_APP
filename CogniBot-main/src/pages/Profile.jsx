import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Mail, Wallet, ShieldCheck, Smartphone, X, Save, Loader2, Activity, Cpu, Radio, Globe } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

/* ─── GLOBAL STYLES (matching HeroSection) ─── */
const GLOBAL_CSS = `
  :root {
    --font-display: 'Clash Display', 'Cabinet Grotesk', system-ui, sans-serif;
    --font-body:    'Cabinet Grotesk', system-ui, sans-serif;
  }
  .grid-lines {
    background-image:
      linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .glass-card {
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 2px solid #0f172a;
    box-shadow: 10px 10px 0 rgba(15,23,42,0.08);
  }
  @keyframes scan-line-wipe {
    0%   { left: -10%; opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { left: 110%; opacity: 0; }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(1.4); }
  }
  .animate-scan-wipe { animation: scan-line-wipe 8s linear infinite; }
  .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

  .profile-input {
    width: 100%;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px 18px;
    font-family: var(--font-body);
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .profile-input:focus {
    border-color: #16a34a;
    box-shadow: 4px 4px 0 rgba(22,163,74,0.15);
  }
  .profile-input:disabled {
    background: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
    border-color: #e2e8f0;
  }
`;

const Profile = () => {
  const { currentUser } = useAuth();
  const profile = currentUser?.profile || {};

  const [name, setName] = useState(profile.name || currentUser?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name cannot be empty");

    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { name: name });
      toast.success("Profile updated successfully! Refresh to see changes globally.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingTop: 96, paddingBottom: 64, position: 'relative', overflow: 'hidden' }}>
      <style>{GLOBAL_CSS}</style>

      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.8 }} />
        <div
          className="animate-scan-wipe"
          style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, transparent, #16a34a, transparent)', opacity: 0.4, zIndex: 1 }}
        />
        {/* Decorative text watermark */}
        <div style={{ position: 'absolute', top: '50%', left: '-2%', transform: 'translateY(-50%)', fontFamily: 'var(--font-display)', fontSize: '18vw', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.05em', whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none' }}>
          ACCOUNT
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderRadius: 99, background: '#f8fafc', border: '2px solid #0f172a', marginBottom: 20 }}>
            <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: '#0f172a', letterSpacing: '0.1em' }}>SYSTEM :: USER PROFILE</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 0.95, margin: 0 }}>
            My Profile
          </h1>
        </motion.div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Personal Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: '#fff', borderRadius: 28, border: '2px solid #0f172a', boxShadow: '10px 10px 0 rgba(15,23,42,0.07)', padding: 36, overflow: 'hidden', position: 'relative' }}
            >
              {/* Accent corner */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'linear-gradient(135deg, #16a34a22, transparent)', borderBottomLeftRadius: 80, pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, paddingBottom: 24, borderBottom: '1.5px solid #f1f5f9' }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a', flexShrink: 0 }}>
                  <UserIcon size={22} color="#4ade80" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Personal Information</h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#64748b', margin: 0, fontWeight: 600 }}>Update your display name</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.1em', marginBottom: 10 }}>FULL NAME</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="profile-input"
                    placeholder="Enter your name"
                  />
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.1em', marginBottom: 10 }}>REGISTERED EMAIL</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
                    <Mail size={16} color="#94a3b8" />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>{currentUser?.email}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 8 }}>Email addresses cannot be changed to prevent wallet disruption.</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <motion.button
                    type="submit"
                    disabled={isSaving}
                    whileHover={{ y: -3, boxShadow: '8px 8px 0 #16a34a' }}
                    whileTap={{ scale: 0.97 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: '#0f172a', color: '#fff', border: '2px solid #0f172a', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 15, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.75 : 1, boxShadow: '6px 6px 0 rgba(15,23,42,0.12)', transition: 'box-shadow 0.2s' }}
                  >
                    {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                    Update Profile
                  </motion.button>
                </div>
              </form>
            </motion.div>

            {/* Security & Roles Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: '#fff', borderRadius: 28, border: '2px solid #0f172a', boxShadow: '10px 10px 0 rgba(15,23,42,0.07)', padding: 36 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, paddingBottom: 24, borderBottom: '1.5px solid #f1f5f9' }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a', flexShrink: 0 }}>
                  <ShieldCheck size={22} color="#4ade80" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Security & Roles</h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#64748b', margin: 0, fontWeight: 600 }}>Access level and account status</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Account Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: '#f8fafc', borderRadius: 18, border: '1.5px solid #e2e8f0' }}>
                  <div>
                    <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>Account Status</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#64748b' }}>Your account is fully verified.</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#15803d', padding: '8px 14px', borderRadius: 10, border: '1.5px solid #bbf7d0' }}>
                    <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800 }}>Active</span>
                  </div>
                </div>

                {/* System Role */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: '#f8fafc', borderRadius: 18, border: '1.5px solid #e2e8f0' }}>
                  <div>
                    <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>System Role</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#64748b' }}>Database permission level.</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '8px 14px', borderRadius: 10,
                    background: profile.role === 'admin' ? '#ede9fe' : '#f1f5f9',
                    color: profile.role === 'admin' ? '#6d28d9' : '#475569',
                    border: `1.5px solid ${profile.role === 'admin' ? '#ddd6fe' : '#e2e8f0'}`
                  }}>
                    {profile.role || 'User'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Wallet Card — only for non-admins */}
            {profile.role !== 'admin' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: '#0f172a', borderRadius: 28, border: '2px solid #0f172a', boxShadow: '10px 10px 0 rgba(15,23,42,0.15)', padding: 36, position: 'relative', overflow: 'hidden' }}
              >
                {/* Glow blobs */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(22,163,74,0.15)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, background: 'rgba(22,163,74,0.08)', borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }} />

                {/* Grid overlay */}
                <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(22,163,74,0.15)', border: '1.5px solid rgba(22,163,74,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Wallet size={20} color="#4ade80" />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em', margin: 0 }}>CHARGE WALLET</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#64748b', margin: 0 }}>Available Balance</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 36 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#4ade80' }}>₹</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {profile.walletBalance?.toFixed(2) || '0.00'}
                    </span>
                  </div>

                  <motion.button
                    onClick={() => setShowAppModal(true)}
                    whileHover={{ y: -3, boxShadow: '8px 8px 0 rgba(22,163,74,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 0', borderRadius: 16, background: '#16a34a', color: '#fff', border: '2px solid #16a34a', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '6px 6px 0 rgba(22,163,74,0.25)', transition: 'box-shadow 0.2s' }}
                  >
                    <Wallet size={18} /> Add Money via App
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* System Status Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: '#fff', borderRadius: 28, border: '2px solid #0f172a', boxShadow: '10px 10px 0 rgba(15,23,42,0.07)', padding: 28, overflow: 'hidden', position: 'relative' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 800, color: '#0f172a', letterSpacing: '0.12em' }}>SYSTEM TELEMETRY</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { label: 'Session Active', icon: <Globe size={14} color="#16a34a" />, value: 'Connected', type: 'status' },
                  { label: 'Auth Provider', icon: <Radio size={14} color="#64748b" />, value: 'Firebase', type: 'text' },
                  { label: 'Platform Node', icon: <Cpu size={14} color="#64748b" />, value: 'SYD_NORTH', type: 'text' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < 2 ? 18 : 0, borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.icon}
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#64748b' }}>{item.label}</span>
                    </div>
                    {item.type === 'status'
                      ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#15803d', padding: '5px 10px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                          <div className="pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a' }} />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800 }}>{item.value}</span>
                        </div>
                      : <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '5px 10px', borderRadius: 8 }}>{item.value}</span>
                    }
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* App Redirection Modal */}
      <AnimatePresence>
        {showAppModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 40 }}
              onClick={() => setShowAppModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: 440, background: '#fff', borderRadius: 32, padding: 40, zIndex: 50, border: '2px solid #0f172a', boxShadow: '16px 16px 0 rgba(15,23,42,0.12)' }}
            >
              <button
                onClick={() => setShowAppModal(false)}
                style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="#64748b" />
              </button>

              <div style={{ width: 64, height: 64, background: '#0f172a', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #0f172a', boxShadow: '6px 6px 0 rgba(22,163,74,0.3)' }}>
                <Smartphone size={28} color="#4ade80" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
                <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>SECURE CHANNEL</span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0f172a', textAlign: 'center', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Open CogniBot App</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#64748b', fontWeight: 600, textAlign: 'center', lineHeight: 1.6, margin: '0 0 32px' }}>
                For security and seamless UPI integration, please open the mobile app to top-up your wallet safely.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <motion.a
                  href="intent://evapp/#Intent;scheme=evapp;package=com.example.evApp;end"
                  whileHover={{ y: -3, boxShadow: '8px 8px 0 rgba(15,23,42,0.15)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#0f172a', color: '#fff', padding: '16px 0', borderRadius: 16, fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 15, textDecoration: 'none', border: '2px solid #0f172a', boxShadow: '6px 6px 0 rgba(15,23,42,0.1)', transition: 'box-shadow 0.2s' }}
                >
                  <Smartphone size={18} /> Open Mobile App
                </motion.a>
                <button
                  onClick={() => setShowAppModal(false)}
                  style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, color: '#94a3b8', padding: '12px 0', cursor: 'pointer' }}
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;