import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../models/booking_model.dart';
import '../services/booking_service.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  static const Color kPrimaryGreen = Color(0xFF28C76F);

  @override
  Widget build(BuildContext context) {
    final bookingService = BookingService();
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      return const Center(
        child: Text(
          'Please login to see bookings',
          style: TextStyle(color: Colors.black87),
        ),
      );
    }

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: const Color(0xFFF9F9F9),
        appBar: AppBar(
          title: const Text(
            'Activity',
            style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: true,
          bottom: TabBar(
            indicatorColor: kPrimaryGreen,
            labelColor: Colors.black87,
            unselectedLabelColor: Colors.black45,
            tabs: const [
              Tab(text: 'Ongoing'),
              Tab(text: 'Completed'),
            ],
          ),
        ),
        body: StreamBuilder<List<BookingModel>>(
          stream: bookingService.getUserBookings(user.uid),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator(color: kPrimaryGreen));
            }

            if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return const Center(
                child: Text(
                  'You have no bookings yet.',
                  style: TextStyle(color: Colors.black54, fontSize: 16),
                ),
              );
            }

            final now = DateTime.now();
            final bookings = snapshot.data!;
            final ongoingBookings = bookings.where((booking) => _isOngoingBooking(booking, now)).toList();
            final completedBookings = bookings.where((booking) => _isCompletedBooking(booking, now)).toList();

            return TabBarView(
              children: [
                _BookingTabView(
                  bookings: ongoingBookings,
                  emptyMessage: 'No ongoing bookings right now.',
                ),
                _BookingTabView(
                  bookings: completedBookings,
                  emptyMessage: 'No completed bookings yet.',
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  static bool _isOngoingBooking(BookingModel booking, DateTime now) {
    final paymentPending = booking.paymentStatus.toLowerCase() == 'pending';
    final bookingConfirmed = booking.bookingStatus.toLowerCase() == 'confirmed';
    return paymentPending || bookingConfirmed || booking.slotTime.isAfter(now);
  }

  static bool _isCompletedBooking(BookingModel booking, DateTime now) {
    return booking.paymentStatus.toLowerCase() == 'completed' && booking.slotTime.isBefore(now);
  }
}

class _BookingTabView extends StatelessWidget {
  const _BookingTabView({
    required this.bookings,
    required this.emptyMessage,
  });

  final List<BookingModel> bookings;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return Center(
        child: Text(
          emptyMessage,
          style: const TextStyle(color: Colors.black54, fontSize: 16),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: bookings.length,
      itemBuilder: (context, index) {
        return _BookingCard(booking: bookings[index])
            .animate()
            .fadeIn(delay: Duration(milliseconds: 100 * index))
            .slideY();
      },
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({required this.booking});

  final BookingModel booking;

  String _displayStationName(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return 'Unknown station';
    }
    return trimmed;
  }

  String _labelForBooking(BookingModel booking) {
    final paymentStatus = booking.paymentStatus.toLowerCase();
    final bookingStatus = booking.bookingStatus.toLowerCase();

    if (paymentStatus == 'completed' && booking.slotTime.isBefore(DateTime.now())) {
      return 'COMPLETED';
    }
    if (paymentStatus == 'pending') {
      return 'PAYMENT PENDING';
    }
    if (bookingStatus == 'confirmed') {
      return 'CONFIRMED';
    }
    return bookingStatus.toUpperCase();
  }

  Color _statusColor(BookingModel booking) {
    final paymentStatus = booking.paymentStatus.toLowerCase();
    final bookingStatus = booking.bookingStatus.toLowerCase();

    if (paymentStatus == 'completed' && booking.slotTime.isBefore(DateTime.now())) {
      return const Color(0xFF28C76F);
    }
    if (paymentStatus == 'pending') {
      return Colors.orange;
    }
    if (bookingStatus == 'confirmed') {
      return Colors.blueAccent;
    }
    return Colors.black54;
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(booking);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  _displayStationName(booking.stationId),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.black87,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _labelForBooking(booking),
                  style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.access_time_filled, color: Colors.black45, size: 18),
              const SizedBox(width: 8),
              Text(
                DateFormat('MMM dd, yyyy • hh:mm a').format(booking.slotTime),
                style: const TextStyle(color: Colors.black54, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.monetization_on, color: Colors.black45, size: 18),
              const SizedBox(width: 8),
              Text(
                '₹${booking.amount.toStringAsFixed(2)} • ${booking.paymentStatus}',
                style: const TextStyle(color: Colors.black54, fontSize: 14),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
