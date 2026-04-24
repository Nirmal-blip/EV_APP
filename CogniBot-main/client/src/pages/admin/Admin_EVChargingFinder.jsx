import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, X, Loader2, Zap, Pencil, MapPin, Cpu, Radio, Activity, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed';
const labelClass = 'block text-xs font-semibold text-slate-600 mb-1.5';
const sectionShell = 'rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5';
const sectionTitle = 'flex items-center gap-2 text-sm font-bold text-slate-900 mb-4';

// 1. Mandatory Leaflet CSS and SVG Icon Setup
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const createIcon = (color) => new L.DivIcon({
  html: `<svg width="30" height="30" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  className: "", iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30]
});

const stationIcon = createIcon('#22c55e'); 
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

function stationDocToForm(s) {
  return {
    name: s.name ?? '',
    ocppStationId: (s.ocppStationId || s.id || '').toString(),
    lat: s.lat != null && s.lat !== '' ? String(s.lat) : '',
    lng: s.lng != null && s.lng !== '' ? String(s.lng) : '',
    availableSlots: s.availableSlots ?? 1,
    pricePerHour: s.pricePerHour ?? 0,
    energyRatePerKwh: s.energyRatePerKwh ?? 12,
    chargerType: s.chargerType || 'Unknown',
    connectorId: s.connectorId ?? 1,
    vendor: s.vendor ?? '',
    model: s.model ?? '',
    status: s.status || 'Available',
    errorCode: s.errorCode || 'NoError',
    isOnline: s.isOnline !== false,
    published: s.published !== false,
  };
}

// 2. Component to handle auto-locating you on Ahmedabad map
function MyLocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", (e) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 14);
    });
  }, [map]);

  return position === null ? null : (
    <Marker position={position} icon={userIcon}><Popup>You are here</Popup></Marker>
  );
}

const EVChargingFinder = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const defaultNewStation = () => ({
    name: '',
    ocppStationId: '',
    lat: '',
    lng: '',
    availableSlots: 1,
    pricePerHour: 0,
    energyRatePerKwh: 12,
    chargerType: 'Unknown',
    connectorId: 1,
    vendor: '',
    model: '',
    status: 'Available',
    errorCode: 'NoError',
    isOnline: true,
    published: true,
  });

  const [newStation, setNewStation] = useState(defaultNewStation);
  /** Firestore document id while editing; null = creating new station */
  const [editingDocId, setEditingDocId] = useState(null);

  const openNewStationModal = () => {
    setEditingDocId(null);
    setNewStation(defaultNewStation());
    setIsModalOpen(true);
  };

  const openEditStationModal = (s) => {
    setEditingDocId(s.id);
    setNewStation(stationDocToForm(s));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDocId(null);
    setNewStation(defaultNewStation());
  };

  const fetchStations = async () => {
    try {
      const snap = await getDocs(collection(db, 'stations'));
      setStations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStations(); }, []);

  // Map click handler to grab coordinates
  function MapEvents() {
    useMapEvents({
      click(e) {
        if (isModalOpen) {
          setNewStation(prev => ({ ...prev, lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) }));
          toast.success("Location captured for Ahmedabad area!");
        }
      },
    });
    return null;
  }

  // SAVE LOGIC: Matches your Dart toMap() and fromMap()
  const handleSave = async (e) => {
    e.preventDefault();
    const stationDocId = (editingDocId || newStation.ocppStationId.trim());
    if (!stationDocId) return toast.error("OCPP Station ID is required (e.g. CP_001)");
    if (!newStation.name.trim()) return toast.error("Station name is required");
    if (!newStation.lat || !newStation.lng) return toast.error("Click the map to set location!");

    try {
      const schemaData = {
        name: newStation.name.trim(),
        ocppStationId: stationDocId,
        lat: parseFloat(newStation.lat),
        lng: parseFloat(newStation.lng),
        availableSlots: parseInt(newStation.availableSlots, 10) || 0,
        pricePerHour: parseFloat(newStation.pricePerHour) || 0,
        energyRatePerKwh: parseFloat(newStation.energyRatePerKwh) || 0,
        chargerType: newStation.chargerType || 'Unknown',
        connectorId: parseInt(newStation.connectorId, 10) || 1,
        vendor: newStation.vendor.trim() || 'Unknown',
        model: newStation.model.trim() || 'Unknown',
        status: newStation.status || 'Available',
        errorCode: newStation.errorCode || 'NoError',
        isOnline: Boolean(newStation.isOnline),
        lastSeen: serverTimestamp(),
        published: Boolean(newStation.published),
      };

      await setDoc(doc(db, 'stations', stationDocId), schemaData, { merge: true });
      toast.success(editingDocId ? "Station updated" : "Station published");
      closeModal();
      fetchStations();
    } catch (err) {
      toast.error("Firebase Sync Error");
    }
  };

  const editingLastSeenLabel = useMemo(() => {
    if (!editingDocId) return null;
    const docSnap = stations.find((x) => x.id === editingDocId);
    const ls = docSnap?.lastSeen;
    if (!ls) return null;
    if (typeof ls.toDate === 'function') return ls.toDate().toLocaleString();
    if (ls.seconds != null) return new Date(ls.seconds * 1000).toLocaleString();
    return null;
  }, [editingDocId, stations]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-green-500" size={40} /></div>;

  return (
    <div className="flex w-full mt-16 h-[calc(100vh-64px)] overflow-hidden bg-white relative">
      
      {/* SIDEBAR: Floating look with top/left margins */}
      <aside className="w-80 md:w-96 flex flex-col border border-slate-200 z-10 bg-white shrink-0 mt-4 ml-4 mb-4 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Stations</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ahmedabad Network</p>
          </div>
          <button type="button" onClick={openNewStationModal} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-green-600 transition-all shadow-md">
            <Plus size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
          {stations.length === 0 ? (
            <p className="text-center text-slate-400 text-sm mt-10">No stations found nearby.</p>
          ) : (
            stations.map(s => (
              <div key={s.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-green-400 transition-all group">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 group-hover:text-green-600">{s.name}</h3>
                  <button
                    type="button"
                    onClick={() => openEditStationModal(s)}
                    className="shrink-0 p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                    title="Edit station"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <p className="text-[10px] font-mono text-slate-400 mt-1">{s.id}</p>
                <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
                  <Zap size={14} className="text-green-500" />
                  <span>{s.chargerType}</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                  <span className="font-bold text-slate-900">₹{s.pricePerHour}/hr</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-500 uppercase">{s.availableSlots} Slots</span>
                    {s.published === false ? (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-900">Draft</span>
                    ) : (
                      <span className="rounded-md bg-green-100 px-2 py-0.5 text-[9px] font-black uppercase text-green-900">Published</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* WHITE MINIMALIST MAP */}
      <main className="flex-1 relative z-0">
        <MapContainer center={[23.0225, 72.5714]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          <MapEvents />
          <MyLocationMarker />
          {stations
            .map((s) => ({ ...s, lat: toFiniteNumber(s.lat), lng: toFiniteNumber(s.lng) }))
            .filter((s) => isValidLatLng(s.lat, s.lng))
            .map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon}>
              <Popup>
                <div className="p-1 min-w-[120px]">
                  <p className="font-bold text-slate-900 mb-1">{s.name}</p>
                  <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold">{s.chargerType}</p>
                  <button
                    type="button"
                    className="w-full bg-slate-900 text-white py-1 rounded text-[10px] font-bold"
                    onClick={() => openEditStationModal(s)}
                  >
                    Edit
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>

{isModalOpen && (
  <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center bg-slate-900/50 backdrop-blur-[2px] p-0 sm:p-4">
    <div
      className="flex h-[min(92vh,56rem)] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border-2 border-slate-900 bg-white shadow-[8px_8px_0_0_rgba(22,163,74,0.15)] sm:rounded-3xl sm:h-[min(90vh,52rem)]"
      role="dialog"
      aria-labelledby="station-form-title"
    >
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600">Admin</p>
          <h2 id="station-form-title" className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            {editingDocId ? 'Edit station' : 'Add station'}
          </h2>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            With the modal open, click the map to set coordinates. ID must match your charger WebSocket path (e.g. <span className="font-mono text-slate-700">CP_001</span>).
          </p>
        </div>
        <button
          type="button"
          onClick={closeModal}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close"
        >
          <X size={22} />
        </button>
      </div>

      <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-5">
            <div className={sectionShell}>
              <h3 className={sectionTitle}>
                <Radio className="h-4 w-4 text-green-600" strokeWidth={2.5} />
                Identity
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass} htmlFor="st-name">Display name</label>
                  <input
                    id="st-name"
                    required
                    className={fieldClass}
                    placeholder="e.g. North Campus Hub"
                    value={newStation.name}
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="st-ocpp">OCPP station ID · Firestore document id</label>
                  <input
                    id="st-ocpp"
                    required
                    disabled={Boolean(editingDocId)}
                    className={fieldClass}
                    placeholder="e.g. CP_001"
                    value={newStation.ocppStationId}
                    onChange={(e) => setNewStation({ ...newStation, ocppStationId: e.target.value })}
                  />
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                    {editingDocId
                      ? 'This id is locked while editing so links to your charger stay valid.'
                      : 'Creates / updates stations/{id} with this exact id.'}
                  </p>
                </div>
                {editingLastSeenLabel && (
                  <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                    <span className="font-mono font-bold text-slate-800">lastSeen</span> (read-only){' '}
                    <span className="text-slate-500">{editingLastSeenLabel}</span>
                  </p>
                )}
              </div>
            </div>

            <div className={sectionShell}>
              <h3 className={sectionTitle}>
                <Cpu className="h-4 w-4 text-green-600" strokeWidth={2.5} />
                Hardware
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="st-vendor">Vendor</label>
                  <input
                    id="st-vendor"
                    className={fieldClass}
                    placeholder="e.g. MGLADS"
                    value={newStation.vendor}
                    onChange={(e) => setNewStation({ ...newStation, vendor: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="st-model">Model</label>
                  <input
                    id="st-model"
                    className={fieldClass}
                    placeholder="e.g. LEV"
                    value={newStation.model}
                    onChange={(e) => setNewStation({ ...newStation, model: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="st-connector">Connector ID</label>
                  <input
                    id="st-connector"
                    type="number"
                    min={1}
                    className={fieldClass}
                    value={newStation.connectorId}
                    onChange={(e) => setNewStation({ ...newStation, connectorId: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="st-chargertype">Charger type</label>
                  <select
                    id="st-chargertype"
                    className={`${fieldClass} cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    }}
                    value={newStation.chargerType}
                    onChange={(e) => setNewStation({ ...newStation, chargerType: e.target.value })}
                  >
                    <option value="Unknown">Unknown</option>
                    <option>Type 2 AC</option>
                    <option>DC Fast Charge</option>
                    <option>CCS2 Rapid</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={sectionShell}>
              <h3 className={sectionTitle}>
                <MapPin className="h-4 w-4 text-green-600" strokeWidth={2.5} />
                Map location
              </h3>
              <p className="-mt-2 mb-3 text-[11px] text-slate-500">Click the map behind this dialog (or type decimals below).</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="st-lat">Latitude</label>
                  <input
                    id="st-lat"
                    type="number"
                    step="any"
                    className={`${fieldClass} font-mono text-sm`}
                    placeholder="23.0225"
                    value={newStation.lat}
                    onChange={(e) => setNewStation({ ...newStation, lat: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="st-lng">Longitude</label>
                  <input
                    id="st-lng"
                    type="number"
                    step="any"
                    className={`${fieldClass} font-mono text-sm`}
                    placeholder="72.5714"
                    value={newStation.lng}
                    onChange={(e) => setNewStation({ ...newStation, lng: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className={sectionShell}>
              <h3 className={sectionTitle}>
                <Zap className="h-4 w-4 text-green-600" strokeWidth={2.5} />
                Operations &amp; pricing
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="st-slots">Available slots</label>
                  <input
                    id="st-slots"
                    type="number"
                    min={0}
                    className={fieldClass}
                    value={newStation.availableSlots}
                    onChange={(e) => setNewStation({ ...newStation, availableSlots: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="st-price">Price per hour (₹)</label>
                  <input
                    id="st-price"
                    type="number"
                    step="0.01"
                    min={0}
                    className={fieldClass}
                    value={newStation.pricePerHour}
                    onChange={(e) => setNewStation({ ...newStation, pricePerHour: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="st-energy-rate">Energy rate (₹ per kWh)</label>
                  <input
                    id="st-energy-rate"
                    type="number"
                    step="0.01"
                    min={0}
                    className={fieldClass}
                    placeholder="Used for consumption bill after charging"
                    value={newStation.energyRatePerKwh}
                    onChange={(e) => setNewStation({ ...newStation, energyRatePerKwh: e.target.value })}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">User app live bill uses kWh × this rate (from Energy.Active.Import.Register).</p>
                </div>
              </div>
            </div>

            <div className={sectionShell}>
              <h3 className={sectionTitle}>
                <Activity className="h-4 w-4 text-green-600" strokeWidth={2.5} />
                OCPP / Firestore listing
              </h3>
              <p className="-mt-2 mb-3 text-[11px] text-slate-500">
                Same fields as <span className="font-mono">stations/&#123;id&#125;</span> — usually updated by the charger; override here for testing.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="st-status">Connector status</label>
                  <select
                    id="st-status"
                    className={`${fieldClass} cursor-pointer`}
                    value={newStation.status}
                    onChange={(e) => setNewStation({ ...newStation, status: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Charging">Charging</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="st-err">OCPP error code</label>
                  <input
                    id="st-err"
                    className={`${fieldClass} font-mono text-sm`}
                    value={newStation.errorCode}
                    onChange={(e) => setNewStation({ ...newStation, errorCode: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">isOnline</p>
                  <p className="text-[11px] text-slate-500">Show station as reachable in admin / maps</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={newStation.isOnline}
                  onClick={() => setNewStation({ ...newStation, isOnline: !newStation.isOnline })}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${newStation.isOnline ? 'bg-green-500' : 'bg-slate-200'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${newStation.isOnline ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                <div className="flex items-start gap-2">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-green-600" strokeWidth={2.5} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">published</p>
                    <p className="text-[11px] text-slate-500">If off, the user EV map hides this station (draft).</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={newStation.published}
                  onClick={() => setNewStation({ ...newStation, published: !newStation.published })}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${newStation.published ? 'bg-green-500' : 'bg-slate-200'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${newStation.published ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-slate-50/90 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={closeModal} className="order-2 rounded-xl border-2 border-slate-900 bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-[3px_3px_0_0_rgba(15,23,42,0.12)] transition hover:bg-slate-50 sm:order-1">
            Cancel
          </button>
          <button
            type="submit"
            className="order-1 rounded-xl border-2 border-slate-900 bg-green-500 px-5 py-3 text-sm font-black text-white shadow-[4px_4px_0_0_rgba(15,23,42,0.85)] transition hover:bg-green-600 sm:order-2"
          >
            {editingDocId ? 'Save changes' : 'Publish station'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

export default EVChargingFinder;