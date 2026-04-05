import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../services/station_service.dart';
import '../models/station_model.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/booking_model.dart';
import '../services/booking_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  final StationService _stationService = StationService();
  Position? _currentPosition;
  bool _isLoading = true;
  StationModel? _selectedStation;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _determinePosition();
    });
  }

  Future<void> _determinePosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    setState(() => _isLoading = true);

    try {
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showErrorSnackBar("Bhai, GPS On karo pehle settings se!");
        setState(() => _isLoading = false);
        return;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showErrorSnackBar("Location permission ke bina stations nahi milenge.");
          setState(() => _isLoading = false);
          return;
        }
      }

      // High Accuracy taaki nearest stations sahi dikhein
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.best //
      );

      setState(() {
        _currentPosition = position;
        _isLoading = false;
      });

      _mapController.move(LatLng(position.latitude, position.longitude), 14.5);

    } catch (e) {
      debugPrint("Location Error: $e");
      setState(() => _isLoading = false);
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.redAccent),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9F9),
      body: Stack(
        children: [
          // Background Map with Station Stream
          _isLoading && _currentPosition == null
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF28C76F)))
              : _buildMapWithStreams(),

          // Search Bar Overlay
          _buildTopOverlay(),

          // Horizontal Station List Overlay
          _buildBottomStationList(),
        ],
      ),
    );
  }

  Widget _buildMapWithStreams() {
    return StreamBuilder<List<StationModel>>(
      stream: _stationService.getAllStations(
        _currentPosition?.latitude ?? 21.1702, 
        _currentPosition?.longitude ?? 72.8311
      ), //
      builder: (context, snapshot) {
        List<Marker> markers = [];

        // 1. Blue Pin for YOUR current location
        if (_currentPosition != null) {
          markers.add(
            Marker(
              width: 50.0,
              height: 50.0,
              point: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
              child: const Icon(Icons.person_pin_circle, color: Colors.blueAccent, size: 45),
            ),
          );
        }

        // 2. Green Pins for ALL NEAREST stations in DB
        if (snapshot.hasData) {
          for (var station in snapshot.data!) {
            markers.add(
              Marker(
                width: 60.0,
                height: 60.0,
                point: LatLng(station.lat, station.lng), //
                child: GestureDetector(
                  onTap: () {
                    setState(() => _selectedStation = station);
                    _mapController.move(LatLng(station.lat, station.lng), 15.5);
                  },
                  child: Icon(
                    Icons.ev_station_rounded, 
                    color: _selectedStation?.id == station.id ? Colors.orange : const Color(0xFF28C76F), 
                    size: 42
                  ).animate().scale(),
                ),
              ),
            );
          }
        }

        return FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _currentPosition != null
                ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
                : const LatLng(21.1702, 72.8311), // Surat default
            initialZoom: 14.0,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
              userAgentPackageName: 'com.nirmal.ev_app',
            ),
            MarkerLayer(markers: markers),
          ],
        );
      },
    );
  }

  Widget _buildBottomStationList() {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        height: 210,
        margin: const EdgeInsets.only(bottom: 25),
        child: StreamBuilder<List<StationModel>>(
          stream: _stationService.getAllStations(
            _currentPosition?.latitude ?? 21.1702, 
            _currentPosition?.longitude ?? 72.8311
          ), // Real-time fetch
          builder: (context, snapshot) {
            if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return const SizedBox(); 
            }

            // Sort logic (Optional): Aap distance ke basis pe yahan sort kar sakte ho
            final stations = snapshot.data!;

            return ListView.builder(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: stations.length,
              itemBuilder: (context, index) {
                return _buildStationCard(stations[index]);
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildStationCard(StationModel station) {
    bool isSelected = _selectedStation?.id == station.id;
    
    // Distance calculate karke dikhane ke liye (Optional)
    double distance = 0;
    if (_currentPosition != null) {
      distance = Geolocator.distanceBetween(
        _currentPosition!.latitude, _currentPosition!.longitude, 
        station.lat, station.lng
      ) / 1000; // Meters to KM
    }

    return GestureDetector(
      onTap: () {
        setState(() => _selectedStation = station);
        _mapController.move(LatLng(station.lat, station.lng), 15.5);
      },
      child: Container(
        width: MediaQuery.of(context).size.width * 0.85,
        margin: const EdgeInsets.only(right: 15),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          border: isSelected ? Border.all(color: const Color(0xFF28C76F), width: 2) : Border.all(color: Colors.grey.shade100, width: 1.5),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 8))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(station.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF0F172A)))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
                  child: Text("${distance.toStringAsFixed(1)} km", style: TextStyle(color: Colors.blue.shade700, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(station.chargerType, style: TextStyle(color: Colors.grey.shade500, fontSize: 13, fontWeight: FontWeight.w600)),
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Standard Rate", style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                    Text("₹${station.pricePerHour}/h", style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 20)),
                  ],
                ),
                ElevatedButton(
                  onPressed: () async {
                    String uid = FirebaseAuth.instance.currentUser?.uid ?? "";
                    if (uid.isEmpty) {
                      _showErrorSnackBar("Please log in to book.");
                      return;
                    }
                    setState(() => _isLoading = true);
                    try {
                      BookingModel newBooking = BookingModel(
                        id: "",
                        userId: uid,
                        stationId: station.name,
                        slotTime: DateTime.now().add(const Duration(hours: 1)),
                        amount: station.pricePerHour,
                        paymentStatus: "completed",
                        bookingStatus: "confirmed",
                        createdAt: DateTime.now(),
                      );
                      await BookingService().createBooking(newBooking);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Booking Confirmed Successfully!"), backgroundColor: Color(0xFF28C76F)));
                      }
                    } catch (e) {
                      _showErrorSnackBar("Booking Failed: $e");
                    } finally {
                      if (mounted) setState(() => _isLoading = false);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isSelected ? const Color(0xFF28C76F) : const Color(0xFF0F172A),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text("Book Slot", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn().slideX(begin: 0.1);
  }

  Widget _buildTopOverlay() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          height: 55,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
          ),
          child: const Row(
            children: [
              Icon(Icons.search, color: Colors.grey),
              SizedBox(width: 12),
              Text('Search nearest EV stations...', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}