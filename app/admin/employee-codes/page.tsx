'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import {
  ChevronLeft,
  Copy,
  Download,
  Plus,
  AlertCircle,
  CheckCircle,
  DollarSign,
  FileText,
} from 'lucide-react'

interface GeneratedCode {
  code: string
  format: string
  createdAt: string
}

export default function EmployeeCodesPage() {
  const router = useRouter()
  const { hasAdminAccess, checkingAdminAccess } = useRequireAdminAccess()
  const [codeCount, setCodeCount] = useState(10)
  const [codeFormat, setCodeFormat] = useState<'standard' | 'payslip'>('standard')
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const handleGenerateCodes = async () => {
    setError('')
    setSuccessMessage('')
    setIsGenerating(true)

    try {
      const response = await fetch('/api/employee-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: codeCount,
          format: codeFormat,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate codes')

      const data = await response.json()
      setGeneratedCodes(data.codes.map((code: string) => ({
        code,
        format: codeFormat,
        createdAt: new Date().toISOString(),
      })))
      setSuccessMessage(`✓ Generated ${data.count} ${codeFormat} codes`)
    } catch (err: any) {
      setError(err.message || 'Failed to generate codes')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setSuccessMessage('✓ Code copied to clipboard')
    setTimeout(() => setSuccessMessage(''), 2000)
  }

  const handleCopyAll = () => {
    const allCodes = generatedCodes.map(c => c.code).join('\n')
    navigator.clipboard.writeText(allCodes)
    setSuccessMessage('✓ All codes copied to clipboard')
    setTimeout(() => setSuccessMessage(''), 2000)
  }

  const handleDownloadCSV = () => {
    const csv = [
      'Employee Code,Format,Generated At',
      ...generatedCodes.map(c => `${c.code},${c.format},${c.createdAt}`),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employee-codes-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (checkingAdminAccess || !hasAdminAccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          {checkingAdminAccess ? <Spinner /> : <div className="text-center">
            <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
            <p className="text-red-600 font-semibold">Admin access required</p>
          </div>}
        </div>
        <Footer />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-primary hover:text-primary/80 font-semibold mb-4 flex items-center gap-2"
          >
            ← Back to Admin
          </button>
          <h1 className="text-4xl font-bold text-dark mb-2">Employee Code Generator</h1>
          <p className="text-gray">Generate unique employee/payslip identification codes</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Generator Panel */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-dark mb-6">Generate New Codes</h2>

          <div className="space-y-6">
            {/* Code Format Selection */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-3">Code Format</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setCodeFormat('standard')}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    codeFormat === 'standard'
                      ? 'border-primary bg-mint'
                      : 'border-gray hover:border-primary'
                  }`}
                >
                  <div className="font-bold text-dark flex items-center gap-2">
                    <DollarSign size={20} />
                    Standard Employee ID
                  </div>
                  <p className="text-xs text-gray mt-2">123456</p>
                  <p className="text-xs text-gray mt-1">Short Pro app sign-in ID</p>
                </button>

                <button
                  onClick={() => setCodeFormat('payslip')}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    codeFormat === 'payslip'
                      ? 'border-primary bg-mint'
                      : 'border-gray hover:border-primary'
                  }`}
                >
                  <div className="font-bold text-dark flex items-center gap-2">
                    <FileText size={20} />
                    Payslip Code
                  </div>
                  <p className="text-xs text-gray mt-2">PS-20240304-X9K2L</p>
                  <p className="text-xs text-gray mt-1">Payroll/HR tracking</p>
                </button>
              </div>
            </div>

            {/* Count Selection */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-3">
                Number of Codes to Generate
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={codeCount}
                  onChange={(e) => setCodeCount(parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className="flex items-center gap-2 bg-mint px-4 py-2 rounded-lg">
                  <span className="text-2xl font-bold text-primary">{codeCount}</span>
                  <span className="text-sm text-gray">codes</span>
                </div>
              </div>
              <p className="text-xs text-gray mt-2">Maximum: 100 codes per generation</p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateCodes}
              disabled={isGenerating}
              className={`w-full py-4 rounded-lg font-bold text-white transition flex items-center justify-center gap-2 ${
                isGenerating
                  ? 'bg-gray cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isGenerating ? (
                <>
                  <Spinner />
                  Generating...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Generate {codeCount} Codes
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Generated Codes Display */}
        {generatedCodes.length > 0 && (
          <Card className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-dark">Generated Codes</h2>
              <div className="text-sm text-gray">
                {generatedCodes.length} codes ready to use
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              <button
                onClick={handleCopyAll}
                className="py-2 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Copy All Codes
              </button>
              <button
                onClick={handleDownloadCSV}
                className="py-2 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download CSV
              </button>
            </div>

            {/* Codes Grid */}
            <div className="bg-light/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {generatedCodes.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopyCode(item.code)}
                    className="p-3 bg-white border-2 border-gray/30 rounded hover:border-primary hover:bg-mint transition text-left group"
                    title="Click to copy"
                  >
                    <p className="font-mono font-bold text-dark text-sm break-all">
                      {item.code}
                    </p>
                    <p className="text-xs text-gray mt-1 group-hover:text-primary transition">
                      Click to copy
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Usage Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-bold text-blue-900 mb-2">💡 How to Use</h4>
              <ol className="text-sm text-blue-900 space-y-1 list-decimal list-inside">
                <li>Copy the code(s) above</li>
                <li>Share with your administrator or employee management system</li>
                <li>Employee can use code during onboarding or payroll setup</li>
                <li>Code becomes active when associated with an employee profile</li>
              </ol>
            </div>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}
