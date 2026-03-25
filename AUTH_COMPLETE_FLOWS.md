# Complete Authentication Flows - All Steps & Code

## TABLE OF CONTENTS
1. [Customer Signup Flow (Steps 1-8)](#customer-signup-flow)
2. [Customer Login Flow](#customer-login-flow)
3. [Employee Signup Flow (Steps 1-8)](#employee-signup-flow)
4. [Employee Login Flow](#employee-login-flow)
5. [API Endpoints Reference](#api-endpoints-reference)

---

## CUSTOMER SIGNUP FLOW

### Complete Step-by-Step Process

#### Step 1: Customer visits signup page and fills personal details

**File:** `/app/auth/signup-customer/page.tsx`

```typescript
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function SignupCustomer() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    state: '',
    password: '',
    confirmPassword: '',
    personalUse: '',
  })

  // Step 0: Personal Details (First Name, Last Name, Email, Phone, State, Password)
  const handleStep0Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phone || !formData.state || !formData.password) {
      setError('All fields are required')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // POST to /api/auth/signup with userType: 'customer'
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          state: formData.state,
          userType: 'customer',
          personalUse: formData.personalUse === 'yes'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // Move to Step 1: Email Verification
      setCurrentStep(1)
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 1: Email Verification (6-digit code)
  const [verificationCode, setVerificationCode] = useState('')

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // POST to /api/auth/verify-code
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      // Email verified, move to Step 2
      setCurrentStep(2)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Phone Verification (similar to email)
  const [phoneCode, setPhoneCode] = useState('')

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Phone verification logic here
    setCurrentStep(3)
  }

  // Steps 3+: Additional info, preferences, plan selection
  // Step 8: Final confirmation and redirect to /dashboard

  return (
    <form onSubmit={
      currentStep === 0 ? handleStep0Submit :
      currentStep === 1 ? handleStep1Submit :
      currentStep === 2 ? handleStep2Submit :
      undefined
    }>
      {/* Render current step UI */}
      {currentStep === 0 && (
        <>
          <input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
          <select
            value={formData.state}
            onChange={(e) => setFormData({...formData, state: e.target.value})}
            required
          >
            <option value="">Select State</option>
            <option value="NSW">NSW</option>
            <option value="VIC">VIC</option>
            <option value="QLD">QLD</option>
            <option value="WA">WA</option>
            <option value="SA">SA</option>
            <option value="TAS">TAS</option>
            <option value="ACT">ACT</option>
            <option value="NT">NT</option>
          </select>
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
          />
        </>
      )}

      {currentStep === 1 && (
        <div>
          <h2>Email Verification</h2>
          <p>Enter the 6-digit code sent to {formData.email}</p>
          <input
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
            maxLength={6}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </div>
      )}

      {error && <p style={{color: 'red'}}>{error}</p>}

      {currentStep === 0 && (
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Continue'}
        </button>
      )}
    </form>
  )
}
```

---

## CUSTOMER LOGIN FLOW

### Step-by-Step Process

**File:** `/app/auth/login/page.tsx`

```typescript
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)

  // Check for remembered email on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('loginEmail')
    const rememberMeEnabled = localStorage.getItem('rememberMe') === 'true'
    const rememberMeExpiry = localStorage.getItem('rememberMeExpiry')

    if (storedEmail && rememberMeEnabled && rememberMeExpiry) {
      const expiryDate = new Date(rememberMeExpiry)
      if (expiryDate > new Date()) {
        // Remember me still valid
        setEmail(storedEmail)
        setRememberMe(true)
      } else {
        // Remember me expired, clear it
        localStorage.removeItem('loginEmail')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberMeExpiry')
      }
    }
  }, [])

  // Step 1: User enters email and password
  // Step 2: User checks "Remember Me" (optional)
  // Step 3: Click Login button → handleSubmit()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailNotConfirmed(false)
    setIsLoading(true)

    try {
      // POST to /api/auth/login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          rememberMe
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 && data.message?.includes('not confirmed')) {
          setEmailNotConfirmed(true)
          return
        }
        throw new Error(data.error || 'Login failed')
      }

      // Step 4: Save remember me if checked (7 days)
      if (rememberMe) {
        localStorage.setItem('loginEmail', email)
        localStorage.setItem('rememberMe', 'true')
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7)
        localStorage.setItem('rememberMeExpiry', expiryDate.toISOString())
      } else {
        localStorage.removeItem('loginEmail')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberMeExpiry')
      }

      // Step 5: Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/verification/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codeType: 'signup' })
      })

      if (!response.ok) throw new Error('Failed to resend code')
      alert('Code sent! Check your email.')
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Sign In</h1>

      {emailNotConfirmed && (
        <div style={{backgroundColor: '#fff3cd', padding: '10px', marginBottom: '10px'}}>
          <p>Your email hasn't been confirmed yet.</p>
          <button type="button" onClick={handleResendCode}>
            Resend Confirmation Code
          </button>
        </div>
      )}

      {error && <p style={{color: 'red'}}>{error}</p>}

      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <label>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        Remember me for 7 days
      </label>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      <a href="/auth/password-reset">Forgot password?</a>
    </form>
  )
}
```

---

## EMPLOYEE SIGNUP FLOW

### Uses SAME Form as Customer with `userType: 'pro'`

**File:** `/app/auth/signup-customer/page.tsx` (same file)

```typescript
// Step 0: Employee fills form with email, password, name, phone, state
// Step 1: Email verification (same as customer)
// Step 2: Phone verification (same as customer)
// Steps 3-8: Additional employee info

const handleSignupSubmit = async () => {
  // The ONLY difference from customer signup:
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formData.email,
      password: formData.password,
      name: `${formData.firstName} ${formData.lastName}`,
      phone: formData.phone,
      state: formData.state,
      userType: 'pro'  // ← This makes them an EMPLOYEE, not customer
    })
  })

  // Rest of flow is identical
}
```

**Result:**
- Record created in `employees` table instead of `customers` table
- Employee ID generated for login
- Access to `/employee/dashboard`
- Must use Employee Login (not customer login)

---

## EMPLOYEE LOGIN FLOW

### Step-by-Step Process

**File:** `/app/auth/employee-signin/page.tsx`

```typescript
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeSignIn() {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Check for remembered employee on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('employeeEmail')
    const rememberMeEnabled = localStorage.getItem('employeeRememberMe') === 'true'
    const rememberMeExpiry = localStorage.getItem('employeeRememberMeExpiry')

    if (storedEmail && rememberMeEnabled && rememberMeExpiry) {
      const expiryDate = new Date(rememberMeExpiry)
      if (expiryDate > new Date()) {
        setEmail(storedEmail)
        setRememberMe(true)
      } else {
        localStorage.removeItem('employeeEmail')
        localStorage.removeItem('employeeRememberMe')
        localStorage.removeItem('employeeRememberMeExpiry')
      }
    }
  }, [])

  // Step 1: Employee enters Employee ID, Email, Password
  // Step 2: Employee checks "Remember Me" (optional)
  // Step 3: Click Sign In button → handleSubmit()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validate Employee ID format
    const isSixDigit = /^\d{6}$/.test(employeeId)
    const isStandardFormat = /^EMP-\d+-[A-Z0-9]+$/.test(employeeId)
    const isPayslipFormat = /^PS-\d{8}-[A-Z0-9]+$/.test(employeeId)

    if (!isSixDigit && !isStandardFormat && !isPayslipFormat) {
      setError('Invalid employee ID format')
      setIsLoading(false)
      return
    }

    try {
      // POST to /api/auth/employee-login
      const response = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          email,
          password,
          rememberMe
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Step 4: Save remember me if checked (7 days)
      if (rememberMe) {
        localStorage.setItem('employeeEmail', email)
        localStorage.setItem('employeeRememberMe', 'true')
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7)
        localStorage.setItem('employeeRememberMeExpiry', expiryDate.toISOString())
      } else {
        localStorage.removeItem('employeeEmail')
        localStorage.removeItem('employeeRememberMe')
        localStorage.removeItem('employeeRememberMeExpiry')
      }

      // Store token
      localStorage.setItem('employeeToken', data.token)
      localStorage.setItem('employeeData', JSON.stringify(data.employee))

      // Step 5: Redirect to employee dashboard
      router.push('/employee/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Employee Sign In</h1>

      {error && <p style={{color: 'red'}}>{error}</p>}

      <div>
        <label>Employee ID</label>
        <input
          type="text"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder="123456 or EMP-xxx-xxx or PS-yyyymmdd-xxx"
          required
        />
        <small>6 digits, EMP format, or Payslip format</small>
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <label>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        Remember me for 7 days
      </label>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
```

---

## API ENDPOINTS REFERENCE

### 1. POST /api/auth/signup
**Used for:** Customer AND Employee signup

```typescript
Request:
{
  email: string
  password: string
  name: string
  phone: string
  state: string
  userType: 'customer' | 'pro'  // ← Determines table (customers vs employees)
}

Response Success (200):
{
  success: true
  userId: string
  user: {
    id: string
    email: string
    emailConfirmed: false
  }
}

Response Error (409):
{
  error: 'Email already registered'
  code: 'DUPLICATE_EMAIL'
}
```

**Usage:**
```typescript
// Customer
await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@example.com',
    password: 'SecurePassword123!',
    name: 'John Doe',
    phone: '0412345678',
    state: 'NSW',
    userType: 'customer'
  })
})

// Employee
await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'employee@example.com',
    password: 'SecurePassword123!',
    name: 'Jane Smith',
    phone: '0487654321',
    state: 'VIC',
    userType: 'pro'
  })
})
```

---

### 2. POST /api/auth/login
**Used for:** Customer login only

```typescript
Request:
{
  email: string
  password: string
  rememberMe: boolean  // Optional: 7-day persistent login
}

Response Success (200):
{
  success: true
  message: 'Login successful'
  user: {
    id: string
    email: string
    userType: 'customer'
  }
  session: {
    access_token: string
    refresh_token: string
  }
}

Response Error (401):
{
  error: 'Invalid credentials or email not confirmed'
}
```

**Usage:**
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@example.com',
    password: 'SecurePassword123!',
    rememberMe: true  // Save for 7 days
  })
})

const data = await response.json()

if (response.ok) {
  // Store remember me
  if (data.rememberMe) {
    localStorage.setItem('loginEmail', 'customer@example.com')
    localStorage.setItem('rememberMe', 'true')
    // Set expiry to 7 days from now
  }
  // Redirect to /dashboard
}
```

---

### 3. POST /api/auth/verify-code
**Used for:** Email verification (both customer and employee)

```typescript
Request:
{
  email: string
  code: string  // 6-digit code
}

Response Success (200):
{
  success: true
  message: 'Code verified'
  email: string
}

Response Error (400):
{
  error: 'Invalid or expired code'
}
```

**Usage:**
```typescript
const response = await fetch('/api/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    code: '123456'
  })
})

if (response.ok) {
  // Move to next step
}
```

---

### 4. POST /api/verification/send-code
**Used for:** Send verification codes

```typescript
Request:
{
  email: string
  codeType: 'signup' | 'verification' | 'phone'
}

Response Success (200):
{
  success: true
  message: 'Code sent'
  email: string
  expiresIn: 900  // seconds (15 minutes)
}
```

**Usage:**
```typescript
const response = await fetch('/api/verification/send-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    codeType: 'signup'
  })
})
```

---

### 5. POST /api/auth/employee-login
**Used for:** Employee login only

```typescript
Request:
{
  employeeId: string  // 6-digit, EMP-xxx-xxx, or PS-yyyymmdd-xxx
  email: string
  password: string
  rememberMe: boolean  // Optional: 7-day persistent login
}

Response Success (200):
{
  success: true
  token: string
  employee: {
    id: string
    email: string
    firstName: string
    lastName: string
    employeeId: string
  }
}

Response Error (401):
{
  error: 'Invalid employee ID or credentials'
}
```

**Usage:**
```typescript
const response = await fetch('/api/auth/employee-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: '123456',
    email: 'employee@example.com',
    password: 'SecurePassword123!',
    rememberMe: true
  })
})

const data = await response.json()

if (response.ok) {
  localStorage.setItem('employeeToken', data.token)
  localStorage.setItem('employeeData', JSON.stringify(data.employee))
  // Redirect to /employee/dashboard
}
```

---

### 6. POST /api/auth/logout
**Used for:** Logout (both customer and employee)

```typescript
Request: No body needed

Response:
{
  success: true
  message: 'Logged out successfully'
}
```

**Usage:**
```typescript
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})

// Clear storage
localStorage.removeItem('loginEmail')
localStorage.removeItem('rememberMe')
// Redirect to home
```

---

### 7. POST /api/auth/password-reset
**Used for:** Password reset

```typescript
Request:
{
  email: string
}

Response:
{
  success: true
  message: 'Password reset link sent'
  email: string
}
```

**Usage:**
```typescript
await fetch('/api/auth/password-reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com'
  })
})
```

---

## QUICK SUMMARY TABLE

| Feature | Customer Signup | Employee Signup | Customer Login | Employee Login |
|---------|-----------------|-----------------|----------------|----------------|
| **Form Location** | `/app/auth/signup-customer` | `/app/auth/signup-customer` (same) | `/app/auth/login` | `/app/auth/employee-signin` |
| **userType** | `'customer'` | `'pro'` | N/A | N/A |
| **Fields Required** | First, Last, Email, Phone, State, Password | First, Last, Email, Phone, State, Password (same) | Email, Password | Employee ID, Email, Password |
| **Email Verification** | Yes (6-digit code) | Yes (6-digit code) | Yes (checked) | No |
| **Remember Me** | Yes (7 days) | N/A | Yes (7 days) | Yes (7 days) |
| **Database Table** | `customers` | `employees` | `users` table query | `employees` table query |
| **Redirect To** | `/dashboard` | N/A (needs login) | `/dashboard` | `/employee/dashboard` |
| **API Endpoint** | `/api/auth/signup` | `/api/auth/signup` | `/api/auth/login` | `/api/auth/employee-login` |
