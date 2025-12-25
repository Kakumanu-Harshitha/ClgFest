import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import AuthContext from '../context/AuthContext';
import { 
  ClipboardList, 
  ShoppingCart, 
  Star, 
  IndianRupee, 
  Clock, 
  MapPin, 
  Calendar,
  Package,
  Tag,
  Heart,
  Bell,
  Filter,
  Search
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [favoriteStalls, setFavoriteStalls] = useState([]);
  const [quickStats, setQuickStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    favoriteStalls: 0,
    recentOrders: 0
  });
  const [activeTab, setActiveTab] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    status: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's orders
      const ordersResponse = await apiClient.get('/api/orders/myorders', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      const orders = ordersResponse.data;
      setAllOrders(orders);
      setRecentOrders(orders.slice(0, 5)); // Last 5 orders
      
      // Calculate quick stats
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // Find favorite stalls based on order frequency
      const stallCounts = {};
      orders.forEach(order => {
        const stallId = order.stall._id || order.stall;
        stallCounts[stallId] = (stallCounts[stallId] || 0) + 1;
      });
      
      // Get stall details for favorite stalls
      const favoriteStallIds = Object.entries(stallCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([stallId]) => stallId);
      
      const favoriteStallsDetails = [];
      for (const stallId of favoriteStallIds) {
        try {
          const stallResponse = await apiClient.get(`/api/stalls/${stallId}`);
          favoriteStallsDetails.push({ ...stallResponse.data, orderCount: stallCounts[stallId] });
        } catch (error) {
          console.error('Error fetching stall details:', error);
        }
      }
      
      setFavoriteStalls(favoriteStallsDetails);
      
      setQuickStats({
        totalOrders,
        totalSpent,
        favoriteStalls: favoriteStallsDetails.length,
        recentOrders: Math.min(5, orders.length)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = allOrders.filter(order => {
    const matchesDate = filters.dateRange === 'all' || 
      (filters.dateRange === 'today' && new Date(order.createdAt).toDateString() === new Date().toDateString()) ||
      (filters.dateRange === 'week' && new Date(order.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (filters.dateRange === 'month' && new Date(order.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    const matchesStatus = filters.status === 'all' || order.status.toLowerCase() === filters.status.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      order.stall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesDate && matchesStatus && matchesSearch;
  });

  const reorderOrder = async (order) => {
    try {
      // Add items from the order to cart
      // This would typically involve adding items to the cart context
      window.showToast('success', 'Items added to cart! Proceed to checkout.');
    } catch (error) {
      window.showToast('error', 'Failed to reorder items');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Login Required</h2>
        <p className="text-gray-600">Please login to access your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h1>
          <p className="text-gray-500">Your personalized dashboard</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
            <div className="flex items-center">
              <div className="bg-yellow-50 p-3 rounded-xl mr-4">
                <ClipboardList className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{quickStats.totalOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
            <div className="flex items-center">
              <div className="bg-green-50 p-3 rounded-xl mr-4">
                <IndianRupee className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{quickStats.totalSpent}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
            <div className="flex items-center">
              <div className="bg-red-50 p-3 rounded-xl mr-4">
                <Heart className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Favorite Stalls</p>
                <p className="text-2xl font-bold text-gray-900">{quickStats.favoriteStalls}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
            <div className="flex items-center">
              <div className="bg-blue-50 p-3 rounded-xl mr-4">
                <Clock className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Recent Orders</p>
                <p className="text-2xl font-bold text-gray-900">{quickStats.recentOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 mb-8 border-b border-gray-100 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('recent')}
            className={`pb-4 px-2 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'recent' 
                ? 'text-yellow-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Recent Orders
            {activeTab === 'recent' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 px-2 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'all' 
                ? 'text-yellow-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Orders
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-4 px-2 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'favorites' 
                ? 'text-yellow-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Favorite Stalls
            {activeTab === 'favorites' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-600"></div>
            )}
          </button>
        </div>

        {/* Recent Orders Section */}
        {activeTab === 'recent' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                <Package className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 mb-6">No recent orders yet. Start ordering!</p>
                <Link to="/stalls" className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-600 transition-colors">
                  Browse Stalls
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentOrders.map(order => (
                  <div key={order._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">{order.stall.name}</h3>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                        order.status === 'Confirmed' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'Ready' ? 'bg-green-50 text-green-700' :
                        order.status === 'Completed' ? 'bg-gray-50 text-gray-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <ul className="text-sm text-gray-600 space-y-1">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                          </li>
                        ))}
                        {order.items.length > 2 && (
                          <li className="text-gray-400 text-xs">+{order.items.length - 2} more items</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                      <span className="font-bold text-lg text-gray-900">₹{order.totalAmount}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => reorderOrder(order)}
                          className="text-xs font-bold text-yellow-600 hover:text-yellow-700 px-3 py-1.5 rounded-lg border border-yellow-100 hover:bg-yellow-50 transition-colors"
                        >
                          Reorder
                        </button>
                        <Link 
                          to={`/order-success/${order._id}`}
                          className="text-xs font-bold text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Orders Section */}
        {activeTab === 'all' && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-4 mb-8 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                />
              </div>
              
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-3">
                <Filter className="text-gray-400 mr-2" size={18} />
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  className="bg-transparent py-2 text-sm focus:outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-3">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="bg-transparent py-2 text-sm focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                <ClipboardList className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No orders found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <div key={order._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">{order.stall.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-400">ID: {order._id.substring(0, 8)}...</p>
                          <span className="text-gray-300 text-xs">•</span>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                          order.status === 'Confirmed' ? 'bg-blue-50 text-blue-700' :
                          order.status === 'Ready' ? 'bg-green-50 text-green-700' :
                          order.status === 'Completed' ? 'bg-gray-50 text-gray-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {order.status}
                        </span>
                        <p className="font-bold text-xl text-gray-900 mt-2">₹{order.totalAmount}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                      <h4 className="text-sm font-bold text-gray-700 mb-3">Order Summary</h4>
                      <ul className="space-y-2">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.quantity}x {item.name}</span>
                            <span className="font-medium text-gray-900">₹{item.price * item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => reorderOrder(order)}
                          className="bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold hover:bg-yellow-600 transition-colors"
                        >
                          Reorder Items
                        </button>
                        <Link 
                          to={`/order-success/${order._id}`}
                          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                      
                      {order.status === 'Completed' && (
                        <Link 
                          to={`/stalls/${order.stall._id}`}
                          className="text-yellow-600 font-bold hover:text-yellow-700 flex items-center transition-colors"
                        >
                          <Star size={18} className="mr-1.5" /> Rate Order
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorite Stalls Section */}
        {activeTab === 'favorites' && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Favorite Stalls</h2>
            
            {favoriteStalls.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                <Heart className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 mb-6">No favorite stalls yet. Start ordering to see your favorites!</p>
                <Link to="/stalls" className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-600 transition-colors">
                  Browse Stalls
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteStalls.map(stall => (
                  <div key={stall._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-44">
                      <img 
                        src={stall.image || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                        alt={stall.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-700 shadow-sm">
                        {stall.orderCount} ORDERS
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{stall.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          stall.isOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {stall.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{stall.description}</p>
                      <Link 
                        to={`/stalls/${stall._id}`}
                        className="w-full block text-center bg-yellow-500 text-black py-2.5 rounded-xl font-bold hover:bg-yellow-600 transition-colors"
                      >
                        Order Again
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;