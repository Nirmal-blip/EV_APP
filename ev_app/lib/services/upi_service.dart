import 'package:flutter_upi_india/flutter_upi_india.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class UpiService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<List<ApplicationMeta>> getInstalledUpiApps() async {
    return await UpiPay.getInstalledUpiApplications(
      statusType:
      UpiApplicationDiscoveryAppStatusType.all,
    );
  }

  Future<UpiTransactionResponse> initiateTransaction({
    required UpiApplication app,
    required double amount,
    String? bookingId,
    String? receiverUpiId,
    String? receiverName,
    String? transactionNote,
  }) async {
    final transactionRef =
        bookingId ?? DateTime.now().millisecondsSinceEpoch.toString();

    return await UpiPay.initiateTransaction(
      app: app,
      receiverUpiAddress:
      receiverUpiId ?? "nirmaljoshi123456789@okaxis",
      receiverName:
      receiverName ?? "EV Charging Station",
      transactionRef: transactionRef,
      transactionNote:
      transactionNote ?? "EV Charging Slot Booking",
      amount: amount.toStringAsFixed(2),
    );
  }

  Future<void> handlePaymentResponse({
    required UpiTransactionResponse response,
    required String userId,
    required double amount,
    String? bookingId,
    bool isWalletTopUp = false,
  }) async {

    final status = response.status;

    final txnId =
        response.txnId ??
            DateTime.now()
                .millisecondsSinceEpoch
                .toString();

    if (status == UpiTransactionStatus.success) {
      if (isWalletTopUp) {
        await _firestore.collection('users').doc(userId).set({
          'walletBalance': FieldValue.increment(amount),
        }, SetOptions(merge: true));

        await _firestore.collection("transactions").doc(txnId).set({
          "userId": userId,
          "amount": amount,
          "status": "success",
          "type": "wallet_topup",
          "transactionId": txnId,
          "timestamp": FieldValue.serverTimestamp(),
        });
        return;
      }

      if (bookingId == null || bookingId.isEmpty) {
        return;
      }

      await _firestore.collection("bookings").doc(bookingId).set({
        "bookingId": bookingId,
        "userId": userId,
        "amount": amount,
        "paymentStatus": "paid",
        "bookingStatus": "confirmed",
        "transactionId": txnId,
        "timestamp": FieldValue.serverTimestamp(),
      });

      await _firestore.collection("transactions").doc(txnId).set({
        "bookingId": bookingId,
        "userId": userId,
        "amount": amount,
        "status": "success",
        "timestamp": FieldValue.serverTimestamp(),
      });
    } else if (status == UpiTransactionStatus.submitted) {
      if (bookingId == null || bookingId.isEmpty) {
        return;
      }

      await _firestore.collection("bookings").doc(bookingId).set({
        "paymentStatus": "pending",
        "bookingStatus": "pending",
      }, SetOptions(merge: true));
    } else {
      if (bookingId == null || bookingId.isEmpty) {
        return;
      }

      await _firestore.collection("bookings").doc(bookingId).set({
        "paymentStatus": "failed",
        "bookingStatus": "cancelled",
      }, SetOptions(merge: true));
    }
  }
}
