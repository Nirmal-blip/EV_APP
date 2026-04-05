import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Mail, Wallet, ShieldCheck, Smartphone, X, Save, Loader2, Activity } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

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
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: name });
      
      // Update Firestore document
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
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
          <UserIcon className="text-slate-400" size={32} /> My Profile
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Profile Editor */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Personal Information</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Registered Email Address</label>
                  <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-medium cursor-not-allowed">
                    <Mail size={18} /> {currentUser?.email}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Email addresses currently cannot be changed to prevent wallet disruption.</p>
                </div>

                <div className="pt-4 mt-8 border-t border-slate-100 flex justify-end">
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Update Profile
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Security & Roles</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <span className="block text-slate-900 font-bold mb-1">Account Status</span>
                    <span className="text-sm font-medium text-slate-500">Your account is fully verified.</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1.5 rounded-lg text-sm font-bold">
                    <ShieldCheck size={16} /> Active
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <span className="block text-slate-900 font-bold mb-1">System Role</span>
                    <span className="text-sm font-medium text-slate-500">Database permission level.</span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'}`}>
                    {profile.role || 'User'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Wallet Panel */}
          {profile.role !== 'admin' && (
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 blur-3xl rounded-full pointer-events-none" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-2">
                    <Wallet className="text-green-400" size={24} />
                    <h3 className="font-bold text-slate-100">Charge Wallet</h3>
                  </div>
                </div>
                <div className="relative z-10">
                  <span className="text-slate-400 font-medium text-sm">Available Balance</span>
                  <div className="text-5xl font-black mt-2 mb-8 flex items-baseline gap-1">
                    <span className="text-green-400 text-3xl">₹</span>
                    {profile.walletBalance?.toFixed(2) || '0.00'}
                  </div>
                  <button 
                    onClick={() => setShowAppModal(true)}
                    className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    <Wallet size={18} /> Add Money via App
                  </button>
                </div>
              </motion.div>
            </div>
          )}

        </div>
      </div>

      {/* App Redirection Modal */}
      <AnimatePresence>
        {showAppModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setShowAppModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-8 z-50 shadow-2xl border border-slate-100"
            >
              <button 
                onClick={() => setShowAppModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner">
                <Smartphone size={32} />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 text-center mb-3">Open CogniBot App</h3>
              <p className="text-slate-500 font-medium text-center mb-8 leading-relaxed">
                For security and seamless UPI integration, please open the mobile app to top-up your wallet safely.
              </p>
              
              <div className="space-y-3">
                <a 
                  href="intent://evapp/#Intent;scheme=evapp;package=com.example.evApp;end"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition"
                >
                  <Smartphone size={20} /> Open Mobile App
                </a>
                <button 
                  onClick={() => setShowAppModal(false)}
                  className="w-full font-bold text-slate-500 py-3 hover:text-slate-900 transition-colors"
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
