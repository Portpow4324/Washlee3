# Admin Setup Guide - Employee Inquiry System

## Quick Start: Setting Up Your Admin Account

### Option 1: Firebase Console (Easiest)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your Washlee project

2. **Set Custom Claims**
   - Go to **Authentication** → **Users**
   - Find the user you want to make admin
   - Click the three dots → **Custom claims**
   - Paste this JSON:
   ```json
   {
     "admin": true
   }
   ```
   - Click Update

3. **Verify in Firestore (Optional)**
   - Go to **Firestore Database** → **users** collection
   - Find your user document
   - Add field: `isAdmin: true`

4. **Log out and back in**
   - The custom claims are cached, so log out completely
   - Log back in to refresh your session

### Option 2: Firebase Admin SDK (Programmatic)

Run this script to set admin claims:

```bash
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = 'USER_UID_HERE';
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => console.log('Custom claims set for user', uid))
  .catch(error => console.log('Error setting custom claims:', error));
"
```

Replace `USER_UID_HERE` with the actual user UID from Firebase Console.

### Option 3: Node.js Script

Create a file `setup-admin.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setupAdmin() {
  const email = 'your-email@example.com'; // Change this
  
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set admin custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    // Also set in Firestore
    await admin.firestore().collection('users').doc(user.uid).update({
      isAdmin: true
    });
    
    console.log(`✓ User ${email} is now an admin!`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupAdmin();
```

Run with: `node setup-admin.js`

---

## Verify Admin Access

### Check if Setup Worked:

1. **Log in to the app**
2. **Try accessing admin panel:**
   - Go to: `https://your-app.com/admin/inquiries`
   - If you're an admin, you'll see the dashboard
   - If not admin, you'll be redirected home

### View Your Admin Status:

In your browser console (F12 → Console):
```javascript
// Shows your current user status
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('User:', user);
```

### Check Firebase Auth Claims:

In Firebase Console:
1. Go to **Authentication** → **Users**
2. Click your user
3. Scroll to **Custom claims** section
4. Should show: `{"admin": true}`

---

## Making Multiple Admins

Repeat the above process for each person who should be an admin:

1. Get their email or UID
2. Set custom claims with `admin: true`
3. They must log out and back in to see the admin panel

---

## Removing Admin Access

If you need to revoke admin access:

### Via Firebase Console:
1. Go to **Authentication** → **Users**
2. Click user → **Custom claims**
3. Remove or set to `"admin": false`
4. Click Update

### Via Script:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function removeAdmin() {
  const uid = 'USER_UID_HERE';
  await admin.auth().setCustomUserClaims(uid, { admin: false });
  console.log('Admin access removed');
}

removeAdmin();
```

---

## What Admins Can Do

Once you have admin access:

✓ View all employee inquiries at `/admin/inquiries`
✓ Filter inquiries by status (Pending, Under Review, Approved, Rejected)
✓ Review applicant's work verification answers
✓ Read skills assessment text
✓ Approve applicants with automatic:
  - Employee ID generation
  - Offer letter generation
  - Email sending to applicant
  - User record updates
✓ Reject applicants with custom feedback message
✓ Track review timestamps and notes

---

## Firestore Security Rules

Make sure your Firestore rules allow admins to read inquiries:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Only admins can read inquiries
    match /inquiries/{document=**} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Users can create their own inquiries
    match /inquiries/{inquiryId} {
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

Update your rules in **Firestore Database** → **Rules** tab.

---

## Common Issues

### "Access Denied" at Admin Dashboard?
- You don't have admin claims set
- Custom claims are cached - try logging out and back in
- Check Firebase Console that `admin: true` is set in custom claims

### Can't See Button/Link to Admin Panel?
- Admin panel is at `/admin/inquiries` - navigate there directly in URL
- There's no menu button for admins - link directly

### Email Not Sending on Approval?
- Check `.env.local` has email service configured
- Check application logs for email errors
- Test email configuration separately

### Employee ID Not Generated?
- Should be automatic (EMP-{timestamp})
- Check Firestore database that user doc was updated with employeeId
- Check browser console for errors

---

## Getting Help

If you're stuck:

1. **Check error logs:**
   - Browser console (F12)
   - Application server logs
   - Firebase logs in Console

2. **Verify configuration:**
   - Custom claims set in Firebase Auth
   - `isAdmin` field in Firestore user doc
   - Email service properly configured

3. **Test step by step:**
   - First: Can user log in?
   - Second: Can user access admin page?
   - Third: Can they see inquiries list?
   - Fourth: Can they approve an inquiry?
   - Fifth: Was email sent?

---

**Need to add more admins?** Follow the "Making Multiple Admins" section above.

**Ready to review applications?** Go to `/admin/inquiries` and start reviewing!
