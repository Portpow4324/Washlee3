# Supabase Schema Completeness Check

## ✅ WHAT YOU HAVE (Already in current schema):
1. **users** - All user accounts (customers, pros, admins)
2. **customers** - Customer account data
3. **employees** - Pro/employee account data
4. **orders** - Customer orders
5. **wash_clubs** - Wash club memberships
6. **wash_club_verification** - Wash club verification process
7. **wash_club_transactions** - Wash club credit transactions
8. **reviews** - Customer reviews of pros
9. **transactions** - Payment transactions
10. **inquiries** - Support inquiries and pro applications
11. **verification_codes** - Email/phone verification codes

## ❌ WHAT YOU'RE MISSING (NEW - Added in COMPLETE schema):

### 1. **subscriptions** ⭐ (REQUIRED)
Why: Customer subscriptions need their own table for:
- Plan types (free, basic, plus, premium)
- Start/end dates and renewal tracking
- Billing cycles (monthly, quarterly, annual)
- Auto-renewal settings
- Cancellation tracking

Fields:
```
id, user_id, plan_type, status, start_date, end_date, auto_renew, 
billing_cycle, next_billing_date, price, currency, 
cancellation_reason, cancelled_at, renewal_count, created_at, updated_at
```

### 2. **admin_logs** (RECOMMENDED)
Why: Track all admin actions for security and auditing
Fields:
```
id, admin_id, action, entity_type, entity_id, old_data, new_data, 
ip_address, created_at
```

### 3. **pro_certifications** (OPTIONAL but useful)
Why: Track pro qualifications and certifications
Fields:
```
id, user_id, certification_name, issued_date, expiry_date, issuer, 
verification_status, created_at, updated_at
```

### 4. **service_categories** (OPTIONAL but useful)
Why: Define types of laundry services (delicates, express, etc.)
Fields:
```
id, name, description, icon_url, base_price, is_active, created_at, updated_at
```

### 5. **wash_club_tiers** (OPTIONAL but useful)
Why: Define wash club tier benefits (tier 1, 2, 3, 4)
Fields:
```
id, tier_level, tier_name, description, credits_earned_per_wash, 
discount_percentage, min_annual_spend, created_at, updated_at
```

## QUICK COMPARISON

| Table | Current | Complete | Priority |
|-------|---------|----------|----------|
| users | ✅ | ✅ | Required |
| customers | ✅ | ✅ | Required |
| employees | ✅ | ✅ | Required |
| **subscriptions** | ❌ | ✅ | **CRITICAL** |
| orders | ✅ | ✅ | Required |
| wash_clubs | ✅ | ✅ | Required |
| wash_club_verification | ✅ | ✅ | Required |
| wash_club_transactions | ✅ | ✅ | Required |
| reviews | ✅ | ✅ | Required |
| transactions | ✅ | ✅ | Required |
| inquiries | ✅ | ✅ | Required |
| verification_codes | ✅ | ✅ | Required |
| admin_logs | ❌ | ✅ | Recommended |
| pro_certifications | ❌ | ✅ | Optional |
| service_categories | ❌ | ✅ | Optional |
| wash_club_tiers | ❌ | ✅ | Optional |

## WHAT TO DO NOW

### Option A: Use Complete Schema (RECOMMENDED)
1. **Delete current schema** in Supabase (drop all tables)
2. **Run the new COMPLETE schema** (SUPABASE_MIGRATION_SCHEMA_COMPLETE.sql)
3. This includes subscriptions + all useful tables

### Option B: Just Add Subscriptions
If you want to keep the current setup:
1. Run this SQL in Supabase:
```sql
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'plus', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'annually')),
  next_billing_date TIMESTAMP,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'AUD',
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  renewal_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());
```

## RECOMMENDATION
Use **Option A (Complete Schema)** because:
1. ✅ Includes everything you need for a complete product
2. ✅ Subscriptions table is critical (you're missing it now)
3. ✅ Admin logs for security
4. ✅ Pro certifications for compliance
5. ✅ Service categories for ordering system
6. ✅ Wash club tiers for loyalty benefits

Start fresh, run the COMPLETE schema, then test creating accounts through your app.
