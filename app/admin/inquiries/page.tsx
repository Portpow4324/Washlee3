'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { ChevronRight, Mail, Phone, CheckCircle, X, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Spinner from '@/components/Spinner'

interface Inquiry {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  state: string
  status: 'pending' | 'under-review' | 'approved' | 'rejected'
  workVerification: {
    hasWorkRight: boolean
    hasValidLicense: boolean
    hasTransport: boolean
    hasEquipment: boolean
    ageVerified: boolean
  }
  skillsAssessment: string
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  idVerification?: {
    fileName?: string
    fileType?: string
    storagePath?: string
    downloadUrl?: string
  }
  idAnalysis?: {
    isLikelyReal?: boolean
    confidence?: number
    notes?: string
    evaluatedAt?: string
  }
}

export default function InquiriesManagement() {
  const router = useRouter()
  const { hasAdminAccess, checkingAdminAccess } = useRequireAdminAccess()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under-review' | 'approved' | 'rejected'>('pending')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasAdminAccess) return
    loadInquiries()
  }, [hasAdminAccess])

  const loadInquiries = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/inquiries/list')
      if (!response.ok) throw new Error('Failed to load inquiries')
      
      const data = await response.json()
      setInquiries(data.inquiries || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not load inquiries.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveInquiry = async () => {
    if (!selectedInquiry) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/inquiries/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          adminId: 'password-admin',
          adminName: 'Admin',
        }),
      })

      if (!response.ok) throw new Error('Failed to approve inquiry')

      // Update local state
      setInquiries(inquiries.map(inq =>
        inq.id === selectedInquiry.id
          ? { ...inq, status: 'approved', reviewedAt: new Date().toISOString() }
          : inq
      ))
      setSelectedInquiry(null)
      setShowApprovalModal(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve inquiry'
      setError(message)
      alert(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectInquiry = async () => {
    if (!selectedInquiry || !rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/inquiries/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: selectedInquiry.id,
          adminId: 'password-admin',
          adminName: 'Admin',
          rejectionReason: rejectionReason,
        }),
      })

      if (!response.ok) throw new Error('Failed to reject inquiry')

      // Update local state
      setInquiries(inquiries.map(inq =>
        inq.id === selectedInquiry.id
          ? { ...inq, status: 'rejected', reviewedAt: new Date().toISOString(), rejectionReason }
          : inq
      ))
      setSelectedInquiry(null)
      setShowApprovalModal(false)
      setRejectionReason('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject inquiry'
      setError(message)
      alert(message)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredInquiries = statusFilter === 'all'
    ? inquiries
    : inquiries.filter(inq => inq.status === statusFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 border-yellow-200'
      case 'under-review': return 'bg-blue-50 border-blue-200'
      case 'approved': return 'bg-green-50 border-green-200'
      case 'rejected': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Pending</span>
      case 'under-review':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Under Review</span>
      case 'approved':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Approved</span>
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Rejected</span>
      default:
        return null
    }
  }

  if (checkingAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-3 hover:text-primary"
        >
          <ArrowLeft size={14} />
          Control center
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-1">Pro inquiries</h1>
        <p className="text-sm text-gray mb-8">
          Inbound Pro applications. Review the work-rights checklist, ID document, and notes — Pros are independent contractors paid commission per completed order.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Status Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(['all', 'pending', 'under-review', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                statusFilter === status
                  ? 'bg-primary text-white'
                  : 'bg-white border-2 border-gray text-dark hover:border-primary'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              {status !== 'all' && (
                <span className="ml-2">
                  ({inquiries.filter(inq => inq.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredInquiries.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle size={48} className="text-gray mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-dark mb-2">No inquiries found</h3>
            <p className="text-gray">No {statusFilter} inquiries at this time</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map(inquiry => (
              <div
                key={inquiry.id}
                className={`p-6 border-2 rounded-lg cursor-pointer hover:shadow-lg transition ${getStatusColor(inquiry.status)}`}
                onClick={() => setSelectedInquiry(inquiry)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-dark">{inquiry.firstName} {inquiry.lastName}</h3>
                    <p className="text-sm text-gray">{inquiry.state}</p>
                  </div>
                  {getStatusBadge(inquiry.status)}
                </div>

                <div className="space-y-2 text-sm text-gray mb-4">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    {inquiry.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    {inquiry.phone}
                  </div>
                </div>

                <div className="flex gap-2">
                  <CheckCircle size={16} className={inquiry.workVerification.hasWorkRight ? 'text-green-600' : 'text-red-600'} />
                  <span className="text-sm font-semibold">Work Rights: {inquiry.workVerification.hasWorkRight ? '✓' : '✗'}</span>
                </div>

                <div className="mt-4 flex justify-end">
                  <ChevronRight size={20} className="text-primary" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inquiry Detail Modal */}
        {selectedInquiry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-dark">{selectedInquiry.firstName} {selectedInquiry.lastName}</h2>
                    <p className="text-gray">{selectedInquiry.state}</p>
                  </div>
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="p-2 hover:bg-light rounded-full transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Contact Info */}
                <div className="mb-6 pb-6 border-b border-gray">
                  <h3 className="font-semibold text-dark mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm text-gray">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      {selectedInquiry.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      {selectedInquiry.phone}
                    </div>
                  </div>
                </div>

                {/* Work Verification */}
                <div className="mb-6 pb-6 border-b border-gray">
                  <h3 className="font-semibold text-dark mb-3">Work Verification</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {selectedInquiry.workVerification.hasWorkRight ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <X size={16} className="text-red-600" />
                      )}
                      <span>Work Right: {selectedInquiry.workVerification.hasWorkRight ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedInquiry.workVerification.hasValidLicense ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <X size={16} className="text-red-600" />
                      )}
                      <span>Valid License & Age: {selectedInquiry.workVerification.hasValidLicense ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedInquiry.workVerification.hasTransport ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <X size={16} className="text-red-600" />
                      )}
                      <span>Transport: {selectedInquiry.workVerification.hasTransport ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedInquiry.workVerification.hasEquipment ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <X size={16} className="text-red-600" />
                      )}
                      <span>Equipment: {selectedInquiry.workVerification.hasEquipment ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* ID Verification */}
                {selectedInquiry.idVerification?.downloadUrl && (
                  <div className="mb-6 pb-6 border-b border-gray">
                    <h3 className="font-semibold text-dark mb-3">ID Verification</h3>
                    <div className="space-y-3">
                      <div className="text-sm text-gray">
                        <p className="font-semibold">Document:</p>
                        <p>{selectedInquiry.idVerification.fileName || 'Uploaded document'}</p>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={selectedInquiry.idVerification.downloadUrl}
                          alt="Uploaded ID"
                          className="w-full h-auto"
                        />
                      </div>

                      {selectedInquiry.idAnalysis && (
                        <div className="text-sm text-gray">
                          <p className="font-semibold">AI Analysis</p>
                          <p>
                            Likely Real: {selectedInquiry.idAnalysis.isLikelyReal ? 'Yes' : 'No'}{' '}
                            (confidence {Math.round((selectedInquiry.idAnalysis.confidence ?? 0) * 100)}%)
                          </p>
                          <p>{selectedInquiry.idAnalysis.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills Assessment */}
                <div className="mb-6">
                  <h3 className="font-semibold text-dark mb-2">Skills Assessment</h3>
                  <p className="text-sm text-gray whitespace-pre-wrap">{selectedInquiry.skillsAssessment}</p>
                </div>

                {/* Action Buttons */}
                {selectedInquiry.status === 'pending' && (
                  <div className="flex gap-3 justify-end pt-6 border-t border-gray">
                    <button
                      onClick={() => setSelectedInquiry(null)}
                      className="px-6 py-2 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
                    >
                      Close
                    </button>
                    <Button
                      onClick={() => {
                        setShowApprovalModal(true)
                      }}
                    >
                      Review & Verify
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Approval Modal */}
            {showApprovalModal && selectedInquiry && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-dark mb-4">Verify Inquiry</h3>
                    <p className="text-gray mb-6">Are all the details correct and legally compliant?</p>

                    <div className="space-y-3 mb-6">
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Optional: Reason for rejection (if rejecting)"
                        rows={3}
                        className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowApprovalModal(false)
                          setRejectionReason('')
                        }}
                        className="flex-1 px-4 py-2 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition disabled:opacity-50"
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!rejectionReason.trim()) {
                            alert('Please add a rejection reason first.')
                            return
                          }
                          if (window.confirm(`Reject inquiry from ${selectedInquiry.firstName} ${selectedInquiry.lastName}? They will be notified.`)) {
                            handleRejectInquiry()
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50"
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Reject'}
                      </button>
                      <Button
                        onClick={() => {
                          if (window.confirm(`Approve inquiry from ${selectedInquiry.firstName} ${selectedInquiry.lastName} and onboard them as a Pro?`)) {
                            handleApproveInquiry()
                          }
                        }}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
