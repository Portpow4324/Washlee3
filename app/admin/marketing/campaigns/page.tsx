'use client'

import { useState, useEffect } from 'react'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Mail, Send, Calendar, BarChart3, Plus, ArrowLeft, Pencil, Trash2, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getEmailTemplates } from '@/lib/resend-email'

interface Campaign {
  id: string
  campaignName: string
  campaignType: 'promotional' | 'transactional' | 'newsletter' | 'winback'
  segments: string[]
  status: 'scheduled' | 'sent' | 'draft'
  sentCount: number
  openCount: number
  clickCount: number
  createdAt: string
  scheduledFor?: string
  subject?: string
  message?: string
  ctaUrl?: string
  templateKey?: string
}

interface CampaignFormState {
  campaignName: string
  campaignType: Campaign['campaignType']
  segments: string[]
  templateKey: string
  subject: string
  message: string
  ctaUrl: string
  scheduleTime: string
}

export default function EmailCampaignsPage() {
  const { hasAdminAccess, checkingAdminAccess } = useRequireAdminAccess()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>({
    campaignName: '',
    campaignType: 'promotional',
    segments: ['customers'],
    templateKey: 'promotional_campaign',
    subject: '',
    message: '',
    ctaUrl: '',
    scheduleTime: '',
  })
  const templates = getEmailTemplates()
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [editForm, setEditForm] = useState<CampaignFormState | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (hasAdminAccess) {
      fetchCampaigns()
    }
  }, [hasAdminAccess])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/marketing/campaigns/list')
      if (!response.ok) throw new Error('Failed to load campaigns')
      
      const data = await response.json()
      // Convert ISO strings back to Date objects for display
      const campaigns = data.campaigns.map((c: any) => ({
        ...c,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        scheduledFor: c.scheduledFor ? new Date(c.scheduledFor) : undefined,
      }))
      setCampaigns(campaigns)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!campaignForm.campaignName || !campaignForm.subject) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/marketing/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm),
      })

      if (!response.ok) throw new Error('Failed to create campaign')

      const result = await response.json()
      alert(`Campaign ${campaignForm.campaignType === 'promotional' ? 'created' : 'sent'} successfully!`)

      // Reset form
      setCampaignForm({
        campaignName: '',
        campaignType: 'promotional',
        segments: ['customers'],
        templateKey: 'promotional_campaign',
        subject: '',
        message: '',
        ctaUrl: '',
        scheduleTime: '',
      })
      setShowNewCampaign(false)
      fetchCampaigns()
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating campaign')
    }
  }

  const openEdit = (campaign: Campaign) => {
    setEditError(null)
    setEditingCampaign(campaign)
    setEditForm({
      campaignName: campaign.campaignName,
      campaignType: campaign.campaignType,
      segments: campaign.segments?.length ? campaign.segments : ['customers'],
      templateKey: campaign.templateKey || 'promotional_campaign',
      subject: campaign.subject || '',
      message: campaign.message || '',
      ctaUrl: campaign.ctaUrl || '',
      scheduleTime: campaign.scheduledFor
        ? new Date(campaign.scheduledFor).toISOString().slice(0, 16)
        : '',
    })
  }

  const closeEdit = () => {
    setEditingCampaign(null)
    setEditForm(null)
    setEditError(null)
  }

  const saveEdit = async () => {
    if (!editingCampaign || !editForm) return
    if (!editForm.campaignName.trim() || !editForm.subject.trim()) {
      setEditError('Campaign name and subject are required.')
      return
    }
    setEditSaving(true)
    setEditError(null)
    try {
      const response = await fetch(`/api/marketing/campaigns?id=${encodeURIComponent(editingCampaign.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (response.status === 503) {
        throw new Error(
          'Campaign editing needs the latest Supabase migration before changes can persist.'
        )
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save changes.')
      }
      closeEdit()
      fetchCampaigns()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setEditSaving(false)
    }
  }

  const openDelete = (campaign: Campaign) => {
    setDeleteError(null)
    setDeleteConfirmText('')
    setDeleteCampaign(campaign)
  }

  const closeDelete = () => {
    setDeleteCampaign(null)
    setDeleteConfirmText('')
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!deleteCampaign) return
    if (deleteConfirmText !== deleteCampaign.campaignName) {
      setDeleteError('Type the campaign name exactly to confirm deletion.')
      return
    }
    setDeleteSaving(true)
    setDeleteError(null)
    try {
      const response = await fetch(`/api/marketing/campaigns?id=${encodeURIComponent(deleteCampaign.id)}`, {
        method: 'DELETE',
      })
      if (response.status === 503) {
        throw new Error(
          'Campaign deletion needs the latest Supabase migration before changes can persist.'
        )
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete campaign.')
      }
      closeDelete()
      fetchCampaigns()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete campaign.')
    } finally {
      setDeleteSaving(false)
    }
  }

  if (checkingAdminAccess || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3 text-gray-600">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Loading campaigns…</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-3 hover:text-primary"
        >
          <ArrowLeft size={14} />
          Control center
        </Link>
        <div className="flex justify-between items-start mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-1">Email campaigns</h1>
            <p className="text-sm text-gray-600">Create, schedule, and review marketing emails sent through Resend.</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowNewCampaign(!showNewCampaign)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            New Campaign
          </Button>
        </div>

        {/* Campaign Form */}
        {showNewCampaign && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-dark mb-6">Create New Campaign</h2>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    value={campaignForm.campaignName}
                    onChange={(e) =>
                      setCampaignForm({ ...campaignForm, campaignName: e.target.value })
                    }
                    placeholder="e.g., Holiday Promo, Welcome Series"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Campaign Type *</label>
                  <select
                    value={campaignForm.campaignType}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        campaignType: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  >
                    <option value="promotional">Promotional</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="transactional">Transactional</option>
                    <option value="winback">Win-back</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Email Subject *</label>
                  <input
                    type="text"
                    required
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    placeholder="Subject line"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Email Template</label>
                  <select
                    value={campaignForm.templateKey}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        templateKey: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  >
                    {Object.entries(templates).map(([key, template]) => (
                      <option key={key} value={key}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Target Segments</label>
                  <div className="flex gap-2">
                    {['customers', 'pros', 'new_users', 'inactive_users'].map((segment) => (
                      <label key={segment} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={campaignForm.segments.includes(segment)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCampaignForm({
                                ...campaignForm,
                                segments: [...campaignForm.segments, segment],
                              })
                            } else {
                              setCampaignForm({
                                ...campaignForm,
                                segments: campaignForm.segments.filter((s) => s !== segment),
                              })
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-dark capitalize">{segment}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Schedule Send (Optional)</label>
                  <input
                    type="datetime-local"
                    value={campaignForm.scheduleTime}
                    onChange={(e) => setCampaignForm({ ...campaignForm, scheduleTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Message *</label>
                <textarea
                  required
                  value={campaignForm.message}
                  onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                  rows={4}
                  placeholder="Campaign message (use HTML)"
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Call-to-Action URL</label>
                <input
                  type="url"
                  value={campaignForm.ctaUrl}
                  onChange={(e) => setCampaignForm({ ...campaignForm, ctaUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="primary" size="md" type="submit">
                  {campaignForm.scheduleTime ? 'Schedule Campaign' : 'Send Campaign'}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => setShowNewCampaign(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray text-sm mb-1">Total Campaigns</p>
                <p className="text-3xl font-bold text-dark">{campaigns.length}</p>
              </div>
              <Mail size={32} className="text-primary/20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray text-sm mb-1">Total Sent</p>
                <p className="text-3xl font-bold text-dark">
                  {campaigns.reduce((sum, c) => sum + c.sentCount, 0).toLocaleString()}
                </p>
              </div>
              <Send size={32} className="text-primary/20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray text-sm mb-1">Avg. Open Rate</p>
                <p className="text-3xl font-bold text-dark">
                  {campaigns.length > 0
                    ? (
                        (campaigns.reduce((sum, c) => sum + c.openCount, 0) /
                          campaigns.reduce((sum, c) => sum + (c.sentCount || 1), 1)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <BarChart3 size={32} className="text-primary/20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray text-sm mb-1">Scheduled</p>
                <p className="text-3xl font-bold text-dark">
                  {campaigns.filter((c) => c.status === 'scheduled').length}
                </p>
              </div>
              <Calendar size={32} className="text-primary/20" />
            </div>
          </Card>
        </div>

        {/* Campaigns List */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-dark mb-4">Recent Campaigns</h2>
          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray/20">
                    <th className="text-left py-3 px-4 font-semibold text-dark">Campaign Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-dark">Type</th>
                    <th className="text-center py-3 px-4 font-semibold text-dark">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-dark">Sent</th>
                    <th className="text-right py-3 px-4 font-semibold text-dark">Opens</th>
                    <th className="text-right py-3 px-4 font-semibold text-dark">Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const isLocked = campaign.status === 'sent'
                    return (
                      <tr key={campaign.id} className="border-b border-gray/10 hover:bg-gray/5 transition">
                        <td className="py-3 px-4 text-dark font-semibold">{campaign.campaignName}</td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                            {campaign.campaignType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              campaign.status === 'sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : campaign.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-dark font-semibold">{campaign.sentCount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray">
                          {campaign.sentCount > 0
                            ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1)
                            : 0}
                          %
                        </td>
                        <td className="py-3 px-4 text-right text-gray text-sm">
                          {new Date(campaign.createdAt).toLocaleDateString('en-AU')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(campaign)}
                              disabled={isLocked}
                              title={isLocked ? 'Sent campaigns are read-only' : 'Edit campaign'}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-line text-dark hover:border-primary hover:text-primary-deep transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openDelete(campaign)}
                              title="Delete campaign"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 transition"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail size={48} className="mx-auto text-gray/30 mb-2" />
              <p className="text-gray">No campaigns yet. Create your first campaign!</p>
            </div>
          )}
        </Card>
      </main>

      {/* Edit drawer */}
      {editingCampaign && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-stretch sm:items-center justify-end sm:justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Edit campaign</h2>
                <p className="text-xs text-gray-500 font-mono">{editingCampaign.id}</p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close edit"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-semibold text-dark mb-2">Campaign name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editForm.campaignName}
                    onChange={(e) => setEditForm({ ...editForm, campaignName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="edit-type" className="block text-sm font-semibold text-dark mb-2">Type</label>
                  <select
                    id="edit-type"
                    value={editForm.campaignType}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        campaignType: e.target.value as Campaign['campaignType'],
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  >
                    <option value="promotional">Promotional</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="transactional">Transactional</option>
                    <option value="winback">Win-back</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-subject" className="block text-sm font-semibold text-dark mb-2">Email subject</label>
                  <input
                    id="edit-subject"
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="edit-template" className="block text-sm font-semibold text-dark mb-2">Email template</label>
                  <select
                    id="edit-template"
                    value={editForm.templateKey}
                    onChange={(e) => setEditForm({ ...editForm, templateKey: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  >
                    {Object.entries(templates).map(([key, template]) => (
                      <option key={key} value={key}>{template.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-dark mb-2">Target segments</label>
                  <div className="flex flex-wrap gap-3">
                    {['customers', 'pros', 'new_users', 'inactive_users'].map((segment) => (
                      <label key={segment} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.segments.includes(segment)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditForm({
                                ...editForm,
                                segments: [...editForm.segments, segment],
                              })
                            } else {
                              setEditForm({
                                ...editForm,
                                segments: editForm.segments.filter((s) => s !== segment),
                              })
                            }
                          }}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm text-dark capitalize">{segment.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-schedule" className="block text-sm font-semibold text-dark mb-2">Scheduled send</label>
                  <input
                    id="edit-schedule"
                    type="datetime-local"
                    value={editForm.scheduleTime}
                    onChange={(e) => setEditForm({ ...editForm, scheduleTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="edit-cta" className="block text-sm font-semibold text-dark mb-2">CTA URL</label>
                  <input
                    id="edit-cta"
                    type="url"
                    value={editForm.ctaUrl}
                    onChange={(e) => setEditForm({ ...editForm, ctaUrl: e.target.value })}
                    placeholder="https://…"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-message" className="block text-sm font-semibold text-dark mb-2">Message</label>
                <textarea
                  id="edit-message"
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary font-mono text-sm"
                />
              </div>

              {editError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800 flex gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={closeEdit}
                disabled={editSaving}
                className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-semibold border border-line text-dark hover:bg-light transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={editSaving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white bg-primary hover:bg-primary-deep transition disabled:opacity-60"
              >
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-950">Delete campaign</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  This permanently removes <span className="font-semibold text-dark">{deleteCampaign.campaignName}</span> and its analytics. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 mb-4 flex gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                Deleting a campaign archives it from the active list. This action is protected because
                historical campaign reporting may depend on the record.
              </span>
            </div>

            <label htmlFor="delete-confirm" className="block text-sm font-semibold text-dark mb-2">
              Type <span className="font-mono">{deleteCampaign.campaignName}</span> to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteCampaign.campaignName}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-red-400 mb-4"
            />

            {deleteError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800 mb-4 flex gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleteSaving}
                className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-semibold border border-line text-dark hover:bg-light transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteSaving || deleteConfirmText !== deleteCampaign.campaignName}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteSaving ? 'Deleting…' : 'Delete campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
