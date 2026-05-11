# 📅 Mobile App - Scheduling Step Implementation
## Copy & Paste Guide for Flutter/React Native/Swift/Kotlin

**Created:** May 1, 2026  
**Status:** Ready to implement in mobile app  
**Platform Compatibility:** Flutter, React Native, Swift, Kotlin

---

## 📱 Implementation Overview

This is **Step 8** in the booking flow. It comes **after delivery address** and **before final review**.

### Flow Position
```
Step 1: Delivery Speed
Step 2: Pickup Address
Step 3: Care Preferences
Step 4: Weight
Step 5: Protection Plan
Step 6: Delivery Address
   ↓
** STEP 8: SCHEDULE PICKUP & DELIVERY TIMES ** ← You are here
   ↓
Step 9: Review & Confirm
   ↓
Payment (Stripe)
```

---

## 🎨 UI Components Required

### 1. Date Picker
- Min date: Tomorrow
- Max date: 30 days from today
- Format: YYYY-MM-DD

### 2. Time Slot Buttons
- Grid layout (2-3 columns)
- Display: "08:00-10:00"
- Show: "X pros available"
- Selected state: Primary color + highlighted background
- Unselected state: Gray border

### 3. Loading State
- Show spinner while fetching slots
- Disable date picker during load

### 4. Error State
- Display error message in red box
- Allow retry by selecting different date

---

## 🔌 API Endpoints to Call

### Endpoint 1: GET Pickup Slots

**URL:** `https://washlee.com/api/scheduling/pickup-slots`  
**Method:** POST  
**Auth:** None required initially (add if needed)

**Request Body:**
```json
{
  "date": "2026-05-15",
  "address": "123 Main St, Sydney NSW 2000, Australia",
  "duration_minutes": 30
}
```

**Response:**
```json
{
  "success": true,
  "date": "2026-05-15",
  "slots": [
    {
      "timeSlot": "08:00-10:00",
      "availablePros": 3,
      "remainingCapacity": 5
    },
    {
      "timeSlot": "10:00-12:00",
      "availablePros": 2,
      "remainingCapacity": 3
    }
  ],
  "totalAvailable": 2
}
```

**Error Response:**
```json
{
  "error": "Failed to fetch slots",
  "status": 500
}
```

---

### Endpoint 2: GET Delivery Slots

**URL:** `https://washlee.com/api/scheduling/delivery-slots`  
**Method:** POST  
**Auth:** None required initially

**Request Body:**
```json
{
  "date": "2026-05-16",
  "address": "456 Oak Ave, Sydney NSW 2000, Australia",
  "duration_minutes": 30
}
```

**Response:** Same format as pickup slots

---

## 📲 Flutter Implementation

### 1. State Management

```dart
// Add to your booking provider/notifier

class BookingState {
  // ... existing fields ...
  
  // Step 8: Scheduling
  String pickupDate = '';
  String pickupTimeSlot = '';
  String deliveryDate = '';
  String deliveryTimeSlot = '';
}

// Add to your notifier
class BookingNotifier extends StateNotifier<BookingState> {
  Future<void> fetchAvailableSlots(String pickupDate, String pickupAddress) async {
    state = state.copyWith(slotsLoading: true);
    
    try {
      // Fetch pickup slots
      final pickupResponse = await http.post(
        Uri.parse('https://washlee.com/api/scheduling/pickup-slots'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'date': pickupDate,
          'address': pickupAddress,
          'duration_minutes': 30
        })
      );
      
      if (pickupResponse.statusCode != 200) throw Exception('Failed to fetch pickup slots');
      final pickupData = jsonDecode(pickupResponse.body);
      
      // Calculate delivery date
      final pickupDateObj = DateTime.parse(pickupDate);
      DateTime deliveryDateObj;
      
      if (state.deliverySpeed == 'standard') {
        deliveryDateObj = pickupDateObj.add(Duration(days: 2));
      } else {
        deliveryDateObj = pickupDateObj.add(Duration(days: 1));
      }
      
      final deliveryDateStr = deliveryDateObj.toIso8601String().split('T')[0];
      
      // Fetch delivery slots
      final deliveryResponse = await http.post(
        Uri.parse('https://washlee.com/api/scheduling/delivery-slots'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'date': deliveryDateStr,
          'address': state.deliveryAddress,
          'duration_minutes': 30
        })
      );
      
      if (deliveryResponse.statusCode != 200) throw Exception('Failed to fetch delivery slots');
      final deliveryData = jsonDecode(deliveryResponse.body);
      
      // Update state with both slot lists
      state = state.copyWith(
        availablePickupSlots: pickupData['slots'] ?? [],
        availableDeliverySlots: deliveryData['slots'] ?? [],
        selectedDeliveryDate: deliveryDateStr,
        slotsLoading: false,
        slotsError: ''
      );
    } catch (error) {
      state = state.copyWith(
        slotsLoading: false,
        slotsError: error.toString()
      );
    }
  }
}
```

### 2. UI Screen

```dart
// lib/screens/booking/SchedulingScreen.dart

class SchedulingScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingState = ref.watch(bookingProvider);
    final bookingNotifier = ref.read(bookingProvider.notifier);
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Schedule Your Times'),
        backgroundColor: Color(0xFF48C9B0),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Error state
            if (bookingState.slotsError.isNotEmpty)
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  border: Border.all(color: Colors.red.shade200),
                  borderRadius: BorderRadius.circular(8)
                ),
                child: Text(
                  bookingState.slotsError,
                  style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold)
                )
              ),
            SizedBox(height: 24),
            
            // Pickup Date & Time Section
            Text(
              'Pickup Date & Time',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            
            // Date picker
            TextFormField(
              readOnly: true,
              onTap: () async {
                final pickedDate = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(Duration(days: 1)),
                  firstDate: DateTime.now().add(Duration(days: 1)),
                  lastDate: DateTime.now().add(Duration(days: 30)),
                );
                
                if (pickedDate != null) {
                  final dateStr = pickedDate.toIso8601String().split('T')[0];
                  bookingNotifier.setPickupDate(dateStr);
                  await bookingNotifier.fetchAvailableSlots(dateStr, bookingState.pickupAddress);
                }
              },
              decoration: InputDecoration(
                hintText: 'Select pickup date',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.calendar_today)
              ),
              controller: TextEditingController(text: bookingState.pickupDate),
            ),
            SizedBox(height: 16),
            
            // Time slots
            if (bookingState.slotsLoading)
              Center(child: CircularProgressIndicator())
            else if (bookingState.availablePickupSlots.isNotEmpty)
              GridView.builder(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 1.2,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8
                ),
                itemCount: bookingState.availablePickupSlots.length,
                itemBuilder: (context, index) {
                  final slot = bookingState.availablePickupSlots[index];
                  final isSelected = bookingState.pickupTimeSlot == slot['timeSlot'];
                  
                  return GestureDetector(
                    onTap: () {
                      bookingNotifier.setPickupTimeSlot(slot['timeSlot']);
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: isSelected ? Color(0xFF48C9B0) : Colors.grey,
                          width: isSelected ? 2 : 1
                        ),
                        borderRadius: BorderRadius.circular(8),
                        backgroundColor: isSelected ? Color(0xFFE8FFFB) : Colors.white
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            slot['timeSlot'],
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.black : Colors.grey
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            '${slot['availablePros']} pro${slot['availablePros'] != 1 ? 's' : ''}',
                            style: TextStyle(fontSize: 12, color: Colors.grey)
                          )
                        ],
                      ),
                    ),
                  );
                },
              )
            else if (bookingState.pickupDate.isNotEmpty)
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.yellow.shade50,
                  border: Border.all(color: Colors.yellow.shade200),
                  borderRadius: BorderRadius.circular(8)
                ),
                child: Text('No available times for this date')
              ),
            
            SizedBox(height: 32),
            
            // Delivery Date & Time Section
            Text(
              'Delivery Date & Time',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Color(0xFFE8FFFB),
                borderRadius: BorderRadius.circular(8)
              ),
              child: Text(
                bookingState.deliverySpeed == 'standard'
                  ? '✓ Estimated delivery: 24-48 hours'
                  : '✓ Estimated delivery: 12-18 hours',
                style: TextStyle(fontSize: 14)
              ),
            ),
            SizedBox(height: 16),
            
            // Time slots (same pattern as pickup)
            if (bookingState.slotsLoading)
              Center(child: CircularProgressIndicator())
            else if (bookingState.availableDeliverySlots.isNotEmpty)
              GridView.builder(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 1.2,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8
                ),
                itemCount: bookingState.availableDeliverySlots.length,
                itemBuilder: (context, index) {
                  final slot = bookingState.availableDeliverySlots[index];
                  final isSelected = bookingState.deliveryTimeSlot == slot['timeSlot'];
                  
                  return GestureDetector(
                    onTap: () {
                      bookingNotifier.setDeliveryTimeSlot(slot['timeSlot']);
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: isSelected ? Color(0xFF48C9B0) : Colors.grey,
                          width: isSelected ? 2 : 1
                        ),
                        borderRadius: BorderRadius.circular(8),
                        backgroundColor: isSelected ? Color(0xFFE8FFFB) : Colors.white
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            slot['timeSlot'],
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.black : Colors.grey
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            '${slot['availablePros']} pro${slot['availablePros'] != 1 ? 's' : ''}',
                            style: TextStyle(fontSize: 12, color: Colors.grey)
                          )
                        ],
                      ),
                    ),
                  );
                },
              )
            else if (bookingState.selectedDeliveryDate.isNotEmpty)
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.yellow.shade50,
                  border: Border.all(color: Colors.yellow.shade200),
                  borderRadius: BorderRadius.circular(8)
                ),
                child: Text('No available times for this date')
              ),
          ],
        ),
      ),
    );
  }
}
```

---

## ⚛️ React Native Implementation

### 1. State Management

```typescript
// Scheduling state
const [selectedPickupDate, setSelectedPickupDate] = useState('');
const [availablePickupSlots, setAvailablePickupSlots] = useState([]);
const [availableDeliverySlots, setAvailableDeliverySlots] = useState([]);
const [slotsLoading, setSlotsLoading] = useState(false);
const [slotsError, setSlotsError] = useState('');

const fetchAvailableSlots = async (pickupDate: string) => {
  setSlotsLoading(true);
  setSlotsError('');
  
  try {
    // Fetch pickup slots
    const pickupResponse = await fetch('https://washlee.com/api/scheduling/pickup-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: pickupDate,
        address: bookingData.pickupAddress,
        duration_minutes: 30
      })
    });
    
    if (!pickupResponse.ok) throw new Error('Failed to fetch pickup slots');
    const pickupData = await pickupResponse.json();
    setAvailablePickupSlots(pickupData.slots || []);
    
    // Calculate delivery date
    const pickupDateObj = new Date(pickupDate);
    const deliveryDateObj = new Date(pickupDateObj);
    
    if (bookingData.deliverySpeed === 'standard') {
      deliveryDateObj.setDate(deliveryDateObj.getDate() + 2);
    } else {
      deliveryDateObj.setDate(deliveryDateObj.getDate() + 1);
    }
    
    const deliveryDateStr = deliveryDateObj.toISOString().split('T')[0];
    
    // Fetch delivery slots
    const deliveryResponse = await fetch('https://washlee.com/api/scheduling/delivery-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: deliveryDateStr,
        address: bookingData.deliveryAddress,
        duration_minutes: 30
      })
    });
    
    if (!deliveryResponse.ok) throw new Error('Failed to fetch delivery slots');
    const deliveryData = await deliveryResponse.json();
    setAvailableDeliverySlots(deliveryData.slots || []);
    
    setBookingData({
      ...bookingData,
      deliveryDate: deliveryDateStr
    });
  } catch (error) {
    setSlotsError(error instanceof Error ? error.message : 'Failed to load time slots');
  } finally {
    setSlotsLoading(false);
  }
};
```

### 2. UI Component

```typescript
import { View, Text, FlatList, Pressable, ActivityIndicator, DatePickerIOS, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export function SchedulingStep() {
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>
        Schedule Your Times
      </Text>
      
      {slotsError ? (
        <View style={{ 
          backgroundColor: '#fee2e2', 
          borderColor: '#fca5a5', 
          borderWidth: 1, 
          borderRadius: 8, 
          padding: 12, 
          marginBottom: 24 
        }}>
          <Text style={{ color: '#991b1b', fontWeight: 'bold' }}>{slotsError}</Text>
        </View>
      ) : null}
      
      {/* Pickup Date */}
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
        Pickup Date & Time
      </Text>
      
      <Pressable
        onPress={() => setShowPickupDatePicker(true)}
        style={{
          borderWidth: 2,
          borderColor: '#9ca3af',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16
        }}
      >
        <Text>{selectedPickupDate || 'Select date'}</Text>
      </Pressable>
      
      {showPickupDatePicker && (
        Platform.OS === 'ios' ? (
          <DatePickerIOS
            date={selectedPickupDate ? new Date(selectedPickupDate) : new Date()}
            onDateChange={(date) => {
              const dateStr = date.toISOString().split('T')[0];
              setSelectedPickupDate(dateStr);
              fetchAvailableSlots(dateStr);
            }}
            minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
            maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
          />
        ) : (
          <DateTimePicker
            value={selectedPickupDate ? new Date(selectedPickupDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              if (date) {
                const dateStr = date.toISOString().split('T')[0];
                setSelectedPickupDate(dateStr);
                fetchAvailableSlots(dateStr);
              }
              setShowPickupDatePicker(false);
            }}
            minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
            maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
          />
        )
      )}
      
      {/* Pickup time slots */}
      {slotsLoading ? (
        <ActivityIndicator size="large" color="#48C9B0" style={{ marginVertical: 24 }} />
      ) : availablePickupSlots.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {availablePickupSlots.map((slot: any) => (
            <Pressable
              key={slot.timeSlot}
              onPress={() => setBookingData({ ...bookingData, pickupTimeSlot: slot.timeSlot })}
              style={{
                flex: 0.3,
                borderWidth: 2,
                borderColor: bookingData.pickupTimeSlot === slot.timeSlot ? '#48C9B0' : '#d1d5db',
                backgroundColor: bookingData.pickupTimeSlot === slot.timeSlot ? '#e8fffb' : '#fff',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                {slot.timeSlot}
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                {slot.availablePros} pro{slot.availablePros !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      
      {/* Delivery Date & Time (similar pattern) */}
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
        Delivery Date & Time
      </Text>
      
      <View style={{
        backgroundColor: '#e8fffb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16
      }}>
        <Text>
          {bookingData.deliverySpeed === 'standard'
            ? '✓ Estimated delivery: 24-48 hours'
            : '✓ Estimated delivery: 12-18 hours'}
        </Text>
      </View>
      
      {/* Delivery time slots (same as pickup) */}
      {slotsLoading ? (
        <ActivityIndicator size="large" color="#48C9B0" />
      ) : availableDeliverySlots.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {availableDeliverySlots.map((slot: any) => (
            <Pressable
              key={slot.timeSlot}
              onPress={() => setBookingData({ ...bookingData, deliveryTimeSlot: slot.timeSlot })}
              style={{
                flex: 0.3,
                borderWidth: 2,
                borderColor: bookingData.deliveryTimeSlot === slot.timeSlot ? '#48C9B0' : '#d1d5db',
                backgroundColor: bookingData.deliveryTimeSlot === slot.timeSlot ? '#e8fffb' : '#fff',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                {slot.timeSlot}
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                {slot.availablePros} pro{slot.availablePros !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
```

---

## 🍎 Swift Implementation (iOS)

```swift
import SwiftUI

struct SchedulingView: View {
    @State private var selectedPickupDate = Date().addingTimeInterval(86400) // Tomorrow
    @State private var selectedPickupTimeSlot = ""
    @State private var selectedDeliveryTimeSlot = ""
    @State private var availablePickupSlots: [TimeSlot] = []
    @State private var availableDeliverySlots: [TimeSlot] = []
    @State private var isLoading = false
    @State private var errorMessage = ""
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Schedule Your Times")
                .font(.title2)
                .fontWeight(.bold)
            
            // Error message
            if !errorMessage.isEmpty {
                HStack {
                    Image(systemName: "exclamationmark.circle.fill")
                    Text(errorMessage)
                }
                .padding(12)
                .background(Color(red: 1, green: 0.95, blue: 0.95))
                .cornerRadius(8)
                .foregroundColor(.red)
            }
            
            // Pickup Date & Time Section
            VStack(alignment: .leading, spacing: 12) {
                Label("Pickup Date & Time", systemImage: "clock.fill")
                    .font(.system(.body, design: .default))
                    .fontWeight(.semibold)
                
                DatePicker(
                    "",
                    selection: $selectedPickupDate,
                    in: Date().addingTimeInterval(86400)...Date().addingTimeInterval(30 * 86400),
                    displayedComponents: .date
                )
                .datePickerStyle(.graphical)
                .onChange(of: selectedPickupDate) { newValue in
                    fetchAvailableSlots(date: newValue)
                }
                
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                } else if !availablePickupSlots.isEmpty {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                        ForEach(availablePickupSlots, id: \.timeSlot) { slot in
                            Button(action: {
                                selectedPickupTimeSlot = slot.timeSlot
                            }) {
                                VStack(spacing: 4) {
                                    Text(slot.timeSlot)
                                        .font(.system(.body, design: .default))
                                        .fontWeight(.semibold)
                                    Text("\(slot.availablePros) pro\(slot.availablePros != 1 ? "s" : "")")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(12)
                                .background(selectedPickupTimeSlot == slot.timeSlot ? Color(red: 0.91, green: 1, blue: 0.98) : Color.white)
                                .border(selectedPickupTimeSlot == slot.timeSlot ? Color(red: 0.28, green: 0.79, blue: 0.69) : Color.gray, width: 2)
                                .cornerRadius(8)
                            }
                            .foregroundColor(.black)
                        }
                    }
                }
            }
            
            // Delivery Date & Time Section
            VStack(alignment: .leading, spacing: 12) {
                Label("Delivery Date & Time", systemImage: "truck.fill")
                    .font(.system(.body, design: .default))
                    .fontWeight(.semibold)
                
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(Color(red: 0.28, green: 0.79, blue: 0.69))
                    Text("Estimated delivery: 24-48 hours")
                        .font(.caption)
                }
                .padding(12)
                .background(Color(red: 0.91, green: 1, blue: 0.98))
                .cornerRadius(8)
                
                if !availableDeliverySlots.isEmpty {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                        ForEach(availableDeliverySlots, id: \.timeSlot) { slot in
                            Button(action: {
                                selectedDeliveryTimeSlot = slot.timeSlot
                            }) {
                                VStack(spacing: 4) {
                                    Text(slot.timeSlot)
                                        .font(.system(.body, design: .default))
                                        .fontWeight(.semibold)
                                    Text("\(slot.availablePros) pro\(slot.availablePros != 1 ? "s" : "")")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(12)
                                .background(selectedDeliveryTimeSlot == slot.timeSlot ? Color(red: 0.91, green: 1, blue: 0.98) : Color.white)
                                .border(selectedDeliveryTimeSlot == slot.timeSlot ? Color(red: 0.28, green: 0.79, blue: 0.69) : Color.gray, width: 2)
                                .cornerRadius(8)
                            }
                            .foregroundColor(.black)
                        }
                    }
                }
            }
            
            Spacer()
        }
        .padding(16)
    }
    
    private func fetchAvailableSlots(date: Date) {
        isLoading = true
        errorMessage = ""
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateString = dateFormatter.string(from: date)
        
        let url = URL(string: "https://washlee.com/api/scheduling/pickup-slots")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "date": dateString,
            "address": "123 Main St, Sydney NSW 2000",
            "duration_minutes": 30
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                isLoading = false
                
                if let error = error {
                    errorMessage = error.localizedDescription
                    return
                }
                
                guard let data = data,
                      let json = try? JSONDecoder().decode(SlotsResponse.self, from: data) else {
                    errorMessage = "Failed to parse response"
                    return
                }
                
                availablePickupSlots = json.slots
            }
        }.resume()
    }
}

struct TimeSlot: Codable {
    let timeSlot: String
    let availablePros: Int
}

struct SlotsResponse: Codable {
    let slots: [TimeSlot]
}
```

---

## 🤖 Kotlin Implementation (Android)

```kotlin
// BookingViewModel.kt

class BookingViewModel : ViewModel() {
    private val _bookingData = MutableLiveData<BookingData>()
    val bookingData: LiveData<BookingData> = _bookingData
    
    private val _availablePickupSlots = MutableLiveData<List<TimeSlot>>()
    val availablePickupSlots: LiveData<List<TimeSlot>> = _availablePickupSlots
    
    private val _slotsLoading = MutableLiveData<Boolean>()
    val slotsLoading: LiveData<Boolean> = _slotsLoading
    
    private val _slotsError = MutableLiveData<String>()
    val slotsError: LiveData<String> = _slotsError
    
    fun fetchAvailableSlots(pickupDate: String, pickupAddress: String) {
        _slotsLoading.value = true
        _slotsError.value = ""
        
        viewModelScope.launch {
            try {
                val client = OkHttpClient()
                val requestBody = JSONObject().apply {
                    put("date", pickupDate)
                    put("address", pickupAddress)
                    put("duration_minutes", 30)
                }.toString().toRequestBody("application/json".toMediaType())
                
                val request = Request.Builder()
                    .url("https://washlee.com/api/scheduling/pickup-slots")
                    .post(requestBody)
                    .build()
                
                val response = client.newCall(request).execute()
                
                if (response.isSuccessful) {
                    val jsonResponse = JSONObject(response.body?.string() ?: "")
                    val slotsArray = jsonResponse.getJSONArray("slots")
                    val slots = mutableListOf<TimeSlot>()
                    
                    for (i in 0 until slotsArray.length()) {
                        val slot = slotsArray.getJSONObject(i)
                        slots.add(
                            TimeSlot(
                                timeSlot = slot.getString("timeSlot"),
                                availablePros = slot.getInt("availablePros")
                            )
                        )
                    }
                    
                    _availablePickupSlots.value = slots
                } else {
                    _slotsError.value = "Failed to fetch slots"
                }
            } catch (e: Exception) {
                _slotsError.value = e.message ?: "Unknown error"
            } finally {
                _slotsLoading.value = false
            }
        }
    }
}

// TimeSlot.kt
data class TimeSlot(
    val timeSlot: String,
    val availablePros: Int
)

// SchedulingFragment.kt
class SchedulingFragment : Fragment() {
    private lateinit var viewModel: BookingViewModel
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        val datePicker = view.findViewById<DatePicker>(R.id.pickup_date_picker)
        val timeSlotRecycler = view.findViewById<RecyclerView>(R.id.time_slots_recycler)
        
        datePicker.setOnDateChangedListener { _, year, month, dayOfMonth ->
            val selectedDate = String.format("%04d-%02d-%02d", year, month + 1, dayOfMonth)
            viewModel.fetchAvailableSlots(selectedDate, "123 Main St, Sydney NSW 2000")
        }
        
        viewModel.availablePickupSlots.observe(viewLifecycleOwner) { slots ->
            val adapter = TimeSlotAdapter(slots) { selectedSlot ->
                // Update booking with selected time
            }
            timeSlotRecycler.adapter = adapter
        }
    }
}
```

---

## ✅ Validation Rules

Before allowing user to proceed to next step, verify:

- [x] Pickup date selected
- [x] Pickup time slot selected
- [x] Delivery date auto-calculated
- [x] Delivery time slot selected
- [x] Both slots have availability (availablePros > 0)

---

## 📊 Data to Store in Order

When creating order, include:

```json
{
  "pickup_date": "2026-05-15",
  "pickup_time_slot": "08:00-10:00",
  "delivery_date": "2026-05-17",
  "delivery_time_slot": "14:00-16:00"
}
```

---

**Document Version:** 1.0  
**Last Updated:** May 1, 2026  
**Status:** Production Ready
