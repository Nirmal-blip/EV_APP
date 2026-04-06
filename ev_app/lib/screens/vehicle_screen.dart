import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'map_screen.dart';

class VehicleScreen extends StatelessWidget {
  const VehicleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const _VehicleScreenContent();
  }
}

class _VehicleScreenContent extends StatefulWidget {
  const _VehicleScreenContent();

  @override
  State<_VehicleScreenContent> createState() => _VehicleScreenContentState();
}

class _VehicleScreenContentState extends State<_VehicleScreenContent> {
  static const Color kPrimaryGreen = Color(0xFF28C76F);
  static const Color kPrimaryDark = Color(0xFF0F172A);
  
  // OCM API Key fetched from your .env file
  final String _ocmApiKey = dotenv.env['OCM_API_KEY'] ?? ""; 

  List<dynamic> _stations = [];
  bool _isLoading = true;
  Position? _currentPosition;

  @override
  void initState() {
    super.initState();
    _initDashboard();
  }

  Future<void> _initDashboard() async {
    await _determinePosition();
    await _fetchOCMStations();
  }

  Future<void> _determinePosition() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showLocationPrompt();
        return;
      }
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showLocationPrompt();
          return;
        }
      }
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low
      );
      if (mounted) setState(() => _currentPosition = position);
    } catch (e) {
      debugPrint("Location error: $e");
      _showLocationPrompt();
    }
  }

  void _showLocationPrompt() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text("Location disabled. Showing top India stations!"),
        action: SnackBarAction(
          label: 'Enable',
          textColor: kPrimaryGreen,
          onPressed: () => Geolocator.openLocationSettings(),
        ),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  Future<void> _fetchOCMStations() async {
    setState(() => _isLoading = true);

    String url;
    if (_currentPosition != null) {
      double lat = _currentPosition!.latitude;
      double lng = _currentPosition!.longitude;
      url = "https://api.openchargemap.io/v3/poi/?output=json"
          "&latitude=$lat"
          "&longitude=$lng"
          "&distance=50"
          "&distanceunit=KM"
          "&maxresults=15"
          "&key=$_ocmApiKey";
    } else {
      // Default to India if GPS is off
      url = "https://api.openchargemap.io/v3/poi/?output=json"
          "&countrycode=IN"
          "&maxresults=10"
          "&key=$_ocmApiKey";
    }

    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'X-API-Key': _ocmApiKey,
          'User-Agent': 'EVApp/1.0',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        if (mounted) {
          setState(() {
            _stations = data;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
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
          String userName = "Driver";
          if (userSnapshot.hasData && userSnapshot.data!.exists) {
            userName = (userSnapshot.data!.data() as Map<String, dynamic>)['name'] ?? "Driver";
          }

          return RefreshIndicator(
            onRefresh: _initDashboard,
            color: kPrimaryGreen,
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                _buildHeader(userName),
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 24),
                      _buildSectionLabel("Recommended For You"),
                      _buildHorizontalList(),
                      const SizedBox(height: 32),
                      _buildSectionLabel("Nearby Live Stations"),
                      _buildVerticalList(),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms);
        },
      ),
    );
  }

  Widget _buildHeader(String name) {
    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.only(top: 60, left: 24, right: 24, bottom: 30),
        decoration: BoxDecoration(
          color: kPrimaryGreen.withOpacity(0.08),
          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Bhai, $name", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: kPrimaryDark)),
                const SizedBox(height: 4),
                Text("Finding best spots for you", 
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.w500)),
              ],
            ),
            CircleAvatar(
              radius: 25,
              backgroundColor: kPrimaryGreen,
              child: Text(name.isNotEmpty ? name[0].toUpperCase() : "U", 
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String title) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 24),
    child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: kPrimaryDark)),
  );

  Widget _buildHorizontalList() {
    if (_isLoading) return const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: kPrimaryGreen)));
    if (_stations.isEmpty) return const Center(child: Padding(padding: EdgeInsets.all(20), child: Text("No live data found.")));

    return SizedBox(
      height: 240,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        itemCount: _stations.length,
        itemBuilder: (context, index) {
          final poi = _stations[index];
          final String title = poi['AddressInfo']?['Title'] ?? "EV Station";
          
        // ⚡ FIX: Path ko change karke aisa likho
int imageNumber = (index % 5) + 1;
String assetPath = "assets/ev$imageNumber.jpg"; // ../.. hatado

return GestureDetector(
  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MapScreen())),
  child: Container(
    width: 300,
    margin: const EdgeInsets.only(right: 18),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(28),
      image: DecorationImage(
        image: AssetImage(assetPath), // Ab ye sahi uthayega
        fit: BoxFit.cover,
      ),
    ),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter, 
                    end: Alignment.bottomCenter, 
                    colors: [Colors.transparent, Colors.black.withOpacity(0.9)]
                  ),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    const Row(
                      children: [
                        Icon(Icons.bolt, color: kPrimaryGreen, size: 16),
                        SizedBox(width: 4),
                        Text("Live Now", style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Spacer(),
                        Text("₹120/hr", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildVerticalList() {
    if (_isLoading) return const SizedBox();
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: _stations.length,
      itemBuilder: (context, index) {
        final poi = _stations[index];
        final title = poi['AddressInfo']?['Title'] ?? "EV Station";
        final address = poi['AddressInfo']?['AddressLine1'] ?? "Nearby Location";

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.all(12),
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: kPrimaryGreen.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.ev_station, color: kPrimaryGreen),
            ),
            title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: kPrimaryDark), maxLines: 1),
            subtitle: Text(address, maxLines: 1, style: const TextStyle(fontSize: 12)),
            trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MapScreen())),
          ),
        );
      },
    );
  }
}