import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user_model.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  // Listen to Auth State Changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();


  // --- EMAIL LOGIN ---
  Future<UserCredential?> login(String email, String password) async {
    try {
      return await _auth.signInWithEmailAndPassword(email: email, password: password);
    } catch (e) {
      rethrow;
    }
  }

  // --- EMAIL SIGNUP ---
  Future<void> signup(String email, String password, String name) async {
    try {
      UserCredential result = await _auth.createUserWithEmailAndPassword(email: email, password: password);
      // Naya user hamesha 'user' role ke saath create hoga
      await _checkAndCreateUser(result.user!, name);
    } catch (e) {
      rethrow;
    }
  }

  // --- GOOGLE SIGN IN ---
  Future<UserCredential?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      UserCredential userCredential = await _auth.signInWithCredential(credential);
      await _checkAndCreateUser(userCredential.user!, userCredential.user!.displayName ?? "User");
      return userCredential;
    } catch (e) {
      rethrow;
    }
  }

  // --- LOGOUT ---
  Future<void> logout() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

  // --- GET USER DETAILS ---
  Future<UserModel?> getCurrentUserDetails() async {
    User? user = _auth.currentUser;
    if (user != null) {
      DocumentSnapshot doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        return UserModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }
    }
    return null;
  }

  // --- HELPER: ROLE MANAGEMENT ---
  Future<void> _checkAndCreateUser(User user, String name) async {
    final doc = await _firestore.collection('users').doc(user.uid).get();
    
    // Agar user database mein nahi hai, tabhi naya doc banao
    if (!doc.exists) {
      await _firestore.collection('users').doc(user.uid).set({
        'uid': user.uid,
        'name': name,
        'email': user.email ?? "",
        'walletBalance': 0.0,
        'role': 'user', // Default Role: User
        'createdAt': FieldValue.serverTimestamp(),
      });
    }
  }
}