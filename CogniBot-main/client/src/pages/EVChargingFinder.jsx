import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  limit,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Loader2, BatteryCharging, Navigation, Wifi, WifiOff, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ocppSyncService } from '../services/ocppService';

const DEFAULT_ENERGY_RATE_PER_KWH = Number(import.meta.env.VITE_DEFAULT_ENERGY_RATE_PER_KWH) || 12;

function parseEnergyWhFromTelemetry(telemetry) {
  const mv = telemetry?.lastMeterValues?.meterValue;
  if (!Array.isArray(mv) || mv.length === 0) return null;
  const sampled = mv[0]?.sampledValue;
  if (!Array.isArray(sampled)) return null;
  const entry = sampled.find((v) => v?.measurand === 'Energy.Active.Import.Register');
  if (entry == null || entry.value === '' || entry.value == null) return null;
  const n = Number(entry.value);
  return Number.isFinite(n) ? n : null;
}

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

function energyRateForStation(station) {
  const r = Number(station?.energyRatePerKwh);
  return r > 0 ? r : DEFAULT_ENERGY_RATE_PER_KWH;
}

function liveConsumptionBill(booking, station, telemetry) {
  const startWh = Number(booking?.meterStartWh);
  const liveWh = parseEnergyWhFromTelemetry(telemetry);
  const rate = energyRateForStation(station);
  if (!Number.isFinite(startWh) || liveWh == null) {
    return { energyKwh: 0, energyCharge: 0, ratePerKwh: rate, meterWh: liveWh };
  }
  const energyKwh = Math.max(0, roundMoney((liveWh - startWh) / 1000));
  const energyCharge = roundMoney(energyKwh * rate);
  return { energyKwh, energyCharge, ratePerKwh: rate, meterWh: liveWh };
}

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

function toFiniteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isValidLatLng(lat, lng) {
  const la = toFiniteNumber(lat);
  const ln = toFiniteNumber(lng);
  return (
    la !== null &&
    ln !== null &&
    la >= -90 &&
    la <= 90 &&
    ln >= -180 &&
    ln <= 180
  );
}

function getOcppStationId(station) {
  return station?.ocppStationId || station?.id;
}

function isStationConsideredOnline(station) {
  return station && station.isOnline !== false;
}

function stationSlotsAllowStart(station) {
  if (station?.availableSlots == null || station?.availableSlots === '') return true;
  const n = Number(station.availableSlots);
  return Number.isFinite(n) && n > 0;
}

function effectiveConnectorStatusLabel(station, stationStatuses) {
  const st = station?.status;
  if (st != null && String(st).trim() !== '') return String(st).trim();
  const ocppId = getOcppStationId(station);
  const live = stationStatuses?.[ocppId]?.status;
  if (live != null && String(live).trim() !== '') return String(live).trim();
  return 'Available';
}

function connectorSessionFlags(station, stationStatuses) {
  const label = effectiveConnectorStatusLabel(station, stationStatuses);
  const n = label.toLowerCase();
  const isAvailable = n === 'available';
  return { label, isAvailable };
}

function sessionStartedAtMs(startedAt) {
  if (!startedAt) return null;
  if (typeof startedAt.toMillis === 'function') return startedAt.toMillis();
  if (startedAt.seconds != null) return startedAt.seconds * 1000;
  return null;
}

function formatSessionElapsed(startedAt) {
  const ms = sessionStartedAtMs(startedAt);
  if (ms == null) return null;
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!isValidLatLng(lat1, lon1) || !isValidLatLng(lat2, lon2)) return null;
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
  const [stationStatuses, setStationStatuses] = useState({});
  const [userPosition, setUserPosition] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [routePath, setRoutePath] = useState(null);
  const [lastRouteFetchPosition, setLastRouteFetchPosition] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [receiptModal, setReceiptModal] = useState(null);
  const { currentUser } = useAuth();

  const bookingForStation = (stationId) => myBookings.find((b) => b.stationId === stationId);

  const hasActiveChargingSession = myBookings.some((b) => b.status === 'active');
  const [, setChargeTick] = useState(0);
  useEffect(() => {
    if (!hasActiveChargingSession) return undefined;
    const id = setInterval(() => setChargeTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [hasActiveChargingSession]);

  useEffect(() => {
    if (!currentUser) {
      setMyBookings([]);
      return;
    }
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', currentUser.uid),
      limit(40)
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyBookings(rows.filter((b) => b.status === 'active'));
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'stations'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStations(all.filter((s) => s.published === true));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedStation && !stations.some((s) => s.id === selectedStation.id)) {
      setSelectedStation(null);
    }
  }, [stations, selectedStation]);

  useEffect(() => {
    ocppSyncService.subscribeToStations(
      stations.map((station) => ({
        docId: station.id,
        ocppStationId: getOcppStationId(station),
      }))
    );
  }, [stations]);

  useEffect(() => () => ocppSyncService.dispose(), []);

  useEffect(() => {
    let cancelled = false;

    async function refreshStatuses() {
      if (stations.length === 0) return;
      try {
        const results = await Promise.all(
          stations.map(async (s) => {
            const stationId = getOcppStationId(s);
            if (!stationId) return null;
            try {
              const status = await ocppSyncService.fetchStationStatus(stationId);
              return [stationId, status];
            } catch {
              return [stationId, { stationId, connected: false, status: "Unavailable" }];
            }
          })
        );

        if (cancelled) return;
        const next = {};
        for (const r of results) {
          if (!r) continue;
          next[r[0]] = r[1];
        }
        setStationStatuses(next);
      } catch {
        // ignore
      }
    }

    refreshStatuses();
    const pollMs = hasActiveChargingSession ? 2500 : 5000;
    const id = setInterval(refreshStatuses, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [stations, hasActiveChargingSession]);

  const handleStartCharging = async (station) => {
    if (!currentUser) return toast.error('Please sign in');
    if (bookingLoadingId) return;

    setBookingLoadingId(station.id);
    try {
      const response = await ocppSyncService.sendRemoteStart(getOcppStationId(station), {
        idTag: currentUser.uid,
        connectorId: station.connectorId || 1,
      });
      
      const ocppId = getOcppStationId(station);
      const meterStartWh = parseEnergyWhFromTelemetry(stationStatuses?.[ocppId]?.telemetry) ?? 0;

      await setDoc(doc(collection(db, 'bookings')), {
        userId: currentUser.uid,
        stationId: station.id,
        stationName: station.name,
        connectorId: station.connectorId || 1,
        status: 'active',
        createdAt: serverTimestamp(),
        startedAt: serverTimestamp(),
        meterStartWh,
      });
      toast.success('Start command sent successfully');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBookingLoadingId(null);
    }
  };

  const handleStopCharging = async (station) => {
    const stationId = getOcppStationId(station);
    if (!stationId) return toast.error('Missing station id');
    if (bookingLoadingId) return;

    setBookingLoadingId(station.id);
    try {
      const txId = stationStatuses?.[stationId]?.telemetry?.lastMeterValues?.transactionId;
      await ocppSyncService.sendRemoteStop(stationId, { transactionId: txId || undefined });

      const booking = bookingForStation(station.id);
      if (booking && booking.status === 'active') {
        const meterEndWh = parseEnergyWhFromTelemetry(stationStatuses?.[stationId]?.telemetry) ?? 0;
        const startWh = Number(booking.meterStartWh) || 0;
        
        // Calculate Bill
        const energyKwh = Math.max(0, roundMoney((meterEndWh - startWh) / 1000));
        const rate = energyRateForStation(station);
        const energyCharge = roundMoney(energyKwh * rate);

        // This removes the active session and resets the card
        await updateDoc(doc(db, 'bookings', booking.id), {
          status: 'completed',
          completedAt: serverTimestamp(),
          meterEndWh,
          energyKwh,
          energyCharge,
          energyRatePerKwh: rate,
          billTotal: energyCharge,
        });

        // Show Bill Popup
        setReceiptModal({
          stationName: booking.stationName || station.name,
          energyKwh,
          ratePerKwh: rate,
          energyCharge,
          billTotal: energyCharge,
          meterStartWh: startWh,
          meterEndWh,
        });
      }

      toast.success('Stop command sent successfully. Session ended.');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBookingLoadingId(null);
    }
  };

  function renderStatusBadge(status) {
    const raw = String(status || 'Unavailable').trim();
    const key = raw.toLowerCase();
    const palette =
      key === 'charging' || key === 'suspendedev' || key === 'suspendedevse'
        ? { bg: '#dcfce7', fg: '#15803d', border: '#16a34a' }
        : key === 'preparing' || key === 'finishing'
          ? { bg: '#dbeafe', fg: '#1d4ed8', border: '#3b82f6' }
          : key === 'available'
            ? { bg: '#f1f5f9', fg: '#334155', border: '#94a3b8' }
            : { bg: '#fee2e2', fg: '#991b1b', border: '#dc2626' };

    return (
      <span
        style={{
          background: palette.bg,
          color: palette.fg,
          border: `1.5px solid ${palette.border}`,
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: '9px',
          fontWeight: 900,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {raw.toUpperCase()}
      </span>
    );
  }

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
    if (!mapInstance || !isValidLatLng(s.lat, s.lng)) return;
    if (userPosition) {
      const coords = await fetchRoute(userPosition, { lat: Number(s.lat), lng: Number(s.lng) });
      if (coords) {
        mapInstance.fitBounds(
          L.latLngBounds([userPosition, [Number(s.lat), Number(s.lng)]]),
          { padding: [80, 80], animate: true }
        );
        return;
      }
    }
    setRoutePath(null);
    setLastRouteFetchPosition(null);
    mapInstance.flyTo([Number(s.lat), Number(s.lng)], 16, { animate: true });
  };

  const processedStations = stations
    .map((s) => {
      const lat = toFiniteNumber(s.lat);
      const lng = toFiniteNumber(s.lng);
      const dist = userPosition ? calculateDistance(userPosition.lat, userPosition.lng, lat, lng) : null;
      return { ...s, lat, lng, distance: dist ? parseFloat(dist) : Infinity, distanceStr: dist };
    })
    .sort((a, b) => a.distance - b.distance);

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
              const conn = connectorSessionFlags(s, stationStatuses);
              const ub = bookingForStation(s.id);
              
              const showStart = conn.isAvailable;
              const showStop = !conn.isAvailable;
              
              // Compute live consumption
              const live = ub?.status === 'active' 
                ? liveConsumptionBill(ub, s, stationStatuses?.[getOcppStationId(s)]?.telemetry) 
                : null;
              
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
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.06em' }}>
                      CONNECTOR (OCPP)
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {renderStatusBadge(conn.label)}
                      {isStationConsideredOnline(s) ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', border: '1.5px solid #16a34a', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Wifi size={10} /> ONLINE
                        </span>
                      ) : (
                        <span style={{ background: '#fee2e2', color: '#991b1b', border: '1.5px solid #dc2626', padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <WifiOff size={10} /> OFFLINE
                        </span>
                      )}
                    </div>
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
                    <div
                      style={{
                        background: '#f1f5f9',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1.5px solid #e2e8f0',
                      }}
                    >
                      <p style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 800, color: '#94a3b8', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Diagnostics</p>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', margin: 0 }}>
                        Slots: {s.availableSlots == null || s.availableSlots === '' ? '—' : s.availableSlots}
                      </p>
                      <p style={{ fontSize: '10px', color: s.errorCode === 'NoError' ? '#64748b' : '#dc2626', margin: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {s.errorCode !== 'NoError' && <AlertCircle size={10} />} {s.errorCode}
                      </p>
                    </div>
                  </div>

                  <div style={{ paddingTop: '16px', borderTop: '2px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>₹{energyRateForStation(s)}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginLeft: '8px' }}>/kWh</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '9px', fontWeight: 800, color: '#94a3b8', fontFamily: 'monospace' }}>
                          SYNC: {s.lastSeen?.toDate ? s.lastSeen.toDate().toLocaleTimeString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                      {!currentUser && (
                      <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: 700, color: '#b45309' }}>Sign in to control charger.</p>
                    )}
                    
                    {/* Live Active Session UI */}
                    {ub?.status === 'active' && live && (
                      <div
                        style={{
                          marginBottom: '12px',
                          padding: '14px 16px',
                          borderRadius: '14px',
                          border: '2px solid #16a34a',
                          background: 'linear-gradient(135deg, #dcfce7 0%, #ecfdf5 100%)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <BatteryCharging size={28} color="#15803d" className="animate-pulse" />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#15803d', letterSpacing: '0.05em' }}>YOUR SESSION · LIVE</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <p style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#14532d' }}>₹{live.energyCharge}</p>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#166534' }}>{live.energyKwh} kWh</p>
                            </div>
                            {formatSessionElapsed(ub.startedAt) && (
                              <p style={{ margin: '6px 0 0 0', fontSize: '11px', fontWeight: 700, color: '#166534', fontFamily: 'monospace' }}>
                                Duration: {formatSessionElapsed(ub.startedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {showStart && (
                        <button
                          type="button"
                          onClick={() => handleStartCharging(s)}
                          disabled={isStationBooking}
                          style={{
                            background: '#16a34a',
                            color: '#fff',
                            border: '2px solid #15803d',
                            padding: '10px 22px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '14px',
                            boxShadow: '4px 4px 0 #0f172a',
                            cursor: isStationBooking ? 'wait' : 'pointer',
                            opacity: isStationBooking ? 0.75 : 1,
                          }}
                        >
                          {isStationBooking ? <Loader2 className="animate-spin" size={16} /> : 'Start charging'}
                        </button>
                      )}
                      {showStop && (
                        <button
                          type="button"
                          onClick={() => handleStopCharging(s)}
                          disabled={isStationBooking}
                          style={{
                            background: '#fff',
                            color: '#b91c1c',
                            border: '2px solid #b91c1c',
                            padding: '10px 22px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '14px',
                            boxShadow: '4px 4px 0 #0f172a',
                            cursor: isStationBooking ? 'wait' : 'pointer',
                          }}
                        >
                          {isStationBooking ? <Loader2 className="animate-spin" size={16} /> : 'Stop charging'}
                        </button>
                      )}
                    </div>
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

          {processedStations.filter((s) => isValidLatLng(s.lat, s.lng)).map((s) => {
            const pubUb = bookingForStation(s.id);
            const pubLoading = bookingLoadingId === s.id;
            const pubConn = connectorSessionFlags(s, stationStatuses);
            
            const pubShowStart = pubConn.isAvailable;
            const pubShowStop = !pubConn.isAvailable;

            const pubLive = pubUb?.status === 'active' 
                ? liveConsumptionBill(pubUb, s, stationStatuses?.[getOcppStationId(s)]?.telemetry) 
                : null;
            
            return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon}>
              <Popup>
                <div style={{ padding: '20px', minWidth: '240px' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 900, margin: '0 0 10px 0' }}>{s.name}</p>
                  <p style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', margin: '0 0 6px 0' }}>CONNECTOR (OCPP)</p>
                  <div style={{ marginBottom: '10px' }}>
                    {renderStatusBadge(pubConn.label)}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                    <p style={{ fontSize: '12px', margin: '0 0 4px 0', fontWeight: 700 }}>{s.vendor} {s.model}</p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Connector ID: {s.connectorId}</p>
                    <p style={{ fontSize: '11px', color: isStationConsideredOnline(s) ? '#16a34a' : '#dc2626', fontWeight: 800, margin: '4px 0 0 0' }}>{isStationConsideredOnline(s) ? 'Network: ACTIVE' : 'Network: OFFLINE'}</p>
                  </div>
                  {!currentUser && (
                    <p style={{ fontSize: '11px', color: '#b45309', fontWeight: 700 }}>Sign in to control charger.</p>
                  )}
                  {pubUb?.status === 'active' && pubLive && (
                    <div style={{ padding: '10px', borderRadius: '10px', border: '2px solid #16a34a', background: '#ecfdf5', marginBottom: '10px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 900, color: '#15803d', margin: 0 }}>YOUR SESSION · LIVE</p>
                      <p style={{ fontSize: '14px', fontWeight: 900, color: '#14532d', margin: '6px 0 0 0' }}>₹{pubLive.energyCharge} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>({pubLive.energyKwh} kWh)</span></p>
                      {formatSessionElapsed(pubUb.startedAt) && (
                        <p style={{ fontSize: '11px', fontWeight: 700, margin: '4px 0 0 0', fontFamily: 'monospace', color: '#166534' }}>{formatSessionElapsed(pubUb.startedAt)}</p>
                      )}
                    </div>
                  )}
                  {pubShowStart && (
                    <button
                      type="button"
                      onClick={() => handleStartCharging(s)}
                      disabled={pubLoading}
                      style={{
                        width: '100%',
                        marginTop: 8,
                        background: '#16a34a',
                        color: '#fff',
                        padding: '12px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        border: 'none',
                        cursor: pubLoading ? 'wait' : 'pointer',
                      }}
                    >
                      {pubLoading ? '…' : 'Start charging'}
                    </button>
                  )}
                  {pubShowStop && (
                    <button
                      type="button"
                      onClick={() => handleStopCharging(s)}
                      disabled={pubLoading}
                      style={{
                        marginTop: 8,
                        width: '100%',
                        background: '#fff',
                        color: '#b91c1c',
                        padding: '12px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        border: '2px solid #b91c1c',
                        cursor: pubLoading ? 'wait' : 'pointer',
                      }}
                    >
                      {pubLoading ? '…' : 'Stop charging'}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );})}
        </MapContainer>
      </main>

      {/* Bill / Receipt Modal */}
      {receiptModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setReceiptModal(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              border: '2px solid #0f172a',
              borderRadius: '20px',
              boxShadow: '8px 8px 0 #16a34a',
              maxWidth: '440px',
              width: '100%',
              padding: '24px 28px',
              position: 'relative',
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setReceiptModal(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '4px',
                color: '#64748b',
              }}
            >
              <X size={22} />
            </button>
            <h2 id="receipt-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 900, margin: '0 32px 16px 0', color: '#0f172a' }}>
              Final Bill
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#334155' }}>{receiptModal.stationName}</p>
            <div style={{ border: '2px solid #f1f5f9', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Energy consumed</span>
                <span style={{ fontWeight: 800 }}>{receiptModal.energyKwh} kWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Rate per kWh</span>
                <span style={{ fontWeight: 800 }}>₹{receiptModal.ratePerKwh}</span>
              </div>
              <div style={{ borderTop: '2px solid #0f172a', paddingTop: '12px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: '#16a34a' }}>
                <span>Total Cost</span>
                <span>₹{receiptModal.billTotal}</span>
              </div>
              <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Meter Reading (Wh): {receiptModal.meterStartWh} → {receiptModal.meterEndWh}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReceiptModal(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 800,
                border: '2px solid #0f172a',
                background: '#0f172a',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EVChargingFinder;