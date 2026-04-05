import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/booking_model.dart';

class BookingService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Create a new booking
  Future<BookingModel?> createBooking(BookingModel booking) async {
    try {
      DocumentReference docRef = await _firestore.collection('bookings').add(booking.toMap());
      
      // Update available slots in station
      await _decreaseStationSlots(booking.stationId);

      return BookingModel.fromMap(booking.toMap(), docRef.id);
    } catch (e) {
      print('Create Booking Error: $e');
      rethrow;
    }
  }

  // Confirm booking (e.g., after payment success)
  Future<void> confirmBooking(String bookingId) async {
    try {
      await _firestore.collection('bookings').doc(bookingId).update({
        'paymentStatus': 'completed',
        'bookingStatus': 'confirmed',
      });
    } catch (e) {
      print('Confirm Booking Error: $e');
      rethrow;
    }
  }

  // Cancel booking
  Future<void> cancelBooking(String bookingId, String stationId) async {
    try {
      await _firestore.collection('bookings').doc(bookingId).update({
        'bookingStatus': 'cancelled',
      });
      // Restore available slot
      await _increaseStationSlots(stationId);
    } catch (e) {
      print('Cancel Booking Error: $e');
      rethrow;
    }
  }

  // Get user bookings as a stream
  Stream<List<BookingModel>> getUserBookings(String userId) {
    return _firestore
        .collection('bookings')
        .where('userId', isEqualTo: userId)
        .snapshots()
        .map((snapshot) {
      final list = snapshot.docs.map((doc) => BookingModel.fromMap(doc.data(), doc.id)).toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    });
  }

  // Helpers to update available slots transactionally
  Future<void> _decreaseStationSlots(String stationId) async {
    DocumentReference stationRef = _firestore.collection('stations').doc(stationId);
    return _firestore.runTransaction((transaction) async {
      DocumentSnapshot snapshot = await transaction.get(stationRef);
      if (!snapshot.exists) throw Exception('Station does not exist!');
      
      int currentSlots = (snapshot.data() as Map<String, dynamic>)['availableSlots'] ?? 0;
      if (currentSlots > 0) {
        transaction.update(stationRef, {'availableSlots': currentSlots - 1});
      } else {
        throw Exception('No slots available');
      }
    });
  }

  Future<void> _increaseStationSlots(String stationId) async {
    DocumentReference stationRef = _firestore.collection('stations').doc(stationId);
    return _firestore.runTransaction((transaction) async {
      DocumentSnapshot snapshot = await transaction.get(stationRef);
      if (!snapshot.exists) throw Exception('Station does not exist!');
      
      int currentSlots = (snapshot.data() as Map<String, dynamic>)['availableSlots'] ?? 0;
      transaction.update(stationRef, {'availableSlots': currentSlots + 1});
    });
  }
}
