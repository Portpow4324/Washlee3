# Quick Copy-Paste Reference - Authentication Code

## EMPLOYEE SIGNUP

**Uses the SAME form as customers** (`app/auth/signup-customer/page.tsx`)

The only difference is the `userType: 'pro'` sent in the request:

```typescript
// Customer
await fetch('/api/auth/signup', {
  body: JSON.stringify({
    email, password, name, phone, state,
    userType: 'customer'  // ← Customer type
  })
})

// Employee
await fetch('/api/auth/signup', {
  body: JSON.stringify({
    email, password, name, phone, state,
    userType: 'pro'  // ← Employee type
  })
})
```

Employees get:
- Record in `employees` table (not `customers`)
- Access to `/employee/dashboard`
- Employee privileges (view jobs, earnings)
- Must login with Employee ID (not email alone)

---

```typescript
## SIGNUP - Customer Form (React Component)

**Also used for EMPLOYEE signup** - same form, different `userType`
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 1. Create auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            state,
          }
        }
      })

      if (authError) throw authError

      // 2. Send verification code
      const codeResponse = await fetch('/api/verification/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codeType: 'signup' })
      })

      if (!codeResponse.ok) throw new Error('Failed to send verification code')

      alert('Verification code sent to your email!')
      // Navigate to verification page
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignup}>
      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
      <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
      <select value={state} onChange={(e) => setState(e.target.value)}>
        <option>Select State</option>
        <option value="NSW">NSW</option>
        <option value="VIC">VIC</option>
      </select>
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing up...' : 'Sign Up'}
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </form>
  )
}
```

---

## LOGIN - Customer Form (React Component)

**With Remember Me feature (7-day persistent login)**

```typescript
// Path: app/auth/login/page.tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      // Check email confirmed
      if (!data.user?.email_confirmed_at) {
        setError('Please confirm your email before logging in')
        return
      }

      // Save remember me if checked (7 days)
      if (rememberMe) {
        localStorage.setItem('loginEmail', email)
        localStorage.setItem('rememberMe', 'true')
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7)
        localStorage.setItem('rememberMeExpiry', expiryDate.toISOString())
      }

      alert('Login successful!')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <label>
        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
        Remember me for 7 days
      </label>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </form>
  )
}
```

---

## EMPLOYEE LOGIN API Route

**Now ENABLED** - Previously was disabled

```typescript
// Path: app/api/auth/employee-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient, getAnonClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  const serviceRoleClient = getServiceRoleClient()
  const anonClient = getAnonClient()

  try {
    const body = await request.json()
    const { employeeId, email, password, rememberMe } = body

    // Validate input
    if (!employeeId || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, email, password' },
        { status: 400 }
      )
    }

    // Validate employee ID format (6-digit, EMP-xxx, PS-xxx)
    const isSixDigit = /^\d{6}$/.test(employeeId)
    const isStandardFormat = /^EMP-\d+-[A-Z0-9]+$/.test(employeeId)
    const isPayslipFormat = /^PS-\d{8}-[A-Z0-9]+$/.test(employeeId)

    if (!isSixDigit && !isStandardFormat && !isPayslipFormat) {
      return NextResponse.json(
        { error: 'Invalid employee ID format' },
        { status: 400 }
      )
    }

    // Step 1: Verify employee exists in employees table
    const { data: employeeData } = await serviceRoleClient
      .from('employees')
      .select('id, first_name, last_name, email')
      .eq('email', email)
      .single()

    if (!employeeData) {
      return NextResponse.json(
        { error: 'Employee not found or invalid credentials' },
        { status: 401 }
      )
    }

    // Step 2: Verify password against Supabase Auth
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Step 3: Return token
    const token = authData.session?.access_token || 'employee-' + Date.now()

    return NextResponse.json({
      success: true,
      token,
      employee: {
        id: employeeData.id,
        email: employeeData.email,
        firstName: employeeData.first_name,
        lastName: employeeData.last_name,
        employeeId: employeeId
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}
```

---

## EMPLOYEE LOGIN - Frontend Form

```typescript
// Path: app/auth/employee-signin/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeSignIn() {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, email, password, rememberMe })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      // Save token
      if (rememberMe) {
        localStorage.setItem('employeeToken', data.token)
        localStorage.setItem('employeeData', JSON.stringify(data.employee))
        // 7-day expiry
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7)
        localStorage.setItem('employeeTokenExpiry', expiryDate.toISOString())
      } else {
        sessionStorage.setItem('employeeToken', data.token)
        sessionStorage.setItem('employeeData', JSON.stringify(data.employee))
      }

      alert('Login successful!')
      router.push('/employee/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        placeholder="Employee ID (6 digits or EMP-xxx)"
        required
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        required
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        required
      />
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
      {error && <p style={{color: 'red'}}>{error}</p>}
    </form>
  )
}
```

---

```typescript
// Path: app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  const supabase = getServiceRoleClient()

  try {
    const body = await request.json()
    const { email, password, name, phone, userType, state } = body

    // Validate
    if (!email || !password || !name || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, phone, user_type: userType, state },
      email_confirm: false
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email already registered', code: 'DUPLICATE_EMAIL' },
          { status: 409 }
        )
      }
      throw authError
    }

    // Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({ id: authData.user.id, email, user_type: userType })

    if (userError) throw userError

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      user: { id: authData.user.id, email, emailConfirmed: false }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 500 }
    )
  }
}
```

---

## LOGIN API Route

```typescript
// Path: app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAnonClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  const supabase = getAnonClient()

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Login failed' },
        { status: 401 }
      )
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({
      success: true,
      user: { id: data.user.id, email, userType: userData?.user_type },
      session: { access_token: data.session?.access_token }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}
```

---

## VERIFY CODE API Route

```typescript
// Path: app/api/auth/verify-code/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient()

  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code required' },
        { status: 400 }
      )
    }

    // Find and verify code
    const now = new Date().toISOString()
    const { data: codeRecord, error: lookupError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code.toUpperCase())
      .eq('used', false)
      .gt('expires_at', now)
      .single()

    if (lookupError || !codeRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      )
    }

    // Mark as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', codeRecord.id)

    // Confirm email
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const user = authUsers?.users.find(u => u.email === email)

    if (user) {
      await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Code verified',
      email
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
```

---

## SEND VERIFICATION CODE API Route

```typescript
// Path: app/api/verification/send-code/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient()

  try {
    const body = await request.json()
    const { email, codeType = 'signup' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Generate 6-digit code
    const code = Math.random().toString().slice(2, 8).padStart(6, '0')

    // Store in database (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    await supabase.from('verification_codes').insert({
      email,
      code,
      code_type: codeType,
      used: false,
      expires_at: expiresAt
    })

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    await transporter.sendMail({
      to: email,
      subject: 'Verification Code',
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`
    })

    return NextResponse.json({
      success: true,
      message: 'Code sent',
      email,
      expiresIn: 900
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send code' },
      { status: 500 }
    )
  }
}
```

---

## LOGOUT API Route

```typescript
// Path: app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAnonClient } from '@/lib/supabaseClientFactory'

export async function POST(request: NextRequest) {
  const supabase = getAnonClient()

  try {
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    )
  }
}
```

---

## Password Reset API Route

```typescript
// Path: app/api/auth/password-reset/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseFactory'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient()

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Check if email exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Supabase handles password reset email automatically
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent',
      email
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Reset failed' },
      { status: 500 }
    )
  }
}
```

---

## AUTH CONTEXT Hook

```typescript
// Path: lib/AuthContext.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        // Fetch user profile
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUserData(data)
      }

      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setUserData(data)
        } else {
          setUser(null)
          setUserData(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserData(null)
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context as any
}
```

---

## QUICK CURL EXAMPLES

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe",
    "phone": "0412345678",
    "userType": "customer",
    "state": "NSW"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'

# Verify Code
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'

# Send Code
curl -X POST http://localhost:3000/api/verification/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "codeType": "signup"
  }'

# Logout
curl -X POST http://localhost:3000/api/auth/logout

# Password Reset
curl -X POST http://localhost:3000/api/auth/password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## NEXT.js Pages

- Customer Signup: `/app/auth/signup-customer/page.tsx`
- Customer Login: `/app/auth/login/page.tsx`
- Signup Choice: `/app/auth/signup/page.tsx`
- Employee Signup: `/app/auth/pro-signup-form/page.tsx`
- Employee Login: `/app/auth/employee-signin/page.tsx`
- Verify Email: `/app/auth/verify-email/page.tsx`

## DATABASE TABLES

- `users` - Auth user records
- `customers` - Customer profiles
- `employees` - Employee profiles
- `verification_codes` - Sent codes (email/phone)
