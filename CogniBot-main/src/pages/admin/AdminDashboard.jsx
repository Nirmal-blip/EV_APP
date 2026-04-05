import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, BatteryCharging, IndianRupee, Activity, ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ revenue: 0, energy: 0, users: 0, activeStations: 0 });
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList = usersSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(u => u.role !== 'admin');
        const bookingsSnap = await getDocs(collection(db, 'bookings'));
        let totalRevenue = 0;
        let totalEnergy = 0; 
        const bookingsList = [];
        bookingsSnap.forEach(doc => {
          const data = doc.data();
          totalRevenue += (data.amount || 0);
          totalEnergy += (data.energykWh || 5.5);
          bookingsList.push({ id: doc.id, ...data });
        });

        // Bind latest bookings to users
        const usersWithBookings = usersList.map(user => {
            const userBookings = bookingsList.filter(b => b.userId === user.id);
            // Sort by descending time if exists
            userBookings.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
            
            return {
                ...user,
                totalBookings: userBookings.length,
                latestBooking: userBookings[0] || null,
            };
        });
        const stationsSnap = await getDocs(collection(db, 'stations'));

        setStats({
          revenue: totalRevenue,
          energy: totalEnergy,
          users: usersSnap.size,
          activeStations: stationsSnap.size,
        });
        setUsers(usersWithBookings);
      } catch (err) {
        console.error("Admin data fetch failed: ", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      
      {/* Premium Hero Section */}
      <div className="bg-slate-900 pt-32 pb-28 relative overflow-hidden">
        {/* Deep Mesh Gradients */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-4 bg-slate-800/50 w-max px-4 py-2 rounded-full border border-slate-700/50 backdrop-blur-md">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-green-400 font-bold uppercase tracking-widest text-xs">System Online & Secure</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
                Command Center
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-xl">
                Monitor live charging metrics, manage user wallets, and oversee the entire EV operating network globally.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-5 shadow-2xl">
               <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center border border-purple-500/30">
                  <ShieldAlert size={28} />
               </div>
               <div>
                   <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Network Integrity</span>
                   <span className="text-white font-black text-xl">100% Operational</span>
               </div>
            </div>
          </motion.div>
        </div>
        
        {/* Subtle Bottom Border styling */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      </div>

      {/* Embedded Floating Widgets Phase */}
      <div className="container mx-auto px-4 max-w-6xl -mt-14 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { title: 'Total Revenue', value: `₹${stats.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
            { title: 'Energy Supplied', value: `${stats.energy.toFixed(1)} kWh`, icon: BatteryCharging, color: 'text-blue-600', bg: 'bg-blue-100' },
            { title: 'Registered Users', value: stats.users, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
            { title: 'Active Stations', value: stats.activeStations, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' }
          ].map((stat, idx) => (
            <motion.div 
              key={stat.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (idx * 0.1) }}
              className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={stat.color} size={28} />
                </div>
              </div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Directory Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
               <Users size={24} className="text-purple-500" /> Identity Directory
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="py-4 px-4 font-bold text-slate-400 text-xs uppercase tracking-widest">User Details</th>
                  <th className="py-4 px-4 font-bold text-slate-400 text-xs uppercase tracking-widest text-center">Total Bookings</th>
                  <th className="py-4 px-4 font-bold text-slate-400 text-xs uppercase tracking-widest">Latest Station</th>
                  <th className="py-4 px-4 font-bold text-slate-400 text-xs uppercase tracking-widest text-right">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="4" className="text-center py-12 text-slate-400 font-medium">Synchronizing cross-platform identity tables...</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                    <td className="py-5 px-4 font-bold text-slate-900 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs border border-slate-200 font-bold group-hover:bg-white transition-colors">
                          {(u.name || (u.email && u.email[0]) || 'A').charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <div>{u.name || 'Anonymous User'}</div>
                         <div className="text-xs text-slate-400 font-medium">{u.email}</div>
                       </div>
                    </td>
                    <td className="py-5 px-4 text-slate-500 font-medium text-center">
                       <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-700 font-bold">{u.totalBookings || 0}</span>
                    </td>
                    <td className="py-5 px-4 text-slate-500 font-medium">
                       {u.latestBooking ? (
                         <div className="flex items-center gap-2">
                            <span className="truncate max-w-[150px] font-bold text-slate-700 block">{u.latestBooking.stationId || u.latestBooking.stationName || 'N/A'}</span>
                         </div>
                       ) : (
                         <span className="text-slate-300 italic text-sm">No bookings yet</span>
                       )}
                    </td>
                    <td className="py-5 px-4 text-right">
                       {u.latestBooking ? (
                         <div className="flex flex-col items-end">
                            <span className="font-black text-slate-900 text-sm">₹{u.latestBooking.amount || 0}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mt-1 ${u.latestBooking.paymentStatus === 'completed' || u.latestBooking.paymentStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {u.latestBooking.paymentStatus || 'Pending'}
                            </span>
                         </div>
                       ) : (
                         <span className="text-slate-300">-</span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
