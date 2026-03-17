# 🚀 Quick Login Guide

## Your Credentials

| Field | Value |
|-------|-------|
| **Employee ID** | `EMP-1773230849589-1ZE64` |
| **Email** | `lukaverde0476653333@gmail.com` |
| **Password** | `35Malcolmst!` |

## Steps to Login

1. **Go to:** http://localhost:3000/auth/employee-signin
2. **Paste Employee ID:** `EMP-1773230849589-1ZE64`
3. **Enter Password:** `35Malcolmst!`
4. **Click:** Sign In
5. **Success!** Redirected to dashboard

## What Was Fixed

✅ Employee ID format now supports full codes (EMP-xxx-xxx)
✅ Approval creates both user and employee records
✅ Login validation checks both formats
✅ Clear error messages for debugging

## If It Still Doesn't Work

### Error: "Employee ID not found"
→ Check that Firestore has `employees/{uid}` document
→ Ask admin to re-approve in `/admin/pro-applications`

### Error: "Invalid employee ID format"
→ Make sure you copied the EXACT ID from email
→ Don't modify or remove any characters

### Error: "Password incorrect"
→ Password is case-sensitive
→ Make sure no extra spaces

---

**Need help?** Check `EMPLOYEE_ID_LOGIN_FIX.md` for detailed troubleshooting
