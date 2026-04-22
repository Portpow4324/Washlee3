'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import {
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  X,
  Clock,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Send,
  Shield,
  FileText,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react'

interface WorkVerification {
  hasWorkRight: boolean
  hasValidLicense: boolean
  hasTransport: boolean
  hasEquipment: boolean
  ageVerified: boolean
}

interface ProApplication {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  state: string
  status: 'pending' | 'under-review' | 'approved' | 'rejected'
  workVerification: WorkVerification
  skillsAssessment: string
  availability?: Record<string, boolean>
  comments?: string
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  idImage?: string // URL to ID verification image
  // Verification checklist
  verificationChecklist?: {
    idVerified: boolean
    contactVerified: boolean
    workRightsVerified: boolean
    backgroundCheckPassed: boolean
    documentsReviewed: boolean
  }
  employeeId?: string
  approvalDate?: string
}

export default function ProApplicationsPage() {
  const router = useRouter()
  const { user, userData, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<ProApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<ProApplication | null>(null)
  const [expandedApp, setExpandedApp] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under-review' | 'approved' | 'rejected'>('pending')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [verificationChecklist, setVerificationChecklist] = useState<Record<string, boolean>>({
    idVerified: false,
    contactVerified: false,
    workRightsVerified: false,
    backgroundCheckPassed: false,
    documentsReviewed: false,
  })
  const [employeeIdGenerated, setEmployeeIdGenerated] = useState(false)
  const [generatedEmployeeId, setGeneratedEmployeeId] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [hasAdminAccess, setHasAdminAccess] = useState(false)

  useEffect(() => {
    // Check for password-based admin access from sessionStorage
    const ownerAccess = sessionStorage.getItem('ownerAccess') === 'true'
    setHasAdminAccess(ownerAccess)
    
    if (!ownerAccess) {
      console.error('[ProApplications] Admin access denied. Redirecting to login.')
      router.push('/admin/login')
      return
    }

    loadApplications()
  }, [router, statusFilter])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      const url = statusFilter !== 'all' 
        ? `/api/admin/pro-approvals?status=${statusFilter}` 
        : '/api/admin/pro-approvals'
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load applications')

      const data = await response.json()
      console.log('[ProApplications] Loaded applications:', data)
      setApplications(data.data || [])
    } catch (error) {
      console.error('[ProApplications] Error loading applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectApp = (app: ProApplication) => {
    setSelectedApp(app)
    setExpandedApp(app.id)
    setVerificationChecklist(app.verificationChecklist || {
      idVerified: false,
      contactVerified: false,
      workRightsVerified: false,
      backgroundCheckPassed: false,
      documentsReviewed: false,
    })
    setEmployeeIdGenerated(false)
    setGeneratedEmployeeId('')
    setRejectionReason('')
  }

  const handleToggleChecklistItem = (item: string) => {
    setVerificationChecklist(prev => ({
      ...prev,
      [item]: !prev[item]
    }))
  }

  const generateEmployeeId = () => {
    // Format: EMP-{TIMESTAMP}-{RANDOM}
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 7).toUpperCase()
    const id = `EMP-${timestamp}-${random}`
    setGeneratedEmployeeId(id)
    setEmployeeIdGenerated(true)
  }

  const allChecklistItemsComplete = Object.values(verificationChecklist).every(v => v === true)

  const handleApproveApplication = async () => {
    if (!selectedApp) return
    if (!allChecklistItemsComplete) {
      alert('Please complete all verification checklist items before approving')
      return
    }

    setActionLoading(true)
    try {
      const employeeId = generatedEmployeeId || `EMP-${Date.now()}`

      const response = await fetch('/api/admin/pro-approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApp.id,
          status: 'approved',
          employeeId: employeeId,
          comments: `Approved by admin on ${new Date().toLocaleDateString()}.`
        }),
      })

      if (!response.ok) throw new Error('Failed to approve application')

      const result = await response.json()

      // Update local state
      setApplications(applications.map(app =>
        app.id === selectedApp.id
          ? ({
              ...app,
              status: 'approved' as const,
              reviewedAt: new Date().toISOString(),
              employeeId: employeeId,
              verificationChecklist: verificationChecklist as {
                idVerified: boolean
                contactVerified: boolean
                workRightsVerified: boolean
                backgroundCheckPassed: boolean
                documentsReviewed: boolean
              },
            } as ProApplication)
          : app
      ))

      setSuccessMessage(`✓ Application approved! Employee ID: ${employeeId}`)
      setShowApprovalModal(false)
      setTimeout(() => {
        setSuccessMessage('')
        setSelectedApp(null)
      }, 3000)
    } catch (error) {
      console.error('[ProApplications] Error approving application:', error)
      alert(`Failed to approve application: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectApplication = async () => {
    if (!selectedApp) return
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/pro-approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApp.id,
          status: 'rejected',
          comments: rejectionReason,
        }),
      })

      if (!response.ok) throw new Error('Failed to reject application')

      // Update local state
      setApplications(applications.map(app =>
        app.id === selectedApp.id
          ? ({
              ...app,
              status: 'rejected' as const,
              reviewedAt: new Date().toISOString(),
              rejectionReason: rejectionReason,
            } as ProApplication)
          : app
      ))

      setSuccessMessage(`✓ Application rejected`)
      setShowRejectionModal(false)
      setTimeout(() => {
        setSuccessMessage('')
        setSelectedApp(null)
      }, 3000)
    } catch (error) {
      console.error('[ProApplications] Error rejecting application:', error)
      alert(`Failed to reject application: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredApplications = applications.filter(app =>
    statusFilter === 'all' ? true : app.status === statusFilter
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'under-review':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return '✓ Approved'
      case 'rejected':
        return '✕ Rejected'
      case 'under-review':
        return '⏳ Under Review'
      default:
        return '○ Pending'
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-primary hover:text-primary/80 font-semibold mb-4 flex items-center gap-2"
          >
            ← Back to Admin
          </button>
          <h1 className="text-4xl font-bold text-dark mb-2">Pro Applications</h1>
          <p className="text-gray">Review and approve service provider applications</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray pb-4">
          {(['all', 'pending', 'under-review', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-t-lg font-semibold transition ${
                statusFilter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray/20 text-gray hover:bg-gray/30'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              {' '}
              ({filteredApplications.length})
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredApplications.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray mb-4" />
            <p className="text-gray text-lg">No applications found for this status</p>
          </Card>
        )}

        {/* Applications List */}
        {!isLoading && filteredApplications.length > 0 && (
          <div className="space-y-4">
            {filteredApplications.map(app => (
              <Card
                key={app.id}
                className={`p-0 overflow-hidden border-2 transition cursor-pointer ${
                  expandedApp === app.id ? 'border-primary' : 'border-gray/30 hover:border-primary'
                }`}
              >
                {/* Summary Row */}
                <button
                  onClick={() => handleSelectApp(app)}
                  className="w-full p-6 text-left hover:bg-light/50 transition flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-dark">
                        {app.firstName} {app.lastName}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(app.status)}`}>
                        {getStatusBadge(app.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray">
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        {app.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} />
                        {app.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        {app.state}
                      </div>
                    </div>
                    {app.employeeId && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg w-fit">
                        <Shield size={16} className="text-green-600" />
                        <span className="font-mono font-bold text-green-700">Employee ID: {app.employeeId}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {expandedApp === app.id ? (
                      <ChevronUp size={24} className="text-primary" />
                    ) : (
                      <ChevronDown size={24} className="text-gray" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedApp === app.id && (
                  <div className="border-t border-gray/30 p-6 bg-light/30 space-y-6">
                    {/* Contact Information */}
                    <div>
                      <h4 className="font-bold text-dark mb-4 flex items-center gap-2">
                        <Mail size={18} />
                        Contact Information
                      </h4>
                      <div className="space-y-2 text-sm ml-6">
                        <p>
                          <span className="font-semibold text-dark">Email:</span> {app.email}
                        </p>
                        <p>
                          <span className="font-semibold text-dark">Phone:</span> {app.phone}
                        </p>
                        <p>
                          <span className="font-semibold text-dark">State:</span> {app.state}
                        </p>
                        <p>
                          <span className="font-semibold text-dark">Submitted:</span>{' '}
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* ID Verification Image */}
                    {app.idImage && (
                      <div>
                        <h4 className="font-bold text-dark mb-4 flex items-center gap-2">
                          <ImageIcon size={18} />
                          ID Verification
                        </h4>
                        <div className="ml-6">
                          <div className="relative w-full max-w-md">
                            <img
                              src={app.idImage}
                              alt="ID Verification"
                              className="w-full h-auto border-2 border-gray/30 rounded-lg"
                            />
                            <div className="mt-3 flex gap-2">
                              <a
                                href={app.idImage}
                                download
                                className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded text-sm hover:bg-primary/80 transition"
                              >
                                <Download size={16} />
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Work Verification */}
                    <div>
                      <h4 className="font-bold text-dark mb-4 flex items-center gap-2">
                        <Shield size={18} />
                        Work Verification
                      </h4>
                      <div className="space-y-2 ml-6">
                        {app.workVerification && Object.entries(app.workVerification).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                value
                                  ? 'bg-green-500 border-green-600'
                                  : 'bg-gray/20 border-gray'
                              }`}
                            >
                              {value && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-sm text-dark">
                              {key === 'hasWorkRight' && 'Has valid work rights'}
                              {key === 'hasValidLicense' && 'Has valid license'}
                              {key === 'hasTransport' && 'Has transport'}
                              {key === 'hasEquipment' && 'Has equipment'}
                              {key === 'ageVerified' && 'Age verified (18+)'}
                            </span>
                          </div>
                        ))}
                        {!app.workVerification && (
                          <p className="text-sm text-gray italic">No verification data available</p>
                        )}
                      </div>
                    </div>

                    {/* Skills Assessment */}
                    <div>
                      <h4 className="font-bold text-dark mb-2 flex items-center gap-2">
                        <FileText size={18} />
                        Skills Assessment
                      </h4>
                      <p className="text-sm text-gray ml-6 whitespace-pre-wrap bg-white p-3 rounded border border-gray/30">
                        {app.skillsAssessment}
                      </p>
                    </div>

                    {/* Availability */}
                    {app.availability && Object.values(app.availability).some(v => v) && (
                      <div>
                        <h4 className="font-bold text-dark mb-2 flex items-center gap-2">
                          <Clock size={18} />
                          Availability
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-6">
                          {Object.entries(app.availability).map(([day, available]) =>
                            available && (
                              <div key={day} className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded">
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    {app.comments && (
                      <div>
                        <h4 className="font-bold text-dark mb-2">Additional Comments</h4>
                        <p className="text-sm text-gray ml-6 whitespace-pre-wrap bg-white p-3 rounded border border-gray/30">
                          {app.comments}
                        </p>
                      </div>
                    )}

                    {/* Verification Checklist (Only show if pending or under-review) */}
                    {(app.status === 'pending' || app.status === 'under-review') && (
                      <div className="border-t border-gray/30 pt-6">
                        <h4 className="font-bold text-dark mb-4 flex items-center gap-2">
                          <CheckCircle size={18} />
                          Verification Checklist
                        </h4>
                        <div className="space-y-3 ml-6">
                          {Object.entries(verificationChecklist).map(([item, checked]) => (
                            <label key={item} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleChecklistItem(item)}
                                className="w-5 h-5 cursor-pointer"
                              />
                              <span className="text-sm font-semibold text-dark">
                                {item === 'idVerified' && '✓ ID Verification Complete'}
                                {item === 'contactVerified' && '✓ Contact Information Verified'}
                                {item === 'workRightsVerified' && '✓ Work Rights Verified'}
                                {item === 'backgroundCheckPassed' && '✓ Background Check Passed'}
                                {item === 'documentsReviewed' && '✓ All Documents Reviewed'}
                              </span>
                            </label>
                          ))}
                        </div>

                        {/* Employee ID Generation */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign size={18} className="text-blue-600" />
                            <h5 className="font-bold text-blue-900">Employee ID</h5>
                          </div>
                          {employeeIdGenerated ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 bg-white p-3 rounded border-2 border-green-300">
                                <span className="font-mono font-bold text-green-700 text-lg">
                                  {generatedEmployeeId}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedEmployeeId)
                                  }}
                                  className="ml-auto text-sm text-green-600 hover:text-green-700 font-semibold"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="text-xs text-blue-700">
                                This ID will be assigned when the application is approved
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={generateEmployeeId}
                              className="w-full py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition text-sm"
                            >
                              Generate Employee ID
                            </button>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex gap-3">
                          <button
                            onClick={() => setShowApprovalModal(true)}
                            disabled={!allChecklistItemsComplete || actionLoading}
                            className={`flex-1 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                              allChecklistItemsComplete && !actionLoading
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray/30 text-gray cursor-not-allowed'
                            }`}
                          >
                            <CheckCircle size={18} />
                            {actionLoading ? 'Processing...' : 'Approve Application'}
                          </button>
                          <button
                            onClick={() => setShowRejectionModal(true)}
                            className="flex-1 py-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg font-bold hover:bg-red-100 transition"
                          >
                            <X size={18} className="inline mr-2" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Approved/Rejected Status */}
                    {(app.status === 'approved' || app.status === 'rejected') && (
                      <div className={`border-t border-gray/30 pt-6 p-4 rounded-lg ${
                        app.status === 'approved'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <h4 className={`font-bold mb-3 flex items-center gap-2 ${
                          app.status === 'approved' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {app.status === 'approved' ? (
                            <>
                              <CheckCircle size={18} />
                              Application Approved
                            </>
                          ) : (
                            <>
                              <X size={18} />
                              Application Rejected
                            </>
                          )}
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-semibold">Reviewed:</span>{' '}
                            {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : 'N/A'}
                          </p>
                          <p>
                            <span className="font-semibold">Reviewed by:</span> {app.reviewedBy || 'Admin'}
                          </p>
                          {app.status === 'rejected' && app.rejectionReason && (
                            <p>
                              <span className="font-semibold">Reason:</span> {app.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-dark mb-4 flex items-center gap-2">
                <CheckCircle size={24} className="text-green-600" />
                Confirm Approval
              </h3>
              <p className="text-gray mb-6">
                Are you sure you want to approve this application? The applicant will receive an approval email with their Employee ID.
              </p>
              {employeeIdGenerated && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-700 font-semibold">Employee ID:</p>
                  <p className="font-mono font-bold text-green-700">{generatedEmployeeId}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 py-2 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveApplication}
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-dark mb-4 flex items-center gap-2">
                <X size={24} className="text-red-600" />
                Reject Application
              </h3>
              <p className="text-gray mb-4">Provide a reason for rejection:</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Failed background check, Incomplete documentation, etc."
                className="w-full p-3 border-2 border-gray rounded-lg focus:border-primary outline-none mb-4 text-sm"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="flex-1 py-2 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectApplication}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  )
}
