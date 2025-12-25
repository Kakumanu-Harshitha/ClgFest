import { Link, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useRef, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { LogOut, ShoppingBag, User, Menu, X } from 'lucide-react';
import CartContext from '../context/CartContext';

const Header = ({ darkModeToggle }) => {
    const { user, logout } = useContext(AuthContext);
    const { getCartItemCount } = useContext(CartContext);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const cartItemCount = getCartItemCount();

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-8">
                    <Link to="/" className="text-3xl font-black italic tracking-tighter text-yellow-600 hover:text-yellow-500 transition">
                        DICTATORS
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-8">
                    <Link to="/stalls" className="text-gray-600 hover:text-yellow-600 font-medium transition">Explore</Link>
                    
                    {user ? (
                        <div className="flex items-center space-x-6">
                            {user.role === 'customer' && (
                                <Link to="/cart" className="relative text-gray-600 hover:text-yellow-600 transition">
                                    <ShoppingBag size={24} />
                                    {cartItemCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </Link>
                            )}
                            <div className="relative" ref={menuRef}>
                                <button 
                                    className="flex items-center space-x-2 text-gray-600 hover:text-yellow-600 transition"
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                >
                                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium">{user.name}</span>
                                </button>
                                <div className={`absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl py-2 z-50 ${menuOpen ? 'block' : 'hidden'}`}>
                                    <div className="px-4 py-2 border-b border-gray-100 mb-2">
                                        <p className="text-sm text-gray-500">Signed in as</p>
                                        <p className="font-bold text-gray-900 truncate">{user.email}</p>
                                    </div>
                                    <Link to="/profile" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-yellow-600 transition">Profile</Link>
                                    {user.role === 'customer' && <Link to="/customer-dashboard" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-yellow-600 transition">Dashboard</Link>}
                                    {user.role === 'customer' && <Link to="/my-orders" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-yellow-600 transition">My Orders</Link>}
                                    {user.role === 'admin' && <Link to="/admin" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-yellow-600 transition">Admin Panel</Link>}
                                    {user.role === 'stall_owner' && <Link to="/stall-owner" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-yellow-600 transition">Stall Dashboard</Link>}
                                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-50 transition flex items-center">
                                        <LogOut size={16} className="mr-2" /> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-6">
                            <Link to="/login" className="text-gray-600 hover:text-yellow-600 font-medium transition">Log in</Link>
                            <Link to="/register" className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition shadow-sm">Sign up</Link>
                        </div>
                    )}
                </nav>

                {/* Mobile menu button */}
                <div className="md:hidden flex items-center space-x-4">
                    {user && user.role === 'customer' && (
                        <Link to="/cart" className="relative text-gray-600">
                            <ShoppingBag size={24} />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </Link>
                    )}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-gray-600"
                    >
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 animate-fadeIn">
                    <div className="flex flex-col space-y-4">
                        <Link to="/stalls" className="text-gray-600 text-lg py-2" onClick={() => setMobileMenuOpen(false)}>Explore Stalls</Link>
                        {user ? (
                            <>
                                <Link to="/profile" className="text-gray-600 text-lg py-2" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                                {user.role === 'customer' && <Link to="/my-orders" className="text-gray-600 text-lg py-2" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>}
                                <button onClick={handleLogout} className="text-red-500 text-lg py-2 text-left">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 text-lg py-2" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                                <Link to="/register" className="bg-yellow-500 text-black px-4 py-3 rounded-lg font-bold text-center" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;