import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../models/booking_model.dart'; //

class YourBookingsScreen extends StatelessWidget {
  const YourBookingsScreen({super.key});

  String _shortLabel(String value, {int maxLength = 8}) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return 'N/A';
    }
    if (trimmed.length <= maxLength) {
      return trimmed;
    }
    return trimmed.substring(0, maxLength);
  }

  @override
  Widget build(BuildContext context) {
    final String uid = FirebaseAuth.instance.currentUser?.uid ?? "";

    return Scaffold(
      backgroundColor: const Color(0xFFF9FBFA),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          _buildSliverAppBar(),
          
          // Real-time Bookings Stream
          StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('bookings')
                .where('userId', isEqualTo: uid) // Sirf current user ki bookings
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator(color: Color(0xFF00D261))),
                );
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return SliverFillRemaining(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.history_rounded, size: 80, color: Colors.grey.shade300),
                      const SizedBox(height: 20),
                      const Text("No Bookings Found", 
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey)),
                    ],
                  ),
                );
              }

              final bookings = snapshot.data!.docs.toList();
              
              // Sort the bookings locally to avoid Firestore Composite Index crash
              bookings.sort((a, b) {
                final timeA = (a.data() as Map<String, dynamic>)['createdAt'];
                final timeB = (b.data() as Map<String, dynamic>)['createdAt'];
                if (timeA is Timestamp && timeB is Timestamp) {
                  return timeB.compareTo(timeA);
                }
                return 0;
              });

              return SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final booking = BookingModel.fromMap(
                        bookings[index].data() as Map<String, dynamic>, 
                        bookings[index].id
                      ); //
                      return _buildBookingCard(context, booking);
                    },
                    childCount: bookings.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return const SliverAppBar(
      expandedHeight: 140,
      pinned: true,
      backgroundColor: Colors.white,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        centerTitle: false,
        titlePadding: EdgeInsets.only(left: 24, bottom: 20),
        title: Text("Your Bookings", 
          style: TextStyle(color: Color(0xFF1A1D1E), fontWeight: FontWeight.w900, fontSize: 24)),
      ),
    );
  }

  Widget _buildBookingCard(BuildContext context, BookingModel booking) {
    bool isCompleted = booking.paymentStatus == 'completed'; //

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 10))
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isCompleted ? const Color(0xFF00D261).withOpacity(0.05) : Colors.orange.withOpacity(0.05),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(28), topRight: Radius.circular(28)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.ev_station_rounded, color: isCompleted ? const Color(0xFF00D261) : Colors.orange),
                    const SizedBox(width: 10),
                    Text("Slot Booking", 
                      style: TextStyle(fontWeight: FontWeight.bold, color: isCompleted ? const Color(0xFF00D261) : Colors.orange)),
                  ],
                ),
                Text(DateFormat('dd MMM, hh:mm a').format(booking.slotTime), //
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade600)),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _buildRow("Booking ID", "#${_shortLabel(booking.id)}"), //
                const SizedBox(height: 12),
                _buildRow("Amount Paid", "₹${booking.amount.toStringAsFixed(2)}"), //
                const SizedBox(height: 12),
                _buildRow("Status", booking.paymentStatus.toUpperCase(), 
                  color: isCompleted ? Colors.green : Colors.red), //
                
                const Divider(height: 40),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {}, 
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))
                        ),
                        child: const Text("View Details"),
                      ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {}, 
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1A1D1E),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))
                        ),
                        child: const Text("Get Invoice", style: TextStyle(color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  Widget _buildRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600, fontSize: 13)),
        Text(value, style: TextStyle(color: color ?? const Color(0xFF1A1D1E), fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }
}
