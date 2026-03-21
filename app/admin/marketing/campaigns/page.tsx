'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Mail, Send, Calendar, Users, BarChart3, Plus, Edit2, Trash2 } from 'lucide-react'
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
}

export default function EmailCampaignsPage() {
  const router = useRouter()
  const { user, userData, loading: authLoading } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [campaignForm, setCampaignForm] = useState({
    campaignName: '',
    campaignType: 'promotional' as const,
    segments: ['customers'] as string[],
    templateKey: 'promotional_campaign',
    subject: '',
    message: '',
    ctaUrl: '',
    scheduleTime: '',
  })
  const templates = getEmailTemplates()

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Marketing] Not logged in, redirecting to login')
      router.push('/auth/login')
      return
    }
    if (!authLoading && user && !userData?.is_admin) {
      console.error('[Marketing] User is not admin. Current user:', user.email)
      router.push('/')
    }
  }, [user, authLoading, userData, router])

  useEffect(() => {
    if (user && userData?.is_admin) {
      fetchCampaigns()
    }
  }, [user, userData])

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray">Loading campaigns...</p>
      </div>
    )
  }

  if (!userData?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray">You don't have access to this page</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-dark mb-2">Email Marketing Campaigns</h1>
            <p className="text-gray">Create and manage email campaigns</p>
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
                    <th className="text-center py-3 px-4 font-semibold text-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
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
                              ? 'bg-green-100 text-green-700'
                              : campaign.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-700'
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
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center flex justify-center gap-2">
                        <button className="p-2 hover:bg-gray/20 rounded-lg transition">
                          <Edit2 size={18} className="text-gray" />
                        </button>
                        <button className="p-2 hover:bg-red-100 rounded-lg transition">
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
      <Footer />
    </div>
  )
}
