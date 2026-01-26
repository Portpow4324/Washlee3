'use client'

import { useState, useEffect } from 'react'
import { ProVerification, getVerificationStatusLabel, getVerificationStatusColor, getVerificationBadge, getVerificationTimelineEvents, getRequiredDocuments } from '@/lib/proVerificationUtils'
import { Upload, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react'

export default function ProVerificationPage() {
  const [verification, setVerification] = useState<ProVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch verification status
  useEffect(() => {
    async function fetchVerification() {
      try {
        const res = await fetch('/api/pro/verification')
        if (res.ok) {
          const data = await res.json()
          setVerification(data)
        } else {
          setError('Failed to load verification status')
        }
      } catch (err) {
        setError('Error loading verification')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchVerification()
  }, [])

  async function handleDocumentUpload(docType: string, file: File) {
    setUploading(true)
    setError('')

    try {
      // In production, upload to Firebase Storage first
      // For now, use a simple data URL (not recommended for production)
      const reader = new FileReader()
      reader.onload = async (e) => {
        const fileData = e.target?.result

        const res = await fetch('/api/pro/verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentType: docType,
            documentUrl: fileData,
          }),
        })

        if (res.ok) {
          // Refresh verification
          const refreshRes = await fetch('/api/pro/verification')
          if (refreshRes.ok) {
            setVerification(await refreshRes.json())
          }
        } else {
          const data = await res.json()
          setError(data.error || 'Failed to upload document')
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmitForReview() {
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/pro/verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_for_review' }),
      })

      if (res.ok) {
        const data = await res.json()
        setVerification(data)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit for review')
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block px-6 py-3 bg-[#48C9B0] text-white rounded-lg">
            Loading verification status...
          </div>
        </div>
      </div>
    )
  }

  if (!verification) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load verification status</p>
        </div>
      </div>
    )
  }

  const badge = getVerificationBadge(verification)
  const statusLabel = getVerificationStatusLabel(verification.status)
  const statusColor = getVerificationStatusColor(verification.status)
  const timeline = getVerificationTimelineEvents(verification)
  const requiredDocs = getRequiredDocuments('individual')
  
  // Calculate progress based on documents uploaded
  const uploadedDocCount = Object.values(verification.documents).filter((doc) => doc?.uploadedAt).length
  const progress = Math.round((uploadedDocCount / requiredDocs.length) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Status Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile Verification</h1>
            <div
              className="px-4 py-2 rounded-full font-semibold text-white"
              style={{ backgroundColor: statusColor }}
            >
              {statusLabel}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-900">Verification Progress</span>
              <span className="text-lg font-bold" style={{ color: statusColor }}>
                {progress}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: statusColor }}
              />
            </div>
          </div>

          {/* Status Message */}
          {verification.status === 'approved' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Your profile is verified!</p>
                <p className="text-sm text-green-700">You can now accept orders and build your reputation.</p>
              </div>
            </div>
          )}

          {verification.status === 'rejected' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-900 mb-2">Verification Failed</p>
              <p className="text-sm text-red-700 mb-3">{verification.rejectionReason || 'Your application was rejected.'}</p>
              <button
                onClick={() => {
                  setVerification(prev => prev ? { ...prev, status: 'pending' } : null)
                }}
                className="text-sm font-semibold text-red-700 hover:text-red-900"
              >
                Reapply →
              </button>
            </div>
          )}

          {(verification.status === 'pending' || verification.status === 'in-review') && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <Clock size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Application under review</p>
                <p className="text-sm text-blue-700">We typically review applications within 2-3 business days.</p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Documents Section */}
        {verification.status !== 'approved' && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Required Documents</h2>

            <div className="space-y-4 mb-8">
              {requiredDocs.map(docType => {
                const uploadedDoc = verification.documents.find(d => d.type === docType)

                return (
                  <div key={docType} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {docType === 'id' && 'Government ID'}
                          {docType === 'background-check' && 'Background Check'}
                          {docType === 'insurance' && 'Insurance'}
                          {docType === 'license' && 'Professional License'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {docType === 'id' && 'Passport, drivers license, or national ID'}
                          {docType === 'background-check' && 'Verified background check (via Onfido)'}
                          {docType === 'insurance' && 'Current liability or professional insurance'}
                          {docType === 'license' && 'Current professional or business license'}
                        </p>
                      </div>
                      {uploadedDoc && uploadedDoc.status === 'approved' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                          <CheckCircle size={16} className="text-green-600" />
                          <span className="text-sm font-semibold text-green-700">Verified</span>
                        </div>
                      )}
                      {uploadedDoc && uploadedDoc.status === 'pending' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full">
                          <Clock size={16} className="text-yellow-600" />
                          <span className="text-sm font-semibold text-yellow-700">Pending</span>
                        </div>
                      )}
                      {uploadedDoc && uploadedDoc.status === 'rejected' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
                          <AlertCircle size={16} className="text-red-600" />
                          <span className="text-sm font-semibold text-red-700">Rejected</span>
                        </div>
                      )}
                    </div>

                    {!uploadedDoc || uploadedDoc.status === 'rejected' ? (
                      <label className="flex items-center justify-center w-full px-6 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="text-center">
                          <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-900">Click to upload</p>
                          <p className="text-xs text-gray-600">or drag and drop</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleDocumentUpload(docType, e.target.files[0])
                            }
                          }}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <FileText size={20} className="text-gray-600" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Document uploaded</p>
                          <p className="text-xs text-gray-600">
                            {uploadedDoc.uploadedAt && new Date(uploadedDoc.uploadedAt.toMillis()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {uploadedDoc?.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                        <p className="text-sm text-red-700">
                          <strong>Rejection reason:</strong> {uploadedDoc.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Submit Button */}
            {verification.documents.some(d => d.status === 'pending' || d.status === 'approved') && (
              <button
                onClick={handleSubmitForReview}
                disabled={submitting}
                className="w-full px-6 py-3 bg-[#48C9B0] text-white font-semibold rounded-lg hover:bg-[#3ab09c] disabled:bg-gray-400 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            )}
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Verification Timeline</h2>

            <div className="space-y-4">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: event.status === 'completed' ? '#48C9B0' : '#FFA500' }}
                    />
                    {i < timeline.length - 1 && (
                      <div
                        className="w-1 h-12"
                        style={{ backgroundColor: event.status === 'completed' ? '#48C9B0' : '#E5E7EB' }}
                      />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.date.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
