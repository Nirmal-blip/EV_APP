import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { collection, onSnapshot, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Loader2, BatteryCharging, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  .animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  .neo-card {
    background: #fff;
    border: 2px solid #0f172a;
    border-radius: 20px;
    box-shadow: 4px 4px 0 rgba(15,23,42,0.05);
    transition: all 0.2s ease;
  }
  .neo-card:hover {
    box-shadow: 6px 6px 0 #16a34a;
    transform: translate(-2px, -2px);
    border-color: #16a34a;
  }
  
  /* Mechanical Click Animation */
  .neo-btn:active {
    transform: scale(0.96) translate(2px, 2px) !important;
    box-shadow: 2px 2px 0 #16a34a !important;
  }

  /* Skeleton Loading */
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  .skeleton-bg {
    background: #f1f5f9;
    background-image: linear-gradient(90deg, #f1f5f9 0px, #e2e8f0 40px, #f1f5f9 80px);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite linear;
  }
  
  /* Leaflet Theming */
  .leaflet-popup-content-wrapper {
    background: #fff;
    border: 2px solid #0f172a;
    border-radius: 16px;
    box-shadow: 6px 6px 0 #0f172a;
    padding: 0;
    overflow: hidden;
  }
  .leaflet-popup-tip {
    background: #0f172a;
    border: 2px solid #0f172a;
  }
  .leaflet-popup-content {
    margin: 0;
    font-family: var(--font-body);
  }
`;

// Icon Setup
const createIcon = (color) => new L.DivIcon({
  html: `<svg width="34" height="34" viewBox="0 0 24 24" fill="${color}" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#fff"></circle></svg>`,
  className: "", iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -34]
});

const stationIcon = createIcon('#16a34a'); // Green for stations
const userIcon = createIcon('#3b82f6');    // Blue for YOU

// Calculate Distance (Haversine Formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of Earth in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); 
}

// Controller to sync Map instance and User Location
function MapController({ setUserPosition, setMapInstance }) {
  const map = useMap();
  useEffect(() => {
    setMapInstance(map);
    map.locate().on("locationfound", function (e) {
      setUserPosition(e.latlng);
      map.flyTo(e.latlng, 13);
    });
  }, [map, setMapInstance, setUserPosition]);
  return null;
}

const EVChargingFinder = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoadingId, setBookingLoadingId] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'stations'), (snap) => {
      setStations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleBookSlot = async (station) => {
    if (!currentUser) return toast.error("Please login to book");
    if (bookingLoadingId) return;

    setBookingLoadingId(station.id);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', currentUser.uid);
        const stationRef = doc(db, 'stations', station.id);

        const userSnap = await transaction.get(userRef);
        const stationSnap = await transaction.get(stationRef);

        if (!userSnap.exists()) throw "User profile not found!";
        
        const userData = userSnap.data();
        const stationData = stationSnap.data();

        const currentBalance = Number(userData.walletBalance || 0);
        const cost = Number(stationData.pricePerHour || 0);
        const availableSlots = Number(stationData.availableSlots || 0);

        if (currentBalance < cost) throw `Insufficient Balance (Have ₹${currentBalance})`;
        if (availableSlots <= 0) throw "No slots available!";

        transaction.update(userRef, { walletBalance: currentBalance - cost });
        transaction.update(stationRef, { availableSlots: availableSlots - 1 });

        const bookingRef = doc(collection(db, 'bookings'));
        transaction.set(bookingRef, {
          userId: currentUser.uid,
          userName: userData.name || currentUser.displayName || "User",
          stationId: station.id,
          stationName: stationData.name,
          amount: cost,
          status: 'active',
          createdAt: serverTimestamp()
        });
      });

      toast.success("Deployment Sync Success!", {
        icon: '⚡',
        style: {
          borderRadius: '16px', background: '#0f172a', color: '#fff',
          fontWeight: 800, border: '2px solid #16a34a',
        },
      });
    } catch (err) {
      console.error(err);
      toast.error(typeof err === 'string' ? err : "Transaction failed", {
        style: {
          borderRadius: '16px', background: '#fee2e2', color: '#991b1b',
          fontWeight: 800, border: '2px solid #dc2626',
        },
      });
    } finally {
      setBookingLoadingId(null);
    }
  };

  const handleCardClick = (s) => {
    setSelectedStation(s);
    if (mapInstance && s.lat && s.lng) {
      mapInstance.flyTo([s.lat, s.lng], 16, { animate: true, duration: 1.5 });
    }
  };

  // Process and sort distances
  const processedStations = stations.map(s => {
    const dist = userPosition ? calculateDistance(userPosition.lat, userPosition.lng, s.lat, s.lng) : null;
    return { ...s, distance: dist ? parseFloat(dist) : Infinity, distanceStr: dist };
  }).sort((a, b) => a.distance - b.distance);

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 110px)', marginTop: '110px', overflow: 'hidden', background: '#fff', position: 'relative', zIndex: 10 }}>
      <style>{GLOBAL_CSS}</style>

      {/* Sidebar - Neo Brutalist Style */}
      <aside style={{ width: '440px', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '2px solid #0f172a', borderTop: '2px solid #0f172a', zIndex: 40, position: 'relative', boxShadow: '8px 0 24px rgba(15,23,42,0.06)' }}>
        
        {/* Sidebar Header */}
        <div style={{ padding: '24px 28px', borderBottom: '2px solid #0f172a', background: '#fff', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.03em' }}>
              <Zap size={24} color="#16a34a" fill="#16a34a" /> AhmedabadHubs
            </h2>
            {userPosition && (
               <div style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px', fontWeight: 900, fontFamily: 'monospace', color: '#3b82f6' }}>
                  GPS ACTIVE
               </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 8px #16a34a' }} className="animate-pulse" />
             <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>LIVE NETWORK STREAM</span>
          </div>
        </div>

        {/* Stations List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-lines" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none', zIndex: 0 }} />
          
          {loading ? (
            /* Skeleton State */
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="neo-card" style={{ padding: '24px', position: 'relative', zIndex: 10, borderColor: '#e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div className="skeleton-bg" style={{ height: '24px', width: '50%', borderRadius: '6px' }} />
                  <div className="skeleton-bg" style={{ height: '20px', width: '60px', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div className="skeleton-bg" style={{ height: '60px', flex: 1, borderRadius: '12px' }} />
                  <div className="skeleton-bg" style={{ height: '60px', flex: 1, borderRadius: '12px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '2px solid #f1f5f9' }}>
                  <div className="skeleton-bg" style={{ height: '36px', width: '60px', borderRadius: '6px' }} />
                  <div className="skeleton-bg" style={{ height: '44px', width: '100px', borderRadius: '12px' }} />
                </div>
              </div>
            ))
          ) : (
            /* Active Stations */
            processedStations.map(s => {
              const isSelected = selectedStation?.id === s.id;
              const isBooking = bookingLoadingId === s.id;
              return (
                <div 
                  key={s.id} 
                  className="neo-card group" 
                  style={{ padding: '24px', position: 'relative', zIndex: 10, cursor: 'pointer', borderColor: isSelected ? '#16a34a' : '#0f172a', boxShadow: isSelected ? '6px 6px 0 #16a34a' : '4px 4px 0 rgba(15,23,42,0.05)', transform: isSelected ? 'translate(-2px, -2px)' : 'none' }}
                  onClick={() => handleCardClick(s)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em', textTransform: 'lowercase' }} className="group-hover:text-[#16a34a] transition-colors">
                          {s.name}
                        </h3>
                        {s.distanceStr && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '11px', fontWeight: 800 }}>
                            <Navigation size={12} color="#94a3b8" /> {s.distanceStr} <span style={{ fontFamily: 'monospace' }}>km away</span>
                          </div>
                        )}
                    </div>
                    {s.availableSlots > 0 ? (
                      <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #16a34a', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, fontFamily: 'monospace' }}>ACTIVE</span>
                    ) : (
                      <span style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #94a3b8', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, fontFamily: 'monospace' }}>FULL</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                      <p style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 800, color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hardware</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.chargerType}</p>
                    </div>
                    <div style={{ flex: 1, background: '#f0fdf4', padding: '12px', borderRadius: '12px', border: '1.5px solid #bbf7d0' }}>
                      <p style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 800, color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slots</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 800, color: '#16a34a', margin: 0 }}>{s.availableSlots} Left</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: '20px', borderTop: '2px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '2px' }}>₹</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900, color: '#0f172a', lineHeight: '1' }}>{s.pricePerHour}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleBookSlot(s); }} 
                      disabled={isBooking || s.availableSlots <= 0} 
                      className={`neo-btn ${(isBooking || s.availableSlots <= 0) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      style={{ 
                        background: '#0f172a', color: '#fff', border: '2px solid #0f172a', 
                        padding: '12px 28px', borderRadius: '12px', fontFamily: 'var(--font-body)', 
                        fontWeight: 800, fontSize: '14px',
                        boxShadow: '4px 4px 0 #16a34a', transition: 'all 0.15s ease-out',
                      }}
                      onMouseEnter={(e) => {
                        if (!isBooking && s.availableSlots > 0) {
                          e.currentTarget.style.transform = 'translate(-2px, -2px)';
                          e.currentTarget.style.boxShadow = '6px 6px 0 #16a34a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isBooking && s.availableSlots > 0) {
                          e.currentTarget.style.transform = 'translate(0px, 0px)';
                          e.currentTarget.style.boxShadow = '4px 4px 0 #16a34a';
                        }
                      }}
                    >
                      {isBooking ? <Loader2 className="animate-spin" size={16} /> : 'Book'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Map Area */}
      <main style={{ flex: 1, position: 'relative', zIndex: 0, background: '#f1f5f9', borderTop: '2px solid #0f172a' }}>
        <MapContainer center={[23.0225, 72.5714]} zoom={13} style={{ height: '100%', width: '100%', fontFamily: 'var(--font-body)' }}>
          <MapController setUserPosition={setUserPosition} setMapInstance={setMapInstance} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          
          {userPosition && (
            <Marker position={userPosition} icon={userIcon}>
              <Popup>
                <div style={{ padding: '16px', borderBottom: '2px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} className="animate-pulse" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6', letterSpacing: '0.1em' }}>YOUR LOCATION</span>
                  </div>
                  <p style={{ margin: 0, marginTop: '4px', fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    You are here
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {stations.map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon}>
              <Popup>
                <div style={{ padding: '20px', minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '12px' }}>
                    <div style={{ background: '#16a34a', padding: '6px', borderRadius: '8px' }}>
                      <BatteryCharging size={16} color="#fff" />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.chargerType}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 16px 0', lineHeight: '1.2' }}>{s.name}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                       <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>₹</span>
                       <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{s.pricePerHour}</span>
                    </div>
                    <span style={{ background: s.availableSlots > 0 ? '#dcfce7' : '#f1f5f9', color: s.availableSlots > 0 ? '#15803d' : '#64748b', fontSize: '11px', fontWeight: 900, padding: '4px 8px', borderRadius: '6px' }}>
                      {s.availableSlots} SLOTS
                    </span>
                  </div>

                  <button 
                     onClick={() => handleBookSlot(s)}
                     disabled={(bookingLoadingId === s.id) || s.availableSlots <= 0}
                     className="neo-btn"
                     style={{ 
                       width: '100%', background: '#0f172a', color: '#fff', border: 'none', 
                       padding: '12px', borderRadius: '10px', fontFamily: 'var(--font-body)', 
                       fontWeight: 800, fontSize: '14px', cursor: ((bookingLoadingId === s.id) || s.availableSlots <= 0) ? 'not-allowed' : 'pointer',
                       opacity: ((bookingLoadingId === s.id) || s.availableSlots <= 0) ? 0.7 : 1, transition: 'all 0.15s ease-out'
                     }}
                  >
                    {(bookingLoadingId === s.id) ? <Loader2 className="animate-spin relative left-1/2 -ml-2" size={16} /> : 'Confirm Booking'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Subtle grid overlay to map borders to integrate into hardware aesthetic */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.05)', zIndex: 1000 }} />
      </main>
    </div>
  );
};

export default EVChargingFinder;