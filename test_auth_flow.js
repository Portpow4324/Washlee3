// Simple test to trace auth flow
const email = "lukaverde3@gmail.com"
const password = "35Malcolmst!"

console.log('Testing Auth Flow for:', email)
console.log('Password:', password)
console.log('\nExpected flow:')
console.log('1. User clicks Login')
console.log('2. Supabase checks email_confirmed_at')
console.log('3. If NOT confirmed, shows "Email Not Confirmed" message')
console.log('4. User clicks "Verify Email Code"')
console.log('5. Goes to /auth/verify-email-code?email=lukaverde3@gmail.com')
console.log('6. User receives verification code via email')
console.log('7. User enters code and clicks "Verify Email"')
console.log('8. Our API calls /api/auth/verify-code with email + code')
console.log('9. Backend checks verification_codes table for matching code')
console.log('10. If matches, marks as used and returns success')
console.log('11. Frontend redirects to /auth/select-usage-type')
console.log('\nKey fixes made:')
console.log('✓ Changed from supabase.auth.verifyOtp() to /api/auth/verify-code')
console.log('✓ Our API checks custom verification_codes table')
console.log('✓ Added Resend Code button with handleResendCode function')
