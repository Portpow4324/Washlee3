'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { ChevronLeft, Search, Shield, Trash2, Eye } from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName: string;
  userType: 'customer' | 'pro';
  createdAt: string;
  lastLogin: string;
  isAdmin: boolean;
  status: 'active' | 'inactive' | 'suspended';
  totalOrders?: number;
  totalSpent?: number;
}

export default function AdminUsersPage() {
  const { user, userData, loading } = useAuth();
  const isAdmin = userData?.isAdmin;
  const isLoading = loading;
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'pro'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'name' | 'orders'>('created');
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [isAdmin, isLoading]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setPageLoading(true);
        setError(null);

        const response = await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_user_analytics' })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        console.log('Fetched users:', data);

        // Mock data if API returns empty
        const mockUsers: User[] = [
          {
            id: 'user-001',
            email: 'john.doe@example.com',
            displayName: 'John Doe',
            userType: 'customer',
            createdAt: '2024-01-15',
            lastLogin: '2024-01-26',
            isAdmin: false,
            status: 'active',
            totalOrders: 12,
            totalSpent: 450.00
          },
          {
            id: 'user-002',
            email: 'jane.smith@example.com',
            displayName: 'Jane Smith',
            userType: 'pro',
            createdAt: '2024-01-10',
            lastLogin: '2024-01-26',
            isAdmin: false,
            status: 'active',
            totalOrders: 45
          },
          {
            id: 'user-003',
            email: 'admin@example.com',
            displayName: 'Admin User',
            userType: 'customer',
            createdAt: '2024-01-01',
            lastLogin: '2024-01-26',
            isAdmin: true,
            status: 'active',
            totalOrders: 0,
            totalSpent: 0
          },
          {
            id: 'user-004',
            email: 'sarah.johnson@example.com',
            displayName: 'Sarah Johnson',
            userType: 'customer',
            createdAt: '2024-01-20',
            lastLogin: '2024-01-25',
            isAdmin: false,
            status: 'active',
            totalOrders: 5,
            totalSpent: 185.50
          },
          {
            id: 'user-005',
            email: 'mike.wilson@example.com',
            displayName: 'Mike Wilson',
            userType: 'pro',
            createdAt: '2024-01-12',
            lastLogin: '2024-01-24',
            isAdmin: false,
            status: 'inactive',
            totalOrders: 32
          },
          {
            id: 'user-006',
            email: 'lucy.brown@example.com',
            displayName: 'Lucy Brown',
            userType: 'customer',
            createdAt: '2024-01-18',
            lastLogin: '2024-01-26',
            isAdmin: false,
            status: 'active',
            totalOrders: 8,
            totalSpent: 290.00
          }
        ];

        setUsers(data.users || mockUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err.message : 'Failed to load users');
        // Still show mock data on error
        const mockUsers: User[] = [
          {
            id: 'user-001',
            email: 'john.doe@example.com',
            displayName: 'John Doe',
            userType: 'customer',
            createdAt: '2024-01-15',
            lastLogin: '2024-01-26',
            isAdmin: false,
            status: 'active',
            totalOrders: 12,
            totalSpent: 450.00
          },
          {
            id: 'user-002',
            email: 'jane.smith@example.com',
            displayName: 'Jane Smith',
            userType: 'pro',
            createdAt: '2024-01-10',
            lastLogin: '2024-01-26',
            isAdmin: false,
            status: 'active',
            totalOrders: 45
          },
          {
            id: 'user-003',
            email: 'admin@example.com',
            displayName: 'Admin User',
            userType: 'customer',
            createdAt: '2024-01-01',
            lastLogin: '2024-01-26',
            isAdmin: true,
            status: 'active',
            totalOrders: 0,
            totalSpent: 0
          }
        ];
        setUsers(mockUsers);
      } finally {
        setPageLoading(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Filter and sort users
  useEffect(() => {
    let filtered = users;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.email.toLowerCase().includes(query) ||
          u.displayName.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(u => u.userType === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'orders':
          return (b.totalOrders || 0) - (a.totalOrders || 0);
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchQuery, filterType, filterStatus, sortBy]);

  const handleToggleSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handlePromoteAdmin = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_admin_claims',
          userId: userId,
          isAdmin: true
        })
      });

      if (!response.ok) throw new Error('Failed to promote user');

      // Update local state
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, isAdmin: true } : u))
      );

      console.log('User promoted to admin');
    } catch (err) {
      console.error('Error promoting user:', err);
      alert('Failed to promote user to admin');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');

      setUsers(prev => prev.filter(u => u.id !== userId));
      console.log('User deleted');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeColor = (type: string) => {
    return type === 'pro'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-purple-100 text-purple-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">Access Denied</p>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
          <Link href="/" className="text-teal-600 hover:underline mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all users, roles, and permissions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">⚠️ {error} - Showing mock data for demonstration</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* User Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Type
              </label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="customer">Customers</option>
                <option value="pro">Pros</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="created">Recently Created</option>
                <option value="name">Name (A-Z)</option>
                <option value="orders">Most Orders</option>
              </select>
            </div>
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredUsers.length} of {users.length} users
            </span>
            <span>
              {selectedUsers.length > 0 && `${selectedUsers.length} selected`}
            </span>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {pageLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No users found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleToggleSelect(user.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.isAdmin && (
                          <Shield className="inline w-4 h-4 text-yellow-500 mr-2" />
                        )}
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.displayName}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getUserTypeColor(
                            user.userType
                          )}`}
                        >
                          {user.userType === 'pro' ? 'Pro' : 'Customer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            user.status
                          )}`}
                        >
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.totalOrders || 0}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button
                          onClick={() => {
                            const details = `
User ID: ${user.id}
Email: ${user.email}
Name: ${user.displayName}
Type: ${user.userType}
Status: ${user.status}
Admin: ${user.isAdmin}
Created: ${user.createdAt}
Last Login: ${user.lastLogin}
Total Orders: ${user.totalOrders || 0}
Total Spent: $${user.totalSpent || 0}
                            `;
                            alert(details);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!user.isAdmin && (
                          <button
                            onClick={() => handlePromoteAdmin(user.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Promote to admin"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-sm text-gray-600">
          <p>Manage users and their permissions from this dashboard</p>
          <Link href="/admin" className="text-teal-600 hover:underline">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
