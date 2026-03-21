'use client'

import { useState } from 'react'
import Button from '@/components/Button'

export default function EmailDebugPage() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const testResendDirect = async () => {
    setLoading(true)
    setLogs([])
    addLog('Starting Resend direct test...')

    try {
      const res = await fetch('/api/test/resend-test')
      const data = await res.json()
      
      addLog(`Response status: ${res.status}`)
      addLog(`Response: ${JSON.stringify(data, null, 2)}`)
      
      if (data.success) {
        addLog('✅ Resend is working!')
        setResponse({ ...data, status: 'success' })
      } else {
        addLog('❌ Resend failed: ' + (data.error?.message || data.error))
        setResponse({ ...data, status: 'error' })
      }
    } catch (error) {
      addLog('❌ Exception: ' + String(error))
      setResponse({ error: String(error), status: 'exception' })
    }
    setLoading(false)
  }

  const testSendConfirmation = async () => {
    setLoading(true)
    setLogs([])
    addLog('Starting send-confirmation endpoint test...')
    addLog(`Target email: ${testEmail}`)

    try {
      const res = await fetch('/api/auth/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          firstName: 'TestUser',
          verificationCode: '123456',
        })
      })

      const data = await res.json()
      
      addLog(`Response status: ${res.status}`)
      addLog(`Response: ${JSON.stringify(data, null, 2)}`)
      
      if (res.ok) {
        addLog('✅ Email endpoint returned success!')
        setResponse({ ...data, status: 'success' })
      } else {
        addLog('❌ Email endpoint failed')
        setResponse({ ...data, status: 'error' })
      }
    } catch (error) {
      addLog('❌ Exception: ' + String(error))
      setResponse({ error: String(error), status: 'exception' })
    }
    setLoading(false)
  }

  const testFullSignup = async () => {
    setLoading(true)
    setLogs([])
    addLog('Starting full signup test...')
    addLog(`Target email: ${testEmail}`)

    try {
      // Step 1: Sign up
      addLog('Step 1: Creating account via /api/auth/signup...')
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'TestPassword123!',
          name: 'Test User',
          phone: '0412345678',
          state: 'NSW',
          personalUse: 'personal',
          userType: 'customer',
        })
      })

      const signupData = await signupRes.json()
      addLog(`Signup response: ${signupRes.status}`)
      addLog(`Signup data: ${JSON.stringify(signupData, null, 2)}`)

      if (!signupRes.ok) {
        addLog('❌ Signup failed!')
        setResponse({ ...signupData, status: 'error' })
        setLoading(false)
        return
      }

      addLog('✅ Account created!')

      // Step 2: Send confirmation
      addLog('Step 2: Sending confirmation email...')
      const emailRes = await fetch('/api/auth/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          firstName: 'Test',
          verificationCode: '123456',
        })
      })

      const emailData = await emailRes.json()
      addLog(`Email response: ${emailRes.status}`)
      addLog(`Email data: ${JSON.stringify(emailData, null, 2)}`)

      if (emailRes.ok) {
        addLog('✅ Email sent successfully!')
        setResponse({ status: 'success', signup: signupData, email: emailData })
      } else {
        addLog('❌ Email send failed!')
        setResponse({ status: 'error', signup: signupData, email: emailData })
      }
    } catch (error) {
      addLog('❌ Exception: ' + String(error))
      setResponse({ error: String(error), status: 'exception' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-light p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-dark mb-8">📧 Email Debug Panel</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-dark mb-4">Email Configuration Check</h2>
          <div className="space-y-2 mb-6">
            <p className="text-sm text-gray">
              These checks will help diagnose email sending issues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Button
              onClick={testResendDirect}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Resend Directly'}
            </Button>

            <Button
              onClick={testSendConfirmation}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Email Endpoint'}
            </Button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-dark mb-2">Test Email Address</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-4 py-2 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            onClick={testFullSignup}
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600"
          >
            {loading ? 'Testing...' : 'Test Full Signup + Email'}
          </Button>
        </div>

        {/* Logs Panel */}
        <div className="bg-dark rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Live Logs</h3>
          <div className="bg-black text-green-400 font-mono text-sm p-4 rounded max-h-96 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">Waiting for test execution...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap break-words">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Response Panel */}
        {response && (
          <div className={`rounded-lg p-6 ${
            response.status === 'success' ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${
              response.status === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {response.status === 'success' ? '✅ Success' : '❌ Error'}
            </h3>
            <pre className="text-sm overflow-auto max-h-64 text-dark">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
