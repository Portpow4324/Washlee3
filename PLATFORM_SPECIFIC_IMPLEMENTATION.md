# 📱 Platform-Specific Implementation Guide
## iOS (Swift), Android (Kotlin), Flutter & React Native

**Created:** April 29, 2026  
**Purpose:** Platform-specific code examples and setup instructions

---

## 🏗️ Architecture by Platform

### Shared Architecture Pattern

All platforms follow the same layered architecture:

```
┌─────────────────────────────────────────┐
│         UI Layer (Screens)              │
│  (Auth, Booking, Dashboard, Payment)    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│      State Management / ViewModel       │
│  (Handle business logic & state)        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│       Service Layer (API Client)        │
│  (Network requests, data transformations)
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│       Local Storage (Secure Keys)       │
│  (Tokens, user data, cache)             │
└─────────────────────────────────────────┘
```

---

## 🍎 iOS Implementation (Swift)

### 1. Project Setup

#### Dependencies (CocoaPods)
```ruby
# Podfile
pod 'Supabase'
pod 'GoTrue'
pod 'Stripe'
pod 'Alamofire'
pod 'KeychainAccess'
```

#### Xcode Configuration
```swift
// AppDelegate.swift
import UIKit
import Supabase
import StripePaymentSheet

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  
  static let supabase = SupabaseClient(
    supabaseUrl: URL(string: "https://hygktikkjggkgmlpxefp.supabase.co")!,
    supabaseKey: "sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI"
  )
  
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Configure Stripe
    StripeAPI.defaultPublishableKey = "pk_test_YOUR_KEY"
    
    // Configure deep link handling for payment
    return true
  }
  
  // Handle deep links for payment redirect
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    if url.scheme == "washlee" {
      // Handle payment return: washlee://payment-success?session_id=...
      NotificationCenter.default.post(
        name: NSNotification.Name("PaymentReturnURL"),
        object: url
      )
    }
    return true
  }
}
```

### 2. Authentication Service

```swift
// Services/AuthService.swift
import Supabase
import KeychainAccess

class AuthService: ObservableObject {
  @Published var user: User? = nil
  @Published var isLoading = false
  @Published var error: String? = nil
  
  private let supabase = AppDelegate.supabase
  private let keychain = KeychainAccess.Keychain(service: "com.washlee.app")
  
  // MARK: - Sign Up
  func signup(
    email: String,
    password: String,
    name: String,
    phone: String
  ) async {
    isLoading = true
    defer { isLoading = false }
    
    do {
      let response = try await supabase.auth.signUp(
        email: email,
        password: password,
        data: [
          "name": name,
          "phone": phone,
          "user_type": "customer"
        ]
      )
      
      // Save tokens securely
      if let session = response.session {
        try keychain.set(session.accessToken, key: "accessToken")
        try keychain.set(session.refreshToken, key: "refreshToken")
      }
      
      // Update user
      await MainActor.run {
        self.user = User(from: response.user)
        self.error = nil
      }
    } catch {
      await MainActor.run {
        self.error = error.localizedDescription
      }
    }
  }
  
  // MARK: - Sign In
  func signin(email: String, password: String) async {
    isLoading = true
    defer { isLoading = false }
    
    do {
      let response = try await supabase.auth.signIn(
        email: email,
        password: password
      )
      
      // Save tokens
      if let session = response.session {
        try keychain.set(session.accessToken, key: "accessToken")
        try keychain.set(session.refreshToken, key: "refreshToken")
      }
      
      await MainActor.run {
        self.user = User(from: response.user)
        self.error = nil
      }
    } catch {
      await MainActor.run {
        self.error = error.localizedDescription
      }
    }
  }
  
  // MARK: - Sign Out
  func signout() async {
    do {
      try await supabase.auth.signOut()
      try keychain.remove("accessToken")
      try keychain.remove("refreshToken")
      
      await MainActor.run {
        self.user = nil
      }
    } catch {
      print("Signout error: \(error)")
    }
  }
  
  // MARK: - Get Access Token
  func getAccessToken() -> String? {
    return try? keychain.get("accessToken")
  }
}
```

### 3. API Client

```swift
// Services/APIClient.swift
import Foundation
import Alamofire

class APIClient {
  static let shared = APIClient()
  
  private let baseURL = "https://washlee.com/api"
  
  func request<T: Decodable>(
    _ path: String,
    method: HTTPMethod = .get,
    parameters: [String: Any]? = nil,
    token: String? = nil
  ) async throws -> T {
    var headers = HTTPHeaders()
    headers["Content-Type"] = "application/json"
    
    if let token = token {
      headers["Authorization"] = "Bearer \(token)"
    }
    
    let url = baseURL + path
    
    return try await withCheckedThrowingContinuation { continuation in
      AF.request(
        url,
        method: method,
        parameters: parameters,
        encoding: JSONEncoding.default,
        headers: headers
      )
      .responseDecodable(of: T.self) { response in
        switch response.result {
        case .success(let value):
          continuation.resume(returning: value)
        case .failure(let error):
          continuation.resume(throwing: error)
        }
      }
    }
  }
}
```

### 4. Booking ViewModel

```swift
// ViewModels/BookingViewModel.swift
import Combine

class BookingViewModel: ObservableObject {
  @Published var step = 1
  
  // Step 1: Delivery Speed
  @Published var deliverySpeed: DeliverySpeed = .standard
  
  // Step 2: Pickup
  @Published var pickupAddress = ""
  @Published var pickupInstructions = ""
  
  // Step 3: Care
  @Published var detergent = "classic-scented"
  @Published var hangDry = false
  
  // Step 4: Weight
  @Published var weight: Double = 10.0
  
  // Step 5: Protection
  @Published var protectionPlan: ProtectionPlan = .basic
  
  // Step 6-7: Delivery (same as pickup logic)
  @Published var deliveryAddress = ""
  
  // Calculations
  var basePrice: Double {
    weight * deliverySpeed.rate
  }
  
  var hangDryPrice: Double {
    hangDry ? 16.50 : 0
  }
  
  var protectionPrice: Double {
    protectionPlan.price
  }
  
  var totalPrice: Double {
    basePrice + hangDryPrice + protectionPrice
  }
  
  var isValidForNextStep: Bool {
    switch step {
    case 1:
      return true // Always valid
    case 2:
      return !pickupAddress.isEmpty
    case 3:
      return !detergent.isEmpty
    case 4:
      return weight >= 10 && weight <= 45
    case 5:
      return true
    case 6:
      return !pickupAddress.isEmpty
    case 7:
      return !deliveryAddress.isEmpty
    default:
      return false
    }
  }
  
  func nextStep() {
    if step < 7 {
      step += 1
    }
  }
  
  func previousStep() {
    if step > 1 {
      step -= 1
    }
  }
  
  async func submitOrder(
    uid: String,
    email: String,
    name: String,
    token: String
  ) throws -> OrderResponse {
    let bookingData = [
      "deliverySpeed": deliverySpeed.rawValue,
      "pickupAddress": pickupAddress,
      "detergent": detergent,
      "hangDry": hangDry,
      "estimatedWeight": weight,
      "protectionPlan": protectionPlan.rawValue,
      "deliveryAddress": deliveryAddress
    ] as [String: Any]
    
    let request = [
      "uid": uid,
      "email": email,
      "customerName": name,
      "orderTotal": totalPrice,
      "bookingData": bookingData
    ] as [String: Any]
    
    return try await APIClient.shared.request(
      "/orders",
      method: .post,
      parameters: request,
      token: token
    )
  }
}

enum DeliverySpeed: String, CaseIterable {
  case standard = "standard"
  case express = "express"
  
  var rate: Double {
    switch self {
    case .standard:
      return 7.50
    case .express:
      return 12.50
    }
  }
  
  var duration: String {
    switch self {
    case .standard:
      return "24-48 hours"
    case .express:
      return "12-18 hours"
    }
  }
}

enum ProtectionPlan: String {
  case basic = "basic"
  case premium = "premium"
  case premiumPlus = "premium-plus"
  
  var price: Double {
    switch self {
    case .basic:
      return 0
    case .premium:
      return 3.50
    case .premiumPlus:
      return 8.50
    }
  }
}
```

### 5. Payment Integration

```swift
// Services/PaymentService.swift
import StripePaymentSheet

class PaymentService {
  static let shared = PaymentService()
  
  func createCheckoutSession(
    orderId: String,
    amount: Double,
    token: String
  ) async throws -> CheckoutSession {
    let request = [
      "orderId": orderId,
      "orderTotal": amount,
      "successUrl": "washlee://payment-success",
      "cancelUrl": "washlee://payment-cancel"
    ]
    
    return try await APIClient.shared.request(
      "/stripe/create-checkout-session",
      method: .post,
      parameters: request,
      token: token
    )
  }
  
  func presentPaymentSheet(
    clientSecret: String,
    in viewController: UIViewController
  ) async throws {
    var configuration = PaymentSheet.Configuration()
    configuration.merchantDisplayName = "Washlee"
    configuration.returnURL = "washlee://payment-return"
    
    let paymentSheet = PaymentSheet(paymentIntentClientSecret: clientSecret, configuration: configuration)
    
    var paymentResult: PaymentSheetResult?
    
    await MainActor.run {
      paymentSheet.present(from: viewController) { result in
        paymentResult = result
      }
    }
    
    guard let result = paymentResult else { return }
    
    switch result {
    case .completed:
      print("Payment completed successfully")
    case .canceled:
      throw PaymentError.userCancelled
    case .failed(let error):
      throw error
    }
  }
}

struct CheckoutSession: Decodable {
  let sessionId: String
  let clientSecret: String
  let url: String?
}

enum PaymentError: Error {
  case userCancelled
  case invalidSession
  case networkError
}
```

---

## 🤖 Android Implementation (Kotlin)

### 1. Project Setup

#### Gradle Dependencies
```gradle
// build.gradle (Project)
buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath "com.android.tools.build:gradle:7.0.0"
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:1.7.0"
  }
}

// build.gradle (Module)
dependencies {
  // Supabase
  implementation "io.github.supabase:gotrue-kt:1.0.0"
  implementation "io.github.supabase:realtime-kt:1.0.0"
  
  // Stripe
  implementation "com.stripe:stripe-android:20.0.0"
  
  // Networking
  implementation "com.squareup.okhttp3:okhttp:4.10.0"
  implementation "com.squareup.retrofit2:retrofit:2.9.0"
  implementation "com.google.code.gson:gson:2.10.1"
  
  // Security
  implementation "androidx.security:security-crypto:1.1.0-alpha06"
  
  // Coroutines
  implementation "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.6.0"
  implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.6.0"
}
```

#### AndroidManifest.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.washlee.app">
    
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    
    <application>
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Payment deep link -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="washlee" android:host="payment-return" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 2. Authentication Service

```kotlin
// services/AuthService.kt
package com.washlee.app.services

import io.github.supabase.GoTrue
import io.github.supabase.SupabaseClient
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthService(context: Context) {
  private val supabase = SupabaseClient(
    supabaseUrl = "https://hygktikkjggkgmlpxefp.supabase.co",
    supabaseKey = "sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI"
  )
  
  private val masterKey = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
  private val encryptedSharedPref = EncryptedSharedPreferences.create(
    context,
    "washlee_secure_prefs",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
  )
  
  suspend fun signup(
    email: String,
    password: String,
    name: String,
    phone: String
  ): Result<AuthResponse> = withContext(Dispatchers.IO) {
    try {
      val response = supabase.auth.signUp(
        email = email,
        password = password,
        data = mapOf(
          "name" to name,
          "phone" to phone,
          "user_type" to "customer"
        )
      )
      
      response.session?.let { session ->
        encryptedSharedPref.edit().apply {
          putString("accessToken", session.accessToken)
          putString("refreshToken", session.refreshToken)
          apply()
        }
      }
      
      Result.success(AuthResponse(user = response.user))
    } catch (e: Exception) {
      Result.failure(e)
    }
  }
  
  suspend fun signin(
    email: String,
    password: String
  ): Result<AuthResponse> = withContext(Dispatchers.IO) {
    try {
      val response = supabase.auth.signIn(
        email = email,
        password = password
      )
      
      response.session?.let { session ->
        encryptedSharedPref.edit().apply {
          putString("accessToken", session.accessToken)
          putString("refreshToken", session.refreshToken)
          apply()
        }
      }
      
      Result.success(AuthResponse(user = response.user))
    } catch (e: Exception) {
      Result.failure(e)
    }
  }
  
  suspend fun signout(): Result<Unit> = withContext(Dispatchers.IO) {
    try {
      supabase.auth.signOut()
      encryptedSharedPref.edit().apply {
        remove("accessToken")
        remove("refreshToken")
        apply()
      }
      Result.success(Unit)
    } catch (e: Exception) {
      Result.failure(e)
    }
  }
  
  fun getAccessToken(): String? {
    return encryptedSharedPref.getString("accessToken", null)
  }
  
  fun getRefreshToken(): String? {
    return encryptedSharedPref.getString("refreshToken", null)
  }
}

data class AuthResponse(val user: AuthUser? = null)
data class AuthUser(val id: String, val email: String)
```

### 3. API Client (Retrofit)

```kotlin
// services/ApiClient.kt
package com.washlee.app.services

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.OkHttpClient
import okhttp3.Interceptor
import kotlinx.coroutines.suspendCancellableCoroutine

class ApiClient(private val authService: AuthService) {
  private val httpClient = OkHttpClient.Builder()
    .addInterceptor { chain ->
      val originalRequest = chain.request()
      
      // Add auth header if token exists
      val token = authService.getAccessToken()
      val request = if (!token.isNullOrEmpty()) {
        originalRequest.newBuilder()
          .header("Authorization", "Bearer $token")
          .header("Content-Type", "application/json")
          .build()
      } else {
        originalRequest.newBuilder()
          .header("Content-Type", "application/json")
          .build()
      }
      
      chain.proceed(request)
    }
    .build()
  
  private val retrofit = Retrofit.Builder()
    .baseUrl("https://washlee.com/api/")
    .client(httpClient)
    .addConverterFactory(GsonConverterFactory.create())
    .build()
  
  val ordersService: OrdersService = retrofit.create(OrdersService::class.java)
  val paymentService: PaymentService = retrofit.create(PaymentService::class.java)
}

// Retrofit Service interfaces
interface OrdersService {
  @POST("orders")
  suspend fun createOrder(@Body request: CreateOrderRequest): ApiResponse<OrderResponse>
  
  @GET("orders")
  suspend fun getOrders(): ApiResponse<List<Order>>
  
  @GET("orders/{orderId}")
  suspend fun getOrder(@Path("orderId") orderId: String): ApiResponse<Order>
}

interface PaymentService {
  @POST("stripe/create-checkout-session")
  suspend fun createCheckoutSession(
    @Body request: CreateCheckoutSessionRequest
  ): ApiResponse<CheckoutSessionResponse>
}

// Data classes
data class CreateOrderRequest(
  val uid: String,
  val email: String,
  val customerName: String,
  val orderTotal: Double,
  val bookingData: BookingData
)

data class BookingData(
  val deliverySpeed: String,
  val pickupAddress: String,
  val detergent: String,
  val hangDry: Boolean,
  val estimatedWeight: Double,
  val protectionPlan: String,
  val deliveryAddress: String
)

data class OrderResponse(
  val id: String,
  val user_id: String,
  val total_price: Double,
  val status: String,
  val weight: Double,
  val created_at: String
)

data class ApiResponse<T>(
  val success: Boolean,
  val data: T? = null,
  val error: String? = null
)
```

### 4. Payment Integration

```kotlin
// services/StripePaymentService.kt
package com.washlee.app.services

import com.stripe.android.PaymentConfiguration
import com.stripe.android.payments.paymentlauncher.PaymentLauncher
import com.stripe.android.payments.paymentlauncher.PaymentResult
import com.stripe.android.model.ConfirmPaymentIntentParams
import com.stripe.android.payments.PaymentFlowResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment

class StripePaymentService {
  fun setupStripe(publishableKey: String) {
    PaymentConfiguration.init(
      context = /* application context */,
      publishableKey = publishableKey
    )
  }
  
  fun launchPaymentSheet(
    fragment: Fragment,
    clientSecret: String,
    onResult: (PaymentResult) -> Unit
  ) {
    val paymentLauncher = PaymentLauncher.Launcher(
      createActivityResultContract = fragment.registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
      ) { result ->
        // Handle payment result
        if (result.resultCode == android.app.Activity.RESULT_OK) {
          onResult(PaymentResult.Completed())
        } else {
          onResult(PaymentResult.Failed(Exception("Payment cancelled")))
        }
      }
    )
    
    paymentLauncher.presentPaymentSheet(clientSecret)
  }
}
```

---

## 🐦 Flutter Implementation

### 1. Project Setup

#### pubspec.yaml
```yaml
name: washlee
description: Washlee laundry service app
publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=2.19.0 <3.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # Supabase & Auth
  supabase_flutter: ^1.2.0
  gotrue: ^1.4.0
  
  # Stripe
  flutter_stripe: ^8.0.0
  
  # Networking
  dio: ^5.0.0
  
  # Storage
  flutter_secure_storage: ^8.0.0
  
  # State management
  riverpod: ^2.0.0
  riverpod_generator: ^2.0.0
  
  # UI
  google_maps_flutter: ^2.2.0
  google_places_flutter: ^2.0.0

dev_dependencies:
  build_runner: ^2.3.0
  riverpod_generator: ^2.0.0
```

### 2. Main App Setup

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app/config/stripe_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://hygktikkjggkgmlpxefp.supabase.co',
    anonKey: 'sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI',
  );
  
  // Initialize Stripe
  Stripe.publishableKey = 'pk_test_YOUR_KEY';
  await Stripe.instance.applySettings();
  
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Washlee',
      theme: ThemeData(
        primaryColor: const Color(0xFF48C9B0),
        useMaterial3: true,
      ),
      home: const RootScreen(),
    );
  }
}
```

### 3. Authentication Provider

```dart
// lib/features/auth/providers/auth_provider.dart
import 'package:riverpod/riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';
import '../repositories/auth_repository.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  return AuthNotifier();
});

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  AuthNotifier() : super(const AsyncValue.loading()) {
    _initAuth();
  }

  final _supabase = Supabase.instance.client;
  final _storage = const FlutterSecureStorage();
  late final AuthRepository _repository = AuthRepository(_supabase, _storage);

  Future<void> _initAuth() async {
    try {
      final user = _supabase.auth.currentUser;
      state = AsyncValue.data(user != null ? User.fromSupabase(user) : null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<void> signup({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    state = const AsyncValue.loading();
    
    try {
      final result = await _repository.signup(
        email: email,
        password: password,
        name: name,
        phone: phone,
      );
      
      state = AsyncValue.data(result);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<void> signin({
    required String email,
    required String password,
  }) async {
    state = const AsyncValue.loading();
    
    try {
      final result = await _repository.signin(email: email, password: password);
      state = AsyncValue.data(result);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<void> signout() async {
    try {
      await _repository.signout();
      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }
}
```

### 4. Booking Provider

```dart
// lib/features/booking/providers/booking_provider.dart
import 'package:riverpod/riverpod.dart';
import '../models/booking_state.dart';
import '../services/booking_service.dart';

final bookingProvider = StateNotifierProvider<BookingNotifier, BookingState>((ref) {
  return BookingNotifier(BookingService());
});

class BookingNotifier extends StateNotifier<BookingState> {
  BookingNotifier(this._service) : super(BookingState.initial());

  final BookingService _service;

  void setDeliverySpeed(DeliverySpeed speed) {
    state = state.copyWith(deliverySpeed: speed);
  }

  void setPickupAddress(String address) {
    state = state.copyWith(pickupAddress: address);
  }

  void setDetergent(String detergent) {
    state = state.copyWith(detergent: detergent);
  }

  void setHangDry(bool value) {
    state = state.copyWith(hangDry: value);
  }

  void setWeight(double weight) {
    state = state.copyWith(weight: weight);
  }

  void setProtectionPlan(ProtectionPlan plan) {
    state = state.copyWith(protectionPlan: plan);
  }

  void setDeliveryAddress(String address) {
    state = state.copyWith(deliveryAddress: address);
  }

  void nextStep() {
    if (state.currentStep < 7) {
      state = state.copyWith(currentStep: state.currentStep + 1);
    }
  }

  void previousStep() {
    if (state.currentStep > 1) {
      state = state.copyWith(currentStep: state.currentStep - 1);
    }
  }

  Future<OrderResponse> submitOrder(String uid, String email, String name) async {
    return _service.createOrder(
      uid: uid,
      email: email,
      name: name,
      state: state,
    );
  }
}
```

### 5. Payment Widget

```dart
// lib/features/payment/screens/payment_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import '../models/checkout_session.dart';
import '../services/payment_service.dart';

class PaymentScreen extends StatefulWidget {
  final String orderId;
  final double amount;
  final String clientSecret;

  const PaymentScreen({
    Key? key,
    required this.orderId,
    required this.amount,
    required this.clientSecret,
  }) : super(key: key);

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Confirm Payment')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Order Total',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                '\$${widget.amount.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: _isLoading ? null : _completePayment,
                icon: const Icon(Icons.payment),
                label: const Text('Complete Payment'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _completePayment() async {
    setState(() => _isLoading = true);

    try {
      await Stripe.instance.confirmPaymentSheetPayment();
      
      if (mounted) {
        Navigator.of(context).pushReplacementNamed(
          '/order-success',
          arguments: widget.orderId,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment failed: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}
```

---

## ⚛️ React Native Implementation

### 1. Project Setup

#### package.json
```json
{
  "name": "washlee",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.73.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-react-native": "^0.1.5",
    "@stripe/stripe-react-native": "^0.28.0",
    "axios": "^1.6.0",
    "react-native-keychain": "^9.0.0",
    "react-native-maps": "^1.8.0",
    "@react-navigation/native": "^6.1.0",
    "@react-native-async-storage/async-storage": "^1.21.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.0.0"
  }
}
```

### 2. Auth Context

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as SecureStorage from 'react-native-keychain';

interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType {
  state: AuthState;
  signup: (email: string, password: string, name: string, phone: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        dispatch({
          type: 'SET_USER',
          payload: session.user,
        });
      } else {
        dispatch({ type: 'CLEAR_USER' });
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, name: string, phone: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, user_type: 'customer' },
        },
      });

      if (error) throw error;

      if (data.session) {
        await SecureStorage.setGenericPassword('token', data.session.access_token);
      }

      dispatch({ type: 'SET_USER', payload: data.user });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Signup failed',
      });
    }
  };

  const signin = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        await SecureStorage.setGenericPassword('token', data.session.access_token);
      }

      dispatch({ type: 'SET_USER', payload: data.user });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Signin failed',
      });
    }
  };

  const signout = async () => {
    try {
      await supabase.auth.signOut();
      await SecureStorage.resetGenericPassword();
      dispatch({ type: 'CLEAR_USER' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Signout failed',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ state, signup, signin, signout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Reducer
const initialState: AuthState = { user: null, loading: false, error: null };

function authReducer(state: AuthState, action: any): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'CLEAR_USER':
      return { ...state, user: null, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}
```

### 3. Booking Screen

```typescript
// src/screens/BookingScreen.tsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { DeliverySpeedStep } from '../components/booking/DeliverySpeedStep';
import { PickupAddressStep } from '../components/booking/PickupAddressStep';
import { CareStep } from '../components/booking/CareStep';
import { WeightStep } from '../components/booking/WeightStep';
import { ProtectionStep } from '../components/booking/ProtectionStep';
import { DeliveryAddressStep } from '../components/booking/DeliveryAddressStep';
import { OrderSummaryStep } from '../components/booking/OrderSummaryStep';

export function BookingScreen() {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    deliverySpeed: 'standard',
    pickupAddress: '',
    detergent: 'classic-scented',
    hangDry: false,
    weight: 10,
    protectionPlan: 'basic',
    deliveryAddress: '',
  });

  const currentPrice = calculatePrice(bookingData);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <DeliverySpeedStep
            selected={bookingData.deliverySpeed}
            onSelect={(speed) => setBookingData({ ...bookingData, deliverySpeed: speed })}
          />
        );
      case 2:
        return (
          <PickupAddressStep
            address={bookingData.pickupAddress}
            onAddressSelect={(addr) => setBookingData({ ...bookingData, pickupAddress: addr })}
          />
        );
      case 3:
        return (
          <CareStep
            detergent={bookingData.detergent}
            hangDry={bookingData.hangDry}
            onDetergentChange={(d) => setBookingData({ ...bookingData, detergent: d })}
            onHangDryChange={(h) => setBookingData({ ...bookingData, hangDry: h })}
          />
        );
      case 4:
        return (
          <WeightStep
            weight={bookingData.weight}
            onWeightChange={(w) => setBookingData({ ...bookingData, weight: w })}
          />
        );
      case 5:
        return (
          <ProtectionStep
            selected={bookingData.protectionPlan}
            onSelect={(plan) => setBookingData({ ...bookingData, protectionPlan: plan })}
          />
        );
      case 6:
        return (
          <DeliveryAddressStep
            address={bookingData.deliveryAddress}
            onAddressSelect={(addr) => setBookingData({ ...bookingData, deliveryAddress: addr })}
          />
        );
      case 7:
        return <OrderSummaryStep bookingData={bookingData} totalPrice={currentPrice} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>Step {step} of 7</Text>
      </View>

      {renderStep()}

      <View style={styles.footer}>
        <Text style={styles.price}>${currentPrice.toFixed(2)}</Text>
        <View style={styles.buttons}>
          {step > 1 && (
            <Button
              title="Back"
              onPress={() => setStep(step - 1)}
              variant="outline"
            />
          )}
          {step < 7 && (
            <Button
              title="Next"
              onPress={() => setStep(step + 1)}
            />
          )}
          {step === 7 && (
            <Button
              title="Complete Booking"
              onPress={() => handleSubmitOrder()}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fefe' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  stepText: { fontSize: 14, color: '#6b7b78' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  price: { fontSize: 24, fontWeight: 'bold', color: '#48C9B0', marginBottom: 16 },
  buttons: { flexDirection: 'row', gap: 8 },
});
```

---

## 🔧 Environment Configuration

### All Platforms

```
SUPABASE_URL=https://hygktikkjggkgmlpxefp.supabase.co
SUPABASE_ANON_KEY=sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
API_BASE_URL=https://washlee.com/api
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
GOOGLE_PLACES_API_KEY=YOUR_GOOGLE_PLACES_KEY
```

---

**Document Version:** 1.0  
**Status:** Complete  
**Last Updated:** April 29, 2026
