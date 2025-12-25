import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { Loader, Plus, CheckCircle, Minus, PlusCircle, Star, Clock, IndianRupee } from 'lucide-react';
import CartContext from '../context/CartContext';

const StallDetailsPage = () => {
    const { id } = useParams();
    const [stall, setStall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [offer, setOffer] = useState(null);
    const { addToCart, cartItems, updateQuantity, removeFromCart } = useContext(CartContext);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const stallRes = await apiClient.get(`/api/stalls/${id}`);
                setStall(stallRes.data);

                const reviewsRes = await apiClient.get(`/api/feedback/stall/${id}`);
                setReviews(reviewsRes.data);
                if (reviewsRes.data.length > 0) {
                    const total = reviewsRes.data.reduce((acc, curr) => acc + curr.rating, 0);
                    setAvgRating((total / reviewsRes.data.length).toFixed(1));
                }
                // Fetch active offers for this stall
                const offersRes = await apiClient.get('/api/offers');
                const combined = [ ...(offersRes.data.globalOffers || []), ...(offersRes.data.stallOffers || []) ];
                const stallOffers = combined.filter(o => {
                    const sid = typeof o.stall === 'object' ? o.stall?._id || o.stall : o.stall;
                    return sid === id;
                });
                if (stallOffers.length > 0) {
                    const best = stallOffers.reduce((prev, curr) => (curr.discountPercentage || 0) > (prev.discountPercentage || 0) ? curr : prev);
                    setOffer(best);
                }
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleAddToCart = (item) => {
        if (!stall) return;
        addToCart(item, stall._id);
    };

    const handleQuantityChange = (item, operation) => {
        const existingItem = cartItems.find(i => i._id === item._id);
        if (existingItem) {
            if (operation === 'add') {
                updateQuantity(item._id, existingItem.quantity + 1);
                window.showToast('success', `${item.name} quantity updated!`);
            } else if (operation === 'remove' && existingItem.quantity > 1) {
                updateQuantity(item._id, existingItem.quantity - 1);
                window.showToast('info', `${item.name} quantity updated!`);
            } else if (operation === 'remove' && existingItem.quantity === 1) {
                removeFromCart(item._id);
                window.showToast('info', `${item.name} removed from cart!`);
            }
        } else {
            addToCart(item, stall._id);
        }
    };

    if (loading) return <div className="flex justify-center mt-20 bg-white min-h-screen"><Loader className="animate-spin text-yellow-600" size={48} /></div>;
    if (!stall) return <div className="text-center mt-20 text-xl bg-white min-h-screen">Stall not found</div>;

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-8">
                {/* Stall Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="md:flex">
                        <div className="md:w-1/3">
                            <div className="relative h-full">
                                <img 
                                    src={stall.image || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                                    alt={stall.name} 
                                    className="w-full h-full object-cover min-h-[256px]"
                                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"; }}
                                />
                                {offer && (
                                    <div className="absolute top-4 left-4 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow-sm">
                                        {offer.discountPercentage}% OFF
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-8 md:w-2/3 flex flex-col justify-center">
                            <div className="flex justify-between items-start">
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">{stall.name}</h1>
                                {avgRating > 0 && (
                                    <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-bold flex items-center">
                                        <Star size={16} className="mr-1 fill-current" /> {avgRating}
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-500 text-lg mb-6">{stall.description}</p>
                            <div className="flex flex-wrap gap-4 items-center">
                                <span className={`px-4 py-2 rounded-full font-bold text-sm ${
                                    stall.isOpen 
                                        ? 'bg-green-50 text-green-700' 
                                        : 'bg-red-50 text-red-700'
                                }`}>
                                    {stall.isOpen ? (
                                        <span className="flex items-center"><Clock size={16} className="mr-1" /> Open for Orders</span>
                                    ) : (
                                        <span className="flex items-center"><Clock size={16} className="mr-1" /> Currently Closed</span>
                                    )}
                                </span>
                                {stall.preBookingEnabled && (
                                    <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-bold text-sm">
                                        Pre-Booking Available
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu Section */}
                <h2 className="text-3xl font-bold mb-6 text-gray-900">Menu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {stall.items && stall.items.map((item) => {
                        const cartItem = cartItems.find(i => i._id === item._id);
                        return (
                            <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col hover:shadow-md transition-shadow">
                                <div className="relative mb-4">
                                    <img 
                                        src={item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"} 
                                        alt={item.name} 
                                        className="w-full h-44 object-cover rounded-lg"
                                        onError={(e) => {
                                            e.target.src = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
                                        }}
                                    />
                                    <span className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold ${
                                        item.isVeg ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                        {item.isVeg ? 'VEG' : 'NON-VEG'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold mb-1 text-gray-900">{item.name}</h3>
                                <p className="text-gray-500 text-sm mb-4 flex-grow line-clamp-2">{item.description}</p>
                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                                    <span className="text-lg font-bold text-gray-900 flex items-center">
                                        <IndianRupee size={18} className="mr-0.5" />{item.price}
                                    </span>
                                    {stall.isOpen && item.isAvailable ? (
                                        cartItem ? (
                                            <div className="flex items-center border border-yellow-200 rounded-full bg-yellow-50 px-2 py-1">
                                                <button 
                                                    onClick={() => handleQuantityChange(item, 'remove')}
                                                    className="p-1 rounded-full text-yellow-700 hover:bg-yellow-100 transition-colors"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="mx-3 font-bold text-yellow-800">{cartItem.quantity}</span>
                                                <button 
                                                    onClick={() => handleQuantityChange(item, 'add')}
                                                    className="p-1 rounded-full text-yellow-700 hover:bg-yellow-100 transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleAddToCart(item)}
                                                className="bg-yellow-500 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-400 transition-all flex items-center shadow-sm"
                                            >
                                                <Plus size={16} className="mr-1" /> Add
                                            </button>
                                        )
                                    ) : (
                                        <span className="text-red-500 font-bold text-sm">Unavailable</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Reviews Section */}
                {reviews.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-6 text-gray-900">Customer Reviews</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {reviews.map((review) => (
                                <div key={review._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold">
                                                {review.user?.name?.charAt(0).toUpperCase() || 'A'}
                                            </div>
                                            <span className="font-bold text-gray-900">{review.user?.name || 'Anonymous'}</span>
                                        </div>
                                        <div className="flex text-yellow-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} className={i < review.rating ? 'fill-current' : 'text-gray-200'} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mb-4">{review.comment}</p>
                                    {review.response && (
                                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 border-l-4 border-yellow-500 mt-2">
                                            <p className="font-bold mb-1">Stall Owner Response:</p>
                                            <p>{review.response}</p>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-4">{new Date(review.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StallDetailsPage;