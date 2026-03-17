# Pro Applications - Quick Admin Guide

## 🚀 Quick Start

### Access the System
1. Go to `/admin` (Admin Dashboard)
2. Click **Pro Applications** card
3. You'll see a list of all applications

### Approve an Application (3 steps)

**Step 1: Expand Application**
- Click on an applicant's name
- View all their information

**Step 2: Verify & Checklist**
- Check off each verification item:
  - ✓ ID Verification Complete
  - ✓ Contact Information Verified
  - ✓ Work Rights Verified
  - ✓ Background Check Passed
  - ✓ All Documents Reviewed
- Click "Generate Employee ID" (generates unique code)

**Step 3: Approve**
- Click "Approve Application"
- Click "Approve" in confirmation modal
- Done! ✓

### What Happens on Approval
✓ User marked as employee  
✓ Employee ID assigned  
✓ Approval email sent to applicant  
✓ User can now access Pro Dashboard  

---

## 📋 Application Tabs

| Tab | What It Shows |
|-----|---------------|
| **All** | Every application |
| **Pending** | New submissions awaiting review |
| **Under Review** | Currently being verified |
| **Approved** | Approved pros with Employee IDs |
| **Rejected** | Rejected with reasons |

---

## 📱 Application Details

When you expand an application, you'll see:

### Contact Information
- Name, email, phone, state
- Submission date

### Work Verification
Each item shows a checkbox - should all be ✓ before approving:
- Has valid work rights
- Has valid license
- Has transport
- Has equipment
- Age verified (18+)

### Skills Assessment
- Text response from applicant (min 50 characters)
- Explains their experience

### Availability
- Days of week they're available to work

### Comments
- Any additional notes from applicant

---

## 🔑 Employee IDs

### What is an Employee ID?
A unique code assigned to each approved pro employee. Used for:
- Payroll/HR tracking
- Dashboard access
- Performance records

### Employee ID Formats
```
Standard:  EMP-1709567890123-A7K9Q
Payslip:   PS-20240304-X9K2L
```

### How to Generate
1. **Manual (During Approval):**
   - Click "Generate Employee ID" button
   - Copy code from modal
   - Click "Approve Application"

2. **Bulk (Advanced):**
   - Go to `/admin/employee-codes`
   - Select format & quantity
   - Click "Generate Codes"
   - Download CSV or copy

---

## ✋ Rejecting an Application

1. Click application to expand
2. Click "Reject" button
3. Enter rejection reason
4. Click "Reject" in modal
5. Applicant gets rejection email with reason

---

## 🔍 Finding Applications

**By Status:**
- Click tab: All, Pending, Under Review, Approved, Rejected

**By Applicant:**
- Applications are sorted by submission date (newest first)
- Look through list

---

## ✅ Approval Checklist

Before clicking "Approve", verify:

- [ ] Name and contact info correct
- [ ] Work rights confirmed (has valid work authorization)
- [ ] Valid ID/license verified
- [ ] Transport confirmed (has vehicle)
- [ ] Equipment confirmed (has laundry equipment)
- [ ] Age verified (18+)
- [ ] Skills assessment is detailed
- [ ] No red flags in availability/comments
- [ ] All 5 verification checklist items checked
- [ ] Employee ID generated

---

## 📊 Admin Dashboard Quick Links

From `/admin`:
- **Pro Applications** → `/admin/pro-applications`
- **Generate Codes** → `/admin/employee-codes`
- **View All Users** → `/admin/users`
- **Analytics** → `/admin/analytics`

---

## 🆘 Troubleshooting

### "Approve Application button is gray/disabled"
→ Check all 5 verification items. Must all be ✓

### "Can't see Pro Applications card"
→ Make sure you're logged in as admin
→ Check `/admin` loads without error

### Applicant says they never got approval email
→ Check in admin: is status "Approved"?
→ Resend manually or contact support

### What if I approve by mistake?
→ Currently cannot undo in UI
→ Contact admin team to manually fix in database
→ (Future feature: undo/revert approval)

---

## 💡 Pro Tips

1. **Batch Approve on Schedule**
   - Review pending applications daily
   - Approve 2-3x per week to distribute IDs evenly

2. **Keep Notes**
   - Use "comments" field during review
   - Note any concerns before approving

3. **CSV Export**
   - Download approved employee IDs weekly
   - Share with HR/payroll team

4. **Monitor Metrics**
   - Check analytics for approval rate
   - Identify review bottlenecks

5. **Team Workflow**
   - Assign "under-review" status to person reviewing
   - Switch to "approved" when ready
   - Keeps team synced

---

## 🔗 Useful Links

| Link | Purpose |
|------|---------|
| `/admin` | Main dashboard |
| `/admin/pro-applications` | Review applications |
| `/admin/employee-codes` | Generate bulk codes |
| `/admin/users` | View all users |
| `/admin/analytics` | View metrics |

---

## ❓ FAQ

**Q: How long does approval take?**
A: 2-5 business days typically. Can be faster if reviewed daily.

**Q: Can applicant reapply if rejected?**
A: Yes, they can submit new application after addressing feedback.

**Q: Is Employee ID permanent?**
A: Yes, each pro keeps their ID for payroll/records.

**Q: Can I change an Employee ID?**
A: Not in current UI. Contact admin team if needed.

**Q: What if applicant doesn't verify phone?**
A: They can't submit - phone verification is required in form.

---

## 📞 Support

For issues with approvals or system errors:
1. Check troubleshooting section above
2. Document the error/screenshot
3. Contact admin team with details

---

**Last Updated:** March 4, 2024
