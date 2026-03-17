# Wash Club Quick Reference

## For Website Developers

### Add to Customer Dashboard

```tsx
import WashClubDashboard from '@/components/WashClubDashboard'

// In dashboard/page.tsx or dashboard layout:
<WashClubDashboard />
```

### Add to Booking Page (Step 7 - Review)

```tsx
import { WASH_CLUB_TIERS, calculateOrderTotal } from '@/lib/washClub'
import { Zap, Award, ChevronRight, X } from 'lucide-react'

// State variables:
const [washClubInfo, setWashClubInfo] = useState<any>(null)
const [creditsToRedeem, setCreditsToRedeem] = useState(0)
const [showCreditsModal, setShowCreditsModal] = useState(false)

// On component mount:
useEffect(() => {
  if (!user) return
  const res = await authenticatedFetch('/api/wash-club/membership')
  if (res.ok) {
    const data = await res.json()
    setWashClubInfo(data.membership)
  }
}, [user])

// In JSX (Step 7 review section):
{washClubInfo && (
  <>
    <Card className="bg-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-primary" />
          <span className="font-bold">Wash Club Rewards</span>
        </div>
        <Award size={20} className="text-accent" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray">Available Credits</div>
          <div className="text-2xl font-bold text-primary">
            {washClubInfo.creditsBalance?.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray">Tier</div>
          <div className="text-2xl font-bold text-accent">
            {WASH_CLUB_TIERS[washClubInfo.tier].name}
          </div>
        </div>
      </div>
      <Button onClick={() => setShowCreditsModal(true)} variant="outline">
        Apply Wash Club Credits
        <ChevronRight size={16} />
      </Button>
    </Card>

    {showCreditsModal && (
      <CreditsRedemptionModal
        membership={washClubInfo}
        onClose={() => setShowCreditsModal(false)}
        onApply={async (creditsAmount) => {
          const res = await authenticatedFetch('/api/wash-club/apply-credits', {
            method: 'POST',
            body: JSON.stringify({
              subtotal: calculateSubtotal(),
              creditsToRedeem: creditsAmount,
              creditValue: 0.01,
            }),
          })
          const data = await res.json()
          // Update booking with discounts:
          setBookingData({
            ...bookingData,
            washClubCreditsApplied: creditsAmount,
            washClubDiscount: data.calculation.discountFromCredits,
            tierDiscount: data.calculation.discountFromTier,
            finalTotal: data.calculation.finalTotal,
            creditsEarned: data.calculation.creditsEarned,
          })
        }}
      />
    )}
  </>
)}
```

### Calculate Order Total with Wash Club

```tsx
import { calculateOrderTotal } from '@/lib/washClub'

// When applying credits during checkout:
const calculation = calculateOrderTotal(
  subtotal,        // e.g., 150.00
  tierLevel,       // 1-4 for Bronze/Silver/Gold/Platinum
  creditsToRedeem, // customer's chosen amount
  0.01            // credit value in dollars
)

// Results:
console.log(calculation.finalTotal)        // Total after credits & tier discount
console.log(calculation.creditsEarned)    // Credits earned on this order
console.log(calculation.discountFromCredits) // $ saved from credits
console.log(calculation.discountFromTier)    // $ saved from tier membership
```

---

## For Mobile App Developers

### Swift (iOS)

```swift
import Foundation

struct WashClubMembership: Codable {
  let userId: String
  let tier: Int
  let creditsBalance: Double
  let creditsEarned: Double
  let totalSpend: Double
  let status: String
}

class WashClubManager {
  static let shared = WashClubManager()
  let baseURL = "https://washlee.com"
  
  func getMembership(token: String) async throws -> WashClubMembership {
    var request = URLRequest(
      url: URL(string: "\(baseURL)/api/wash-club/membership")!
    )
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(
      ["membership": WashClubMembership].self,
      from: data
    )
    return response["membership"]!
  }
  
  func applyCredits(
    subtotal: Double,
    creditsToRedeem: Double,
    token: String
  ) async throws -> [String: Any] {
    var request = URLRequest(
      url: URL(string: "\(baseURL)/api/wash-club/apply-credits")!
    )
    request.httpMethod = "POST"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: Any] = [
      "subtotal": subtotal,
      "creditsToRedeem": creditsToRedeem,
      "creditValue": 0.01
    ]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
  }
}

// Usage in ViewController:
let membership = try await WashClubManager.shared.getMembership(token: authToken)
print("Current Tier: \(membership.tier)")
print("Available Credits: \(membership.creditsBalance)")
```

### Kotlin (Android)

```kotlin
import com.google.gson.annotations.SerializedName
import retrofit2.http.*

data class WashClubMembership(
  val userId: String,
  val tier: Int,
  val creditsBalance: Double,
  val creditsEarned: Double,
  val totalSpend: Double,
  val status: String
)

data class ApplyCreditsRequest(
  val subtotal: Double,
  val creditsToRedeem: Double,
  val creditValue: Double = 0.01
)

interface WashClubService {
  @GET("api/wash-club/membership")
  suspend fun getMembership(
    @Header("Authorization") token: String
  ): Map<String, WashClubMembership>
  
  @POST("api/wash-club/apply-credits")
  suspend fun applyCredits(
    @Header("Authorization") token: String,
    @Body request: ApplyCreditsRequest
  ): Map<String, Any>
}

// Usage in Activity/Fragment:
viewModelScope.launch {
  try {
    val membership = washClubService.getMembership("Bearer $authToken")
      .get("membership")
    println("Tier: ${membership?.tier}")
    println("Credits: ${membership?.creditsBalance}")
  } catch (e: Exception) {
    Log.e("WashClub", "Error", e)
  }
}
```

### React Native

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage'

class WashClubAPI {
  static baseURL = 'https://washlee.com'
  
  static async getMembership(token) {
    const response = await fetch(
      `${this.baseURL}/api/wash-club/membership`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const data = await response.json()
    return data.membership
  }
  
  static async applyCredits(subtotal, creditsToRedeem, token) {
    const response = await fetch(
      `${this.baseURL}/api/wash-club/apply-credits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subtotal,
          creditsToRedeem,
          creditValue: 0.01,
        }),
      }
    )
    return await response.json()
  }
}

// Usage in component:
export function CheckoutScreen() {
  const [membership, setMembership] = useState(null)
  
  useEffect(() => {
    const loadMembership = async () => {
      const token = await AsyncStorage.getItem('authToken')
      const data = await WashClubAPI.getMembership(token)
      setMembership(data)
    }
    loadMembership()
  }, [])
  
  const handleApplyCredits = async (amount) => {
    const token = await AsyncStorage.getItem('authToken')
    const result = await WashClubAPI.applyCredits(
      subtotal,
      amount,
      token
    )
    // Use result.calculation for updated totals
  }
  
  return (
    <View>
      <Text>Available: {membership?.creditsBalance} credits</Text>
      <Text>Tier: {membership?.tier}</Text>
      <Button title="Apply Credits" onPress={() => handleApplyCredits(50)} />
    </View>
  )
}
```

---

## Database Collections (Firestore)

### Create Collections:

```javascript
// Use Firebase Console or write script to create:

// Collection: wash_clubs
// Document: {userId}
{
  "userId": "user123",
  "tier": 2,
  "totalSpend": 250.00,
  "creditsBalance": 45.75,
  "creditsEarned": 125.50,
  "creditsRedeemed": 79.75,
  "joinDate": timestamp,
  "lastUpdated": timestamp,
  "status": "active"
}

// Subcollection: wash_clubs/{userId}/transactions
// Document: {transactionId}
{
  "type": "earn",
  "amount": 12.00,
  "description": "Order #ORD-12345 completed",
  "orderId": "ORD-12345",
  "timestamp": timestamp,
  "balanceBefore": 100.00,
  "balanceAfter": 112.00
}
```

---

## Tier Reference Table

```
TIER      | NAME      | MIN SPEND | CREDITS | DISCOUNT | ANNUAL FEE
----------|-----------|-----------|---------|----------|----------
1         | Bronze    | $0        | 5%      | 0%       | Free
2         | Silver    | $200      | 8%      | 3%       | Free
3         | Gold      | $500      | 12%     | 5%       | Free
4         | Platinum  | $1,000    | 15%     | 10%      | $49.99
```

---

## API Response Examples

### GET /api/wash-club/membership

```json
{
  "membership": {
    "userId": "user123",
    "tier": 2,
    "totalSpend": 250.50,
    "creditsBalance": 45.75,
    "creditsEarned": 125.50,
    "creditsRedeemed": 79.75,
    "joinDate": "2024-01-15T10:30:00.000Z",
    "lastUpdated": "2024-03-16T14:22:00.000Z",
    "status": "active"
  }
}
```

### POST /api/wash-club/apply-credits

**Request:**
```json
{
  "subtotal": 150.00,
  "creditsToRedeem": 50,
  "creditValue": 0.01
}
```

**Response:**
```json
{
  "success": true,
  "calculation": {
    "creditsApplied": 50,
    "discountFromCredits": 0.50,
    "tierDiscount": 3,
    "discountFromTier": 4.50,
    "finalTotal": 145.00,
    "creditsEarned": 11.60
  },
  "membership": {
    "tier": 2,
    "tierName": "Silver",
    "creditsAvailable": 100
  }
}
```

---

## Common Tasks

### Check if user is eligible for tier upgrade

```tsx
import { calculateTier, checkTierUpgrade } from '@/lib/washClub'

const newTier = calculateTier(totalAnnualSpend)
const { upgraded, message } = checkTierUpgrade(currentTier, totalAnnualSpend)

if (upgraded) {
  console.log(message) // "Congratulations! You've been upgraded to Gold tier!"
}
```

### Calculate order total with all discounts

```tsx
import { calculateOrderTotal } from '@/lib/washClub'

const result = calculateOrderTotal(
  subtotal = 100,
  tierLevel = 2, // Silver
  creditsToRedeem = 50,
  creditValue = 0.01
)

// result.finalTotal = 94.50
// (100 - 0.50 credit discount - 3.00 tier discount)
// result.creditsEarned = 7.56 (8% of 94.50)
```

### Format credits for display

```tsx
import { formatCredits, formatCreditValue } from '@/lib/washClub'

console.log(formatCredits(45.75))           // "45.75 credits"
console.log(formatCreditValue(45.75))       // "$0.46"
console.log(formatCreditValue(45.75, 0.01)) // "$0.46"
```

---

## Testing Checklist

- [ ] User sees WashClubDashboard in customer dashboard
- [ ] /wash-club page displays all tiers correctly
- [ ] Membership info loads from API
- [ ] Credits apply to booking order
- [ ] Final total calculated correctly with both discounts
- [ ] Credits earned on order completion
- [ ] Tier progression works at thresholds ($200, $500, $1000)
- [ ] Mobile app can fetch membership via API
- [ ] Mobile app can apply credits via API
- [ ] Credit balance updates after redemption
- [ ] Firestore collections created with test data
- [ ] Transaction audit trail populated

---

## Deployment Checklist

- [ ] All Firestore collections created
- [ ] Security rules set for collections
- [ ] Firebase indexes created if needed
- [ ] WashClubDashboard added to customer dashboard
- [ ] Booking page integrated with Wash Club credits
- [ ] Order creation updated to:
  - Track credits applied
  - Deduct from balance
  - Create transaction
  - Emit earned credits
- [ ] Order confirmation email shows credits earned
- [ ] Admin dashboard (if needed) to manage memberships
- [ ] Mobile app updated with WashClub APIs
- [ ] Test with real orders in staging
- [ ] Monitor credit calculations in production
