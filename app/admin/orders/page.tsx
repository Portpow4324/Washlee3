'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { ChevronLeft, Search, Eye, Trash2, Package } from 'lucide-react';

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  proId?: string;
  proName?: string;
  status: 'pending' | 'accepted' | 'collecting' | 'washing' | 'delivering' | 'completed' | 'cancelled';
  items: { type: string; quantity: number; instructions?: string }[];
  pickupDate: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  pricing: {
    subtotal: number;
    tax: number;
    total: number;
  };
  specialInstructions?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
  };
  paymentStatus: 'pending' | 'completed' | 'failed';
  feedback?: {
    rating: number;
    review: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminOrdersPage() {
  const { user, userData, loading } = useAuth();
  const isAdmin = userData?.isAdmin;
  const isLoading = loading;
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status'>('date');
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [isAdmin, isLoading]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setPageLoading(true);
        setError(null);

        const response = await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_order_analytics' })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        console.log('Fetched orders:', data);

        // Mock data if API returns empty
        const mockOrders: Order[] = [
          {
            id: 'ORD-001',
            customerId: 'user-001',
            customerName: 'John Doe',
            customerEmail: 'john.doe@example.com',
            proId: 'user-002',
            proName: 'Jane Smith',
            status: 'completed',
            items: [
              { type: 'regular-wash', quantity: 5, instructions: 'Cold water only' }
            ],
            pickupDate: '2024-01-24',
            estimatedDelivery: '2024-01-26',
            actualDelivery: '2024-01-26',
            pricing: { subtotal: 45.00, tax: 4.50, total: 49.50 },
            address: { street: '123 Main St', city: 'Sydney', state: 'NSW', postcode: '2000' },
            paymentStatus: 'completed',
            feedback: { rating: 5, review: 'Excellent service!' },
            createdAt: '2024-01-24',
            updatedAt: '2024-01-26'
          },
          {
            id: 'ORD-002',
            customerId: 'user-004',
            customerName: 'Sarah Johnson',
            customerEmail: 'sarah.johnson@example.com',
            proId: 'user-002',
            proName: 'Jane Smith',
            status: 'delivering',
            items: [
              { type: 'delicate-wash', quantity: 3 },
              { type: 'comforter', quantity: 1 }
            ],
            pickupDate: '2024-01-26',
            estimatedDelivery: '2024-01-27',
            pricing: { subtotal: 65.00, tax: 6.50, total: 71.50 },
            address: { street: '456 Oak Ave', city: 'Melbourne', state: 'VIC', postcode: '3000' },
            paymentStatus: 'completed',
            createdAt: '2024-01-26',
            updatedAt: '2024-01-26'
          },
          {
            id: 'ORD-003',
            customerId: 'user-001',
            customerName: 'John Doe',
            customerEmail: 'john.doe@example.com',
            status: 'pending',
            items: [
              { type: 'regular-wash', quantity: 8 }
            ],
            pickupDate: '2024-01-27',
            estimatedDelivery: '2024-01-28',
            pricing: { subtotal: 55.00, tax: 5.50, total: 60.50 },
            address: { street: '123 Main St', city: 'Sydney', state: 'NSW', postcode: '2000' },
            paymentStatus: 'pending',
            createdAt: '2024-01-26',
            updatedAt: '2024-01-26'
          },
          {
            id: 'ORD-004',
            customerId: 'user-006',
            customerName: 'Lucy Brown',
            customerEmail: 'lucy.brown@example.com',
            proId: 'user-005',
            proName: 'Mike Wilson',
            status: 'accepted',
            items: [
              { type: 'regular-wash', quantity: 6 }
            ],
            pickupDate: '2024-01-25',
            estimatedDelivery: '2024-01-27',
            pricing: { subtotal: 52.00, tax: 5.20, total: 57.20 },
            address: { street: '789 Pine Rd', city: 'Brisbane', state: 'QLD', postcode: '4000' },
            paymentStatus: 'completed',
            createdAt: '2024-01-25',
            updatedAt: '2024-01-26'
          },
          {
            id: 'ORD-005',
            customerId: 'user-004',
            customerName: 'Sarah Johnson',
            customerEmail: 'sarah.johnson@example.com',
            status: 'cancelled',
            items: [
              { type: 'regular-wash', quantity: 4 }
            ],
            pickupDate: '2024-01-26',
            estimatedDelivery: '2024-01-28',
            pricing: { subtotal: 35.00, tax: 3.50, total: 38.50 },
            address: { street: '456 Oak Ave', city: 'Melbourne', state: 'VIC', postcode: '3000' },
            paymentStatus: 'failed',
            createdAt: '2024-01-26',
            updatedAt: '2024-01-26'
          }
        ];

        setOrders(data.orders || mockOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load orders');
        // Still show mock data on error
        const mockOrders: Order[] = [
          {
            id: 'ORD-001',
            customerId: 'user-001',
            customerName: 'John Doe',
            customerEmail: 'john.doe@example.com',
            proId: 'user-002',
            proName: 'Jane Smith',
            status: 'completed',
            items: [{ type: 'regular-wash', quantity: 5 }],
            pickupDate: '2024-01-24',
            estimatedDelivery: '2024-01-26',
            actualDelivery: '2024-01-26',
            pricing: { subtotal: 45.00, tax: 4.50, total: 49.50 },
            address: { street: '123 Main St', city: 'Sydney', state: 'NSW', postcode: '2000' },
            paymentStatus: 'completed',
            createdAt: '2024-01-24',
            updatedAt: '2024-01-26'
          }
        ];
        setOrders(mockOrders);
      } finally {
        setPageLoading(false);
      }
    };

    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  // Filter and sort orders
  useEffect(() => {
    let filtered = orders;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        o =>
          o.id.toLowerCase().includes(query) ||
          o.customerEmail.toLowerCase().includes(query) ||
          o.customerName.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(o => o.status === filterStatus);
    }

    // Filter by payment
    if (filterPayment !== 'all') {
      filtered = filtered.filter(o => o.paymentStatus === filterPayment);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'total':
          return b.pricing.total - a.pricing.total;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchQuery, filterStatus, filterPayment, sortBy]);

  const handleToggleSelect = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update order');

      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
      );

      console.log('Order updated');
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Failed to update order');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await handleUpdateStatus(orderId, 'cancelled');
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivering':
      case 'washing':
      case 'collecting':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-teal-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-1">Track and manage all orders</p>
            </div>
          </div>
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
                Search Orders
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID, email, or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="collecting">Collecting</option>
                <option value="washing">Washing</option>
                <option value="delivering">Delivering</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Payment Status</option>
                <option value="completed">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
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
                <option value="date">Newest First</option>
                <option value="total">Highest Total</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredOrders.length} of {orders.length} orders
            </span>
            <span>
              {selectedOrders.length > 0 && `${selectedOrders.length} selected`}
            </span>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {pageLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No orders found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Pro
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleToggleSelect(order.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900">{order.customerName}</div>
                        <div className="text-gray-500 text-xs">{order.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.proName || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={order.status}
                          onChange={e => handleUpdateStatus(order.id, e.target.value as Order['status'])}
                          className={`px-2 py-1 rounded text-xs font-medium border-0 ${getStatusColor(
                            order.status
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="collecting">Collecting</option>
                          <option value="washing">Washing</option>
                          <option value="delivering">Delivering</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() +
                            order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        ${order.pricing.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button
                          onClick={() => {
                            const details = `
Order ID: ${order.id}
Customer: ${order.customerName} (${order.customerEmail})
Pro: ${order.proName || 'Not assigned'}
Status: ${order.status}
Payment: ${order.paymentStatus}
Items: ${order.items.map(i => `${i.type} x${i.quantity}`).join(', ')}
Total: $${order.pricing.total}
Pickup: ${order.pickupDate}
Est. Delivery: ${order.estimatedDelivery}
Address: ${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.postcode}
                            `;
                            alert(details);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status !== 'cancelled' && order.status !== 'completed' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">Total Orders</div>
            <div className="text-3xl font-bold text-gray-900">{orders.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">Revenue</div>
            <div className="text-3xl font-bold text-gray-900">
              ${orders.reduce((sum, o) => sum + o.pricing.total, 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">Completed</div>
            <div className="text-3xl font-bold text-green-600">
              {orders.filter(o => o.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-2">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-sm text-gray-600">
          <p>Manage all orders from this dashboard</p>
          <Link href="/admin" className="text-teal-600 hover:underline">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
