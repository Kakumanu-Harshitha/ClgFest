import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ResetPasswordPage = () => {
    const [phone, setPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const { resetPassword } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();
        try {
            await resetPassword(phone, newPassword);
            alert('Password reset successful. Please login.');
            navigate('/login');
        } catch (error) {
            alert(error.response?.data?.message || 'Reset failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Reset Password</h2>

                <form onSubmit={handleReset}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter your registered phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                        Reset Password
                    </button>
                </form>
                 <p className="mt-4 text-center text-sm text-gray-600">
                    Remembered? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
