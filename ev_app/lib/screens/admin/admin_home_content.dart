import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_animate/flutter_animate.dart';

class AdminHomeContent extends StatelessWidget {
  const AdminHomeContent({super.key});

  @override
  Widget build(BuildContext context) {
    final String adminUid = FirebaseAuth.instance.currentUser?.uid ?? "";

    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection('bookings').snapshots(),
      builder: (context, bookingSnapshot) {
        
        // FIX: Yahan filter lagaya hai taaki sirf 'user' role waale hi count ho
        return StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .where('role', isEqualTo: 'user') // <--- Admin ko count se bahar nikalne ke liye
              .snapshots(),
          builder: (context, userSnapshot) {
            
            double totalRevenue = 0;
            // Ab ye count sirf unka hai jinaka role 'user' hai
            int userCount = userSnapshot.hasData ? userSnapshot.data!.docs.length : 0;

            if (bookingSnapshot.hasData) {
              for (var doc in bookingSnapshot.data!.docs) {
                var data = doc.data() as Map<String, dynamic>;
                if (data['paymentStatus'] == 'completed') {
                  totalRevenue += (data['amount'] ?? 0.0).toDouble();
                }
              }
            }

            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FutureBuilder<DocumentSnapshot>(
                    future: FirebaseFirestore.instance.collection('users').doc(adminUid).get(),
                    builder: (context, nameSnapshot) {
                      String adminName = "Admin"; 
                      if (nameSnapshot.hasData && nameSnapshot.data!.exists) {
                        adminName = nameSnapshot.data!['name'] ?? "Admin";
                      }
                      return _buildHeader(adminName);
                    },
                  ),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("Real-time Stats", 
                          style: TextStyle(color: Color(0xFF0F172A), fontSize: 24, fontWeight: FontWeight.w900)),
                        const SizedBox(height: 20),
                        _buildStatCard("Total Revenue", "₹${totalRevenue.toStringAsFixed(2)}", Icons.payments_rounded, const Color(0xFF28C76F)),
                        const SizedBox(height: 16),
                        
                        // Ab yahan sirf 'user' role waale hi dikhenge
                        _buildStatCard("Total Users", "$userCount Users", Icons.people_alt_rounded, Colors.blue.shade700),
                        
                        const SizedBox(height: 35),
                        const Text("User Bookings Activity", style: TextStyle(color: Color(0xFF0F172A), fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 15),
                        ...userSnapshot.data!.docs.map((userDoc) {
                           var userData = userDoc.data() as Map<String, dynamic>? ?? {};
                           var userId = userDoc.id;
                           
                           // Find bookings for this user
                           var userBookings = [];
                           if (bookingSnapshot.hasData) {
                             userBookings = bookingSnapshot.data!.docs
                                 .map((b) => b.data() as Map<String, dynamic>)
                                 .where((b) => b['userId'] == userId || b['customerUid'] == userId)
                                 .toList();
                           }

                           userBookings.sort((a, b) {
                               var timeA = a['createdAt'];
                               var timeB = b['createdAt'];
                               int msA = (timeA is Timestamp) ? timeA.millisecondsSinceEpoch : 0;
                               int msB = (timeB is Timestamp) ? timeB.millisecondsSinceEpoch : 0;
                               return msB.compareTo(msA);
                           });

                           var latestBooking = userBookings.isNotEmpty ? userBookings.first : null;
                           int totalBookings = userBookings.length;
                           
                           String userName = userData['name'] ?? 'Anonymous';
                           if (userName.isEmpty) userName = 'User';
                           
                           return _buildUserBookingTile(userName, latestBooking, totalBookings);
                        }).toList(),
                        const SizedBox(height: 120),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
  
  // ... _buildHeader, _buildStatCard, _buildActionTile methods ...
}

  Widget _buildHeader(String name) {
    return Container(
      padding: const EdgeInsets.only(top: 70, left: 24, right: 24, bottom: 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("HELLO ADMIN,", style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
          Text(name, style: const TextStyle(color: Color(0xFF0F172A), fontSize: 32, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String val, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(18)),
            child: Icon(icon, color: color, size: 30),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: Colors.grey.shade700, fontSize: 13, fontWeight: FontWeight.bold)),
                Text(val, style: const TextStyle(color: Color(0xFF0F172A), fontSize: 24, fontWeight: FontWeight.w900)),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideX(begin: 0.1);
  }

  Widget _buildActionTile(String title, String sub, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFF28C76F), size: 28),
        title: Text(title, style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w800, fontSize: 16)),
        subtitle: Text(sub, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, color: Colors.black26, size: 18),
      ),
    );
  }

  Widget _buildUserBookingTile(String userName, Map<String, dynamic>? latestBooking, int totalBookings) {
    bool hasBooking = latestBooking != null;
    String status = hasBooking ? (latestBooking['paymentStatus'] ?? 'pending').toString().toUpperCase() : '';
    Color statusColor = status == 'COMPLETED' || status == 'SUCCESS' ? Colors.green : Colors.orange;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: const Color(0xFF28C76F).withOpacity(0.1),
          child: Text(userName[0].toUpperCase(), style: const TextStyle(color: Color(0xFF28C76F), fontWeight: FontWeight.bold)),
        ),
        title: Text(userName, style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w800, fontSize: 16)),
        subtitle: hasBooking
            ? Text("Bookings: $totalBookings • Last: ₹${latestBooking['amount']} @ Station: ${latestBooking['stationId'] ?? 'N/A'}", style: TextStyle(color: Colors.grey.shade600, fontSize: 12))
            : Text("No bookings yet", style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontStyle: FontStyle.italic)),
        trailing: hasBooking
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(status, style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
              )
            : const SizedBox(),
      ),
    );
  }
