'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ChevronLeft, Search, MoreVertical, MessageCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface SupportTicket {
  id: string
  user_id: string
  email: string
  name: string
  phone: string
  inquiry_type: string
  message: string
  status: string
  submitted_at: string
  admin_notes?: string
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [adminNote, setAdminNote] = useState('')

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('inquiries')
        .select('*')
        .eq('type', 'customer_inquiry')
        .order('submitted_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      const transformed: SupportTicket[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        email: item.email,
        name: item.name,
        phone: item.phone,
        inquiry_type: item.inquiry_type || 'general',
        message: item.message || '',
        status: item.status,
        submitted_at: item.submitted_at,
        admin_notes: item.admin_notes
      }))

      setTickets(transformed)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error: updateError } = await supabase
        .from('inquiries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId)

      if (updateError) {
        alert(`Error: ${updateError.message}`)
        return
      }

      setTickets(prev =>
        prev.map(ticket =>
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      )
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const addAdminNote = async (ticketId: string) => {
    if (!adminNote.trim()) return

    try {
      const ticket = tickets.find(t => t.id === ticketId)
      if (!ticket) return

      const currentNotes = ticket.admin_notes ? ticket.admin_notes + '\n\n' : ''
      const newNotes =
        currentNotes + `[${new Date().toLocaleString()}] Admin: ${adminNote}`

      const { error: updateError } = await supabase
        .from('inquiries')
        .update({ admin_notes: newNotes, updated_at: new Date().toISOString() })
        .eq('id', ticketId)

      if (updateError) {
        alert(`Error: ${updateError.message}`)
        return
      }

      setTickets(prev =>
        prev.map(t =>
          t.id === ticketId ? { ...t, admin_notes: newNotes } : t
        )
      )
      setAdminNote('')
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'contacted':
        return 'bg-blue-100 text-blue-700'
      case 'resolved':
        return 'bg-green-100 text-green-700'
      case 'closed':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'billing':
        return '💳'
      case 'technical':
        return '⚙️'
      case 'service_issue':
        return '⚠️'
      case 'feedback':
        return '💬'
      default:
        return '❓'
    }
  }

  const filtered = tickets
    .filter(ticket => {
      const matchesSearch =
        ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.message.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
      const matchesType = filterType === 'all' || ticket.inquiry_type === filterType
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <div className="bg-white border-b border-gray/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-light rounded-lg transition"
            >
              <ChevronLeft size={24} className="text-dark" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-dark flex items-center gap-2">
                <MessageCircle size={32} className="text-primary" />
                Support Tickets
              </h1>
              <p className="text-gray text-sm">Manage customer inquiries and support requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray" />
            <input
              type="text"
              placeholder="Search by name, email, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="service_issue">Service Issue</option>
            <option value="feedback">Feedback</option>
            <option value="general">General</option>
          </select>
        </div>

        {/* Tickets */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray">
            <p>No support tickets found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow-sm border border-gray/10 hover:shadow-md transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(ticket.inquiry_type)}</span>
                        <h3 className="text-lg font-bold text-dark">{ticket.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray">
                        <div>
                          <span className="font-semibold">Email:</span> {ticket.email}
                        </div>
                        <div>
                          <span className="font-semibold">Phone:</span> {ticket.phone}
                        </div>
                        <div>
                          <span className="font-semibold">Type:</span> {ticket.inquiry_type}
                        </div>
                        <div>
                          <span className="font-semibold">Submitted:</span>{' '}
                          {new Date(ticket.submitted_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-light rounded-lg transition">
                      <MoreVertical size={18} className="text-gray" />
                    </button>
                  </div>

                  <div className="mb-4 p-4 bg-light rounded-lg border border-gray/10">
                    <p className="text-sm text-gray font-semibold mb-2">Message:</p>
                    <p className="text-sm text-dark">{ticket.message}</p>
                  </div>

                  {ticket.admin_notes && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 font-semibold mb-2">Admin Notes:</p>
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{ticket.admin_notes}</p>
                    </div>
                  )}

                  {selectedTicket?.id === ticket.id && (
                    <div className="mb-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Add a note for this ticket..."
                        className="w-full p-3 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => addAdminNote(ticket.id)}
                          className="px-4 py-2 bg-primary hover:bg-accent text-white rounded-lg font-semibold text-sm transition"
                        >
                          Save Note
                        </button>
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="px-4 py-2 border border-gray/20 text-dark rounded-lg font-semibold text-sm transition hover:bg-light"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {ticket.status !== 'resolved' && (
                      <>
                        {ticket.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(ticket.id, 'contacted')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition"
                          >
                            Mark as Contacted
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(ticket.id, 'resolved')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition"
                        >
                          Resolve
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                      className="px-4 py-2 border border-primary text-primary rounded-lg font-semibold text-sm transition hover:bg-mint"
                    >
                      {selectedTicket?.id === ticket.id ? 'Close Note' : 'Add Note'}
                    </button>
                    <button
                      onClick={() => updateStatus(ticket.id, 'closed')}
                      className="px-4 py-2 border border-gray/20 text-dark rounded-lg font-semibold text-sm transition hover:bg-light"
                    >
                      Close Ticket
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Total Tickets</p>
            <p className="text-3xl font-bold text-dark">{tickets.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {tickets.filter(t => t.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Resolved</p>
            <p className="text-3xl font-bold text-green-600">
              {tickets.filter(t => t.status === 'resolved').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Resolution Rate</p>
            <p className="text-3xl font-bold text-blue-600">
              {tickets.length > 0
                ? Math.round(
                    ((tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length / tickets.length) * 100)
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
