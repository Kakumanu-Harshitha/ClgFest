import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Home, Download, Printer, Clock, CreditCard, IndianRupee } from 'lucide-react';
import jsPDF from 'jspdf';
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const OrderSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id: orderId } = useParams(); // Get orderId from URL params
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const config = {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                const { data } = await apiClient.get(`/api/orders/${orderId}`, config);
                console.log("Fetched order data:", data); // Add this line
                setOrder(data);
            } catch (err) {
                console.error("Error fetching order details:", err);
                setError("Failed to load order details.");
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrder();
        } else if (location.state?.order) {
            // Fallback for direct navigation without URL param (less ideal)
            setOrder(location.state.order);
            setLoading(false);
        } else {
            setError("No order ID provided.");
            setLoading(false);
        }
    }, [orderId, location.state?.order]);

    if (loading) {
        return <div className="text-center py-8">Loading order details...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">Error: {error}</div>;
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <h2 className="text-2xl font-bold mb-4">No Order Details Found</h2>
                <button 
                    onClick={() => navigate('/')}
                    className="text-indigo-600 hover:underline"
                >
                    Go Home
                </button>
            </div>
        );
    }

    // Function to generate receipt
    const generateReceipt = () => {
        const receiptData = {
            orderId: order._id,
            stallName: order.stallName || order.stall?.name || 'Stall',
            items: order.items,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderType: order.orderType,
            createdAt: new Date(order.createdAt).toLocaleString(),
            tokenNumber: order.tokenNumber
        };

        const doc = new jsPDF();

        // Set font size and add title
        doc.setFontSize(20);
        doc.text("Order Receipt", 105, 20, null, null, "center");

        doc.setFontSize(12);
        doc.text(`Order ID: ${receiptData.orderId}`, 10, 40);
        doc.text(`Stall Name: ${receiptData.stallName}`, 10, 47);
        doc.text(`Order Type: ${receiptData.orderType}`, 10, 54);
        doc.text(`Payment Method: ${receiptData.paymentMethod} (${receiptData.paymentStatus})`, 10, 61);
        doc.text(`Order Date: ${receiptData.createdAt}`, 10, 68);
        if (receiptData.tokenNumber) {
            doc.text(`Token Number: ${receiptData.tokenNumber}`, 10, 75);
        }

        // Add items table
        const tableColumn = ["Item", "Quantity", "Price", "Total"];
        const tableRows = [];

        receiptData.items.forEach(item => {
            const itemData = [
                item.name,
                item.quantity,
                `₹${item.price}`,
                `₹${item.price * item.quantity}`,
            ];
            tableRows.push(itemData);
        });

        // Add items table manually
        let currentY = 85;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Item", 10, currentY);
        doc.text("Quantity", 80, currentY);
        doc.text("Price", 120, currentY);
        doc.text("Total", 160, currentY);
        currentY += 5;
        doc.line(10, currentY, 200, currentY); // Draw a line under headers
        currentY += 5;
        doc.setFont("helvetica", "normal");

        receiptData.items.forEach(item => {
            doc.text(item.name, 10, currentY);
            doc.text(item.quantity.toString(), 80, currentY);
            doc.text(`₹${item.price}`, 120, currentY);
            doc.text(`₹${item.price * item.quantity}`, 160, currentY);
            currentY += 7;
        });
        doc.line(10, currentY, 200, currentY); // Draw a line under items
        currentY += 10;

        // Add total amount
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Amount: ₹${receiptData.totalAmount}`, 10, currentY);

        // Save the PDF
        doc.save(`receipt-${receiptData.orderId}.pdf`);

        window.showToast('success', 'Receipt downloaded successfully!');
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex justify-center mb-6">
                        <CheckCircle className="text-green-500 w-24 h-24" />
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h1>
                    <p className="text-gray-600 mb-6">Your order has been sent to the stall.</p>

                    {order.tokenNumber ? (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 w-full max-w-md text-center border border-indigo-100">
                            <div className="text-sm text-gray-500 mb-1">Token Number</div>
                            <div className="text-5xl font-mono font-bold text-indigo-600">{order.tokenNumber}</div>
                            <div className="mt-3 text-lg text-gray-700">
                                {order.eventName ? `${order.eventName} • ` : ''}{order.stallName || order.stall?.name || 'Stall'}
                            </div>
                            {order.tokenStatus && (
                                <div className="mt-2 text-sm text-gray-500">Status: {order.tokenStatus}</div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-yellow-50 rounded-xl p-6 mb-6 text-sm text-yellow-800 w-full max-w-md text-center border border-yellow-100">
                            Your token will appear once payment is verified
                            {order.orderType === 'Pre-booking' && order.pickupTime ? ` and near your pickup time (${new Date(order.pickupTime).toLocaleString()}).` : '.'}
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Order Summary</h2>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">Order ID</span>
                            <span className="font-mono text-sm font-medium">{order._id}</span>
                        </div>
                        
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">Stall</span>
                            <span className="font-medium">{order.stallName || order.stall?.name || 'N/A'}</span>
                        </div>
                        
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">Order Type</span>
                            <span className="font-medium text-indigo-600">{order.orderType}</span>
                        </div>
                        
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">Payment Method</span>
                            <span className="font-medium flex items-center">
                                {order.paymentMethod === 'Cash' ? <IndianRupee size={16} className="mr-1" /> : <CreditCard size={16} className="mr-1" />}
                                {order.paymentMethod} • {order.paymentStatus}
                            </span>
                        </div>
                        
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">Order Date</span>
                            <span className="font-medium">
                                {order.createdAt && !isNaN(new Date(order.createdAt)) 
                                    ? new Date(order.createdAt).toLocaleString() 
                                    : 'N/A'}
                            </span>
                        </div>
                        
                        <div className="flex justify-between pt-3">
                            <span className="text-lg font-bold text-gray-800">Total Amount</span>
                            <span className="text-lg font-bold text-gray-800 flex items-center">
                                <IndianRupee size={20} className="mr-1" />{order.totalAmount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Ordered */}
                {order?.items && order.items.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-6 mb-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Items Ordered</h2>
                        <ul className="space-y-3">
                            {order.items.map((item, index) => (
                                <li key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                                    <div className="flex items-center">
                                        <span className="text-gray-700 font-medium mr-2">{item.quantity}x</span>
                                        <span className="text-gray-700">{item.name}</span>
                                    </div>
                                    <span className="font-mono text-gray-800">₹{item.price * item.quantity}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4">
                    <button 
                        onClick={generateReceipt}
                        className="flex items-center bg-gray-100 text-gray-700 px-4 py-3 rounded-full font-bold hover:bg-gray-200 transition"
                    >
                        <Download size={20} className="mr-2" /> Download Receipt
                    </button>
                    
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center bg-gray-100 text-gray-700 px-4 py-3 rounded-full font-bold hover:bg-gray-200 transition"
                    >
                        <Printer size={20} className="mr-2" /> Print Receipt
                    </button>
                    
                    <button 
                        onClick={() => navigate('/stalls')}
                        className="flex items-center bg-indigo-600 text-white px-4 py-3 rounded-full font-bold hover:bg-indigo-700 transition"
                    >
                        Order More
                    </button>
                    
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center bg-indigo-600 text-white px-4 py-3 rounded-full font-bold hover:bg-indigo-700 transition"
                    >
                        <Home size={20} className="mr-2" /> Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;