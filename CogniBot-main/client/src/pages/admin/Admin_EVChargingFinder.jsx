import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, X, Loader2, Zap, BatteryCharging, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

// 1. Mandatory Leaflet CSS and SVG Icon Setup
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const createIcon = (color) => new L.DivIcon({
  html: `<svg width="30" height="30" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  className: "", iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -30]
});

const stationIcon = createIcon('#22c55e'); 
const userIcon = createIcon('#3b82f6');    

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
  
  // State matches StationModel.dart fields
  const [newStation, setNewStation] = useState({
    name: '',
    lat: '',
    lng: '',
    availableSlots: 1,
    pricePerHour: 120,
    chargerType: 'Type 2 AC'
  });

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
    if (!newStation.lat || !newStation.lng) return toast.error("Click the map to set location!");

    try {
      const schemaData = {
        name: newStation.name,
        lat: parseFloat(newStation.lat),             // double
        lng: parseFloat(newStation.lng),             // double
        availableSlots: parseInt(newStation.availableSlots), // int
        pricePerHour: parseFloat(newStation.pricePerHour),   // double
        chargerType: newStation.chargerType          // String
      };

      await addDoc(collection(db, 'stations'), schemaData);
      toast.success("Station Registered Successfully!");
      setIsModalOpen(false);
      fetchStations();
    } catch (err) {
      toast.error("Firebase Sync Error");
    }
  };

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
          <button onClick={() => setIsModalOpen(true)} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-green-600 transition-all shadow-md">
            <Plus size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
          {stations.length === 0 ? (
            <p className="text-center text-slate-400 text-sm mt-10">No stations found nearby.</p>
          ) : (
            stations.map(s => (
              <div key={s.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-green-400 transition-all group">
                <h3 className="font-bold text-slate-800 group-hover:text-green-600">{s.name}</h3>
                <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
                  <Zap size={14} className="text-green-500" />
                  <span>{s.chargerType}</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                  <span className="font-bold text-slate-900">₹{s.pricePerHour}/hr</span>
                  <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-500 uppercase">{s.availableSlots} Slots</span>
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
          {stations.map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon}>
              <Popup>
                <div className="p-1 min-w-[120px]">
                  <p className="font-bold text-slate-900 mb-1">{s.name}</p>
                  <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold">{s.chargerType}</p>
                  <button className="w-full bg-slate-900 text-white py-1 rounded text-[10px] font-bold">Details</button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>

      {/* ADD STATION MODAL: Schema-Compliant Form */}
    {/* ADD STATION MODAL */}
{isModalOpen && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
      <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full">
        <X size={20} />
      </button>
      
      <h2 className="text-2xl font-black text-slate-900 mb-1">New Point</h2>
      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-6">
        Click Map OR Enter Manually
      </p>
      
      <form onSubmit={handleSave} className="space-y-4">
        {/* Station Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Station Name</label>
          <input 
            required 
            placeholder="E.g. IITRAM Campus Hub" 
            className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium" 
            value={newStation.name} 
            onChange={e => setNewStation({...newStation, name: e.target.value})} 
          />
        </div>
        
        {/* Editable Lat/Lng Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Latitude</label>
            <input 
              type="number"
              step="any"
              placeholder="23.0225"
              className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-mono text-sm" 
              value={newStation.lat} 
              onChange={e => setNewStation({...newStation, lat: e.target.value})} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Longitude</label>
            <input 
              type="number"
              step="any"
              placeholder="72.5714"
              className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-mono text-sm" 
              value={newStation.lng} 
              onChange={e => setNewStation({...newStation, lng: e.target.value})} 
            />
          </div>
        </div>

        {/* Slots and Price (Schema: int and double) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Slots (int)</label>
            <input 
              type="number" 
              className="w-full p-4 bg-slate-100 rounded-2xl outline-none" 
              value={newStation.availableSlots} 
              onChange={e => setNewStation({...newStation, availableSlots: e.target.value})} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Price/hr (double)</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full p-4 bg-slate-100 rounded-2xl outline-none" 
              value={newStation.pricePerHour} 
              onChange={e => setNewStation({...newStation, pricePerHour: e.target.value})} 
            />
          </div>
        </div>

        {/* Charger Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Charger Type</label>
          <select 
            className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold text-slate-700 appearance-none" 
            value={newStation.chargerType} 
            onChange={e => setNewStation({...newStation, chargerType: e.target.value})}
          >
            <option>Type 2 AC</option>
            <option>DC Fast Charge</option>
            <option>CCS2 Rapid</option>
          </select>
        </div>

        <button type="submit" className="w-full py-5 bg-green-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-green-100 hover:bg-green-600 transition-all mt-4">
          PUBLISH STATION
        </button>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

export default EVChargingFinder;