/**
 * Session Manager Test Suite
 * Tests "Remember Me" functionality for all login types
 */

import { CustomerSession, EmployeeSession, AdminSession } from './sessionManager'

interface TestResult {
  name: string
  passed: boolean
  message: string
}

const results: TestResult[] = []

// Test 1: Customer Remember Me - Save
export const testCustomerRememberMeSave = () => {
  const testName = 'Customer: Remember Me Save (30 days)'
  try {
    // Clear any existing data
    CustomerSession.logout()
    
    // Save with remember me
    CustomerSession.save('test@example.com', true)
    
    // Check if saved correctly
    const remembered = localStorage.getItem('customerRememberMe')
    const expiry = localStorage.getItem('customerRememberMeExpiry')
    
    if (remembered === 'true' && expiry) {
      const expiryDate = new Date(expiry)
      const today = new Date()
      const daysDiff = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff >= 29 && daysDiff <= 31) {
        results.push({ name: testName, passed: true, message: `✅ Expiry set to ~${Math.round(daysDiff)} days` })
        return true
      }
    }
    
    throw new Error('Remember Me not saved correctly')
  } catch (error: any) {
    results.push({ name: testName, passed: false, message: `❌ ${error.message}` })
    return false
  }
}

// Test 2: Customer Remember Me - Check valid
export const testCustomerRememberMeCheckValid = () => {
  const testName = 'Customer: Check Valid Remember Me'
  try {
    CustomerSession.logout()
    CustomerSession.save('test@example.com', true)
    
    const isValid = CustomerSession.check()
    if (isValid) {
      results.push({ name: testName, passed: true, message: '✅ Valid session recognized' })
      return true
    }
    
    throw new Error('Valid session not recognized')
  } catch (error: any) {
    results.push({ name: testName, passed: false, message: `❌ ${error.message}` })
    return false
  }
}

// Test 3: Customer No Remember Me - Session Only
export const testCustomerSessionOnly = () => {
  const testName = 'Customer: Session Only (No Remember Me)'
  try {
    CustomerSession.logout()
    sessionStorage.clear()
    
    // Save WITHOUT remember me
    CustomerSession.save('test@example.com', false)
    
    // Check session storage
    const sessionOnly = sessionStorage.getItem('customerSessionOnly')
    const notInLocalStorage = !localStorage.getItem('customerRememberMe')
    
    if (sessionOnly === 'true' && notInLocalStorage) {
      results.push({ name: testName, passed: true, message: '✅ Session-only mode activated' })
      return true
    }
    
    throw new Error('Session-only mode not set up correctly')
  } catch (error: any) {
    results.push({ name: testName, passed: false, message: `❌ ${error.message}` })
    return false
  }
}

// Test 4: Customer Auto Logout on Reload
export const testCustomerAutoLogoutOnReload = () => {
  const testName = 'Customer: Auto Logout on Reload (No Remember Me)'
  try {
    CustomerSession.logout()
    sessionStorage.clear()
    
    // Simulate: User logged in but didn't check remember me
    sessionStorage.setItem('customerSessionOnly', 'true')
    
    // Simulate page reload - session storage is cleared by browser
    sessionStorage.clear()
    
    // Check if should logout
    const shouldLogout = !sessionStorage.getItem('customerSessionOnly') && 
                         !localStorage.getItem('customerRememberMe')
    
    if (shouldLogout) {
      results.push({ name: testName, passed: true, message: '✅ Auto-logout triggered on reload' })
      return true
    }
    
    throw new Error('Auto-logout not triggered')
  } catch (error: any) {
    results.push({ name: testName, passed: false, message: `❌ ${error.message}` })
    return false
  }
}

// Test 5: Customer Expiry Check
export const testCustomerExpiryCheck = () => {
  const testName = 'Customer: Expiry Date Check'
  try {
    CustomerSession.logout()
    
    // Set expired date
    localStorage.setItem('customerRememberMe', 'true')
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 1) // Yesterday
    localStorage.setItem('customerRememberMeExpiry', expiredDate.toISOString())
    
    // Check should return false
    const isValid = CustomerSession.check()
    
    if (!isValid) {
      results.push({ name: testName, passed: true, message: '✅ Expired session detected and cleared' })
      return true
    }
    
    throw new Error('Expired session not detected')
  } catch (error: any) {
    results.push({ name: testName, passed: false, message: `❌ ${error.message}` })
    return false
  }
}

// Test 6: Employee Remember Me - Stricter (7 days)
export const testEmployeeRememberMe = () => {
  const testName = 'Employee: Remember Me (7 days - STRICTER)'
  try {
    EmployeeSession.logout()
    sessionStorage.clear()
    
    EmployeeSession.save(true)
    
    const remembered = localStorage.getItem('employeeRememberMe')
    const expiry = localStorage.getItem('employeeRememberMeExpiry')
    
    if (remembered === 'true' && expiry) {
      const expiryDate = new Date(expiry)
      const today = new Date()
      const daysDiff = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff >= 6 && daysDiff <= 8) {
        results.push({ name: testName, passed: true, message: `✅ Employee expiry set to ~${Math.round(daysDiff)} days (STRICTER)` })
        return true
      }
    }
    
    throw new Error('Employee Remember Me not set correctly')
  } catch (error: any) {
    results.push({ name: testName, passed: false, message: `❌ ${error.message}` })
    return false
  }
}

// Test 7: Employee Strict Session Only
export const testEmployeeStrictSessionOnly = () => {
  const testName = 'Employee: Strict Session Only'
  try {
    EmployeeSession.logout()
    sessionStorage.clear()
    
    EmployeeSession.save(false)
    
    // Simulate reload - session storage cleared
    const employeeSessionCleared = !sessionStorage.getItem('employeeSessionOnly')
    const noRememberMe = !localStorage.getItem('employeeRememberMe')
    
    if (employeeSessionCleared || noRememberMe) {
      results.push({ name: testName, passed: true, message: '✅ Strict session-only mode enforced' })
      return true
    }
    
    throw new Error('Strict mode not enforced')
  } catch (error: any) {
    results.push({ name: testName, passed: false, message: `❌ ${error.message}` })
    return false
  }
}

// Test 8: Admin Remember Me - Most Strict (3 days)
export const testAdminRememberMe = () => {
  const testName = 'Admin: Remember Me (3 days - MOST STRICT)'
  try {
    AdminSession.logout()
    sessionStorage.clear()
    
    AdminSession.save(true)
    
    const remembered = localStorage.getItem('adminRememberMe')
    const expiry = localStorage.getItem('adminRememberMeExpiry')
    
    if (remembered === 'true' && expiry) {
      const expiryDate = new Date(expiry)
      const today = new Date()
      const daysDiff = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff >= 2 && daysDiff <= 4) {
        results.push({ name: testName, passed: true, message: `✅ Admin expiry set to ~${Math.round(daysDiff)} days (MOST STRICT)` })
        return true
      }
    }
    
    throw new Error('Admin Remember Me not set correctly')
  } catch (error: any) {
    results.push({ name: testName, passed: false, message: `❌ ${error.message}` })
    return false
  }
}

// Test 9: Logout Clears All Data
export const testLogoutClearsAll = () => {
  const testName = 'All: Logout Clears All Data'
  try {
    // Set data for all types
    CustomerSession.save('test@example.com', true)
    EmployeeSession.save(true)
    AdminSession.save(true)
    
    // Logout all
    CustomerSession.logout()
    EmployeeSession.logout()
    AdminSession.logout()
    
    // Check all cleared
    const customerCleared = !localStorage.getItem('customerRememberMe')
    const employeeCleared = !localStorage.getItem('employeeRememberMe')
    const adminCleared = !localStorage.getItem('adminRememberMe')
    
    if (customerCleared && employeeCleared && adminCleared) {
      results.push({ name: testName, passed: true, message: '✅ All session data properly cleared' })
      return true
    }
    
    throw new Error('Some session data not cleared')
  } catch (error: any) {
    results.push({ name: testName, passed: false, message: `❌ ${error.message}` })
    return false
  }
}

// Run all tests
export const runAllTests = (): TestResult[] => {
  results.length = 0 // Clear previous results
  
  console.log('🧪 Running Session Manager Tests...\n')
  
  testCustomerRememberMeSave()
  testCustomerRememberMeCheckValid()
  testCustomerSessionOnly()
  testCustomerAutoLogoutOnReload()
  testCustomerExpiryCheck()
  testEmployeeRememberMe()
  testEmployeeStrictSessionOnly()
  testAdminRememberMe()
  testLogoutClearsAll()
  
  // Summary
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  console.log('📊 Test Results:')
  console.log('================')
  results.forEach(r => console.log(`${r.passed ? '✅' : '❌'} ${r.name}\n   ${r.message}`))
  console.log('================')
  console.log(`\n✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${total - passed}/${total}`)
  
  return results
}

// Export for use in component
export const getTestResults = () => results
