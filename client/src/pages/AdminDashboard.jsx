import { useState, useEffect, useContext } from 'react';
import apiClient from '../api/axiosConfig';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Loader, 
    UserPlus, 
    Store, 
    BarChart2, 
    Settings, 
    MessageSquare, 
    Tag, 
    Trash2, 
    Upload,
    RefreshCw,
    Gift,
    Menu,
    X
} from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [analytics, setAnalytics] = useState(null);
    const [stalls, setStalls] = useState([]);
    const [offers, setOffers] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [feedbackStallFilter, setFeedbackStallFilter] = useState('');
    const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('');
    const [settings, setSettings] = useState({ upiId: '', upiQrImage: '', luckyDrawEnabled: false, luckyDrawStall: '', luckyDrawThreshold: 50 });
    const [allOrders, setAllOrders] = useState([]);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [tokenIdSearchTerm, setTokenIdSearchTerm] = useState('');

    // Lucky Draw States
    const [luckyDrawStall, setLuckyDrawStall] = useState('');
    const [luckyDrawParticipants, setLuckyDrawParticipants] = useState([]);
    const [luckyDrawHistory, setLuckyDrawHistory] = useState([]);

    // Feedback Reply State
    const [replyText, setReplyText] = useState({}); // Map of feedbackId -> text
    const [submittingReply, setSubmittingReply] = useState(null);

    // Form States
    const [newStall, setNewStall] = useState({ name: '', description: '', image: '', ownerId: '', phone: '' });
    const [newOffer, setNewOffer] = useState({ title: '', description: '', discountPercentage: '', couponCode: '', validUntil: '' });
    const [users, setUsers] = useState([]);
    const [creatingStall, setCreatingStall] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', phone: '', role: 'stall_owner' });
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
        } else {
            fetchAllData();
        }
    }, [user, navigate]);

    useEffect(() => {
        if (activeTab === 'stalls') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await apiClient.get('/api/users', config);
            setUsers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearchOrders = () => {
        // This function will be implemented in the next step to fetch orders based on search terms.
        console.log('Searching for customer:', customerSearchTerm, 'and token ID:', tokenIdSearchTerm);
        fetchAllData(); // Trigger data refetch with search terms
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const results = await Promise.allSettled([
                apiClient.get('/api/stalls/admin', config),
                apiClient.get('/api/orders/admin/analytics', config),
                apiClient.get('/api/offers'),
                apiClient.get('/api/feedback', config),
                apiClient.get('/api/settings'),
                apiClient.get('/api/orders/admin/all', { 
                    headers: config.headers,
                    params: {
                        customerName: customerSearchTerm,
                        tokenId: tokenIdSearchTerm ? tokenIdSearchTerm.replace(/[^0-9]/g, '') : ''
                    }
                }),
                apiClient.get('/api/luckydraw/settings', config),
                apiClient.get('/api/luckydraw/history', config)
            ]);
            const [stallsRes, analyticsRes, offersRes, feedbackRes, settingsRes, ordersRes, luckyDrawSettingsRes, luckyDrawHistoryRes] = results;
            if (stallsRes.status === 'fulfilled') setStalls(stallsRes.value.data);
            if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
            if (offersRes.status === 'fulfilled') {
                const o = offersRes.value.data || {};
                const combined = [ ...(o.globalOffers || []), ...(o.stallOffers || []) ];
                setOffers(combined);
            }
            if (feedbackRes.status === 'fulfilled') setFeedback(feedbackRes.value.data);
            if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value.data);
            if (ordersRes.status === 'fulfilled') setAllOrders(ordersRes.value.data);
            if (luckyDrawSettingsRes.status === 'fulfilled') {
                setSettings(prev => ({ ...prev, ...luckyDrawSettingsRes.value.data }));
            }
            if (luckyDrawHistoryRes.status === 'fulfilled') {
                setLuckyDrawHistory(luckyDrawHistoryRes.value.data);
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---

    const fetchLuckyDrawParticipants = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const params = {};
            if (luckyDrawStall) params.stallId = luckyDrawStall;
            
            const { data } = await apiClient.get('/api/orders/admin/luckydraw', { 
                headers: config.headers,
                params 
            });
            setLuckyDrawParticipants(data);
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Failed to fetch participants' });
        }
    };

    const toggleApproval = async (stallId, next) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.put(`/api/stalls/${stallId}/approve`, { isApproved: next }, config);
            fetchAllData();
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to update approval' });
        }
    };

    const handleFeedbackReply = async (feedbackId) => {
        if (!replyText[feedbackId]) return;
        setSubmittingReply(feedbackId);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.put(`/api/feedback/${feedbackId}/respond`, {
                response: replyText[feedbackId]
            }, config);
            
            // Update local state
            setFeedback(feedback.map(f => 
                f._id === feedbackId ? { ...f, response: replyText[feedbackId] } : f
            ));
            setReplyText({ ...replyText, [feedbackId]: '' });
        } catch {
            setToast({ type: 'error', message: 'Failed to send reply' });
        } finally {
            setSubmittingReply(null);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.put('/api/settings', settings, config);
            setToast({ type: 'success', message: 'Settings updated successfully' });
        } catch {
            setToast({ type: 'error', message: 'Failed to update settings' });
        }
    };

    const handleUpdateLuckyDrawSettings = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.put('/api/luckydraw/settings', {
                luckyDrawEnabled: settings.luckyDrawEnabled,
                luckyDrawStall: settings.luckyDrawStall,
                luckyDrawThreshold: settings.luckyDrawThreshold
            }, config);
            setToast({ type: 'success', message: 'Lucky draw settings updated successfully' });
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to update lucky draw settings' });
        }
    };

    const triggerLuckyDraw = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const response = await apiClient.post('/api/luckydraw/trigger', {}, config);
            setToast({ type: 'success', message: `Lucky draw triggered! Winner: ${response.data.draw.winner.name}` });
            // Refresh data
            fetchAllData();
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to trigger lucky draw' });
        }
    };

    const resetLuckyDrawCounter = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.post('/api/luckydraw/reset', {}, config);
            setToast({ type: 'success', message: 'Lucky draw counter reset successfully' });
            // Refresh data
            fetchAllData();
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to reset lucky draw counter' });
        }
    };

    const handleCreateOffer = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const payload = {
                title: newOffer.title,
                description: newOffer.description,
                discountPercentage: Number(newOffer.discountPercentage) || 0,
                couponCode: newOffer.couponCode,
                validUntil: newOffer.validUntil ? new Date(newOffer.validUntil) : undefined
            };
            await apiClient.post('/api/offers', payload, config);
            setToast({ type: 'success', message: 'Offer created!' });
            setNewOffer({ title: '', description: '', discountPercentage: '', couponCode: '', validUntil: '' });
            const { data } = await apiClient.get('/api/offers');
            const combined = [ ...(data.globalOffers || []), ...(data.stallOffers || []) ];
            setOffers(combined);
        } catch {
            setToast({ type: 'error', message: 'Failed to create offer' });
        }
    };

    const handleDeleteOffer = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.delete(`/api/offers/${id}`, config);
            setOffers(offers.filter(o => o._id !== id));
        } catch {
            setToast({ type: 'error', message: 'Failed to delete offer' });
        }
    };

    const handleCreateStall = async (e) => {
        e.preventDefault();
        if (!newStall.ownerId) {
            setToast({ type: 'error', message: 'Please select an owner' });
            return;
        }
        setCreatingStall(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.post('/api/stalls', newStall, config);
            setToast({ type: 'success', message: 'Stall created successfully' });
            setNewStall({ name: '', description: '', image: '', ownerId: '', phone: '' });
            fetchAllData();
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to create stall' });
        } finally {
            setCreatingStall(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await apiClient.post('/api/users', newUser, config);
            setToast({ type: 'success', message: 'User created successfully' });
            setUsers([...users, data]);
            setNewStall({ ...newStall, ownerId: data._id });
            setCreatingUser(false);
            setNewUser({ name: '', email: '', password: '', phone: '', role: 'stall_owner' });
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to create user' });
        }
    };

    const [actionLoading, setActionLoading] = useState({});

    const updatePaymentStatus = async (orderId, newStatus) => {
        try {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), payment: true } }));
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` } };
            const { data: updated } = await apiClient.put(`/api/orders/${orderId}/status`, { paymentStatus: newStatus }, config);
            
            setAllOrders(curr => curr.map(o => (o._id === orderId ? updated : o)));
            setToast({ type: 'success', message: 'Payment status updated successfully!' });
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Payment status update failed' });
        } finally {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), payment: false } }));
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), status: true } }));
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` } };
            const { data: updated } = await apiClient.put(`/api/orders/${orderId}/status`, { status: newStatus }, config);
            
            setAllOrders(curr => curr.map(o => (o._id === orderId ? updated : o)));
            setToast({ type: 'success', message: 'Order status updated successfully!' });
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Order status update failed' });
        } finally {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), status: false } }));
        }
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const AdminCard = ({ title, icon, onClick }) => (
        <div 
            onClick={onClick} 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer flex items-center space-x-4"
        >
            <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        </div>
    );

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Login Required</h2>
                <p className="text-gray-600">Please login as an admin to access the dashboard.</p>
            </div>
        );
    }
    if (user.role !== 'admin') {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Not Authorized</h2>
                <p className="text-gray-600">Only admins can access this page.</p>
            </div>
        );
    }
    if (loading) return <div className="flex justify-center mt-20"><Loader className="animate-spin text-indigo-600" size={48} /></div>;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-indigo-700 text-white rounded-md">
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-indigo-900 text-white p-6 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out md:flex md:flex-col`}>
                <h1 className="text-2xl font-bold mb-8">Fest Admin</h1>
                <nav className="space-y-4 flex-1">
                    <button onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'overview' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                        <BarChart2 size={20} /> <span>Overview</span>
                    </button>
                    <button onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'orders' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                        <BarChart2 size={20} /> <span>Orders</span>
                    </button>
                    <button onClick={() => { setActiveTab('stalls'); setIsSidebarOpen(false); }} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'stalls' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                        <Store size={20} /> <span>Stalls</span>
                    </button>
                    <button onClick={() => { setActiveTab('offers'); setIsSidebarOpen(false); }} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'offers' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                        <Tag size={20} /> <span>Offers</span>
                    </button>
                    <button onClick={() => { setActiveTab('feedback'); setIsSidebarOpen(false); }} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'feedback' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                        <MessageSquare size={20} /> <span>Feedback</span>
                    </button>
                    <button onClick={() => { setActiveTab('luckydraw'); setIsSidebarOpen(false); }} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'luckydraw' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                        <Gift size={20} /> <span>Lucky Draw</span>
                    </button>
                    <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'settings' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                        <Settings size={20} /> <span>Settings (QR)</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 capitalize">{activeTab}</h2>
                    <button onClick={fetchAllData} className="p-2 bg-white rounded-full shadow hover:bg-gray-50 text-indigo-600">
                        <RefreshCw size={20} />
                    </button>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AdminCard title="Orders" icon={<BarChart2 size={24} />} onClick={() => setActiveTab('orders')} />
                        <AdminCard title="Stalls" icon={<Store size={24} />} onClick={() => setActiveTab('stalls')} />
                        <AdminCard title="Offers" icon={<Tag size={24} />} onClick={() => setActiveTab('offers')} />
                        <AdminCard title="Feedback" icon={<MessageSquare size={24} />} onClick={() => setActiveTab('feedback')} />
                        <AdminCard title="Lucky Draw" icon={<Gift size={24} />} onClick={() => setActiveTab('luckydraw')} />
                        <AdminCard title="Settings (QR)" icon={<Settings size={24} />} onClick={() => setActiveTab('settings')} />
                    </div>
                )}

                {activeTab === 'overview' && analytics && (
                    <div className="space-y-8 mt-8">
                        <h3 className="text-2xl font-bold text-gray-800">Analytics Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
                                <p className="text-gray-500">Total Revenue</p>
                                <p className="text-3xl font-bold">₹{analytics.totalRevenue}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <p className="text-gray-500">Total Orders</p>
                                <p className="text-3xl font-bold">{analytics.totalOrders}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <p className="text-gray-500">Active Stalls</p>
                                <p className="text-3xl font-bold">{stalls.length}</p>
                </div>
                {toast && (
                    <div className="fixed top-4 right-4 z-50">
                        <div className={`toast-enter rounded-lg shadow-lg px-4 py-3 text-sm ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                            {toast.message}
                        </div>
                    </div>
                )}
            </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-xl font-bold mb-4">Orders by Status</h3>
                                <div className="space-y-4">
                                    {analytics.ordersByStatus.map(status => {
                                        const maxCount = Math.max(...analytics.ordersByStatus.map(s => s.count), 1);
                                        const percentage = (status.count / maxCount) * 100;
                                        return (
                                            <div key={status._id}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="capitalize font-medium text-gray-700">{status._id}</span>
                                                    <span className="font-bold text-indigo-600">{status.count}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                    <div 
                                                        className={`h-2.5 rounded-full ${
                                                            status._id === 'Pending' ? 'bg-yellow-500' :
                                                            status._id === 'Confirmed' ? 'bg-blue-500' :
                                                            status._id === 'Ready' ? 'bg-green-500' :
                                                            status._id === 'Completed' ? 'bg-gray-500' : 'bg-red-500'
                                                        }`} 
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-xl font-bold mb-4">Top Stalls (Revenue)</h3>
                                <ul className="space-y-3">
                                    {analytics.revenueByStall.map((stall, idx) => (
                                        <li key={idx} className="flex justify-between border-b pb-2">
                                            <span>{stall.stallName}</span>
                                            <span className="font-bold">₹{stall.total}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
                                
                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex justify-between items-center mb-6">
                                <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
                            <input
                                type="text"
                                placeholder="Search by Customer Name"
                                className="p-2 border border-gray-300 rounded-md w-full md:w-1/2"
                                value={customerSearchTerm}
                                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Search by Token ID"
                                className="p-2 border border-gray-300 rounded-md w-full md:w-1/4"
                                value={tokenIdSearchTerm}
                                onChange={(e) => setTokenIdSearchTerm(e.target.value)}
                            />
                            <button
                                onClick={handleSearchOrders}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition w-full md:w-auto"
                            >
                                Search Orders
                            </button>
                        </div>
                        <h3 className="text-xl font-bold">All Orders</h3>
                                <p className="text-gray-600">Total: {allOrders.length} orders</p>
                            </div>
                                            
                            {allOrders.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No orders found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {allOrders.map(order => (
                                        <div key={order._id} className="card-hover bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600 mb-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center space-x-3 mb-1">
                                                        <span className="text-2xl font-bold font-mono text-indigo-600">#{order.tokenNumber ?? '-'}</span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                                            order.status === 'Ready' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {order.status.toUpperCase()}
                                                        </span>
                                                        <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        <p>{order.orderType} Order • {order.paymentMethod}</p>
                                                        {order.pickupTime && (
                                                            <p className="font-bold text-indigo-600">Pickup: {new Date(order.pickupTime).toLocaleString()}</p>
                                                        )}
                                                        {order.transactionId && (
                                                            <p className="text-purple-600 font-mono text-xs">Trans ID: {order.transactionId}</p>
                                                        )}
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`text-xs font-bold ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                                                                Payment: {order.paymentStatus}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col space-y-2">
                                                    {order.paymentStatus === 'Pending' && (
                                                        <button
                                                            onClick={() => updatePaymentStatus(order._id, 'Paid')}
                                                            className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition"
                                                            disabled={actionLoading[order._id]?.payment}
                                                        >
                                                            {actionLoading[order._id]?.payment ? 'Verifying...' : 'Verify Payment'}
                                                        </button>
                                                    )}
                                                    {order.status === 'Pending' && order.paymentStatus === 'Paid' && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order._id, 'Confirmed')}
                                                            className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition"
                                                            disabled={actionLoading[order._id]?.status}
                                                        >
                                                            {actionLoading[order._id]?.status ? 'Confirming...' : 'Confirm Order'}
                                                        </button>
                                                    )}
                                                    {order.status === 'Confirmed' && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order._id, 'Ready')}
                                                            className="flex items-center px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition"
                                                            disabled={actionLoading[order._id]?.status}
                                                        >
                                                            {actionLoading[order._id]?.status ? 'Marking Ready...' : 'Mark Ready'}
                                                        </button>
                                                    )}
                                                    {order.status === 'Ready' && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order._id, 'Completed')}
                                                            className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition"
                                                            disabled={actionLoading[order._id]?.status}
                                                        >
                                                            {actionLoading[order._id]?.status ? 'Completing...' : 'Mark Completed'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                                            
                                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                                <h4 className="font-bold mb-2">Items</h4>
                                                <ul className="space-y-2">
                                                    {order.items.map((item, idx) => (
                                                        <li key={idx} className="flex justify-between">
                                                            <span>{item.quantity} x {item.name}</span>
                                                            <span className="font-mono">₹{item.price * item.quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="border-t mt-3 pt-2 flex justify-between font-bold">
                                                    <span>Total</span>
                                                    <span>₹{order.totalAmount}</span>
                                                </div>
                                            </div>
                                                            
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                <div className="font-semibold text-gray-700">Customer Name: <span className="font-normal text-gray-600">{order.user.name}</span></div>
                                                <div className="font-semibold text-gray-700">Phone Number: <span className="font-normal text-gray-600">{order.user.phone}</span></div>
                                                {order.user.email && (
                                                    <div className="font-semibold text-gray-700 md:col-span-2">Email: <span className="font-normal text-gray-600">{order.user.email}</span></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                                
                {/* Stalls Tab */}
                {activeTab === 'stalls' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-bold mb-4">Manage Stalls</h3>
                            <div className="space-y-4">
                                {stalls.map(stall => (
                                    <div key={stall._id} className="flex justify-between items-center border p-4 rounded hover:bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="font-bold text-lg">{stall.name}</p>
                                                <p className="text-gray-500 text-sm">{stall.description}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${stall.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {stall.isOpen ? 'OPEN' : 'CLOSED'}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${stall.isApproved ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {stall.isApproved ? 'APPROVED' : 'PENDING'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleApproval(stall._id, !stall.isApproved)}
                                                className={`px-3 py-1 rounded text-sm ${stall.isApproved ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                            >
                                                {stall.isApproved ? 'Disable' : 'Approve'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow h-fit">
                            <h3 className="text-xl font-bold mb-4">Add New Stall</h3>
                            <form onSubmit={handleCreateStall}>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Stall Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded" 
                                        value={newStall.name}
                                        onChange={e => setNewStall({ ...newStall, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Description</label>
                                    <textarea 
                                        className="w-full border p-2 rounded" 
                                        value={newStall.description}
                                        onChange={e => setNewStall({ ...newStall, description: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Image URL</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded" 
                                        placeholder="https://example.com/stall.jpg"
                                        value={newStall.image}
                                        onChange={e => setNewStall({ ...newStall, image: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Paste a publicly accessible image link. This image appears on the stall page.</p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Phone</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded" 
                                        value={newStall.phone}
                                        onChange={e => setNewStall({ ...newStall, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Owner</label>
                                    <select 
                                        className="w-full border p-2 rounded mb-2"
                                        value={newStall.ownerId}
                                        onChange={e => setNewStall({ ...newStall, ownerId: e.target.value })}
                                    >
                                        <option value="">Select Owner</option>
                                        {users.filter(u => u.role === 'stall_owner').map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={() => setCreatingUser(!creatingUser)}
                                        className="text-indigo-600 text-sm hover:underline"
                                    >
                                        + Create New Owner
                                    </button>
                                </div>

                                {creatingUser && (
                                    <div className="mb-4 bg-gray-50 p-4 rounded border">
                                        <h4 className="font-bold text-sm mb-2">New Owner Details</h4>
                                        <input 
                                            type="text" placeholder="Name" className="w-full border p-2 rounded mb-2 text-sm"
                                            value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        />
                                        <input 
                                            type="email" placeholder="Email" className="w-full border p-2 rounded mb-2 text-sm"
                                            value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        />
                                        <input 
                                            type="text" placeholder="Phone" className="w-full border p-2 rounded mb-2 text-sm"
                                            value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                        />
                                        <input 
                                            type="password" placeholder="Password" className="w-full border p-2 rounded mb-2 text-sm"
                                            value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleCreateUser}
                                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 w-full"
                                        >
                                            Create Owner
                                        </button>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={creatingStall}
                                    className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400"
                                >
                                    {creatingStall ? 'Creating...' : 'Create Stall'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Offers Tab */}
                {activeTab === 'offers' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {offers.length === 0 && (
                                <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                                    No offers published yet.
                                </div>
                            )}
                            {offers.map(offer => (
                                <div key={offer._id} className="bg-white p-6 rounded-lg shadow flex justify-between items-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-pink-500"></div>
                                    <div>
                                        <h3 className="text-xl font-bold">{offer.title}</h3>
                                        <p className="text-gray-600">{offer.description}</p>
                                        <div className="mt-2 flex space-x-4">
                                            <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-sm font-bold">Code: {offer.couponCode}</span>
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">{offer.discountPercentage}% OFF</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteOffer(offer._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow h-fit">
                            <h3 className="text-xl font-bold mb-4">Create Offer</h3>
                            <form onSubmit={handleCreateOffer}>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Title</label>
                                    <input 
                                        type="text" 
                                        value={newOffer.title} 
                                        onChange={e => setNewOffer({...newOffer, title: e.target.value})} 
                                        className="w-full border p-2 rounded" 
                                        required 
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Description</label>
                                    <textarea 
                                        value={newOffer.description} 
                                        onChange={e => setNewOffer({...newOffer, description: e.target.value})} 
                                        className="w-full border p-2 rounded" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Code</label>
                                        <input 
                                            type="text" 
                                            value={newOffer.couponCode} 
                                            onChange={e => setNewOffer({...newOffer, couponCode: e.target.value})} 
                                            className="w-full border p-2 rounded" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Discount (%)</label>
                                        <input 
                                            type="number" 
                                            value={newOffer.discountPercentage} 
                                            onChange={e => setNewOffer({...newOffer, discountPercentage: e.target.value})} 
                                            className="w-full border p-2 rounded" 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Valid Until</label>
                                    <input 
                                        type="date" 
                                        value={newOffer.validUntil} 
                                        onChange={e => setNewOffer({...newOffer, validUntil: e.target.value})} 
                                        className="w-full border p-2 rounded" 
                                    />
                                </div>
                                <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Publish Offer</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Feedback Tab */}
                {activeTab === 'feedback' && (
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-lg shadow flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-bold mb-1">Stall</label>
                                <select 
                                    value={feedbackStallFilter}
                                    onChange={e => setFeedbackStallFilter(e.target.value)}
                                    className="w-full border rounded p-2"
                                >
                                    <option value="">All</option>
                                    {[...new Set(feedback.map(f => f.stall?.name).filter(Boolean))].map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Rating</label>
                                <select 
                                    value={feedbackRatingFilter}
                                    onChange={e => setFeedbackRatingFilter(e.target.value)}
                                    className="border rounded p-2"
                                >
                                    <option value="">All</option>
                                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}★</option>)}
                                </select>
                            </div>
                            <button onClick={() => { setFeedbackStallFilter(''); setFeedbackRatingFilter(''); }} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">Clear</button>
                        </div>
                        {(feedback
                            .filter(f => !feedbackStallFilter || f.stall?.name === feedbackStallFilter)
                            .filter(f => !feedbackRatingFilter || String(f.rating) === String(feedbackRatingFilter))
                        ).map(item => (
                            <div key={item._id} className="bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-gray-700">{item.user?.name || 'Anonymous'}</span>
                                    <span className="text-xs text-gray-500">{item.stall?.name || 'Unknown Stall'}</span>
                                    <div className="flex text-yellow-500">
                                        {'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)}
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-2">{item.comment}</p>
                                
                                {item.response && (
                                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 border-l-4 border-indigo-500 mb-2">
                                        <span className="font-bold">Response:</span> {item.response}
                                    </div>
                                )}

                                {!item.response && (
                                    <div className="mt-4 flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Write a reply..." 
                                            className="flex-1 border p-2 rounded text-sm"
                                            value={replyText[item._id] || ''}
                                            onChange={e => setReplyText({ ...replyText, [item._id]: e.target.value })}
                                        />
                                        <button 
                                            onClick={() => handleFeedbackReply(item._id)}
                                            disabled={submittingReply === item._id || !replyText[item._id]}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:bg-gray-400"
                                        >
                                            Reply
                                        </button>
                                    </div>
                                )}
                                
                                <p className="text-xs text-gray-400 mt-2">{new Date(item.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Lucky Draw Tab */}
                {activeTab === 'luckydraw' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-bold mb-4 flex items-center"><Gift className="mr-2" /> Lucky Draw Preparation</h3>
                            <p className="text-gray-600 mb-6">Filter users who made purchases from specific stalls for the lucky draw.</p>
                            
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <select 
                                    className="border p-3 rounded flex-1"
                                    value={luckyDrawStall}
                                    onChange={e => setLuckyDrawStall(e.target.value)}
                                >
                                    <option value="">-- All Stalls --</option>
                                    {stalls.map(stall => (
                                        <option key={stall._id} value={stall._id}>{stall.name}</option>
                                    ))}
                                </select>
                                <button 
                                    onClick={fetchLuckyDrawParticipants}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 font-bold"
                                >
                                    Fetch Participants
                                </button>
                            </div>

                            {luckyDrawParticipants.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-lg">Eligible Users ({luckyDrawParticipants.length})</h4>
                                        <button 
                                            onClick={() => {
                                                const csv = luckyDrawParticipants.map(u => `${u.name},${u.phone},${u.email}`).join('\n');
                                                navigator.clipboard.writeText(csv);
                                                setToast({ type: 'success', message: 'Copied to clipboard!' });
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-bold"
                                        >
                                            Copy List
                                        </button>
                                    </div>
                                    <div className="bg-gray-50 rounded border max-h-96 overflow-y-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-100 border-b">
                                                <tr>
                                                    <th className="p-3">Name</th>
                                                    <th className="p-3">Phone</th>
                                                    <th className="p-3">Email</th>
                                                    <th className="p-3">Branch</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {luckyDrawParticipants.map((p, idx) => (
                                                    <tr key={idx} className="border-b hover:bg-gray-100">
                                                        <td className="p-3">{p.name}</td>
                                                        <td className="p-3">{p.phone}</td>
                                                        <td className="p-3">{p.email}</td>
                                                        <td className="p-3">{p.branch || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {luckyDrawParticipants.length === 0 && (
                                <div className="text-center text-gray-500 py-8 border rounded border-dashed">
                                    No participants found with current filters.
                                </div>
                            )}
                        </div>
                        
                        {/* Lucky Draw History */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-bold mb-4 flex items-center"><Gift className="mr-2" /> Lucky Draw History</h3>
                            
                            {luckyDrawHistory.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-100 border-b">
                                            <tr>
                                                <th className="p-3">Draw #</th>
                                                <th className="p-3">Winner Name</th>
                                                <th className="p-3">Phone</th>
                                                <th className="p-3">Email</th>
                                                <th className="p-3">Branch</th>
                                                <th className="p-3">Stall</th>
                                                <th className="p-3">Order ID</th>
                                                <th className="p-3">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {luckyDrawHistory.map((draw, idx) => (
                                                <tr key={draw._id} className="border-b hover:bg-gray-50">
                                                    <td className="p-3">{draw.drawNumber}</td>
                                                    <td className="p-3 font-semibold">{draw.winner.name}</td>
                                                    <td className="p-3">{draw.winner.phone}</td>
                                                    <td className="p-3">{draw.winner.email}</td>
                                                    <td className="p-3">{draw.winner.branch || '-'}</td>
                                                    <td className="p-3">{draw.stallName}</td>
                                                    <td className="p-3 text-sm text-gray-500">{draw.orderId ? draw.orderId.substring(0, 8) + '...' : '-'}</td>
                                                    <td className="p-3">{new Date(draw.timestamp).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    No lucky draw history available.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-8">
                        <div className="bg-white p-8 rounded-lg shadow max-w-2xl mx-auto">
                            <h3 className="text-2xl font-bold mb-6 flex items-center"><Settings className="mr-2" /> Global Payment Settings</h3>
                            <form onSubmit={handleUpdateSettings}>
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-bold mb-2">UPI ID (VPA)</label>
                                    <input 
                                        type="text" 
                                        value={settings.upiId} 
                                        onChange={e => setSettings({...settings, upiId: e.target.value})} 
                                        className="w-full border p-3 rounded"
                                        placeholder="e.g. festadmin@okaxis"
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-bold mb-2">QR Code Image URL</label>
                                    <div className="flex gap-4">
                                        <input 
                                            type="text" 
                                            value={settings.upiQrImage} 
                                            onChange={e => setSettings({...settings, upiQrImage: e.target.value})} 
                                            className="w-full border p-3 rounded"
                                            placeholder="https://example.com/qr.png"
                                        />
                                    </div>
                                    {settings.upiQrImage && (
                                        <div className="mt-4 p-4 border rounded bg-gray-50 flex justify-center">
                                            <img src={settings.upiQrImage} alt="QR Preview" className="w-48 h-48 object-contain" />
                                        </div>
                                    )}
                                </div>
                                <button className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700">
                                    Save Settings
                                </button>
                            </form>
                        </div>
                        
                        <div className="bg-white p-8 rounded-lg shadow max-w-2xl mx-auto">
                            <h3 className="text-2xl font-bold mb-6 flex items-center"><Gift className="mr-2" /> Lucky Draw Settings</h3>
                            <form onSubmit={handleUpdateLuckyDrawSettings}>
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-bold mb-2">Enable Lucky Draw</label>
                                    <div className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={settings.luckyDrawEnabled} 
                                            onChange={e => setSettings({...settings, luckyDrawEnabled: e.target.checked})} 
                                            className="w-5 h-5 text-indigo-600 rounded"
                                        />
                                        <span className="ml-2 text-gray-700">Enable automatic lucky draw after threshold is reached</span>
                                    </div>
                                </div>
                                
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-bold mb-2">Lucky Draw Stall</label>
                                    <select 
                                        value={settings.luckyDrawStall || ''} 
                                        onChange={e => setSettings({...settings, luckyDrawStall: e.target.value})} 
                                        className="w-full border p-3 rounded"
                                        disabled={!settings.luckyDrawEnabled}
                                    >
                                        <option value="">Select a stall for lucky draw</option>
                                        {stalls.map(stall => (
                                            <option key={stall._id} value={stall._id}>{stall.name}</option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-sm text-gray-500">Only completed orders from this stall will count toward the lucky draw</p>
                                </div>
                                
                                <div className="mb-6">
                                    <label className="block text-gray-700 font-bold mb-2">Threshold (Orders)</label>
                                    <input 
                                        type="number" 
                                        value={settings.luckyDrawThreshold} 
                                        onChange={e => setSettings({...settings, luckyDrawThreshold: parseInt(e.target.value)})} 
                                        className="w-full border p-3 rounded"
                                        min="1"
                                        max="1000"
                                        disabled={!settings.luckyDrawEnabled}
                                    />
                                    <p className="mt-2 text-sm text-gray-500">Number of completed orders required to trigger a lucky draw</p>
                                </div>
                                
                                <button className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700 disabled:bg-gray-400" disabled={!settings.luckyDrawEnabled}>
                                    Save Lucky Draw Settings
                                </button>
                            </form>
                        </div>
                        
                        <div className="bg-white p-8 rounded-lg shadow max-w-2xl mx-auto">
                            <h3 className="text-2xl font-bold mb-6 flex items-center"><Gift className="mr-2" /> Manual Lucky Draw</h3>
                            <div className="space-y-4">
                                <p className="text-gray-600">Manually trigger a lucky draw for testing or special occasions.</p>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={triggerLuckyDraw}
                                        className="flex-1 bg-purple-600 text-white py-3 rounded font-bold hover:bg-purple-700"
                                    >
                                        Trigger Lucky Draw Now
                                    </button>
                                    <button 
                                        onClick={resetLuckyDrawCounter}
                                        className="flex-1 bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700"
                                    >
                                        Reset Counter
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Trigger: Randomly select a winner from recent completed orders</p>
                                <p className="text-sm text-gray-500">Reset: Reset the lucky draw counter</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
