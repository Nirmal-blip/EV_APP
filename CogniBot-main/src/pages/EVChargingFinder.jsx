import React, { useState, useEffect } from 'react';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader, CircleF } from '@react-google-maps/api';
import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Zap, BatteryCharging, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EVChargingFinder = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { currentUser } = useAuth();

  const [mapCenter, setMapCenter] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setMapCenter([28.6139, 77.2090]); // Fallback to New Delhi
        }
      );
    } else {
      setMapCenter([28.6139, 77.2090]);
    }
  }, []);

  useEffect(() => {
    if (!mapCenter) return;

    const fetchLiveStations = async () => {
      try {
        const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${mapCenter[0]}&longitude=${mapCenter[1]}&distance=5000&maxresults=200`;
        
        const res = await fetch(url, {
          headers: {
            'X-API-Key': import.meta.env.VITE_OCM_API_KEY || ''
          }
        });

        if (res.status === 403 || res.status === 401) {
          toast.error("OCM API Access Denied. Check your VITE_OCM_API_KEY inside the .env file!");
          throw new Error("Missing/Invalid OpenChargeMap Key");
        }

        const data = await res.json();

        // Cross-reference Firebase active bookings
        let occupiedSlots = {};
        try {
           const bookingsSnap = await getDocs(collection(db, 'bookings'));
           bookingsSnap.docs.forEach(d => {
              const b = d.data();
              if (b.bookingStatus === 'active' && b.stationId) {
                 occupiedSlots[b.stationId] = (occupiedSlots[b.stationId] || 0) + 1;
              }
           });
        } catch(e) {
           console.error("Booking sync error", e);
        }
        
        const dataList = data.map(poi => {
           let type = 'Standard Charger';
           let price = 0;
           
           if (poi.Connections && poi.Connections.length > 0) {
              const maxPower = Math.max(...poi.Connections.map(c => c.PowerKW || 0));
              if (maxPower >= 40) type = 'DC Fast Charge';
              else if (maxPower >= 11) type = 'Type 2 AC';
           }

           if (poi.UsageCost && !poi.UsageCost.toLowerCase().includes('free')) {
              price = 120; // Default simulated paid price in INR 
           }

           return {
             id: poi.ID.toString(),
             lat: poi.AddressInfo?.Latitude,
             lng: poi.AddressInfo?.Longitude,
             name: poi.AddressInfo?.Title || poi.OperatorInfo?.Title || 'Global EV Station',
             pricePerHour: price,
             chargerType: type,
             availableSlots: Math.max(0, (poi.NumberOfPoints || Math.floor(Math.random() * 4) + 1) - (occupiedSlots[poi.ID.toString()] || 0))
           };
        });
        
        setStations(dataList);
      } catch (err) {
        console.error("Failed to fetch live stations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveStations();
  }, [mapCenter]);

  const handleBookSlot = async (station) => {
    if (!currentUser) {
      toast.error('Please log in to book a slot');
      return;
    }
    
    if (currentUser.profile?.role === 'admin') {
      toast.error('Administrators are not permitted to book stations.');
      return;
    }
    
    setBookingLoading(true);
    try {
      // 1. Fetch latest user balance
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User record not found");
      
      const userData = userSnap.data();
      const cost = station.pricePerHour || 100;

      if ((userData.walletBalance || 0) < cost) {
        toast.error(`Insufficient balance. Minimum ₹${cost} required. Please open the EV App to top up.`);
        setBookingLoading(false);
        return;
      }

      // 2. Deduct balance
      await updateDoc(userRef, {
        walletBalance: (userData.walletBalance || 0) - cost
      });

      // 3. Create Booking
      await addDoc(collection(db, 'bookings'), {
        userId: currentUser.uid,
        stationId: station.id,
        amount: cost,
        paymentStatus: 'completed',
        bookingStatus: 'active',
        slotTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        energykWh: 5.5
      });

      // Synchronously decrease the slot count locally 
      setStations(prev => prev.map(s => {
         if (s.id === station.id) {
            return { ...s, availableSlots: Math.max(0, (s.availableSlots || 0) - 1) };
         }
         return s;
      }));

      toast.success(`Slot booked at ${station.name}!`);
      setSelectedStation(null); // Close the infowindow
    } catch (err) {
      console.error(err);
      toast.error('Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isLoaded || loading || !mapCenter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 size={48} className="animate-spin text-green-500 mb-4" />
        <p className="text-slate-500 font-bold">Acquiring live location satellites...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh)] pt-20">
      <div className="flex flex-1 overflow-hidden">
        {/* Side Panel for Stations List */}
        <div className="w-80 md:w-96 bg-white border-r border-slate-200 shadow-xl z-10 flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-white">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <MapPin size={24} className="text-green-500" /> Nearest Stations
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">{stations.length} active stations found</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {stations.length === 0 ? (
              <div className="text-center p-4 text-slate-500 font-medium">No stations found in the database.</div>
            ) : stations.map(station => (
               <div 
                 key={station.id} 
                 onClick={() => setSelectedStation(station)}
                 className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
               >
                  <h3 className="font-bold text-slate-900 mb-1">{station.name || 'EV Station'}</h3>
                  <div className="flex flex-col gap-2 mt-2 border-t border-slate-100 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-slate-500"><BatteryCharging size={14}/> {station.chargerType || 'Standard'}</span>
                      <span className="font-bold text-slate-800">₹{station.pricePerHour || 0}/hr</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-xs font-bold text-slate-400">Available Slots</span>
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">{station.availableSlots || 0}</span>
                    </div>
                  </div>
               </div>
            ))}
          </div>
        </div>

        {/* Map Viewport */}
        <div className="flex-1 relative">
          <GoogleMap
            mapContainerClassName="w-full h-full z-0 font-sans"
            center={{ lat: mapCenter[0], lng: mapCenter[1] }}
            zoom={13}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
            }}
          >
            {/* User Live Location Marker */}
            <CircleF 
              center={{ lat: mapCenter[0], lng: mapCenter[1] }} 
              options={{ fillColor: '#3b82f6', fillOpacity: 0.5, strokeColor: '#2563eb', strokeWeight: 2 }} 
              radius={400} 
            />
        
            {stations.map(station => {
              if (!station.lat || !station.lng) return null;
              return (
                <MarkerF 
                  key={station.id} 
                  position={{ lat: station.lat, lng: station.lng }}
                  onClick={() => setSelectedStation(station)}
                />
              );
            })}

            {selectedStation && (
              <InfoWindowF
                position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
                onCloseClick={() => setSelectedStation(null)}
              >
                <div className="p-4 w-60">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-3">
                    <Zap size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{selectedStation.name || 'Unnamed Station'}</h3>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 mb-2 border-b border-slate-100 pb-2">
                     <BatteryCharging size={16} className="text-green-500" /> {selectedStation.chargerType || 'Standard'}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm mb-4">
                    <span className="font-bold text-slate-900">₹{selectedStation.pricePerHour || 0}/hr</span>
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">
                      {selectedStation.availableSlots || 0} Slots
                    </span>
                  </div>

                  <button 
                    onClick={() => handleBookSlot(selectedStation)}
                    disabled={bookingLoading || (selectedStation.availableSlots || 0) === 0}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-slate-300"
                  >
                    {bookingLoading ? <Loader2 size={16} className="animate-spin" /> : 
                     (selectedStation.availableSlots || 0) === 0 ? 'Full' : 'Book Slot'}
                  </button>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
};

export default EVChargingFinder;
