import 'dart:async';
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
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  
  StreamSubscription<ServiceStatus>? _serviceStatusStream;
  Position? _currentPosition;
  bool _isLoading = true;
  StationModel? _selectedStation;
  List<StationModel> _allStations = [];

  // Consistent Colors (Matching your Web App's Slate & Green theme)
  final Color _primaryDark = const Color(0xFF0F172A); // Slate 900
  final Color _accentGreen = const Color(0xFF28C76F); // Success Green

  @override
  void initState() {
    super.initState();
    _initLocationServices();
  }

  @override
  void dispose() {
    _serviceStatusStream?.cancel();
    super.dispose();
  }

  void _initLocationServices() {
    // 1. Listen for GPS toggle (Notification/Alert logic)
    _serviceStatusStream = Geolocator.getServiceStatusStream().listen((status) {
      if (status == ServiceStatus.disabled) {
        _showGpsDisabledDialog();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _determinePosition();
    });
  }

  void _showGpsDisabledDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.location_off, color: Colors.redAccent),
            SizedBox(width: 10),
            Text("GPS is Off"),
          ],
        ),
        content: const Text("Bhai, bina GPS ke live stations nahi dikhenge. Please turn it on from settings!"),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await Geolocator.openLocationSettings();
            },
            child: Text("Open Settings", style: TextStyle(color: _accentGreen, fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }

  Future<void> _determinePosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showGpsDisabledDialog();
      _fetchStations(null);
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _fetchStations(null);
        return;
      }
    }

    final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
    setState(() {
      _currentPosition = position;
    });
    _mapController.move(LatLng(position.latitude, position.longitude), 14.0);
    _fetchStations(position);
  }

  Future<void> _fetchStations(Position? pos) async {
    setState(() => _isLoading = true);
    final stations = await _stationService.fetchLiveStations(lat: pos?.latitude, lng: pos?.longitude);
    if (mounted) {
      setState(() {
        _allStations = stations;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.white,
      // The Side Panel (Like your React Web Sidebar)
      drawer: _buildSideStationList(),
      body: Stack(
        children: [
          _isLoading && _currentPosition == null
              ? Center(child: CircularProgressIndicator(color: _accentGreen))
              : _buildMap(),
          
          // Menu Button to open Drawer
          Positioned(
            top: 50,
            left: 20,
            child: GestureDetector(
              onTap: () => _scaffoldKey.currentState?.openDrawer(),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
                ),
                child: Icon(Icons.menu, color: _primaryDark),
              ),
            ),
          ),
          
          _buildBottomStationCard(),
        ],
      ),
    );
  }

  Widget _buildSideStationList() {
    return Drawer(
      width: MediaQuery.of(context).size.width * 0.85,
      child: Container(
        color: const Color(0xFFF8FAFC),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.only(top: 60, left: 24, bottom: 24, right: 24),
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 5, offset: Offset(0, 2))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: _accentGreen.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                        child: Icon(Icons.bolt_rounded, color: _accentGreen, size: 28),
                      ),
                      const SizedBox(width: 14),
                      Text("Nearby Hubs", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: _primaryDark, letterSpacing: -0.5)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text("${_allStations.length} fast charging stations found", 
                    style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500, fontSize: 13)),
                ],
              ),
            ),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                itemCount: _allStations.length,
                separatorBuilder: (context, index) => const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  final station = _allStations[index];
                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
                      border: Border.all(color: Colors.grey.shade100),
                    ),
                    child: Material(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(20),
                        onTap: () {
                          setState(() => _selectedStation = station);
                          _mapController.move(LatLng(station.lat, station.lng), 15.0);
                          Navigator.pop(context);
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [_accentGreen.withOpacity(0.2), _accentGreen.withOpacity(0.05)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(child: Icon(Icons.ev_station, color: _accentGreen)),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(station.name, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: _primaryDark), maxLines: 1, overflow: TextOverflow.ellipsis),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(6)),
                                          child: Text(station.chargerType, style: TextStyle(color: Colors.grey.shade600, fontSize: 10, fontWeight: FontWeight.bold)),
                                        ),
                                        const Spacer(),
                                        Text("₹${station.pricePerHour}/hr", style: TextStyle(fontWeight: FontWeight.w900, color: _accentGreen, fontSize: 14)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMap() {
    return FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _currentPosition != null 
                ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
                : const LatLng(20.5937, 78.9629), // Center of India
            initialZoom: _currentPosition != null ? 14.0 : 4.5,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
              userAgentPackageName: 'com.nirmal.ev_app',
            ),
            MarkerLayer(
              markers: [
                if (_currentPosition != null)
                  Marker(
                    point: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
                    width: 60,
                    height: 60,
                    child: Container(
                      decoration: BoxDecoration(color: Colors.blueAccent.withOpacity(0.2), shape: BoxShape.circle),
                      child: Center(
                        child: Container(
                          width: 20, height: 20,
                          decoration: const BoxDecoration(color: Colors.blueAccent, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.blueAccent, blurRadius: 10)]),
                        ),
                      ),
                    ).animate(onPlay: (controller) => controller.repeat()).scale(duration: 1500.ms, curve: Curves.easeInOut),
                  ),
                ..._allStations.map((s) {
                  final isSelected = _selectedStation?.id == s.id;
                  return Marker(
                    point: LatLng(s.lat, s.lng),
                    width: 50,
                    height: 50,
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedStation = s),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.fastOutSlowIn,
                        margin: EdgeInsets.all(isSelected ? 0 : 5),
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.orange : Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: (isSelected ? Colors.orange : _accentGreen).withOpacity(0.4),
                              blurRadius: isSelected ? 15 : 8,
                              spreadRadius: isSelected ? 4 : 0,
                              offset: const Offset(0, 4),
                            )
                          ],
                          border: Border.all(color: isSelected ? Colors.white : _accentGreen, width: 2.5),
                        ),
                        child: Icon(
                          Icons.ev_station_rounded, 
                          color: isSelected ? Colors.white : _accentGreen, 
                          size: isSelected ? 26 : 22,
                        ),
                      ).animate(target: isSelected ? 1 : 0).scale(duration: 200.ms),
                    ),
                  );
                }),
              ],
            ),
          ],
        );
  }

  Widget _buildBottomStationCard() {
    if (_selectedStation == null) return const SizedBox();
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        margin: const EdgeInsets.only(bottom: 30, left: 20, right: 20),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 20, offset: const Offset(0, 5))],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_selectedStation!.name, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: _primaryDark)),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.bolt, color: _accentGreen, size: 18),
                const SizedBox(width: 4),
                Text(_selectedStation!.chargerType, style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.bold)),
                const Spacer(),
                Text("₹${_selectedStation!.pricePerHour}/hr", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: _primaryDark)),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primaryDark,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  elevation: 0,
                ),
                onPressed: () {
                  // Keep your existing booking logic here
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Processing booking for ${_selectedStation!.name}...")));
                },
                child: const Text("Book Charging Slot", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            )
          ],
        ),
      ),
    ).animate().slideY(begin: 1, end: 0, curve: Curves.easeOutQuart);
  }
}