import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_upi_india/flutter_upi_india.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:ui';

import '../services/upi_service.dart';

class UpiPaymentSheet extends StatefulWidget {
  final double amount;
  final String? bookingId;
  final String userId;
  final String? receiverUpiId;
  final String? receiverName;

  const UpiPaymentSheet({
    super.key,
    required this.amount,
    required this.userId,
    this.bookingId,
    this.receiverUpiId,
    this.receiverName,
  });

  @override
  State<UpiPaymentSheet> createState() =>
      _UpiPaymentSheetState();
}

class _UpiPaymentSheetState
    extends State<UpiPaymentSheet> {

  final UpiService _upiService = UpiService();

  List<ApplicationMeta>? _apps;

  bool _isLoading = true;

  static const Color accentGreen =
      Color(0xFF28C76F);

  @override
  void initState() {
    super.initState();
    _loadUpiApps();
  }

  Future<void> _loadUpiApps() async {
    try {

      final apps =
          await _upiService.getInstalledUpiApps();

      if (mounted) {
        setState(() {
          _apps = apps;
          _isLoading = false;
        });
      }

    } catch (e) {

      setState(() {
        _apps = [];
        _isLoading = false;
      });

    }
  }


  /// START PAYMENT FLOW
  Future<void> _processPayment(
      ApplicationMeta appMeta) async {

    try {

      HapticFeedback.mediumImpact();

      final response =
          await _upiService.initiateTransaction(
        app: appMeta.upiApplication,
        amount: widget.amount,
        bookingId: widget.bookingId,
        receiverUpiId: widget.receiverUpiId,
        receiverName: widget.receiverName,
        transactionNote: widget.bookingId == null
            ? "EV Wallet Recharge"
            : "EV Charging Slot Booking",
      );


      await _upiService.handlePaymentResponse(
        response: response,
        bookingId: widget.bookingId,
        userId: widget.userId,
        amount: widget.amount,
        isWalletTopUp: widget.bookingId == null,
      );


      if (mounted) {
        Navigator.pop(context, response);
      }

    } catch (e) {

      debugPrint("UPI ERROR: $e");

    }
  }


  @override
  Widget build(BuildContext context) {

    return BackdropFilter(

      filter:
          ImageFilter.blur(sigmaX: 12, sigmaY: 12),

      child: Container(

        decoration: BoxDecoration(

          color: const Color(0xFF161616)
              .withOpacity(0.95),

          borderRadius:
              const BorderRadius.vertical(
            top: Radius.circular(35),
          ),

          border: Border.all(
              color: Colors.white
                  .withOpacity(0.1)),

        ),

        padding:
            const EdgeInsets.fromLTRB(24, 12, 24, 40),

        child: Column(

          mainAxisSize: MainAxisSize.min,

          children: [

            _handleBar(),

            _header(),

            const SizedBox(height: 32),

            if (_isLoading)
              _loadingState()
            else if (_apps == null ||
                _apps!.isEmpty)
              _emptyState()
            else
              _appGrid(),

            const SizedBox(height: 24),

            _secureFooter(),

          ],

        ),

      ).animate().slideY(
            begin: 1,
            end: 0,
            duration: 500.ms,
            curve: Curves.easeOutQuart,
          ),

    );

  }


  Widget _handleBar() {

    return Container(

      width: 40,

      height: 4,

      margin:
          const EdgeInsets.only(bottom: 30),

      decoration: BoxDecoration(

        color: Colors.white24,

        borderRadius:
            BorderRadius.circular(2),

      ),

    );

  }


  Widget _header() {

    return Row(

      mainAxisAlignment:
          MainAxisAlignment.spaceBetween,

      children: [

        Column(

          crossAxisAlignment:
              CrossAxisAlignment.start,

          children: [

            const Text(

              "PAYMENT AMOUNT",

              style: TextStyle(
                color: Colors.white38,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5,
              ),

            ),

            const SizedBox(height: 4),

            Text(

              "₹${widget.amount.toStringAsFixed(2)}",

              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: Colors.white,
              ),

            ),

          ],

        ),

        Container(

          padding:
              const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 8,
          ),

          decoration: BoxDecoration(

            color:
                accentGreen.withOpacity(.1),

            borderRadius:
                BorderRadius.circular(12),

          ),

          child: Row(

            children: [

              const Icon(
                Icons.verified_user_rounded,
                color: accentGreen,
                size: 16,
              ),

              const SizedBox(width: 6),

              Text(
                widget.receiverName ??
                    "Verified Station",
                style: const TextStyle(
                  color: accentGreen,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              )

            ],

          ),

        )

      ],

    );

  }


  Widget _appGrid() {

    return GridView.builder(

      shrinkWrap: true,

      physics:
          const NeverScrollableScrollPhysics(),

      gridDelegate:
          const SliverGridDelegateWithFixedCrossAxisCount(

        crossAxisCount: 4,

        mainAxisSpacing: 20,

        crossAxisSpacing: 20,

        childAspectRatio: .8,

      ),

      itemCount: _apps!.length,

      itemBuilder: (context, index) {

        final app = _apps![index];

        return GestureDetector(

          onTap: () => _processPayment(app),

          child: Column(

            children: [

              Container(

                padding:
                    const EdgeInsets.all(12),

                decoration: BoxDecoration(

                  color: Colors.white
                      .withOpacity(.05),

                  borderRadius:
                      BorderRadius.circular(20),

                ),

                child:
                    app.iconImage(40),

              ),

              const SizedBox(height: 10),

              Text(

                app.upiApplication.appName,

                style: const TextStyle(
                  fontSize: 11,
                  color: Colors.white70,
                  fontWeight: FontWeight.w600,
                ),

              )

            ],

          ),

        )

            .animate()

            .fadeIn(delay: (index * 50).ms)

            .scale(begin:
                const Offset(.8, .8));

      },

    );

  }


  Widget _loadingState() {

    return const Center(
      child: CircularProgressIndicator(),
    );

  }


  Widget _emptyState() {

    return const Column(

      children: [

        Icon(Icons.error_outline,
            color: Colors.redAccent),

        SizedBox(height: 10),

        Text(
          "No UPI Apps Found",
          style: TextStyle(
              color: Colors.white),
        ),

      ],

    );

  }


  Widget _secureFooter() {

    return Row(

      mainAxisAlignment:
          MainAxisAlignment.center,

      children: [

        Icon(
          Icons.shield_outlined,
          size: 14,
          color:
              Colors.white.withOpacity(.2),
        ),

        const SizedBox(width: 8),

        Text(

          "Encrypted via NPCI Intent Flow",

          style: TextStyle(
            color:
                Colors.white.withOpacity(.2),
            fontSize: 11,
          ),

        )

      ],

    );

  }

}
