import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { collection, onSnapshot, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Loader2, BatteryCharging, Navigation, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ocppSyncService } from '../services/ocppService';

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
  .neo-btn:active {
    transform: scale(0.96) translate(2px, 2px) !important;
    box-shadow: 2px 2px 0 #16a34a !important;
  }
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
  .leaflet-popup-content-wrapper {
    background: #fff;
    border: 2px solid #0f172a;
    border-radius: 16px;
    box-shadow: 6px 6px 0 #0f172a;
    padding: 0;
    overflow: hidden;
  }
  .leaflet-popup-tip { background: #0f172a; border: 2px solid #0f172a; }
  .leaflet-popup-content { margin: 0; font-family: var(--font-body); }
`;

const createIcon = (color) => new L.DivIcon({
  html: `<svg width="34" height="34" viewBox="0 0 24 24" fill="${color}" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#fff"></circle></svg>`,
  className: "", iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -34]
});

const stationIcon = createIcon('#16a34a');
const userIcon = createIcon('#3b82f6');

function getOcppStationId(station) {
  return station?.ocppStationId || station?.id;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); 
}

function MapController({ setUserPosition, setMapInstance }) {
  const map = useMap();
  useEffect(() => {
    setMapInstance(map);
    let initialLocationFly = false;
    map.locate({ watch: true, enableHighAccuracy: true }).on("locationfound", function (e) {
      setUserPosition(e.latlng);
      if (!initialLocationFly) {
        initialLocationFly = true;
        map.flyTo(e.latlng, 13);
      }
    });
    return () => map.stopLocate();
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
  const [routePath, setRoutePath] = useState(null);
  const [lastRouteFetchPosition, setLastRouteFetchPosition] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'stations'), (snap) => {
      setStations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    ocppSyncService.subscribeToStations(
      stations.map((station) => ({
        docId: station.id,
        ocppStationId: getOcppStationId(station),
      }))
    );
  }, [stations]);

  useEffect(() => () => ocppSyncService.dispose(), []);

  const handleBookSlot = async (station) => {

    if (!currentUser)
      return toast.error("Please login to start charging");
  
    if (!station.isOnline)
      return toast.error("Station offline");
  
    if (station.availableSlots <= 0)
      return toast.error("No slots available");
  
    if (bookingLoadingId)
      return;
  
    setBookingLoadingId(station.id);
  
    const bookingRef = doc(collection(db, "bookings"));
  
    let bookingCreated = false;
    let deductedAmount = 0;
  
    try {
  
      /* ================= STEP 1 WALLET + BOOKING ================= */
  
      await runTransaction(db, async (transaction) => {
  
        const userRef = doc(db, "users", currentUser.uid);
        const stationRef = doc(db, "stations", station.id);
  
        const userSnap = await transaction.get(userRef);
        const stationSnap = await transaction.get(stationRef);
  
        if (!userSnap.exists())
          throw new Error("User profile missing");
  
        if (!stationSnap.exists())
          throw new Error("Station missing");
  
        const userData = userSnap.data();
        const stationData = stationSnap.data();
  
        const wallet = Number(userData.walletBalance || 0);
        const cost = Number(stationData.pricePerHour || 0);
  
        if (wallet < cost)
          throw new Error("Low wallet balance");
  
        transaction.update(userRef, {
          walletBalance: wallet - cost
        });
  
        transaction.set(bookingRef, {
  
          userId: currentUser.uid,
          stationId: station.id,
          stationName: station.name,
  
          connectorId: station.connectorId || 1,
  
          amount: cost,
  
          status: "starting",
  
          createdAt: serverTimestamp()
  
        });
  
        bookingCreated = true;
        deductedAmount = cost;
  
      });
  
      /* ================= STEP 2 SEND OCPP COMMAND ================= */
  
      const response =
        await ocppSyncService.sendRemoteStart(
  
          getOcppStationId(station),
  
          {
            idTag: currentUser.uid,
            connectorId: station.connectorId || 1
          }
  
        );
  
      const status =
        response?.status ||
        response?.idTagInfo?.status ||
        "Accepted";
  
      if (status !== "Accepted")
        throw new Error("Charger rejected start request");
  
      /* ================= STEP 3 CONFIRM ACTIVE ================= */
  
      await runTransaction(db, async (transaction) => {
  
        const bookingSnap =
          await transaction.get(bookingRef);
  
        if (bookingSnap.exists()) {
  
          transaction.update(bookingRef, {
  
            status: "active",
  
            startedAt: serverTimestamp(),
  
            ocppRemoteStartAccepted: true
  
          });
  
        }
  
      });
  
      toast.success("Charging Started ⚡");
  
    }
  
    catch (err) {
  
      console.error(err);
  
      const message =
        err instanceof Error
          ? err.message
          : String(err);
  
      /* ================= ROLLBACK ================= */
  
      if (bookingCreated) {
  
        try {
  
          await runTransaction(db, async (transaction) => {
  
            const userRef =
              doc(db, "users", currentUser.uid);
  
            const userSnap =
              await transaction.get(userRef);
  
            if (userSnap.exists()) {
  
              transaction.update(userRef, {
  
                walletBalance:
                  Number(
                    userSnap.data().walletBalance || 0
                  ) + deductedAmount
  
              });
  
              transaction.update(bookingRef, {
  
                status: "failed",
  
                failureReason: message,
  
                failedAt: serverTimestamp()
  
              });
  
            }
  
          });
  
        }
  
        catch (rollbackError) {
  
          console.error(
            "Rollback failed",
            rollbackError
          );
  
        }
  
      }
  
      toast.error(message);
  
    }
  
    finally {
  
      setBookingLoadingId(null);
  
    }
  
  };

  const fetchRoute = async (start, end) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        setRoutePath(coords);
        setLastRouteFetchPosition(start);
        return coords;
      }
    } catch (err) { console.error("Routing error:", err); }
    return null;
  };

  useEffect(() => {
    if (!selectedStation || !userPosition || !lastRouteFetchPosition) return;
    const distMovedKm = calculateDistance(userPosition.lat, userPosition.lng, lastRouteFetchPosition.lat, lastRouteFetchPosition.lng);
    if (distMovedKm && parseFloat(distMovedKm) > 0.02) {
      fetchRoute(userPosition, { lat: selectedStation.lat, lng: selectedStation.lng });
    }
  }, [userPosition, selectedStation, lastRouteFetchPosition]);

  const handleCardClick = async (s) => {
    setSelectedStation(s);
    if (!mapInstance || !s.lat || !s.lng) return;
    if (userPosition) {
      const coords = await fetchRoute(userPosition, { lat: s.lat, lng: s.lng });
      if (coords) {
        mapInstance.fitBounds(L.latLngBounds([userPosition, [s.lat, s.lng]]), { padding: [80, 80], animate: true });
        return;
      }
    }
    setRoutePath(null);
    setLastRouteFetchPosition(null);
    mapInstance.flyTo([s.lat, s.lng], 16, { animate: true });
  };

  const processedStations = stations.map(s => {
    const dist = userPosition ? calculateDistance(userPosition.lat, userPosition.lng, s.lat, s.lng) : null;
    return { ...s, distance: dist ? parseFloat(dist) : Infinity, distanceStr: dist };
  }).sort((a, b) => a.distance - b.distance);

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 110px)', marginTop: '110px', overflow: 'hidden', background: '#fff', position: 'relative', zIndex: 10 }}>
      <style>{GLOBAL_CSS}</style>

      <aside style={{ width: '440px', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '2px solid #0f172a', borderTop: '2px solid #0f172a', zIndex: 40, position: 'relative' }}>
        
        {/* Sidebar Header */}
        <div style={{ padding: '24px 28px', borderBottom: '2px solid #0f172a', background: '#fff' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={24} color="#16a34a" fill="#16a34a" /> AhmedabadHubs
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} className="animate-pulse" />
             <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>LIVE NETWORK STREAM</span>
          </div>
        </div>

        {/* Stations List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
             Array.from({ length: 3 }).map((_, i) => <div key={i} className="neo-card skeleton-bg" style={{ height: '200px' }} />)
          ) : (
            processedStations.map(s => {
              const isSelected = selectedStation?.id === s.id;
              const isStationBooking = bookingLoadingId === s.id;
              return (
                <div 
                  key={s.id} 
                  className="neo-card group" 
                  style={{ 
                    padding: '24px', position: 'relative', cursor: 'pointer', 
                    borderColor: isSelected ? '#16a34a' : '#0f172a',
                    boxShadow: isSelected ? '6px 6px 0 #16a34a' : '4px 4px 0 rgba(15,23,42,0.05)',
                    transform: isSelected ? 'translate(-2px, -2px)' : 'none' 
                  }}
                  onClick={() => handleCardClick(s)}
                >
                  <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '6px' }}>
                    {s.isOnline ? (
                       <span style={{ background: '#dcfce7', color: '#15803d', border: '1.5px solid #16a34a', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <Wifi size={10} /> ONLINE
                       </span>
                    ) : (
                       <span style={{ background: '#fee2e2', color: '#991b1b', border: '1.5px solid #dc2626', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <WifiOff size={10} /> OFFLINE
                       </span>
                    )}
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0', textTransform: 'lowercase' }}>
                      {s.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                          {s.status}
                        </span>
                        {s.distanceStr && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '11px', fontWeight: 800 }}>
                            <Navigation size={12} /> {s.distanceStr}km
                          </div>
                        )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                      <p style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 800, color: '#94a3b8', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Hardware</p>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{s.vendor} {s.model}</p>
                      <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>CID: {s.connectorId} • {s.chargerType}</p>
                    </div>
                    <div style={{ background: s.availableSlots > 0 ? '#f0fdf4' : '#f1f5f9', padding: '10px', borderRadius: '12px', border: s.availableSlots > 0 ? '1.5px solid #bbf7d0' : '1.5px solid #e2e8f0' }}>
                      <p style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 800, color: '#94a3b8', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Diagnostics</p>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: s.availableSlots > 0 ? '#16a34a' : '#64748b', margin: 0 }}>{s.availableSlots} Available</p>
                      <p style={{ fontSize: '10px', color: s.errorCode === 'NoError' ? '#64748b' : '#dc2626', margin: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {s.errorCode !== 'NoError' && <AlertCircle size={10} />} {s.errorCode}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: '16px', borderTop: '2px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>₹{s.pricePerHour}</span>
                      <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, color: '#94a3b8', fontFamily: 'monospace' }}>
                        SYNC: {s.lastSeen?.toDate ? s.lastSeen.toDate().toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleBookSlot(s); }} 
                      disabled={isStationBooking || s.availableSlots <= 0 || !s.isOnline} 
                      style={{ 
                        background: '#0f172a', color: '#fff', border: '2px solid #0f172a', 
                        padding: '10px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '14px',
                        boxShadow: '4px 4px 0 #16a34a', opacity: (!s.isOnline || s.availableSlots <= 0) ? 0.6 : 1,
                        cursor: (!s.isOnline || s.availableSlots <= 0) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isStationBooking ? <Loader2 className="animate-spin" size={16} /> : !s.isOnline ? 'Offline' : 'Start'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <main style={{ flex: 1, position: 'relative', zIndex: 0, background: '#f1f5f9' }}>
        <MapContainer center={[23.0225, 72.5714]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <MapController setUserPosition={setUserPosition} setMapInstance={setMapInstance} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          
          {userPosition && (
            <Marker position={userPosition} icon={userIcon}>
              <Popup><div style={{ padding: '10px', fontWeight: 800 }}>You are here</div></Popup>
            </Marker>
          )}

          {routePath && <Polyline positions={routePath} pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.7, dashArray: '12, 16', className: 'animate-pulse-slow' }} />}

          {stations.map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon}>
              <Popup>
                <div style={{ padding: '20px', minWidth: '220px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, margin: '0 0 10px 0' }}>{s.name}</p>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                    <p style={{ fontSize: '12px', margin: '0 0 4px 0', fontWeight: 700 }}>{s.vendor} {s.model}</p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Connector ID: {s.connectorId}</p>
                    <p style={{ fontSize: '11px', color: s.isOnline ? '#16a34a' : '#dc2626', fontWeight: 800, margin: '4px 0 0 0' }}>{s.isOnline ? 'Network: ACTIVE' : 'Network: OFFLINE'}</p>
                  </div>
                  <button 
                     onClick={() => handleBookSlot(s)}
                     disabled={(bookingLoadingId === s.id) || s.availableSlots <= 0 || !s.isOnline}
                     style={{ width: '100%', background: '#0f172a', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                  >
                    {(bookingLoadingId === s.id) ? 'Processing...' : 'Book Slot'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
};

export default EVChargingFinder;