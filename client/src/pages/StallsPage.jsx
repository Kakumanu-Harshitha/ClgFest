import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { Loader, Star, Clock, ShoppingCart, Search, Filter, SortAsc, MapPin } from 'lucide-react';

// Skeleton loader component for stalls
const StallSkeleton = () => {
    return (
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-300 dark:bg-gray-600"></div>
            <div className="p-6">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="flex justify-between items-center">
                    <div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="h-5 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
            </div>
        </div>
    );
};

const StallsPage = () => {
    const [stalls, setStalls] = useState([]);
    const [offerByStall, setOfferByStall] = useState({});
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get('search') || '';
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [filterOpen, setFilterOpen] = useState(true);
    const [sortBy, setSortBy] = useState('name'); // name, rating, discount

    useEffect(() => {
        // Update searchQuery if URL param changes
        const currentSearch = new URLSearchParams(location.search).get('search') || '';
        setSearchQuery(currentSearch);
    }, [location.search]);

    useEffect(() => {
        const fetchStalls = async () => {
            try {
                const { data } = await apiClient.get('/api/stalls');
                setStalls(data);
                console.log('Fetched stalls:', data);
                // Fetch active offers and index by stall
                const offersRes = await apiClient.get('/api/offers');
                const combined = [ ...(offersRes.data.globalOffers || []), ...(offersRes.data.stallOffers || []) ];
                const map = {};
                for (const o of combined) {
                    if (o.stall) {
                        const sid = typeof o.stall === 'object' ? o.stall._id || o.stall : o.stall;
                        // Keep the highest discountPercentage per stall
                        if (!map[sid] || (o.discountPercentage || 0) > (map[sid].discountPercentage || 0)) {
                            map[sid] = o;
                        }
                    }
                }
                setOfferByStall(map);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchStalls();
    }, []);

    // Filter and sort stalls based on criteria
    const processedStalls = stalls
        .sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'rating') {
                // For now, we'll use a default rating since the API doesn't return ratings for stalls
                return 0; // Will be updated when ratings are available
            } else if (sortBy === 'discount') {
                const discountA = offerByStall[a._id]?.discountPercentage || 0;
                const discountB = offerByStall[b._id]?.discountPercentage || 0;
                return discountB - discountA;
            }
            return 0;
        });

    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-4 text-gray-900">Explore Food Stalls</h1>
                        <div className="max-w-md mx-auto relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search for biryani, waffle or sandwich"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-900"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, index) => (
                            <StallSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-4 text-gray-900">Explore Food Stalls</h1>
                    <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search for biryani, waffle or sandwich"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-900"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-700"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="discount">Sort by Discount</option>
                            </select>
                            <button
                                onClick={() => setFilterOpen(!filterOpen)}
                                className={`border rounded-full px-4 py-2 flex items-center transition-colors ${
                                    filterOpen 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : 'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                            >
                                <Clock size={16} className="mr-1" /> {filterOpen ? 'Open Only' : 'All'}
                            </button>
                        </div>
                    </div>
                </div>
                
                {processedStalls.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <ShoppingCart className="mx-auto w-16 h-16 text-gray-300 mb-4" />
                        <h2 className="text-xl font-bold mb-2">No stalls found</h2>
                        <p>Try adjusting your search query</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {processedStalls.map((stall) => (
                            <Link to={`/stalls/${stall._id}`} key={stall._id} className="group">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:border-yellow-200">
                                    <div className="relative">
                                        <img 
                                            src={stall.image || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                                            alt={stall.name} 
                                            className="w-full h-52 object-cover transition duration-500 group-hover:scale-105"
                                        />
                                        {offerByStall[stall._id] && (
                                            <div className="absolute top-3 left-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow-sm">
                                                {offerByStall[stall._id].discountPercentage}% OFF
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-xl font-bold text-gray-900">{stall.name}</h2>
                                            <div className="flex items-center bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded-full font-bold">
                                                <Star size={12} className="mr-1 fill-current" />
                                                <span>4.5</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{stall.description}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StallsPage;