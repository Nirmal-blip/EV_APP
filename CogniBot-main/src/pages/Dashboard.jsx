import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    // Fetch last 10 bookings for user
    const fetchBookings = async () => {
      if (!currentUser?.uid) return;
      try {
        const q = query(
          collection(db, 'bookings'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const rawBookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort locally to completely avoid Firebase composite index errors!
        rawBookings.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        
        setBookings(rawBookings.slice(0, 10));
      } catch (err) {
        console.error("Failed fetching bookings: ", err);
      }
    };
    fetchBookings();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">My Bookings Dashboard</h1>
        
        <div className="w-full">
          {/* Main Content Area */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[60vh]"
          >
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <Activity size={28} className="text-green-500" /> Recent Booking History
              </h2>
              <span className="text-sm font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {bookings.length} Records
              </span>
            </div>
            
            {bookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookings.map((booking, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={booking.id} 
                    className="flex flex-col p-6 rounded-2xl border border-slate-200 hover:border-green-300 hover:shadow-md hover:bg-slate-50 transition-all gap-4 cursor-default"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
                          <Calendar className="text-white" size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">Station {booking.stationId.substring(0, 6)}...</p>
                          <p className="text-sm font-medium text-slate-500">
                            {booking.slotTime?.seconds ? new Date(booking.slotTime.seconds * 1000).toLocaleString() : 'Unknown Date'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-900 text-xl mb-1 flex items-baseline justify-end gap-1">
                          <span className="text-green-600 text-base">₹</span>{booking.amount}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-100 px-2 py-1 rounded-md">
                          {booking.bookingStatus}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-medium text-slate-500">
                       <span>Transaction ID:</span>
                       <span className="font-mono text-xs">{booking.id}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400">
                <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center mb-4 bg-slate-50">
                  <Activity size={32} />
                </div>
                <p className="font-bold text-slate-500 text-lg">No recent bookings found.</p>
                <p className="text-sm mt-1">Head to the Live Map to book an EV slot!</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
