import { useState, useContext, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import AuthContext from '../context/AuthContext';
 
import { Edit, Trash2, Plus, X, Utensils, ClipboardList, Calendar, BarChart2, CheckCircle, Clock, MessageSquare, Tag } from 'lucide-react';

const StallOwnerDashboard = () => {
    const { user } = useContext(AuthContext);
    
    const [stall, setStall] = useState(null);
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [offers, setOffers] = useState([]);
    const [newOffer, setNewOffer] = useState({ title: '', description: '', couponCode: '', discountPercentage: '' , validUntil: ''});
    const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'prebookings', 'menu', 'analytics', 'feedback', 'offers'
    const [actionLoading, setActionLoading] = useState({});
    const [toast, setToast] = useState(null);
    
    // Auto-dismiss toast after 2.5 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 2500);
            
            return () => clearTimeout(timer);
        }
    }, [toast]);
    const [loadingStates, setLoadingStates] = useState({
        stall: false,
        orders: false,
        allOrders: false,
        feedback: false,
        offers: false
    });
    
    // Menu State
    const [isEditing, setIsEditing] = useState(false);
    const [editItemId, setEditItemId] = useState(null);
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        price: '',
        image: '',
        category: 'Snacks',
        isVeg: true,
        isAvailable: true
    });

    // Feedback Reply State
    const [replyText, setReplyText] = useState({}); // Map of feedbackId -> text
    const [submittingReply, setSubmittingReply] = useState(null);

    const fetchStall = async () => {
        setLoadingStates(prev => ({ ...prev, stall: true }));
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await apiClient.get(`/api/stalls/${user.stallId}/owner`, config);
            setStall(data);
        } catch {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await apiClient.get(`/api/stalls/owner/me`, config);
                setStall(data);
            } catch (e) {
                console.error(e);
            }
        } finally {
            setLoadingStates(prev => ({ ...prev, stall: false }));
        }
    };

    const fetchOrders = async (sid) => {
        setLoadingStates(prev => ({ ...prev, orders: true }));
        try {
            if (!sid) return;
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await apiClient.get(`/api/orders/stall/${sid}`, config);
            // Filter to only include orders with active tokens
            const ordersWithTokens = data.filter(order => order.tokenNumber);
            setOrders(ordersWithTokens);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingStates(prev => ({ ...prev, orders: false }));
        }
    };
    
    const fetchAllOrders = async (sid) => {
        setLoadingStates(prev => ({ ...prev, allOrders: true }));
        try {
            if (!sid) return;
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await apiClient.get(`/api/orders/stall/${sid}`, config);
            setAllOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingStates(prev => ({ ...prev, allOrders: false }));
        }
    };

    const toggleOpen = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.put(`/api/stalls/${user.stallId}/open`, { isOpen: !stall.isOpen }, config);
            fetchStall(); // Refresh stall data immediately after update
            setToast({ type: 'success', message: 'Stall status updated successfully!' });
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Failed to update open status' });
        }
    };

    const togglePreBooking = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.put(`/api/stalls/${user.stallId}/prebooking`, { preBookingEnabled: !stall.preBookingEnabled }, config);
            fetchStall(); // Refresh stall data immediately after update
            setToast({ type: 'success', message: 'Pre-booking status updated successfully!' });
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Failed to update pre-booking status' });
        }
    };

    const fetchFeedback = async (sid) => {
        setLoadingStates(prev => ({ ...prev, feedback: true }));
        try {
            if (!sid) return;
            const { data } = await apiClient.get(`/api/feedback/stall/${sid}`);
            setFeedback(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingStates(prev => ({ ...prev, feedback: false }));
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'stall_owner') return;
        if (user.stallId) {
            fetchStall();
        } else {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            apiClient.get(`/api/stalls/owner/me`, config)
                .then(({ data }) => setStall(data))
                .catch(() => {});
        }
    }, [user]);

    useEffect(() => {
        if (!user || user.role !== 'stall_owner') return;
        const sid = stall?._id || user.stallId;
        if (!sid) return;
        
        // Initial data fetch
        fetchOrders(sid);
        fetchAllOrders(sid);
        fetchFeedback(sid);
        if (activeTab === 'offers') {
            fetchOffers(sid);
        }
        
        // Set up polling for real-time updates
        const interval = setInterval(() => {
            fetchOrders(sid);
            fetchAllOrders(sid);
            fetchFeedback(sid);
            if (activeTab === 'offers') {
                fetchOffers(sid);
            }
            // Also refresh stall info periodically to catch any changes
            fetchStall();
        }, 30000); // Poll every 30 seconds
        
        return () => clearInterval(interval);
    }, [stall, user, activeTab]);

    // --- Feedback Handlers ---
    const handleFeedbackReply = async (feedbackId) => {
        if (!replyText[feedbackId]) return;
        setSubmittingReply(feedbackId);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.put(`/api/feedback/${feedbackId}/respond`, {
                response: replyText[feedbackId]
            }, config);
            
            // Update local state optimistically
            setFeedback(prev => prev.map(f => 
                f._id === feedbackId ? { ...f, response: replyText[feedbackId] } : f
            ));
            setReplyText(prev => ({ ...prev, [feedbackId]: '' }));
            setToast({ type: 'success', message: 'Feedback reply sent successfully!' });
        } catch {
            setToast({ type: 'error', message: 'Failed to send reply' });
        } finally {
            setSubmittingReply(null);
        }
    };

    // --- Menu Handlers ---
    const handleMenuSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` } };
            let response;
            
            if (isEditing) {
                response = await apiClient.put(`/api/stalls/items/${editItemId}`, newItem, config);
                setToast({ type: 'success', message: 'Item updated successfully!' });
            } else {
                response = await apiClient.post(`/api/stalls/${stall._id}/items`, newItem, config);
                setToast({ type: 'success', message: 'Item added successfully!' });
            }
            
            // Optimistically update the local state
            if (stall) {
                const updatedItems = isEditing 
                    ? stall.items.map(item => item._id === editItemId ? { ...newItem, _id: editItemId } : item)
                    : [...stall.items, { ...newItem, _id: response.data._id }];
                
                setStall(prev => ({ ...prev, items: updatedItems }));
            }
            
            resetForm();
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Operation failed' });
        }
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.delete(`/api/stalls/items/${itemId}`, config);
            
            // Optimistically update the local state
            if (stall) {
                setStall(prev => ({
                    ...prev,
                    items: prev.items.filter(item => item._id !== itemId)
                }));
            }
            
            setToast({ type: 'success', message: 'Item deleted successfully!' });
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Delete failed' });
        }
    };

    const handleEditClick = (item) => {
        setIsEditing(true);
        setEditItemId(item._id);
        setNewItem({
            name: item.name, description: item.description, price: item.price,
            image: item.image, category: item.category, isVeg: item.isVeg, isAvailable: item.isAvailable
        });
        window.scrollTo(0, 0);
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditItemId(null);
        setNewItem({
            name: '', description: '', price: '', image: '',
            category: 'Snacks', isVeg: true, isAvailable: true
        });
    };

    // --- Order Handlers ---
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), status: true } }));
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` } };
            const { data: updated } = await apiClient.put(`/api/orders/${orderId}/status`, { status: newStatus }, config);
            
            // Optimistically update orders
            setOrders(curr => {
                const idx = curr.findIndex(o => o._id === orderId);
                if (idx === -1) return curr;
                const next = [...curr];
                if (updated.status === 'Completed' || updated.tokenStatus === 'DELIVERED' || updated.tokenStatus === 'CANCELLED') {
                    next.splice(idx, 1);
                } else {
                    next[idx] = updated;
                }
                return next;
            });
            
            setAllOrders(curr => curr.map(o => (o._id === orderId ? updated : o)));
            setToast({ type: 'success', message: 'Order status updated successfully!' });
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Status update failed' });
        } finally {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), status: false } }));
        }
    };

    const updatePaymentStatus = async (orderId, newStatus) => {
        try {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), payment: true } }));
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` } };
            const { data: updated } = await apiClient.put(`/api/orders/${orderId}/status`, { paymentStatus: newStatus }, config);
            
            setAllOrders(curr => curr.map(o => (o._id === orderId ? updated : o)));
            setOrders(curr => {
                const exists = curr.some(o => o._id === orderId);
                if (updated.tokenStatus === 'ACTIVE' && updated.tokenNumber) {
                    if (exists) {
                        return curr.map(o => (o._id === orderId ? updated : o));
                    }
                    return [updated, ...curr];
                }
                if (exists) {
                    return curr.map(o => (o._id === orderId ? updated : o));
                }
                return curr;
            });
            
            setToast({ type: 'success', message: 'Payment status updated successfully!' });
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Payment status update failed' });
        } finally {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), payment: false } }));
        }
    };

    const fetchOffers = async (sid) => {
        setLoadingStates(prev => ({ ...prev, offers: true }));
        try {
            const { data } = await apiClient.get('/api/offers');
            const combined = [ ...(data.globalOffers || []), ...(data.stallOffers || []) ];
            const mine = combined.filter(o => {
                const stallField = typeof o.stall === 'object' ? o.stall?._id || o.stall : o.stall;
                return stallField && sid && String(stallField) === String(sid);
            });
            setOffers(mine);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingStates(prev => ({ ...prev, offers: false }));
        }
    };

    const deleteOffer = async (offerId) => {
        if (!window.confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
            return;
        }
        
        try {
            const config = { 
                headers: { 
                    Authorization: `Bearer ${user.token}` 
                } 
            };
            
            await apiClient.delete(`/api/offers/${offerId}`, config);
            
            // Optimistically update the local state
            setOffers(prev => prev.filter(offer => offer._id !== offerId));
            setToast({ type: 'success', message: 'Offer deleted successfully!' });
        } catch (error) {
            console.error('Delete offer error:', error);
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to delete offer' });
        }
    };

    const createOffer = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const payload = {
                title: newOffer.title,
                description: newOffer.description,
                couponCode: newOffer.couponCode,
                discountPercentage: Number(newOffer.discountPercentage) || 0,
                validUntil: newOffer.validUntil ? new Date(newOffer.validUntil) : undefined,
                stall: (stall?._id || user.stallId)
            };
            await apiClient.post('/api/offers', payload, config);
            setNewOffer({ title: '', description: '', couponCode: '', discountPercentage: '', validUntil: '' });
            const sid = stall?._id || user.stallId;
            fetchOffers(sid);
            setToast({ type: 'success', message: 'Offer published successfully!' });
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to publish offer' });
        }
    };

    // --- Analytics Helper ---
    const getAnalytics = () => {
        const totalRevenue = allOrders.reduce((acc, order) => acc + (order.status !== 'Cancelled' ? order.totalAmount : 0), 0);
        const totalOrders = allOrders.filter(o => o.status !== 'Cancelled').length;
        const pendingOrders = allOrders.filter(o => o.status === 'Pending').length;
        return { totalRevenue, totalOrders, pendingOrders };
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Login Required</h2>
                <p className="text-gray-600">Please login as a stall owner to access the dashboard.</p>
            </div>
        );
    }
    if (user.role !== 'stall_owner') {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Not Authorized</h2>
                <p className="text-gray-600">Only stall owners can access this page.</p>
            </div>
        );
    }
    if (!stall) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Loading Dashboard...</h2>
                {!user?.stallId && (
                    <p className="text-gray-600">No stall linked to your account yet. Please contact an admin to link your stall.</p>
                )}
            </div>
        );
    }

    const liveOrders = orders.filter(o => o.orderType === 'Live');
    const preBookings = allOrders.filter(o => o.orderType === 'Pre-booking');
    const pendingLiveOrders = allOrders.filter(o => o.orderType === 'Live' && !o.tokenNumber);
    const analytics = getAnalytics();

    const markDelivered = async (orderId) => {
        try {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), deliver: true } }));
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` } };
            const { data: updated } = await apiClient.put(`/api/orders/${orderId}/status`, { tokenStatus: 'DELIVERED' }, config);
            
            setOrders(curr => curr.filter(o => o._id !== orderId));
            setAllOrders(curr => curr.map(o => (o._id === orderId ? updated : o)));
            setToast({ type: 'success', message: 'Order marked as delivered!' });
        } catch {
            setToast({ type: 'error', message: 'Failed to mark delivered' });
        } finally {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), deliver: false } }));
        }
    };

    const cancelToken = async (orderId) => {
        if (!window.confirm('Cancel this token?')) return;
        try {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), cancel: true } }));
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` } };
            const { data: updated } = await apiClient.put(`/api/orders/${orderId}/status`, { tokenStatus: 'CANCELLED' }, config);
            
            setOrders(curr => curr.filter(o => o._id !== orderId));
            setAllOrders(curr => curr.map(o => (o._id === orderId ? updated : o)));
            setToast({ type: 'success', message: 'Token cancelled successfully!' });
        } catch {
            setToast({ type: 'error', message: 'Failed to cancel token' });
        } finally {
            setActionLoading(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), cancel: false } }));
        }
    };

    const OrderCard = ({ order }) => (
        <div className={`card-hover bg-white rounded-lg shadow p-6 border-l-4 ${order.status === 'Completed' ? 'border-green-500' : 'border-indigo-600'} mb-4`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-xl font-bold">Order #{order.tokenNumber || order._id.substring(0, 6)}</h3>
                        {order.tokenNumber && (
                            <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Token: {order.tokenNumber}</span>
                        )}
                        {order.paymentStatus === 'Pending' && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Payment Pending</span>
                        )}
                        {order.status === 'Pending' && order.paymentStatus !== 'Pending' && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Order Pending</span>
                        )}
                        {order.status === 'Confirmed' && (
                            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Confirmed</span>
                        )}
                        {order.status === 'Preparing' && (
                            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Preparing</span>
                        )}
                        {order.status === 'Ready' && (
                            <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Ready for Pickup</span>
                        )}
                        {order.status === 'Completed' && (
                            <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Completed</span>
                        )}
                        {order.status === 'Cancelled' && (
                            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Cancelled</span>
                        )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>{order.orderType} Order • {order.paymentMethod}</p>
                        {order.pickupTime && (
                            <p className="font-bold text-indigo-600 flex items-center">
                                <Clock size={16} className="mr-1" /> Pickup: {new Date(order.pickupTime).toLocaleString()}
                            </p>
                        )}
                        {order.transactionId && (
                            <p className="text-purple-600 font-mono text-xs">Trans ID: {order.transactionId}</p>
                        )}
                        <div className="flex items-center space-x-2">
                            <span className={`text-xs font-bold ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                                Payment: {order.paymentStatus}
                            </span>
                            {order.paymentStatus === 'Pending' && (
                                <button 
                                    onClick={() => updatePaymentStatus(order._id, 'Paid')} 
                                    disabled={!!actionLoading[order._id]?.payment}
                                    className={`btn-press text-xs px-2 py-0.5 rounded ${actionLoading[order._id]?.payment ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                >
                                    {actionLoading[order._id]?.payment ? 'Marking...' : 'Mark Paid'}
                                </button>
                            )}
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
                        <button onClick={() => updateOrderStatus(order._id, 'Ready')} disabled={!!actionLoading[order._id]?.status} className={`btn-press px-4 py-2 rounded ${actionLoading[order._id]?.status ? 'bg-gray-300 text-gray-700' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}>{actionLoading[order._id]?.status ? '...' : 'Mark Ready'}</button>
                    )}
                    {order.status === 'Ready' && (
                        <button onClick={() => updateOrderStatus(order._id, 'Completed')} disabled={!!actionLoading[order._id]?.status} className={`btn-press px-4 py-2 rounded ${actionLoading[order._id]?.status ? 'bg-gray-300 text-gray-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>{actionLoading[order._id]?.status ? '...' : 'Complete'}</button>
                    )}
                </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
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
            <div className="flex gap-2 mt-4">
                <button onClick={() => markDelivered(order._id)} disabled={!!actionLoading[order._id]?.deliver} className={`btn-press px-3 py-2 rounded flex items-center ${actionLoading[order._id]?.deliver ? 'bg-gray-300 text-gray-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                    <CheckCircle size={16} className="mr-1" /> {actionLoading[order._id]?.deliver ? 'Delivering...' : 'Deliver'}
                </button>
                <button onClick={() => cancelToken(order._id)} disabled={!!actionLoading[order._id]?.cancel} className={`btn-press px-3 py-2 rounded ${actionLoading[order._id]?.cancel ? 'bg-gray-300 text-gray-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                    {actionLoading[order._id]?.cancel ? 'Cancelling...' : 'Cancel'}
                </button>
            </div>
        </div>
    );

    // Toast notification component
    const ToastNotification = () => {
        if (!toast) return null;
        
        return (
            <div 
                className="fixed top-4 right-4 z-50 transition-all duration-300 transform"
                onClick={() => setToast(null)}
                style={{ cursor: 'pointer' }}
            >
                <div className={`rounded-lg shadow-lg px-4 py-3 text-sm ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {toast.message}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <ToastNotification />
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-indigo-700">{stall.name}</h1>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${stall.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{stall.isOpen ? 'OPEN' : 'CLOSED'}</span>
                </div>
                <button onClick={toggleOpen} className={`mb-6 px-3 py-2 rounded ${stall.isOpen ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                    {stall.isOpen ? 'Close Stall' : 'Open Stall'}
                </button>
                <button onClick={togglePreBooking} className={`mb-6 px-3 py-2 rounded ${stall.preBookingEnabled ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-600 text-white hover:bg-gray-700'}`}>
                    {stall.preBookingEnabled ? 'Disable Pre-Booking' : 'Enable Pre-Booking'}
                </button>
                <nav className="space-y-2 flex-1">
                    <button onClick={() => setActiveTab('orders')} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'orders' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <ClipboardList size={20} /> <span>Live Orders</span>
                        {liveOrders.filter(o => o.status === 'Pending').length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-auto">
                                {liveOrders.filter(o => o.status === 'Pending').length}
                            </span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('prebookings')} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'prebookings' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Calendar size={20} /> <span>Pre-bookings</span>
                    </button>
                    <button onClick={() => setActiveTab('menu')} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'menu' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Utensils size={20} /> <span>Menu</span>
                    </button>
                    <button onClick={() => { setActiveTab('offers'); fetchOffers(stall?._id || user.stallId); }} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'offers' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Tag size={20} /> <span>Offers</span>
                    </button>
                    <button onClick={() => setActiveTab('feedback')} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'feedback' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <MessageSquare size={20} /> <span>Feedback</span>
                    </button>
                    <button onClick={() => setActiveTab('analytics')} className={`flex items-center space-x-3 w-full p-3 rounded ${activeTab === 'analytics' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <BarChart2 size={20} /> <span>Analytics</span>
                    </button>
                </nav>
                <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500">Status: <span className="text-green-600 font-bold">Online</span></p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <h2 className="text-2xl font-bold mb-6 capitalize">{activeTab === 'prebookings' ? 'Pre-Bookings' : activeTab}</h2>

                {loadingStates.stall && activeTab === 'menu' && (
                    <div className="mb-4 text-center text-gray-600">Updating menu...</div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        {loadingStates.orders && <div className="text-center text-gray-600">Loading orders...</div>}
                        {liveOrders.length === 0 ? <p className="text-gray-500">No active tokens currently.</p> : liveOrders.map(order => <OrderCard key={order._id} order={order} />)}
                        {pendingLiveOrders.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-bold mb-2">Waiting for payment verification</h3>
                                <div className="space-y-4">
                                    {pendingLiveOrders.map(order => <OrderCard key={order._id} order={order} />)}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'prebookings' && (
                    <div className="space-y-6">
                        {loadingStates.allOrders && <div className="text-center text-gray-600">Loading pre-bookings...</div>}
                        {preBookings.length === 0 ? <p className="text-gray-500">No pre-bookings yet.</p> : preBookings.map(order => <OrderCard key={order._id} order={order} />)}
                    </div>
                )}

                {activeTab === 'feedback' && (
                    <div className="space-y-4">
                        {loadingStates.feedback && <div className="text-center text-gray-600">Loading feedback...</div>}
                        <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">Feedback Summary</h3>
                                <p className="text-sm text-gray-600">Only for your stall</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {feedback.length ? (feedback.reduce((a, b) => a + (b.rating || 0), 0) / feedback.length).toFixed(1) : '0.0'}
                                </div>
                                <div className="text-xs text-gray-500">{feedback.length} reviews</div>
                            </div>
                        </div>
                        {feedback.length === 0 ? <p className="text-gray-500">No feedback yet.</p> : feedback.map(item => (
                            <div key={item._id} className="bg-white p-6 rounded-lg shadow">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-gray-700">{item.user?.name || 'Anonymous'}</span>
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

                {activeTab === 'offers' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {loadingStates.offers && <div className="text-center text-gray-600">Loading offers...</div>}
                        <div className="lg:col-span-2 space-y-4">
                            {offers.length === 0 ? (
                                <div className="text-gray-500">No offers yet.</div>
                            ) : (
                                offers.map(offer => (
                                    <div key={offer._id} className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold">{offer.title}</h3>
                                            <p className="text-gray-600">{offer.description}</p>
                                            <div className="mt-2 flex space-x-4">
                                                <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-sm font-bold">Code: {offer.couponCode}</span>
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">{offer.discountPercentage}% OFF</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => deleteOffer(offer._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                                title="Delete Offer"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow h-fit">
                            <h3 className="text-xl font-bold mb-4">Publish Offer</h3>
                            <form onSubmit={createOffer}>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Title</label>
                                    <input type="text" value={newOffer.title} onChange={e => setNewOffer({ ...newOffer, title: e.target.value })} className="w-full border p-2 rounded" required />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Description</label>
                                    <textarea value={newOffer.description} onChange={e => setNewOffer({ ...newOffer, description: e.target.value })} className="w-full border p-2 rounded" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Code</label>
                                        <input type="text" value={newOffer.couponCode} onChange={e => setNewOffer({ ...newOffer, couponCode: e.target.value })} className="w-full border p-2 rounded" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Discount (%)</label>
                                        <input type="number" value={newOffer.discountPercentage} onChange={e => setNewOffer({ ...newOffer, discountPercentage: e.target.value })} className="w-full border p-2 rounded" required />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Valid Until</label>
                                    <input type="date" value={newOffer.validUntil} onChange={e => setNewOffer({ ...newOffer, validUntil: e.target.value })} className="w-full border p-2 rounded" />
                                </div>
                                <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Create Offer</button>
                            </form>
                        </div>
                    </div>
                )}
                {activeTab === 'analytics' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {loadingStates.allOrders && <div className="text-center text-gray-600">Loading analytics...</div>}
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                            <p className="text-gray-500">Total Earnings</p>
                            <p className="text-3xl font-bold">₹{analytics.totalRevenue}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                            <p className="text-gray-500">Total Orders</p>
                            <p className="text-3xl font-bold">{analytics.totalOrders}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                            <p className="text-gray-500">Pending Orders</p>
                            <p className="text-3xl font-bold">{analytics.pendingOrders}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'menu' && (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Add/Edit Item Form */}
                        <div className="bg-white p-6 rounded-lg shadow h-fit">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">{isEditing ? 'Edit Item' : 'Add New Item'}</h2>
                                {isEditing && (
                                    <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleMenuSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 mb-1">Item Name</label>
                                    <input type="text" required className="w-full border rounded p-2" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1">Price (₹)</label>
                                    <input type="number" required className="w-full border rounded p-2" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1">Description</label>
                                    <textarea className="w-full border rounded p-2" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1">Image URL</label>
                                    <input type="text" className="w-full border rounded p-2" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={newItem.isVeg} onChange={e => setNewItem({...newItem, isVeg: e.target.checked})} className="mr-2" /> Veg
                                    </label>
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={newItem.isAvailable} onChange={e => setNewItem({...newItem, isAvailable: e.target.checked})} className="mr-2" /> Available
                                    </label>
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-bold">
                                    {isEditing ? 'Update Item' : 'Add Item'}
                                </button>
                            </form>
                        </div>

                        {/* Menu List */}
                        <div className="lg:col-span-2 space-y-4">
                            {loadingStates.stall && <div className="text-center text-gray-600">Loading menu...</div>}
                            {(stall.items && stall.items.length > 0 ? stall.items : []).map((item) => (
                                <div key={item._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                                    <div className="flex items-center space-x-4">
                                        <img src={item.image || "https://via.placeholder.com/100"} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                        <div>
                                            <h3 className="font-bold text-lg flex items-center">
                                                {item.name}
                                                <span className={`ml-2 w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            </h3>
                                            <p className="text-gray-500 text-sm">{item.description}</p>
                                            <p className="font-bold mt-1">₹{item.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleEditClick(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full">
                                            <Edit size={20} />
                                        </button>
                                        <button onClick={() => handleDelete(item._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!stall.items || stall.items.length === 0) && !loadingStates.stall && (
                                <div className="text-gray-500">No menu items yet. Add your first item using the form.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StallOwnerDashboard;