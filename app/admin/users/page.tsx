'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface User {
  id: string
  email: string
  name: string
  phone: string
  user_type: string
  is_admin: boolean
  is_employee: boolean
  profile_picture_url: string
  created_at: string
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/users', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok) {
        setError(`Failed to load users: ${result.error || response.statusText}`)
        return
      }

      const transformed: User[] = (result.users || []).map((item: any) => ({
        id: item.id,
        email: item.email,
        name: item.name || 'N/A',
        phone: item.phone || 'N/A',
        user_type: item.user_type || 'customer',
        is_admin: item.is_admin || false,
        is_employee: item.is_employee || false,
        profile_picture_url: item.profile_picture_url || '',
        created_at: item.created_at
      }))

      setUsers(transformed)
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filtered = users
    .filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType =
        filterType === 'all' ||
        (filterType === 'admin' && user.is_admin) ||
        (filterType === 'employee' && user.is_employee) ||
        (filterType === 'customer' && user.user_type === 'customer')
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const getUserTypeColor = (user: User) => {
    if (user.is_admin) return 'bg-red-100 text-red-700'
    if (user.is_employee) return 'bg-purple-100 text-purple-700'
    return 'bg-blue-100 text-blue-700'
  }

  const getUserTypeLabel = (user: User) => {
    if (user.is_admin) return 'Admin'
    if (user.is_employee) return 'Pro'
    return 'Customer'
  }

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-3 hover:text-primary"
          >
            <ArrowLeft size={14} />
            Control center
          </Link>
          <h1 className="text-3xl font-bold text-gray-950">Users</h1>
          <p className="text-sm text-gray-600 mt-1">
            Customers, Pros, and admins. Search by name or email and filter by role.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray/20 rounded-lg"
          >
            <option value="all">All Users</option>
            <option value="customer">Customers</option>
            <option value="employee">Pros</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
            className="px-4 py-2 border border-gray/20 rounded-lg"
          >
            <option value="date">Sort: Join Date</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-light border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-light">
                    <td className="px-6 py-4 text-sm font-medium text-dark">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-dark">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray">{user.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getUserTypeColor(user)}`}>
                        {getUserTypeLabel(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Total Users</p>
            <p className="text-3xl font-bold text-dark">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Customers</p>
            <p className="text-3xl font-bold">{users.filter(u => !u.is_admin && !u.is_employee).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Pros</p>
            <p className="text-3xl font-bold">{users.filter(u => u.is_employee).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Admins</p>
            <p className="text-3xl font-bold">{users.filter(u => u.is_admin).length}</p>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  )
}
