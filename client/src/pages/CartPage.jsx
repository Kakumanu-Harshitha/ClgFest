import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart, Clock, CreditCard, MapPin, IndianRupee } from 'lucide-react';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal, stallId } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [orderType, setOrderType] = useState('Live');
    const [transactionId, setTransactionId] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [upiQr, setUpiQr] = useState('');
    const [upiId, setUpiId] = useState('');
    const [stallName, setStallName] = useState('');
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedOffer, setAppliedOffer] = useState(null);
    const [couponStatus, setCouponStatus] = useState('');
    const [preBookingEnabled, setPreBookingEnabled] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/settings');
                if (data && data.upiQrImage) {
                    setUpiQr(data.upiQrImage);
                }
                if (data && data.upiId) {
                    setUpiId(data.upiId);
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };
        const fetchStall = async () => {
            try {
                if (!stallId) return;
                const { data } = await axios.get(`http://localhost:5000/api/stalls/${stallId}`);
                if (data && data.name) {
                    setStallName(data.name);
                }
                if (data && typeof data.preBookingEnabled === 'boolean') {
                    setPreBookingEnabled(!!data.preBookingEnabled);
                    if (!data.preBookingEnabled && orderType === 'Pre-booking') {
                        setOrderType('Live');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch stall:', error);
            }
        };
        fetchSettings();
        fetchStall();
    }, []);

    const discountAmount = appliedOffer ? Math.round(getCartTotal() * ((appliedOffer.discountPercentage || 0) / 100)) : 0;
    const finalTotal = Math.max(0, getCartTotal() - discountAmount);

    const handleApplyCoupon = async () => {
        try {
            const code = couponCode.trim();
            if (!code) {
                setAppliedOffer(null);
                setCouponStatus('');
                return;
            }
            const { data } = await axios.get('http://localhost:5000/api/offers');
            const combined = [ ...(data.globalOffers || []), ...(data.stallOffers || []) ];
            const match = combined.find(o => {
                const c = (o.couponCode || '').toUpperCase();
                const entered = code.toUpperCase();
                const sid = typeof o.stall === 'object' ? (o.stall?._id || o.stall) : o.stall;
                const stallMatch = !sid || (stallId && String(sid) === String(stallId));
                return c && c === entered && stallMatch;
            });
            if (match) {
                setAppliedOffer(match);
                setCouponStatus('applied');
                window.showToast('success', `Coupon ${match.couponCode} applied! ${match.discountPercentage}% discount`);
            } else {
                setAppliedOffer(null);
                setCouponStatus('invalid');
                window.showToast('error', 'Invalid or not applicable coupon code');
            }
        } catch (error) {
            setAppliedOffer(null);
            setCouponStatus('error');
            window.showToast('error', 'Failed to apply coupon');
        }
    };

    const handleRazorpayPayment = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        try {
            // Create order on backend to get order ID
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                }
            };
            
            // First create a temporary order to get the order ID
            const orderData = {
                stallId,
                items: cartItems.map(item => ({
                    foodItem: item._id,
                    quantity: item.quantity
                })),
                paymentMethod: 'Razorpay',
                orderType,
                transactionId: 'temp', // Will be updated after payment
                pickupTime: orderType === 'Pre-booking' ? pickupTime : undefined,
                couponCode: appliedOffer ? appliedOffer.couponCode : (couponCode.trim() || undefined)
            };
            
            const orderResponse = await axios.post('http://localhost:5000/api/orders', orderData, config);
            
            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                const razorpayScript = document.createElement('script');
                razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
                document.head.appendChild(razorpayScript);
                
                razorpayScript.onload = () => {
                    initializeRazorpay(orderResponse.data._id);
                };
            } else {
                initializeRazorpay(orderResponse.data._id);
            }
        } catch (error) {
            console.error('Razorpay payment setup error:', error);
            window.showToast('error', error.response?.data?.message || 'Failed to initialize payment');
        }
    };
    
    const initializeRazorpay = (orderId) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag', // Replace with your actual key
            amount: Math.round(finalTotal * 100), // Amount in paise
            currency: 'INR',
            name: 'Dictators Stalls',
            description: `Order at ${stallName || 'Festival Stall'}`,
            order_id: orderId, // This would be generated by Razorpay in a full implementation
            handler: async function (response) {
                // Payment successful, update order status
                try {
                    const config = {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${user.token}`
                        }
                    };
                    
                    // Update order with transaction ID
                    const updateResponse = await axios.put(
                        `http://localhost:5000/api/orders/${orderId}/status`, 
                        { 
                            paymentStatus: 'Paid',
                            transactionId: response.razorpay_payment_id
                        }, 
                        config
                    );
                    
                    window.showToast('success', 'Payment successful! Order updated.');
                    navigate(`/order-success/${orderId}`, { state: { order: updateResponse.data } });
                    clearCart();
                } catch (error) {
                    console.error('Order update error:', error);
                    window.showToast('error', 'Payment successful but order update failed');
                }
            },
            prefill: {
                name: user.name,
                email: user.email,
                contact: user.phone || ''
            },
            notes: {
                order_id: orderId
            },
            theme: {
                color: '#3b82f6' // Tailwind blue-500
            }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const handleStripePayment = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        try {
            // Create payment intent on backend
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                }
            };
            
            const { data } = await axios.post('http://localhost:5000/api/payments/create-payment-intent', {
                amount: finalTotal,
                currency: 'inr',
                description: `Payment for order at ${stallName || 'Festival Stall'}`,
                orderId: 'temp-order-id' // This would be generated after order creation
            }, config);
            
            // Load Stripe.js if not already loaded
            if (!window.Stripe) {
                const stripeScript = document.createElement('script');
                stripeScript.src = 'https://js.stripe.com/v3/';
                document.head.appendChild(stripeScript);
                
                stripeScript.onload = () => {
                    initializeStripeCheckout(data.clientSecret);
                };
            } else {
                initializeStripeCheckout(data.clientSecret);
            }
        } catch (error) {
            console.error('Stripe payment setup error:', error);
            window.showToast('error', error.response?.data?.message || 'Failed to initialize payment');
        }
    };
    
    const initializeStripeCheckout = (clientSecret) => {
        if (!window.Stripe) {
            window.showToast('error', 'Stripe.js not loaded. Please check your internet connection and try again.');
            return;
        }
        
        // Create a Stripe instance with the publishable key from environment
        const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51_example_key');
        
        if (!stripe) {
            window.showToast('error', 'Stripe is not properly configured');
            return;
        }
        
        stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: { /* Card details would be collected from UI */ },
                billing_details: {
                    name: user.name,
                    email: user.email,
                },
            }
        }).then(function(result) {
            if (result.error) {
                // Show error to your customer
                window.showToast('error', result.error.message);
                
                // Notify backend about payment failure
                handlePaymentFailure(result.error);
            } else {
                // The payment has been processed
                if (result.paymentIntent.status === 'succeeded') {
                    window.showToast('success', 'Payment successful! Processing order...');
                    
                    // Complete the order
                    handleCheckoutWithPaymentId(result.paymentIntent.id);
                }
            }
        });
    };
    
    const handlePaymentFailure = async (error) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                }
            };
            
            await axios.post('http://localhost:5000/api/payments/payment-failure', {
                reason: error.message
            }, config);
        } catch (err) {
            console.error('Payment failure notification error:', err);
        }
    };
    
    const handleCheckoutWithPaymentId = async (paymentIntentId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (cartItems.length === 0) return;

        setLoading(true);
        try {
            const orderData = {
                stallId,
                items: cartItems.map(item => ({
                    foodItem: item._id,
                    quantity: item.quantity
                })),
                paymentMethod: 'Stripe',
                orderType,
                transactionId: paymentIntentId,
                pickupTime: orderType === 'Pre-booking' ? pickupTime : undefined,
                couponCode: appliedOffer ? appliedOffer.couponCode : (couponCode.trim() || undefined)
            };

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                }
            };

            const { data } = await axios.post('http://localhost:5000/api/orders', orderData, config);
            
            clearCart();
            window.showToast('success', 'Order placed successfully!');
            navigate(`/order-success/${data._id}`);

        } catch (error) {
            console.error('Checkout error:', error);
            window.showToast('error', error.response?.data?.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (cartItems.length === 0) return;

        // Validation
        if (paymentMethod === 'UPI' && !transactionId.trim()) {
            window.showToast('error', 'Please enter the UPI Transaction ID');
            return;
        }

        if (orderType === 'Pre-booking' && !preBookingEnabled) {
            window.showToast('error', 'Pre-booking is not enabled for this stall');
            return;
        }

        if (orderType === 'Pre-booking' && !pickupTime) {
            window.showToast('error', 'Please select a pickup time');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                stallId,
                items: cartItems.map(item => ({
                    foodItem: item._id,
                    quantity: item.quantity
                })),
                paymentMethod,
                orderType,
                transactionId: paymentMethod === 'UPI' ? transactionId : undefined,
                pickupTime: orderType === 'Pre-booking' ? pickupTime : undefined,
                couponCode: appliedOffer ? appliedOffer.couponCode : (couponCode.trim() || undefined)
            };

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                }
            };

            const { data } = await axios.post('http://localhost:5000/api/orders', orderData, config);
            
            clearCart();
            window.showToast('success', 'Order placed successfully!');
            navigate(`/order-success/${data._id}`);

        } catch (error) {
            console.error('Checkout error:', error);
            window.showToast('error', error.response?.data?.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <div className="flex justify-center mb-6">
                    <ShoppingCart className="text-gray-400 w-24 h-24" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Your Cart is Empty</h2>
                <p className="text-gray-600 mb-8">Looks like you haven't added anything yet.</p>
                <button 
                    onClick={() => navigate('/stalls')}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:bg-indigo-700 transition"
                >
                    Browse Stalls
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center mb-6">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-indigo-600"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back
                </button>
                <div className="ml-auto flex items-center text-sm text-gray-500">
                    <MapPin size={16} className="mr-1" /> {stallName || 'Festival Stall'}
                </div>
            </div>

            <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-extrabold mb-2 text-gray-800 animate-fadeInUp">Your Cart</h1>
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
            </div>
            <p className="text-gray-600 mb-8">Event: COLORIDO 2K25 • Stall: {stallName}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map((item) => (
                        <div key={item._id} className="card-hover bg-white p-4 rounded-lg shadow flex items-center">
                            <img 
                                src={item.image || "https://via.placeholder.com/100"} 
                                alt={item.name} 
                                className="w-20 h-20 object-cover rounded-md mr-4"
                            />
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold">{item.name}</h3>
                                <p className="text-gray-500 flex items-center"><IndianRupee size={14} className="mr-1" />{item.price}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="font-bold w-6 text-center">{item.quantity}</span>
                                <button 
                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <button 
                                onClick={() => removeFromCart(item._id)}
                                className="ml-4 text-red-500 hover:text-red-700"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Checkout Summary */}
                <div className="card-hover bg-white p-6 rounded-lg shadow h-fit">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <ShoppingCart size={20} className="mr-2" /> Order Summary
                    </h2>
                    <div className="flex justify-between mb-2">
                        <span>Subtotal</span>
                        <span className="flex items-center"><IndianRupee size={14} className="mr-1" />{getCartTotal()}</span>
                    </div>
                    
                    {/* Coupon Section */}
                    <div className="mb-4 mt-6">
                        <label className="block text-gray-700 font-bold mb-2">Coupon Code</label>
                        <div className="flex space-x-2">
                            <input 
                                type="text" 
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Enter code"
                                className="flex-1 border rounded p-2"
                                onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            />
                            <button 
                                onClick={handleApplyCoupon}
                                className="btn-press px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                                Apply
                            </button>
                        </div>
                        {appliedOffer && (
                            <div className="flex justify-between items-center mt-2 p-2 bg-green-50 rounded">
                                <span className="text-green-700 font-medium">{appliedOffer.couponCode}</span>
                                <button 
                                    onClick={() => { 
                                        setAppliedOffer(null); 
                                        setCouponStatus(''); 
                                        setCouponCode(''); 
                                        window.showToast('info', 'Coupon removed');
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                        {couponStatus === 'invalid' && (
                            <p className="text-red-600 text-sm mt-2">Invalid or not applicable to this stall.</p>
                        )}
                    </div>
                    
                    {appliedOffer && (
                        <div className="flex justify-between mb-2 text-green-700 font-semibold">
                            <span>Discount</span>
                            <span className="flex items-center">-<IndianRupee size={14} className="mr-1" />{discountAmount}</span>
                        </div>
                    )}
                    <div className="border-t my-4"></div>
                    <div className="flex justify-between mb-6 text-xl font-bold">
                        <span>Total</span>
                        <span className="flex items-center"><IndianRupee size={18} className="mr-1" />{finalTotal}</span>
                    </div>

                    {/* Order Type Selection */}
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2 flex items-center">
                            <Clock size={16} className="mr-2" /> Order Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setOrderType('Live')}
                                className={`p-3 rounded-lg border-2 ${
                                    orderType === 'Live' 
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                Live Order
                            </button>
                            <button
                                onClick={() => {
                                    if (preBookingEnabled) setOrderType('Pre-booking');
                                }}
                                disabled={!preBookingEnabled}
                                className={`p-3 rounded-lg border-2 ${
                                    orderType === 'Pre-booking' 
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                                        : preBookingEnabled 
                                            ? 'border-gray-200 hover:border-gray-300' 
                                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Pre-booking
                            </button>
                        </div>
                        {!preBookingEnabled && (
                            <p className="text-xs text-gray-500 mt-2">Pre-booking is currently disabled for this stall.</p>
                        )}
                    </div>

                    {orderType === 'Pre-booking' && (
                        <div className="mb-4">
                            <label className="block text-gray-700 font-bold mb-2">Pickup Time</label>
                            <input 
                                type="datetime-local" 
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="w-full border rounded p-2"
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </div>
                    )}

                    {/* Payment Method */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-bold mb-2 flex items-center">
                            <CreditCard size={16} className="mr-2" /> Payment Method
                        </label>
                        
                        {/* Payment method selection with icons */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                onClick={() => setPaymentMethod('Cash')}
                                className={`p-3 rounded-lg border-2 flex flex-col items-center ${
                                    paymentMethod === 'Cash' 
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="text-2xl mb-1">💵</div>
                                <span>Cash</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('UPI')}
                                className={`p-3 rounded-lg border-2 flex flex-col items-center ${
                                    paymentMethod === 'UPI' 
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="text-2xl mb-1">💳</div>
                                <span>UPI</span>
                            </button>
                        </div>

                        {/* Payment method details */}
                        {paymentMethod === 'UPI' && (
                            <div className="bg-gray-50 p-4 rounded border">
                                {upiQr ? (
                                    <div className="mb-4 text-center">
                                        <p className="text-sm text-gray-600 mb-2">Scan to Pay</p>
                                        <img src={upiQr} alt="UPI QR" className="mx-auto w-48 h-48 object-contain" />
                                    </div>
                                ) : (
                                    <p className="text-red-500 text-sm mb-4">QR Code not available. Ask counter.</p>
                                )}
                                {upiId && <p className="text-center text-sm text-gray-700 mb-3">UPI ID: {upiId}</p>}
                                <label className="block text-gray-700 font-bold mb-2">Transaction ID / UTR</label>
                                <input 
                                    type="text" 
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    placeholder="Enter 12-digit UTR/Ref No"
                                    className="w-full border rounded p-2"
                                />
                            </div>
                        )}
                        
                        {/* Additional payment options */}
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Other Payment Options:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleRazorpayPayment}
                                    className="p-2 rounded-lg border border-gray-300 hover:border-indigo-500 text-sm flex items-center justify-center"
                                >
                                    <span>💳 Razorpay</span>
                                </button>
                                <button
                                    onClick={handleStripePayment}
                                    className="p-2 rounded-lg border border-gray-300 hover:border-indigo-500 text-sm flex items-center justify-center"
                                    disabled={!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === 'pk_test_51_example_key'}
                                >
                                    <span>💳 Stripe</span>
                                    {!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === 'pk_test_51_example_key' ? <span className="text-xs text-red-500 ml-1">(Config Required)</span> : ''}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleCheckout}
                        disabled={loading}
                        className={`btn-press w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Processing...' : `Place Order - ₹${finalTotal}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;