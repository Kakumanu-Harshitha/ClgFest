import { useState, useEffect, useContext } from 'react';
import apiClient from '../api/axiosConfig';
import AuthContext from '../context/AuthContext';
import { Loader, Star, X } from 'lucide-react';

const MyOrdersPage = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderFeedback, setOrderFeedback] = useState({});
    const [toast, setToast] = useState(null);
    
    // Feedback Modal State
    const [ratingModal, setRatingModal] = useState({ show: false, orderId: null });
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` }
                };
                const { data } = await apiClient.get('/api/orders/myorders', config);
                setOrders(data);
                const results = await Promise.allSettled(
                    data.map(o => apiClient.get(`/api/feedback/order/${o._id}`, config))
                );
                const map = {};
                data.forEach((o, idx) => {
                    const r = results[idx];
                    if (r.status === 'fulfilled') {
                        map[o._id] = r.value.data || null;
                    }
                });
                setOrderFeedback(map);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    const handleRateOrder = (orderId) => {
        setRatingModal({ show: true, orderId });
        setRating(5);
        setComment('');
    };

    const submitFeedback = async () => {
        if (!comment.trim()) {
            setToast({ type: 'error', message: 'Please add a comment' });
            return;
        }
        setSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await apiClient.post('/api/feedback', {
                orderId: ratingModal.orderId,
                rating,
                comment
            }, config);
            setToast({ type: 'success', message: 'Feedback submitted successfully!' });
            setRatingModal({ show: false, orderId: null });
            try {
                const { data } = await apiClient.get(`/api/feedback/order/${ratingModal.orderId}`, config);
                setOrderFeedback(prev => ({ ...prev, [ratingModal.orderId]: data || null }));
            } catch (e) {
                console.error(e);
            }
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to submit feedback' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center mt-20"><Loader className="animate-spin text-indigo-600" size={48} /></div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl relative">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">My Orders</h1>

            {orders.length === 0 ? (
                <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow">
                    <p className="text-xl mb-4">You haven't placed any orders yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order._id} className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                <div>
                                    <div className="flex items-center space-x-3 mb-1">
                                        <span className="text-2xl font-bold font-mono text-indigo-600">#{order.tokenNumber}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'Ready' ? 'bg-green-100 text-green-800' :
                                            order.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {order.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                                    </div>
                                    <div className="text-indigo-600 font-bold mt-1">
                                        {order.stall?.name || 'Unknown Stall'}
                                    </div>
                                    <div className="mt-2 text-sm">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                                            order.orderType === 'Pre-booking' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                                        }`}>
                                            {order.orderType}
                                        </span>
                                        {order.orderType === 'Pre-booking' && order.pickupTime && (
                                            <span className="ml-2 text-gray-600">
                                                Pickup: <span className="font-semibold">{order.pickupTime}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 text-right">
                                    <div className="text-2xl font-bold">₹{order.totalAmount}</div>
                                    <div className="text-sm text-gray-500">{order.paymentMethod} • {order.paymentStatus}</div>
                                    {order.paymentMethod === 'UPI' && order.transactionId && (
                                        <div className="text-xs text-gray-400 mt-1 font-mono">
                                            TxID: {order.transactionId}
                                        </div>
                                    )}
                                    {(order.status === 'Completed' || order.tokenStatus === 'DELIVERED') && !orderFeedback[order._id] && (
                                        <button 
                                            onClick={() => handleRateOrder(order._id)}
                                            className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 flex items-center justify-end ml-auto"
                                        >
                                            <Star size={14} className="mr-1" fill="currentColor" /> Rate Order
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <ul className="space-y-2">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between text-sm">
                                            <span>{item.quantity} x {item.name}</span>
                                            <span className="font-mono">₹{item.price * item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                                {orderFeedback[order._id] && (
                                    <div className="mt-4 bg-white rounded border p-3">
                                        <div className="flex items-center mb-2">
                                            {[1,2,3,4,5].map(star => (
                                                <Star
                                                    key={star}
                                                    size={18}
                                                    className={star <= (orderFeedback[order._id]?.rating || 0) ? "text-yellow-500 fill-current" : "text-gray-300"}
                                                />
                                            ))}
                                            <span className="ml-2 text-xs text-gray-500">{orderFeedback[order._id]?.rating}/5</span>
                                        </div>
                                        {orderFeedback[order._id]?.comment && (
                                            <p className="text-sm text-gray-700">{orderFeedback[order._id].comment}</p>
                                        )}
                                        {orderFeedback[order._id]?.response && (
                                            <div className="mt-3 text-sm bg-indigo-50 text-indigo-700 p-3 rounded">
                                                Owner reply: {orderFeedback[order._id].response}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Rating Modal */}
            {ratingModal.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Rate Your Order</h3>
                            <button onClick={() => setRatingModal({ show: false, orderId: null })}><X size={24} /></button>
                        </div>
                        <div className="flex justify-center space-x-2 mb-6 animate-fadeInUp">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setRating(star)} className="focus:outline-none btn-press">
                                    <Star 
                                        size={32} 
                                        className={star <= rating ? "text-yellow-500 fill-current" : "text-gray-300"} 
                                    />
                                </button>
                            ))}
                        </div>
                        <textarea
                            className="w-full border rounded p-3 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            rows="4"
                            placeholder="Tell us about your food..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        ></textarea>
                        <button 
                            onClick={submitFeedback}
                            disabled={submitting}
                            className="btn-press w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                            {submitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </div>
            )}
            {toast && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`toast-enter rounded-lg shadow-lg px-4 py-3 text-sm ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrdersPage;
