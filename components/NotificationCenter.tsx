'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, Trash2 } from 'lucide-react'
import { Notification } from '@/lib/notificationService'

interface NotificationCenterProps {
  userId?: string
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true)
        const res = await fetch('/api/notifications/send')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
          setUnreadCount(data.filter((n: any) => !n.read).length)
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen || userId) {
      fetchNotifications()
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isOpen, userId])

  async function handleMarkRead(notificationId: string) {
    try {
      await fetch('/api/notifications/send', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          action: 'mark_read',
        }),
      })

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  async function handleDelete(notificationId: string) {
    try {
      await fetch('/api/notifications/send', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          action: 'delete',
        }),
      })

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  async function handleMarkAllRead() {
    try {
      for (const notif of notifications.filter(n => !n.read)) {
        await fetch('/api/notifications/send', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId: notif.id,
            action: 'mark_read',
          }),
        })
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_confirmed':
      case 'order_completed':
        return 'bg-green-50 border-green-200'
      case 'order_cancelled':
        return 'bg-red-50 border-red-200'
      case 'pro_assigned':
      case 'order_pickup':
      case 'order_delivery':
        return 'bg-blue-50 border-blue-200'
      case 'promotional':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_confirmed':
      case 'order_completed':
        return '✓'
      case 'order_cancelled':
        return '✕'
      case 'pro_assigned':
        return '👤'
      case 'order_pickup':
      case 'order_delivery':
        return '📍'
      case 'promotional':
        return '🎉'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-[#48C9B0] transition-colors"
        title="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Popup */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-gray-900"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 text-sm text-[#48C9B0] hover:bg-gray-50 border-b border-gray-200 font-semibold"
            >
              Mark all as read
            </button>
          )}

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading && !notifications.length ? (
              <div className="p-8 text-center text-gray-600">
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors ${
                    !notif.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-xl flex-shrink-0">
                      {getNotificationIcon(notif.event)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {notif.createdAt instanceof Date
                          ? notif.createdAt.toLocaleDateString()
                          : new Date((notif.createdAt as any).toMillis?.() || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="text-gray-400 hover:text-[#48C9B0] transition-colors p-1"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 text-center">
            <a href="/dashboard/notifications" className="text-sm text-[#48C9B0] hover:font-semibold transition-colors">
              View all notifications →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
