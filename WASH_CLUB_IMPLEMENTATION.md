# Wash Club Implementation Guide

## Overview

Wash Club is a tiered loyalty program that rewards customers with credits for every order. Credits can be redeemed for discounts on future orders. This guide covers:

1. **Website Integration** - Adding Wash Club to the booking/ordering flow
2. **Mobile App Integration** - Implementing Wash Club in mobile applications
3. **Database Schema** - Firestore collection structure
4. **API Endpoints** - RESTful APIs for mobile and frontend consumption
5. **Business Rules** - Tier calculations, credit management, and redemption logic

---

## Quick Start: Core Concepts

### Tier System

| Tier | Name | Min Annual Spend | Credit Rate | Discount | Annual Fee |
|------|------|-----------------|------------|----------|-----------|
| 1 | Bronze | $0 | 5% | 0% | Free |
| 2 | Silver | $200 | 8% | 3% | Free |
| 3 | Gold | $500 | 12% | 5% | Free |
| 4 | Platinum | $1,000 | 15% | 10% | $49.99 |

### Credit Value

- 1 credit = $0.01
- Credits are earned automatically on order completion
- Customers can redeem up to 50% of order total in credits
- Credits never expire if account is active

---

## 1. Website Integration

### Adding Wash Club to Booking Page

**Location:** `app/booking/page.tsx`

#### Step 1: Add State Variables

```tsx
const [washClubInfo, setWashClubInfo] = useState<any>(null)
const [creditsToRedeem, setCreditsToRedeem] = useState(0)
const [showCreditsModal, setShowCreditsModal] = useState(false)
```

#### Step 2: Fetch Membership on Load

```tsx
useEffect(() => {
  if (!user) return

  const fetchWashClub = async () => {
    try {
      const response = await authenticatedFetch('/api/wash-club/membership')
      if (response.ok) {
        const data = await response.json()
        setWashClubInfo(data.membership)
      }
    } catch (err) {
      console.error('Failed to load Wash Club info:', err)
    }
  }

  fetchWashClub()
}, [user])
```

#### Step 3: Add Wash Club Section to Review Step

```tsx
// In Step 7 (Review & Confirm) render:
{washClubInfo && (
  <Card className="bg-primary/5 border border-primary/20">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Zap size={20} className="text-primary" />
        <span className="font-bold text-dark">Wash Club Rewards</span>
      </div>
      <Award size={20} className="text-accent" />
    </div>
    
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <div className="text-sm text-gray">Available Credits</div>
        <div className="text-2xl font-bold text-primary">
          {washClubInfo.creditsBalance?.toFixed(2) || '0.00'}
        </div>
      </div>
      <div>
        <div className="text-sm text-gray">Tier</div>
        <div className="text-2xl font-bold text-accent">
          {WASH_CLUB_TIERS[washClubInfo.tier].name}
        </div>
      </div>
    </div>
    
    <Button 
      variant="outline"
      onClick={() => setShowCreditsModal(true)}
      className="w-full"
    >
      Apply Wash Club Credits
      <ChevronRight size={16} />
    </Button>
  </Card>
)}
```

#### Step 4: Credits Modal Component

```tsx
{showCreditsModal && washClubInfo && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card className="max-w-md w-full mx-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-dark">Apply Wash Club Credits</h3>
        <button onClick={() => setShowCreditsModal(false)}>
          <X size={24} />
        </button>
      </div>
      
      <div className="bg-light rounded-lg p-4 mb-6">
        <div className="text-sm text-gray mb-2">Available</div>
        <div className="text-3xl font-bold text-primary">
          {washClubInfo.creditsBalance?.toFixed(2) || '0.00'} credits
        </div>
        <div className="text-xs text-gray mt-2">
          = ${(washClubInfo.creditsBalance * 0.01).toFixed(2)} value
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Credits to Redeem</label>
        <input
          type="number"
          min="0"
          max={washClubInfo.creditsBalance}
          value={creditsToRedeem}
          onChange={(e) => setCreditsToRedeem(Math.min(Number(e.target.value), washClubInfo.creditsBalance))}
          className="w-full px-4 py-2 border border-gray rounded-lg"
        />
        <div className="text-xs text-gray mt-2">
          Discount: ${(creditsToRedeem * 0.01).toFixed(2)}
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button 
          variant="outline"
          onClick={() => setShowCreditsModal(false)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={() => {
            applyCredits()
            setShowCreditsModal(false)
          }}
          className="flex-1"
        >
          Apply Credits
        </Button>
      </div>
    </Card>
  </div>
)}
```

#### Step 5: Apply Credits Function

```tsx
const applyCredits = async () => {
  try {
    const response = await authenticatedFetch('/api/wash-club/apply-credits', {
      method: 'POST',
      body: JSON.stringify({
        subtotal: calculateSubtotal(),
        creditsToRedeem,
        creditValue: 0.01,
      }),
    })
    
    if (!response.ok) throw new Error('Failed to apply credits')
    
    const data = await response.json()
    // Update booking data with calculated totals
    setBookingData({
      ...bookingData,
      washClubCreditsApplied: creditsToRedeem,
      washClubDiscount: data.calculation.discountFromCredits,
      tierDiscount: data.calculation.discountFromTier,
    })
  } catch (err) {
    console.error('Error applying credits:', err)
    setError('Failed to apply credits')
  }
}
```

---

## 2. Mobile App Integration

### REST API Endpoints

All endpoints require Bearer token authentication in `Authorization` header.

#### Get Membership Status

```
GET /api/wash-club/membership

Response:
{
  "membership": {
    "userId": "user123",
    "tier": 2,
    "totalSpend": 250.00,
    "creditsBalance": 45.75,
    "creditsEarned": 125.50,
    "creditsRedeemed": 79.75,
    "joinDate": "2024-01-15T10:30:00Z",
    "lastUpdated": "2024-03-16T14:22:00Z",
    "status": "active"
  }
}
```

#### Apply Credits to Order

```
POST /api/wash-club/apply-credits

Request:
{
  "subtotal": 150.00,
  "creditsToRedeem": 50,
  "creditValue": 0.01
}

Response:
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

#### Get Tier Benefits

```
GET /api/wash-club/tiers

Response:
{
  "tiers": [
    {
      "tier": 1,
      "name": "Bronze",
      "minSpend": 0,
      "creditRate": 0.05,
      "discount": 0,
      "benefits": [...]
    },
    ...
  ]
}
```

---

## 3. Database Schema

### Firestore Collections

#### `wash_clubs` (Membership Records)

```
/wash_clubs/{userId}
{
  "userId": "user123",
  "tier": 2,
  "totalSpend": 250.00,
  "creditsBalance": 45.75,
  "creditsEarned": 125.50,
  "creditsRedeemed": 79.75,
  "joinDate": Timestamp,
  "lastUpdated": Timestamp,
  "expiryDate": Timestamp (optional),
  "status": "active|inactive|suspended",
  "preferredTier": 2 (optional, for auto-upgrade)
}
```

#### `credit_transactions` (Audit Trail)

```
/wash_clubs/{userId}/transactions/{transactionId}
{
  "type": "earn|redeem|expire|admin_adjust",
  "amount": 25.50,
  "description": "Order #ORD-12345 completed",
  "orderId": "ORD-12345",
  "timestamp": Timestamp,
  "expiryDate": Timestamp (for earned credits),
  "balanceBefore": 100.00,
  "balanceAfter": 125.50
}
```

#### `wash_club_orders` (Order Integration)

Add to existing orders collection:

```
/orders/{orderId}
{
  ...existing fields,
  "washClubCreditsApplied": 50,
  "creditValue": 0.01,
  "discountFromCredits": 0.50,
  "discountFromTier": 4.50,
  "finalTotal": 145.00,
  "creditsEarned": 11.60,
  "tierAtOrderTime": 2
}
```

---

## 4. Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [x] Create `lib/washClub.ts` utilities
- [x] Create API endpoints (`/api/wash-club/*`)
- [x] Create `WashClubDashboard` component
- [x] Create `/wash-club` public page
- [ ] Create Firestore collections & indexes
- [ ] Create admin functions for tier management

### Phase 2: Website Integration (Week 2-3)
- [ ] Add Wash Club to booking page review step
- [ ] Add Wash Club section to customer dashboard
- [ ] Create credits redemption UI
- [ ] Add earned credits display in order confirmation
- [ ] Update checkout flow to apply credits

### Phase 3: Mobile App (Week 3-4)
- [ ] Document API endpoints for mobile developers
- [ ] Create mobile SDK/helper functions
- [ ] Implement Wash Club UI in mobile app
- [ ] Test cross-platform credit redemption
- [ ] Document mobile implementation patterns

### Phase 4: Enhancement (Week 4+)
- [ ] Add referral rewards
- [ ] Create seasonal promotions
- [ ] Implement tier-up notifications
- [ ] Add credit expiry reminders
- [ ] Create admin dashboard for Wash Club management

---

## 5. Mobile App Developer Guide

### iOS/Swift Implementation Example

```swift
// Get user membership
func getWashClubMembership(userId: String, token: String) async throws -> WashClubMembership {
    let url = URL(string: "https://washlee.com/api/wash-club/membership")!
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(MembershipResponse.self, from: data)
    return response.membership
}

// Apply credits to order
func applyWashClubCredits(
    subtotal: Double,
    creditsToRedeem: Double,
    token: String
) async throws -> CreditCalculation {
    let url = URL(string: "https://washlee.com/api/wash-club/apply-credits")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = [
        "subtotal": subtotal,
        "creditsToRedeem": creditsToRedeem,
        "creditValue": 0.01
    ]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(CreditsResponse.self, from: data)
    return response.calculation
}
```

### Android/Kotlin Implementation Example

```kotlin
// Get user membership
suspend fun getWashClubMembership(token: String): WashClubMembership {
    return httpClient.get("api/wash-club/membership") {
        bearerAuth(token)
    }.body()
}

// Apply credits to order
suspend fun applyWashClubCredits(
    subtotal: Double,
    creditsToRedeem: Double,
    token: String
): CreditCalculation {
    return httpClient.post("api/wash-club/apply-credits") {
        bearerAuth(token)
        contentType(ContentType.Application.Json)
        setBody(mapOf(
            "subtotal" to subtotal,
            "creditsToRedeem" to creditsToRedeem,
            "creditValue" to 0.01
        ))
    }.body<CreditsResponse>().calculation
}
```

### React Native Implementation Example

```javascript
// Get user membership
export const getWashClubMembership = async (token) => {
  const response = await fetch('https://washlee.com/api/wash-club/membership', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await response.json()
  return data.membership
}

// Apply credits to order
export const applyWashClubCredits = async (subtotal, creditsToRedeem, token) => {
  const response = await fetch('https://washlee.com/api/wash-club/apply-credits', {
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
  })
  const data = await response.json()
  return data.calculation
}
```

---

## 6. Testing Credentials

For development/testing with Wash Club:

- **Bronze Member**: $0 annual spend, 5% credits
- **Silver Member**: $250 annual spend, 8% credits, 3% discount
- **Gold Member**: $500 annual spend, 12% credits, 5% discount
- **Platinum Member**: $1,000 annual spend, 15% credits, 10% discount

Test credit redemption:
- Max credits to redeem: customer's balance
- Max discount via credits: 50% of order total
- Credit value: $0.01 per credit

---

## 7. Future Enhancements

1. **Referral Program**: Earn credits for referring friends
2. **Seasonal Bonuses**: Bonus credits during promotional periods
3. **Birthday Rewards**: Extra credits on birthday month
4. **Partnership Rewards**: Earn credits from partner merchants
5. **Gamification**: Badges, streaks, challenges
6. **Flexible Redemption**: Redeem for services, not just discounts
7. **Subscription Integration**: Auto-renew orders for bonus credits

---

## 8. Support & Questions

For implementation questions:
- Email: dev@washlee.com
- Docs: https://docs.washlee.com/wash-club
- API Reference: https://api.washlee.com/docs
