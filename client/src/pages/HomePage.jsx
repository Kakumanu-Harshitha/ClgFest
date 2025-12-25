import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import apiClient from '../api/axiosConfig';
import AuthContext from '../context/AuthContext';
import { Search, MapPin, ChevronRight, Utensils, ShoppingBag, Zap } from 'lucide-react';

const HomePage = () => {
    const [offers, setOffers] = useState([]);
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('stalls');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/stalls?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [offersRes, stallsRes] = await Promise.all([
                    apiClient.get('/api/offers'),
                    apiClient.get('/api/stalls')
                ]);
                
                const combinedOffers = [ ...(offersRes.data.globalOffers || []), ...(offersRes.data.stallOffers || []) ];
                setOffers(combinedOffers.slice(0, 4));
                setStalls(stallsRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                setOffers([]);
                setStalls([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    const filteredStalls = stalls.filter(stall => {
        if (activeTab === 'stalls') return stall.isOpen; // Dining Out = Open stalls
        if (activeTab === 'delivery') return stall.isOpen; // Delivery = Also open stalls for now
        if (activeTab === 'nightlife') return true; // Show all for nightlife
        return true;
    });

    const tabs = [
        { id: 'stalls', label: 'Dining Out', icon: <Utensils size={24} />, color: 'text-yellow-500' },
        { id: 'delivery', label: 'Delivery', icon: <ShoppingBag size={24} />, color: 'text-yellow-500' },
        { id: 'nightlife', label: 'Nightlife', icon: <Zap size={24} />, color: 'text-yellow-500' }
    ];

    const collections = [
        { 
            id: 1, 
            title: 'Top Trending Spots', 
            places: '12 Places', 
            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' 
        },
        { 
            id: 2, 
            title: 'Best of Street Food', 
            places: '8 Places', 
            image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' 
        },
        { 
            id: 3, 
            title: 'Sweet Cravings', 
            places: '10 Places', 
            image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' 
        },
        { 
            id: 4, 
            title: 'New in Town', 
            places: '5 Places', 
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' 
        }
    ];

    return (
        <div className="bg-white min-h-screen text-gray-900 font-sans">
            {/* Hero Section */}
            <div className="relative h-[450px] flex flex-col items-center justify-center px-4">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                        alt="Hero Background" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>

                <div className="relative z-10 text-center w-full max-w-4xl">
                    <h1 className="text-6xl font-black italic mb-8 tracking-tighter text-yellow-500">
                        DICTATORS
                    </h1>
                    <h2 className="text-4xl font-bold mb-10 text-white">Discover the best food & drinks in College Fest</h2>
                    
                    {/* Search Bar */}
                    <div className="bg-white rounded-xl flex flex-col md:flex-row items-center p-2 shadow-2xl w-full">
                        <div className="flex items-center px-4 py-2 border-b md:border-b-0 md:border-r border-gray-200 w-full md:w-1/3">
                            <MapPin className="text-yellow-500 mr-2" size={20} />
                            <input 
                                type="text" 
                                defaultValue="RVR&JC, B2 Stall" 
                                className="bg-transparent text-gray-700 outline-none w-full placeholder-gray-500"
                            />
                        </div>
                        <div className="flex items-center px-4 py-2 w-full md:w-2/3">
                            <Search className="text-gray-400 mr-2" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search for biryani, waffle or sandwich" 
                                className="bg-transparent text-gray-700 outline-none w-full placeholder-gray-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="container mx-auto px-4 mt-8">
                <div className="flex space-x-12 border-b border-gray-100 pb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-3 pb-4 transition-all relative ${
                                activeTab === tab.id ? 'opacity-100' : 'opacity-50 hover:opacity-70'
                            }`}
                        >
                            <div className={`p-3 rounded-full ${activeTab === tab.id ? 'bg-yellow-500 text-black' : 'bg-gray-100 text-yellow-600'}`}>
                                {tab.icon}
                            </div>
                            <span className={`text-xl font-medium ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-500'}`}>
                                {tab.label}
                            </span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-500 rounded-t-full"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Collections Section */}
            <div className="container mx-auto px-4 py-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-4xl font-bold mb-2 text-gray-900">
                            {activeTab === 'stalls' ? 'Best Dining Places' : activeTab === 'delivery' ? 'Quick Delivery Stalls' : 'Nightlife Spots'}
                        </h2>
                        <p className="text-gray-500 text-lg">Explore curated lists of top stalls, snacks, and drinks based on trends</p>
                    </div>
                    <Link to="/stalls" className="text-yellow-600 flex items-center hover:underline font-medium">
                        View all stalls <ChevronRight size={20} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredStalls.slice(0, 4).map(stall => (
                        <Link 
                            to={`/stalls/${stall._id}`} 
                            key={stall._id} 
                            className="group relative h-80 rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:scale-[1.02]"
                        >
                            <img 
                                src={stall.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                                alt={stall.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-xl font-bold mb-1 text-white">{stall.name}</h3>
                                <p className="text-sm flex items-center text-white/90">
                                    {stall.isOpen ? 'Open Now' : 'Closed'} <ChevronRight size={16} />
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Special Offers Section */}
            {offers.length > 0 && (
                <div className="container mx-auto px-4 py-12 bg-gray-50 rounded-3xl mb-12">
                    <h2 className="text-3xl font-bold mb-8 text-gray-900">Special Offers for You</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {offers.map((offer) => (
                            <div key={offer._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-yellow-500 transition-colors shadow-sm">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                                            {offer.discountPercentage}% OFF
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">{offer.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{offer.description}</p>
                                    <div className="bg-gray-50 border border-dashed border-yellow-500/50 p-3 rounded-lg flex justify-between items-center">
                                        <span className="text-xs text-gray-500 uppercase">Code</span>
                                        <span className="font-mono font-bold text-yellow-600">{offer.couponCode}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(`/stalls/${offer.stall?._id || offer.stall}`)}
                                    className="w-full py-4 bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors"
                                >
                                    Order Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions / Categories */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <Link to="/stalls" className="flex flex-col items-center group">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm">
                            <Utensils className="text-yellow-600" size={32} />
                        </div>
                        <span className="font-bold text-lg group-hover:text-yellow-600 transition-colors text-gray-700">Browse Stalls</span>
                    </Link>
                    <Link to="/cart" className="flex flex-col items-center group">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm">
                            <ShoppingBag className="text-yellow-600" size={32} />
                        </div>
                        <span className="font-bold text-lg group-hover:text-yellow-600 transition-colors text-gray-700">Your Cart</span>
                    </Link>
                    <Link to="/my-orders" className="flex flex-col items-center group">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm">
                            <Zap className="text-yellow-600" size={32} />
                        </div>
                        <span className="font-bold text-lg group-hover:text-yellow-600 transition-colors text-gray-700">Track Orders</span>
                    </Link>
                    <Link to="/profile" className="flex flex-col items-center group">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm">
                            <MapPin className="text-yellow-600" size={32} />
                        </div>
                        <span className="font-bold text-lg group-hover:text-yellow-600 transition-colors text-gray-700">Fest Map</span>
                    </Link>
                </div>
            </div>

            {/* Footer space */}
            <div className="h-20"></div>
        </div>
    );
};

export default HomePage;