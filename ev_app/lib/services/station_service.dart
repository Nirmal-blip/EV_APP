import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/station_model.dart';
import 'dart:math';

class StationService {

  // Fetch from OpenChargeMap REST API
  Future<List<StationModel>> fetchLiveStations({double? lat, double? lng}) async {
    final apiKey = dotenv.env['OCM_API_KEY'] ?? '';
    late Uri url;
    if (lat != null && lng != null) {
      url = Uri.parse('https://api.openchargemap.io/v3/poi/?output=json&latitude=$lat&longitude=$lng&distance=50&maxresults=200');
    } else {
      url = Uri.parse('https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&maxresults=10');
    }

    try {
      // Fetch active Firebase bookings to cross-reference with OpenChargeMap
      Map<String, int> occupiedSlots = {};
      try {
         final bookingsSnap = await FirebaseFirestore.instance
             .collection('bookings')
             .where('bookingStatus', isEqualTo: 'active')
             .get();
             
         for (var doc in bookingsSnap.docs) {
             final data = doc.data();
             final stationId = data['stationId']?.toString();
             if (stationId != null) {
                occupiedSlots[stationId] = (occupiedSlots[stationId] ?? 0) + 1;
             }
         }
      } catch (e) {
         print("Booking slots sync error: $e");
      }

      final response = await http.get(
        url, 
        headers: {
          'X-API-Key': apiKey,
          'User-Agent': 'EVApp/1.0',
        }
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((poi) {
          String type = 'Standard Charger';
           double price = 0;
           
           if (poi['Connections'] != null && poi['Connections'].isNotEmpty) {
              final connections = poi['Connections'] as List;
              double maxPower = 0.0;
              for (var c in connections) {
                if (c['PowerKW'] != null) {
                  double power = c['PowerKW'] is double ? c['PowerKW'] : (c['PowerKW'] as num).toDouble();
                  if (power > maxPower) maxPower = power;
                }
              }
              if (maxPower >= 40) {
                type = 'DC Fast Charge';
              } else if (maxPower >= 11) {
                type = 'Type 2 AC';
              }
           }

           if (poi['UsageCost'] != null && !poi['UsageCost'].toString().toLowerCase().contains('free')) {
              price = 120.0;
           }

           final stationIdStr = poi['ID'].toString();
           
           return StationModel(
             id: stationIdStr,
             name: poi['AddressInfo']?['Title'] ?? poi['OperatorInfo']?['Title'] ?? 'Global EV Station',
             lat: (poi['AddressInfo']?['Latitude'] ?? 0.0).toDouble(),
             lng: (poi['AddressInfo']?['Longitude'] ?? 0.0).toDouble(),
             availableSlots: max(0, (poi['NumberOfPoints'] ?? Random().nextInt(4) + 1).toInt() - (occupiedSlots[stationIdStr] ?? 0)),
             pricePerHour: price,
             chargerType: type,
           );
        }).toList();
      }
    } catch (e) {
      print("Error fetching live stations: $e");
    }
    return [];
  }

  // Get a stream of all stations around a given coordinate (or top India if null)
  Stream<List<StationModel>> getAllStations({double? lat, double? lng}) async* {
    yield await fetchLiveStations(lat: lat, lng: lng);
  }

  // Backwards compatibility for other potential usages
  Future<List<StationModel>> getNearbyStations(double lat, double lng, {double radiusInKm = 30.0}) async {
    return fetchLiveStations(lat: lat, lng: lng);
  }

  Future<StationModel?> getStationById(String stationId) async {
    // OpenChargeMap supports querying by ID if required in future
    return null;
  }
}
