'use client'

import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import { getResolutionsByCategory, issueResolutions } from '@/lib/issueResolutions'

export default function ResolutionGuidePage() {
  const router = useRouter()
  const params = useParams()
  const { user, userData, loading: authLoading } = useAuth()
  const [resolution, setResolution] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<number | null>(null)
  const [hasOwnerAccess, setHasOwnerAccess] = useState(false)

  // Check admin access
  useEffect(() => {
    const ownerAccess = sessionStorage.getItem('ownerAccess') === 'true'
    setHasOwnerAccess(ownerAccess)

    if (authLoading) return

    if (ownerAccess) {
      setLoading(false)
      return
    }

    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!userData?.isAdmin) {
      router.push('/')
      return
    }

    setLoading(false)
  }, [user, userData, authLoading, router])

  // Find resolution
  useEffect(() => {
    const found = issueResolutions.find(r => r.id === params.id)
    setResolution(found)
  }, [params.id])

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(index)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  if (!resolution) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-primary hover:text-[#3aad9a] mb-6 font-semibold"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg">Resolution guide not found</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-[#3aad9a] mb-6 font-semibold"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          {/* Header */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{resolution.title}</h1>
                <p className="text-gray-600">{resolution.description}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                resolution.severity === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : resolution.severity === 'high'
                  ? 'bg-orange-100 text-orange-800'
                  : resolution.severity === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {resolution.severity.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Category: <strong>{resolution.category}</strong></span>
            </div>
          </div>

          {/* Symptoms */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertCircle className="text-orange-600" />
              Symptoms
            </h2>
            <ul className="space-y-3">
              {resolution.symptoms.map((symptom: string, idx: number) => (
                <li key={idx} className="flex gap-3 text-gray-700">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Root Causes */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertCircle className="text-red-600" />
              Root Causes
            </h2>
            <ul className="space-y-3">
              {resolution.rootCauses.map((cause: string, idx: number) => (
                <li key={idx} className="flex gap-3 text-gray-700">
                  <span className="text-red-600 font-bold flex-shrink-0">→</span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Resolution Steps */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="text-green-600" />
              Resolution Steps
            </h2>
            <div className="space-y-8">
              {resolution.steps.map((step: any, idx: number) => (
                <div key={idx} className="border-l-4 border-primary pl-6 pb-8 last:pb-0">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold flex-shrink-0">
                      {step.order}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{step.details}</p>

                  {step.code && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 relative">
                      <button
                        onClick={() => copyToClipboard(step.code, idx)}
                        className="absolute top-3 right-3 px-3 py-1 bg-primary text-white text-xs rounded hover:bg-[#3aad9a] transition flex items-center gap-2"
                      >
                        <Copy size={14} />
                        {copiedCode === idx ? 'Copied!' : 'Copy'}
                      </button>
                      <code className="block text-sm text-gray-700 font-mono overflow-x-auto whitespace-pre-wrap break-words">
                        {step.code}
                      </code>
                    </div>
                  )}

                  {step.files && step.files.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Related Files:</p>
                      <ul className="space-y-2">
                        {step.files.map((file: string, fileIdx: number) => (
                          <li key={fileIdx} className="text-sm text-blue-800">
                            <code className="bg-white px-2 py-1 rounded">{file}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Prevention Tips */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lightbulb className="text-yellow-600" />
              Prevention Tips
            </h2>
            <ul className="space-y-3">
              {resolution.preventionTips.map((tip: string, idx: number) => (
                <li key={idx} className="flex gap-3 text-gray-700">
                  <span className="text-yellow-600 font-bold flex-shrink-0">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Related Errors */}
          {resolution.relatedErrors && resolution.relatedErrors.length > 0 && (
            <div className="bg-white rounded-lg shadow p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Error Patterns</h2>
              <ul className="space-y-2">
                {resolution.relatedErrors.map((error: string, idx: number) => (
                  <li key={idx} className="text-gray-700">
                    <code className="bg-gray-50 px-3 py-1 rounded text-sm">{error}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resources */}
          {resolution.resources && resolution.resources.length > 0 && (
            <div className="bg-white rounded-lg shadow p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Resources</h2>
              <div className="grid gap-4">
                {resolution.resources.map((resource: any, idx: number) => (
                  <a
                    key={idx}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-mint transition flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{resource.title}</p>
                      <p className="text-sm text-gray-500">{resource.type}</p>
                    </div>
                    <ExternalLink className="text-primary flex-shrink-0" size={20} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Back to Dashboard Button */}
          <div className="text-center">
            <button
              onClick={() => router.push('/admin/security')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-[#3aad9a] transition font-semibold"
            >
              Back to Security Dashboard
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
