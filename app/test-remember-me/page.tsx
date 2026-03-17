'use client'

import { useState, useEffect } from 'react'
import { runAllTests, getTestResults } from '@/lib/sessionTester'
import Button from '@/components/Button'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export default function TestRememberMe() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const handleRunTests = () => {
    setIsRunning(true)
    const results = runAllTests()
    setTestResults(results)
    setIsRunning(false)
  }

  useEffect(() => {
    // Auto-run on mount
    handleRunTests()
  }, [])

  const passed = testResults.filter(r => r.passed).length
  const total = testResults.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-mint to-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-dark mb-4">🧪 Remember Me Test Suite</h1>
          <p className="text-xl text-gray">Testing session management across all login types</p>
        </div>

        {/* Test Status */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Total Tests */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{total}</div>
              <div className="text-blue-700 font-semibold">Total Tests</div>
            </div>

            {/* Passed Tests */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{passed}</div>
              <div className="text-green-700 font-semibold">Passed ✅</div>
            </div>

            {/* Failed Tests */}
            <div className={`bg-gradient-to-br ${total - passed === 0 ? 'from-gray-50 to-gray-100' : 'from-red-50 to-red-100'} rounded-2xl p-6 text-center`}>
              <div className={`text-4xl font-bold ${total - passed === 0 ? 'text-gray-600' : 'text-red-600'} mb-2`}>
                {total - passed}
              </div>
              <div className={`${total - passed === 0 ? 'text-gray-700' : 'text-red-700'} font-semibold`}>
                Failed {total - passed === 0 ? '✅' : '❌'}
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-dark mb-2">Test Status</h3>
                {total > 0 && passed === total ? (
                  <p className="text-green-600 font-semibold flex items-center gap-2">
                    <CheckCircle size={20} />
                    All tests passed! Remember Me functionality is working correctly ✅
                  </p>
                ) : (
                  <p className="text-red-600 font-semibold flex items-center gap-2">
                    <XCircle size={20} />
                    Some tests failed. See details below.
                  </p>
                )}
              </div>
              <Button
                onClick={handleRunTests}
                disabled={isRunning}
                size="lg"
                className="flex items-center gap-2"
              >
                <RefreshCw size={20} className={isRunning ? 'animate-spin' : ''} />
                {isRunning ? 'Running...' : 'Run Tests'}
              </Button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-dark mb-6">Detailed Results</h2>
          
          {testResults.map((result, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 border-l-4 ${
                result.passed
                  ? 'bg-green-50 border-l-green-500'
                  : 'bg-red-50 border-l-red-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                    {result.passed ? '✅' : '❌'} {result.name}
                  </h3>
                  <p className={`text-sm mt-2 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Testing Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-2xl p-8 mt-12">
          <h3 className="text-xl font-bold text-dark mb-4">📋 Manual Testing Checklist</h3>
          <div className="space-y-3 text-dark">
            <div className="flex gap-3">
              <input type="checkbox" className="w-5 h-5" />
              <label><strong>Customer Login:</strong> Login → Check "Remember me" → Close tab → Reopen → Should still be logged in</label>
            </div>
            <div className="flex gap-3">
              <input type="checkbox" className="w-5 h-5" />
              <label><strong>Customer Logout:</strong> Login → Uncheck "Remember me" → Reload page → Should be logged out</label>
            </div>
            <div className="flex gap-3">
              <input type="checkbox" className="w-5 h-5" />
              <label><strong>Employee Login:</strong> Login → Check "Remember me" → After 7 days → Should be logged out</label>
            </div>
            <div className="flex gap-3">
              <input type="checkbox" className="w-5 h-5" />
              <label><strong>Employee Session:</strong> Login → Uncheck "Remember me" → Close browser → Reopen → Should be logged out</label>
            </div>
            <div className="flex gap-3">
              <input type="checkbox" className="w-5 h-5" />
              <label><strong>Admin Login:</strong> Login → Check "Remember me" → After 3 days → Should be logged out</label>
            </div>
          </div>
        </div>

        {/* Browser Console Info */}
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-2xl p-8 mt-8">
          <h3 className="text-xl font-bold text-dark mb-4">🔍 Debug Info (Open Browser Console)</h3>
          <p className="text-dark mb-4">Run these commands in your browser console to inspect session data:</p>
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <div>// Customer Session</div>
            <div>localStorage.getItem('customerRememberMe')</div>
            <div>localStorage.getItem('customerRememberMeExpiry')</div>
            <div></div>
            <div>// Employee Session</div>
            <div>localStorage.getItem('employeeRememberMe')</div>
            <div>localStorage.getItem('employeeRememberMeExpiry')</div>
            <div></div>
            <div>// Admin Session</div>
            <div>localStorage.getItem('adminRememberMe')</div>
            <div>localStorage.getItem('adminRememberMeExpiry')</div>
            <div></div>
            <div>// Session Storage (cleared on tab close)</div>
            <div>sessionStorage.getItem('customerSessionOnly')</div>
            <div>sessionStorage.getItem('employeeSessionOnly')</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray">
          <p>This test page can be deleted in production</p>
          <p className="text-sm mt-2">Located at: <code className="bg-gray-100 px-2 py-1 rounded">/test-remember-me</code></p>
        </div>
      </div>
    </div>
  )
}
