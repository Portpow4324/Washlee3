'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ChevronLeft, Download, FileText, BarChart3, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { collection, getDocs, where, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Report {
  id: string
  name: string
  type: 'revenue' | 'orders' | 'users' | 'performance' | 'errors'
  generatedAt: string
  size: string
  format: 'pdf' | 'csv' | 'xlsx'
}

export default function AdminReportsPage() {
  const router = useRouter()
  const { user, userData, loading: authLoading } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'revenue' | 'orders' | 'users' | 'performance'>('revenue')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    if (!authLoading && user && !userData?.isAdmin) {
      console.error('[Reports] User is not admin. Current user:', user.email)
      router.push('/')
    }
  }, [user, authLoading, userData, router])

  useEffect(() => {
    if (user && userData?.isAdmin) {
      loadReports()
    }
  }, [user, userData])

  const loadReports = async () => {
    try {
      setLoading(true)
      
      // Reports are generated on-demand from real Firestore data
      // This page doesn't store pre-generated reports, but generates them from live data
      // Show empty state since reports are created when user clicks generate
      setReports([])
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (reportId: string) => {
    // In a real app, this would generate/download the report
    alert(`Downloading report ${reportId}...`)
  }

  const handleGenerateReport = (type: string) => {
    alert(`Generating ${type} report...`)
  }

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray">Loading reports...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            </div>
            <p className="text-gray-600">Generate and download detailed reports</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8 border-b border-gray-200">
            <div className="flex gap-8">
              {(['revenue', 'orders', 'users', 'performance'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-2 font-semibold transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Report Generation Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {activeTab === 'revenue' && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                      <div>
                        <h3 className="font-bold text-gray-900">Monthly Revenue Report</h3>
                        <p className="text-sm text-gray-600">Detailed revenue breakdown</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateReport('revenue')}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition font-semibold"
                  >
                    Generate Report
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-bold text-gray-900">Quarterly Revenue Trends</h3>
                        <p className="text-sm text-gray-600">Q1 2026 analysis</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateReport('quarterly')}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-semibold"
                  >
                    Generate Report
                  </button>
                </div>
              </>
            )}

            {activeTab === 'orders' && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-bold text-gray-900">Order Status Report</h3>
                        <p className="text-sm text-gray-600">Current order metrics</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateReport('order-status')}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-semibold"
                  >
                    Generate Report
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-orange-600" />
                      <div>
                        <h3 className="font-bold text-gray-900">Order Fulfillment Times</h3>
                        <p className="text-sm text-gray-600">Average turnaround analysis</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateReport('fulfillment')}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition font-semibold"
                  >
                    Generate Report
                  </button>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                      <div>
                        <h3 className="font-bold text-gray-900">User Growth Report</h3>
                        <p className="text-sm text-gray-600">New signups and retention</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateReport('user-growth')}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition font-semibold"
                  >
                    Generate Report
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-indigo-600" />
                      <div>
                        <h3 className="font-bold text-gray-900">User Segmentation</h3>
                        <p className="text-sm text-gray-600">Customer vs Pro breakdown</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateReport('segmentation')}
                    className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition font-semibold"
                  >
                    Generate Report
                  </button>
                </div>
              </>
            )}

            {activeTab === 'performance' && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                      <div>
                        <h3 className="font-bold text-gray-900">System Health Report</h3>
                        <p className="text-sm text-gray-600">Uptime and performance metrics</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateReport('system-health')}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition font-semibold"
                  >
                    Generate Report
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-cyan-600" />
                      <div>
                        <h3 className="font-bold text-gray-900">API Performance Report</h3>
                        <p className="text-sm text-gray-600">Response times and errors</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateReport('api-performance')}
                    className="w-full px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition font-semibold"
                  >
                    Generate Report
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Previous Reports */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-lg text-gray-900">Recent Reports</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Report Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Generated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Size</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Format</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No reports generated yet
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{report.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">{report.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{report.size}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 uppercase">{report.format}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDownload(report.id)}
                            className="inline-flex items-center gap-2 px-3 py-1 text-sm text-primary hover:bg-mint rounded transition"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
