import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:math';

import '../services/station_service.dart';
import '../models/station_model.dart';
import 'map_screen.dart';

class VehicleScreen extends StatefulWidget {
  const VehicleScreen({super.key});

  @override
  State<VehicleScreen> createState() => _VehicleScreenState();
}

class _VehicleScreenState extends State<VehicleScreen> {
  static const Color kPrimaryGreen = Color(0xFF28C76F); // Original Green
  static const Color kTextDark = Color(0xFF1A1D1E);
  static const double _fallbackLat = 21.1702;
  static const double _fallbackLng = 72.8311;
  static const List<String> _stationImageUrls = [
    'https://images.unsplash.com/photo-1620067676674-0f2b2c8acdd6?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593941707882-a5bba14938cb?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1633694735977-2c67af6bd5a4?q=80&w=1200&auto=format&fit=crop',
  ];
  
  final StationService _stationService = StationService();
  Position? _currentPosition;

  @override
  void initState() {
    super.initState();
    _determinePosition();
  }

  Future<void> _determinePosition() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return;
      }
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return;
        }
      }
      final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.best);
      if (mounted) {
        setState(() {
          _currentPosition = position;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {});
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final String uid = FirebaseAuth.instance.currentUser?.uid ?? "";

    return Scaffold(
      backgroundColor: Colors.white,
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance.collection('users').doc(uid).snapshots(),
        builder: (context, userSnapshot) {
          String userName = "User";
          if (userSnapshot.hasData && userSnapshot.data!.exists) {
            var data = userSnapshot.data!.data() as Map<String, dynamic>;
            userName = data['name'] ?? "User";
          }

          return CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              _buildModernHeader(userName),
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 24),
                    _buildSectionHeader("Recommend for you", ""),
                    const SizedBox(height: 16),
                    _buildRecommendedList(),
                    const SizedBox(height: 32),
                    _buildSectionHeader("Nearby Charging Station", "View all"),
                    const SizedBox(height: 16),
                    _buildNearbyList(),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ],
          ).animate().fadeIn(duration: 400.ms);
        },
      ),
    );
  }

  Widget _buildModernHeader(String name) {
    final safeName = name.trim().isEmpty ? 'User' : name.trim();

    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.only(top: 60, left: 24, right: 24, bottom: 30),
        decoration: BoxDecoration(
          color: kPrimaryGreen.withOpacity(0.05),
          borderRadius: const BorderRadius.only(
            bottomLeft: Radius.circular(32),
            bottomRight: Radius.circular(32),
          ),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: kPrimaryGreen, width: 2),
                      ),
                      child: CircleAvatar(
                        radius: 20,
                        backgroundColor: Colors.white,
                        child: Text(_initialForName(safeName), style: const TextStyle(fontWeight: FontWeight.bold, color: kPrimaryGreen, fontSize: 18)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(safeName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: kTextDark)),
                        Text("Find nearest charging point", style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                  ),
                  child: Stack(
                    children: [
                      const Icon(Icons.notifications_none_rounded, color: kTextDark, size: 24),
                      Positioned(right: 2, top: 2, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle))),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 50,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search, color: Colors.grey),
                        const SizedBox(width: 12),
                        Text("Search", style: TextStyle(color: Colors.grey.shade400, fontSize: 14)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  height: 50,
                  width: 50,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10)],
                  ),
                  child: const Icon(Icons.tune_rounded, color: kPrimaryGreen),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, String action) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: kTextDark)),
          if (action.isNotEmpty)
            Text(action, style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildRecommendedList() {
    double searchLat = _currentPosition?.latitude ?? _fallbackLat;
    double searchLng = _currentPosition?.longitude ?? _fallbackLng;

    return SizedBox(
      height: 200,
      child: StreamBuilder<List<StationModel>>(
        stream: _stationService.getAllStations(searchLat, searchLng),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator(color: kPrimaryGreen));
          
          final stations = snapshot.data!;
          if (stations.isEmpty) return const SizedBox();

          return ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 24),
            itemCount: stations.length,
            itemBuilder: (context, index) {
              final station = stations[index];
              return Container(
                width: 280,
                margin: const EdgeInsets.only(right: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 15, offset: const Offset(0, 10))],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      _StationImage(imageUrl: _stationImageFor(station.id), borderRadius: 24),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(8)),
                              child: Text(
                                _currentPosition == null ? 'Nearby fallback' : 'Open',
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(station.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                const SizedBox(height: 2),
                                Text("Connection: ${station.availableSlots} point", style: const TextStyle(color: Colors.white70, fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildNearbyList() {
    double searchLat = _currentPosition?.latitude ?? _fallbackLat;
    double searchLng = _currentPosition?.longitude ?? _fallbackLng;

    return StreamBuilder<List<StationModel>>(
      stream: _stationService.getAllStations(searchLat, searchLng),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator(color: kPrimaryGreen)));
        
        final stations = snapshot.data!;
        
        return ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          itemCount: stations.length,
          itemBuilder: (context, index) {
            final station = stations[index];
            
            double distance = 0;
            if (_currentPosition != null) {
              distance = Geolocator.distanceBetween(
                _currentPosition!.latitude, _currentPosition!.longitude, 
                station.lat, station.lng
              ) / 1000;
            } else {
              distance = Random().nextDouble() * 5 + 1; // dummy if location off
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade100, width: 2),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 15, offset: const Offset(0, 5))],
              ),
              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: _StationImage(
                          imageUrl: _stationImageFor(station.id),
                          width: 80,
                          height: 80,
                          borderRadius: 16,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(station.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: kTextDark)),
                            const SizedBox(height: 4),
                            Text("Connection: ${station.availableSlots} point", style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            const Text("Central City District", style: TextStyle(color: Colors.grey, fontSize: 11)), // mock address
                            const SizedBox(height: 8),
                            const Text("Open", style: TextStyle(color: kPrimaryGreen, fontWeight: FontWeight.bold, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1, color: Color(0xFFF0F0F0)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.schedule, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          const Text("24 * 7", style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                          const SizedBox(width: 12),
                          const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text("${distance.toStringAsFixed(1)} km", style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                          const SizedBox(width: 12),
                          const Icon(Icons.star, size: 14, color: Colors.orange),
                          const SizedBox(width: 4),
                          const Text("5.0", style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      ElevatedButton(
                        onPressed: () {
                          // Route explicitly to map screen focusing on this station
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const MapScreen()));
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kPrimaryGreen,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text("Get direction", style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _stationImageFor(String seed) {
    final safeSeed = seed.isEmpty ? 'station' : seed;
    final index = safeSeed.codeUnits.fold<int>(0, (sum, unit) => sum + unit) % _stationImageUrls.length;
    return _stationImageUrls[index];
  }

  String _initialForName(String name) {
    final trimmedName = name.trim();
    if (trimmedName.isEmpty) {
      return 'U';
    }
    return trimmedName.substring(0, 1).toUpperCase();
  }
}

class _StationImage extends StatelessWidget {
  const _StationImage({
    required this.imageUrl,
    this.width,
    this.height,
    required this.borderRadius,
  });

  final String imageUrl;
  final double? width;
  final double? height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return Image.network(
      imageUrl,
      width: width,
      height: height,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, progress) {
        if (progress == null) {
          return child;
        }
        return _fallbackCardImage();
      },
      errorBuilder: (context, error, stackTrace) => _fallbackCardImage(),
    );
  }

  Widget _fallbackCardImage() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        gradient: const LinearGradient(
          colors: [Color(0xFF153B2E), Color(0xFF28C76F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(Icons.ev_station_rounded, color: Colors.white, size: 34),
      ),
    );
  }
}
