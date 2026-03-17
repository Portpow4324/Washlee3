/**
 * Strict Session Management with "Remember Me"
 * 
 * Rules:
 * 1. Customer Login:
 *    - Remember Me = 30 days persistence
 *    - No Remember Me = Session only (cleared on tab close)
 *    - On page reload without Remember Me flag = Auto logout
 * 
 * 2. Employee Login:
 *    - Remember Me = 7 days persistence (STRICTER)
 *    - No Remember Me = Session only (cleared on tab close)
 *    - On page reload without Remember Me flag = Auto logout
 *    - Security warning displayed
 * 
 * 3. Admin Login:
 *    - Remember Me = 3 days persistence (MOST STRICT)
 *    - No Remember Me = Session only (cleared on tab close)
 *    - On page reload without Remember Me flag = Auto logout
 *    - Security warning displayed prominently
 */

// Customer Session Management
export const CustomerSession = {
  save: (email: string, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem('customerRememberMe', 'true')
      localStorage.setItem('customerEmail', email)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)
      localStorage.setItem('customerRememberMeExpiry', expiryDate.toISOString())
    } else {
      // Session-only storage
      sessionStorage.setItem('customerSessionOnly', 'true')
    }
  },

  check: () => {
    const rememberMeExpiry = localStorage.getItem('customerRememberMeExpiry')
    const sessionOnly = sessionStorage.getItem('customerSessionOnly')
    
    // Check expiry
    if (rememberMeExpiry && new Date(rememberMeExpiry) < new Date()) {
      CustomerSession.logout()
      return false
    }
    
    // Strict rule: No remember me and no active session = logout
    if (!sessionOnly && !localStorage.getItem('customerRememberMe')) {
      return false
    }
    
    return true
  },

  logout: () => {
    localStorage.removeItem('customerRememberMe')
    localStorage.removeItem('customerEmail')
    localStorage.removeItem('customerRememberMeExpiry')
    sessionStorage.removeItem('customerSessionOnly')
  },

  isRemembered: (): boolean => {
    return localStorage.getItem('customerRememberMe') === 'true'
  }
}

// Employee Session Management (STRICTER)
export const EmployeeSession = {
  save: (rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem('employeeRememberMe', 'true')
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 7) // 7 days only
      localStorage.setItem('employeeRememberMeExpiry', expiryDate.toISOString())
    } else {
      // Session-only storage
      sessionStorage.setItem('employeeSessionOnly', 'true')
    }
  },

  check: () => {
    const rememberMeExpiry = localStorage.getItem('employeeRememberMeExpiry')
    const sessionOnly = sessionStorage.getItem('employeeSessionOnly')
    
    // Check expiry
    if (rememberMeExpiry && new Date(rememberMeExpiry) < new Date()) {
      EmployeeSession.logout()
      return false
    }
    
    // STRICT rule for employees: No remember me and no active session = logout
    if (!sessionOnly && !localStorage.getItem('employeeRememberMe')) {
      EmployeeSession.logout()
      return false
    }
    
    return true
  },

  logout: () => {
    localStorage.removeItem('employeeRememberMe')
    localStorage.removeItem('employeeToken')
    localStorage.removeItem('employeeData')
    localStorage.removeItem('employeeRememberMeExpiry')
    sessionStorage.removeItem('employeeSessionOnly')
  },

  isRemembered: (): boolean => {
    return localStorage.getItem('employeeRememberMe') === 'true'
  }
}

// Admin Session Management (MOST STRICT)
export const AdminSession = {
  save: (rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem('adminRememberMe', 'true')
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 3) // 3 days only - MOST STRICT
      localStorage.setItem('adminRememberMeExpiry', expiryDate.toISOString())
    } else {
      // Session-only storage
      sessionStorage.setItem('adminSessionOnly', 'true')
    }
  },

  check: () => {
    const rememberMeExpiry = localStorage.getItem('adminRememberMeExpiry')
    const sessionOnly = sessionStorage.getItem('adminSessionOnly')
    
    // Check expiry
    if (rememberMeExpiry && new Date(rememberMeExpiry) < new Date()) {
      AdminSession.logout()
      return false
    }
    
    // MOST STRICT rule for admins: No remember me and no active session = logout
    if (!sessionOnly && !localStorage.getItem('adminRememberMe')) {
      AdminSession.logout()
      return false
    }
    
    return true
  },

  logout: () => {
    localStorage.removeItem('adminRememberMe')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    localStorage.removeItem('adminRememberMeExpiry')
    sessionStorage.removeItem('adminSessionOnly')
  },

  isRemembered: (): boolean => {
    return localStorage.getItem('adminRememberMe') === 'true'
  }
}

// Global utility: Check all sessions on app load
export const initializeSessionSecurity = () => {
  // Check all session types
  if (!CustomerSession.check()) {
    CustomerSession.logout()
  }
  
  if (!EmployeeSession.check()) {
    EmployeeSession.logout()
  }
  
  if (!AdminSession.check()) {
    AdminSession.logout()
  }

  // Listen for storage changes (logout from other tabs)
  window.addEventListener('storage', (event) => {
    if (event.key?.includes('RememberMe') || event.key?.includes('Token')) {
      // Token or remember me was cleared from another tab
      window.location.href = '/auth/login'
    }
  })
}

// On page reload/tab close events
export const setupSessionCleanup = () => {
  window.addEventListener('beforeunload', () => {
    // Session-only users are automatically logged out on tab close
    // because sessionStorage is cleared by browser
    if (sessionStorage.getItem('customerSessionOnly')) {
      localStorage.removeItem('customerToken')
    }
    if (sessionStorage.getItem('employeeSessionOnly')) {
      localStorage.removeItem('employeeToken')
    }
    if (sessionStorage.getItem('adminSessionOnly')) {
      localStorage.removeItem('adminToken')
    }
  })
}
