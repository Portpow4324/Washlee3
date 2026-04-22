# 🚀 Quick Start Guide - Pro Application Admin Panel

## Access Admin Panel

**URL**: `http://localhost:3000/admin`
**Login URL**: `http://localhost:3000/admin/login`

**You'll be logged in with `ownerAccess` session**

---

## View Pro Applications

1. Go to **Admin Dashboard** → `/admin`
2. Find **"Pro Applications"** section
3. Click **"View Applications"** button
4. You'll see all pro applications

---

## Review an Application

1. Click **"Review"** button on any application card
2. Expands to show full details:
   - ✅ Personal info (name, email, phone, state)
   - ✅ Contact information
   - ✅ **ID verification image** (if uploaded)
   - ✅ Work verification (transport, license, etc.)
   - ✅ Skills assessment
   - ✅ Verification checklist

---

## Approve an Application

1. Complete all **Verification Checklist** items (5 checkboxes)
2. Click **"Generate Employee ID"** button
3. Copy the Employee ID if needed
4. Click **"Approve Application"** button
5. Confirm in modal
6. ✅ Application approved! Email sent to applicant (if configured)

---

## Reject an Application

1. Click **"Reject"** button
2. Enter reason for rejection
3. Click **"Reject"** in modal
4. ✅ Application rejected! Email sent to applicant (if configured)

---

## Filter Applications

Click status tabs to filter:
- **All** - All applications
- **Pending** - Waiting for review (yellow)
- **Under Review** - Being reviewed (blue)
- **Approved** - Already approved (green)
- **Rejected** - Rejected (red)

---

## Test Data

**Sample Application**:
- Name: Luka Verde
- Email: lukaverde6@gmail.com
- Phone: +61412458144
- State: VIC
- Status: Pending
- ID Upload: ✅ Yes
- Work Verification: ✅ All complete

---

## API Endpoints (For Testing)

### Get all applications
```bash
curl http://localhost:3000/api/admin/pro-approvals
```

### Filter by status
```bash
curl "http://localhost:3000/api/admin/pro-approvals?status=pending"
```

### Approve application
```bash
curl -X PATCH http://localhost:3000/api/admin/pro-approvals \
  -H "Content-Type: application/json" \
  -d '{
    "id": "b94fdf0a-b217-4e78-b1b9-be613d585c3a",
    "status": "approved",
    "comments": "Approved after verification"
  }'
```

---

## What Happens After Approval

1. Application status changes to "approved" in Supabase
2. User's next login shows Pro access
3. Header dropdown no longer shows pending modal
4. "Pro Dashboard" button becomes available
5. User gets full Pro access

---

## Important Notes

⚠️ **ID Upload is Optional**
- Users can skip ID upload and still apply
- Admin page will show "No ID Verification Image" section

⚠️ **Manual Role Assignment**
- Currently, approving doesn't auto-assign Pro role
- May need separate step to create Pro role for user

⚠️ **Email Notifications**
- Feature not yet enabled
- Users don't get approval/rejection emails (can be added)

---

## Troubleshooting

**Problem**: Admin panel shows "No applications found"
- **Solution**: Check if user actually submitted form and it saved to Supabase
- **Debug**: Run in Supabase dashboard:
  ```sql
  SELECT * FROM pro_inquiries ORDER BY created_at DESC LIMIT 5;
  ```

**Problem**: ID image not showing
- **Solution**: User must have uploaded ID on step 4 of form
- **Check**: In Supabase, look at `id_verification` column

**Problem**: "Approve" button is greyed out
- **Solution**: Complete all 5 verification checkboxes first
- **They are**: ID, Contact, Work Rights, Background, Documents

---

## Key Files

| File | Purpose |
|------|---------|
| `/app/admin/pro-applications/page.tsx` | Admin dashboard UI |
| `/app/api/admin/pro-approvals/route.ts` | API for fetching/updating apps |
| `/app/auth/pro-signup-form/page.tsx` | User application form |
| `/app/api/inquiries/create/route.ts` | Saves form data to Supabase |

---

## Support

If admin panel isn't working:
1. Check: Is dev server running? (`npm run dev`)
2. Check: Are you logged in at `/admin/login`?
3. Check: Are there records in Supabase `pro_inquiries` table?
4. Check: Is `.env.local` file configured with Supabase keys?

---

**Status**: ✅ READY TO USE
**Date**: April 1, 2026
