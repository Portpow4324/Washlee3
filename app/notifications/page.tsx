'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  Bell,
  Check,
  Trash2,
  Archive,
  AlertCircle,
  Gift,
  Star,
  Clock,
  Inbox,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface NotificationItem {
  id: string
  title: string
  body: string
  type: 'order_update' | 'promo' | 'points' | 'alert' | 'system'
  read: boolean
  archived: boolean
  created_at: string
  data?: unknown
}

type FilterId = 'all' | 'unread' | 'archived'

const TYPE_ICON: Record<string, { icon: typeof Bell; bg: string; fg: string }> = {
  order_update: { icon: Clock, bg: 'bg-blue-100', fg: 'text-blue-700' },
  promo: { icon: Gift, bg: 'bg-pink-100', fg: 'text-pink-700' },
  points: { icon: Star, bg: 'bg-mint', fg: 'text-primary-deep' },
  alert: { icon: AlertCircle, bg: 'bg-amber-100', fg: 'text-amber-800' },
  system: { icon: Bell, bg: 'bg-line', fg: 'text-gray' },
}

function formatTime(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterId>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/notifications')
    }
  }, [user, authLoading, router])

  const loadNotifications = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/notifications?userId=${user.id}`)
      const result = await response.json()
      setNotifications(result.data || [])
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    loadNotifications()

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, loadNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', notificationId }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleArchive = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', notificationId }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, archived: true } : n))
      )
    } catch (error) {
      console.error('Error archiving:', error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', notificationId }),
      })
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read && !n.archived
    if (filter === 'archived') return n.archived
    return !n.archived
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-soft-mint flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Loading notifications…</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read && !n.archived).length
  const inboxCount = notifications.filter((n) => !n.archived).length

  return (
    <div className="min-h-screen bg-soft-mint flex flex-col">
      <Header />
      <main className="flex-1 container-page py-10">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-1">Notifications</h1>
            <p className="text-gray text-sm">Order updates, Wash Club news, and reminders.</p>
          </div>
          <div className="inline-flex items-center gap-2 surface-card px-4 py-2 text-xs font-semibold text-gray">
            <Bell size={14} className="text-primary-deep" />
            {unreadCount} unread
          </div>
        </div>

        <div role="tablist" className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'all' as const, label: `Inbox (${inboxCount})` },
            { id: 'unread' as const, label: `Unread (${unreadCount})` },
            { id: 'archived' as const, label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === tab.id
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white text-dark border border-line hover:border-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="surface-card p-10 sm:p-14 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint mb-4">
              <Inbox size={20} className="text-primary-deep" />
            </div>
            <h2 className="text-lg font-bold text-dark mb-1">All caught up</h2>
            <p className="text-sm text-gray">Nothing here right now — we&rsquo;ll ping you when something happens.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredNotifications.map((notification) => {
              const meta = TYPE_ICON[notification.type] ?? TYPE_ICON.system
              const Icon = meta.icon
              return (
                <li
                  key={notification.id}
                  className={`surface-card p-5 ${
                    !notification.read ? 'border-primary/30 bg-mint/30' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                      <Icon size={18} className={meta.fg} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-semibold text-dark truncate">{notification.title}</h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray leading-relaxed">{notification.body}</p>
                      {notification.created_at && (
                        <p className="text-xs text-gray-soft mt-2">{formatTime(notification.created_at)}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-mint text-primary-deep hover:bg-primary hover:text-white transition"
                          >
                            <Check size={12} />
                            Mark as read
                          </button>
                        )}
                        {!notification.archived && (
                          <button
                            type="button"
                            onClick={() => handleArchive(notification.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-line text-gray hover:bg-light transition"
                          >
                            <Archive size={12} />
                            Archive
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(notification.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 transition"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
