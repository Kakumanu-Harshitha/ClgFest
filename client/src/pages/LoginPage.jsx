import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const LoginPage = () => {
    const [identifier, setIdentifier] = useState(''); // Email or Phone
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer');
    const [isLoading, setIsLoading] = useState(false);
    
    // Removed OTP related state
    // const [otp, setOtp] = useState('');
    // const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
    // const [showOtpInput, setShowOtpInput] = useState(false);
    // const [otpCooldown, setOtpCooldown] = useState(0);
    // const [otpExpiry, setOtpExpiry] = useState(0);
    // const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
    
    // const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const { login, requestOTP, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    // Removed OTP-related useEffect hooks
    // // Handle OTP cooldown timer
    // useEffect(() => {
    //     let cooldownTimer;
    //     if (otpCooldown > 0) {
    //         cooldownTimer = setTimeout(() => {
    //             setOtpCooldown(otpCooldown - 1);
    //         }, 1000);
    //     }
    //     return () => clearTimeout(cooldownTimer);
    // }, [otpCooldown]);

    // // Handle OTP expiry timer
    // useEffect(() => {
    //     let expiryTimer;
    //     if (otpExpiry > 0) {
    //         expiryTimer = setTimeout(() => {
    //             setOtpExpiry(otpExpiry - 1);
    //         }, 1000);
    //     } else if (otpExpiry === 0 && showOtpInput) {
    //         window.showToast('error', 'OTP has expired. Please request a new one.');
    //         setShowOtpInput(false);
    //         setOtpInputs(['', '', '', '', '', '']);
    //         setOtp('');
    //     }
    //     return () => clearTimeout(expiryTimer);
    // }, [otpExpiry, showOtpInput]);

    // Removed OTP-related functions
    // const handleSendOTP = async () => {
    //     if (!identifier) {
    //         window.showToast('error', 'Please enter phone number');
    //         return;
    //     }
    //     if (otpCooldown > 0) {
    //         window.showToast('error', `Please wait ${otpCooldown} seconds before requesting another OTP`);
    //         return;
    //     }
    //     
    //     setIsLoading(true);
    //     try {
    //         await requestOTP(identifier, 'login');
    //         setShowOtpInput(true);
    //         setOtpExpiry(300); // 5 minutes
    //         setOtpCooldown(60); // 60 seconds cooldown
    //         window.showToast('success', 'OTP sent to your phone');
    //     } catch (error) {
    //         window.showToast('error', error.response?.data?.message || 'Failed to send OTP');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    // const handleOtpChange = (index, value) => {
    //     if (/^\d$/.test(value) || value === '') {
    //         const newOtpInputs = [...otpInputs];
    //         newOtpInputs[index] = value;
    //         setOtpInputs(newOtpInputs);
    //         
    //         // Auto-focus to next field
    //         if (value !== '' && index < 5) {
    //             otpRefs[index + 1].current?.focus();
    //         }
    //         
    //         // Update combined OTP value
    //         const combinedOtp = newOtpInputs.join('');
    //         setOtp(combinedOtp);
    //     }
    // };

    // const handleKeyDown = (index, e) => {
    //     if (e.key === 'Backspace' && index > 0 && otpInputs[index] === '') {
    //         otpRefs[index - 1].current?.focus();
    //     }
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setIsLoading(true);
        try {
            await login(identifier, password, role);
            window.showToast('success', 'Login successful!');
        } catch (error) {
            window.showToast('error', error.response?.data?.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.02]">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4 animate-float">🎉</div>
                    <h2 className="text-3xl font-extrabold text-gray-800">Welcome to COLORIDO 2K25</h2>
                    <p className="text-gray-600 mt-2">Login to your account</p>
                </div>
                
                <div className="flex justify-center mb-6 space-x-2">
                    <button 
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${role === 'customer' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        onClick={() => { setRole('customer'); }}
                    >
                        Customer
                    </button>
                    <button 
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${role === 'stall_owner' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        onClick={() => { setRole('stall_owner'); }}
                    >
                        Stall Owner
                    </button>
                    <button 
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${role === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        onClick={() => { setRole('admin'); }}
                    >
                        Admin
                    </button>
                </div>

                {/* Removed OTP login method selection since OTP verification has been disabled */}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            {role === 'customer' ? 'Phone Number' : 'Email Address'}
                        </label>
                        <input
                            type={role === 'customer' ? "text" : "email"}
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder={role === 'customer' ? "Enter phone number" : "Enter email"}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <div className="text-right mt-2">
                            <Link to="/reset-password" className="text-xs text-indigo-600 hover:underline">Forgot Password?</Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-bold disabled:opacity-50"
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline font-bold">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;