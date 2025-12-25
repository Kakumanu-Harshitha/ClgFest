import { useEffect, useState, useContext } from 'react';
import apiClient from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProfilePage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        const fetchProfile = async () => {
            try {
                const { data } = await apiClient.get('/api/auth/profile', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setProfile(data);
            } catch {
                // If token failed, redirect to login
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Loading Profile...</h2>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Profile not available</h2>
                <button
                    onClick={() => navigate('/login')}
                    className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                    Login
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">My Profile</h1>
            <div className="bg-white rounded-lg shadow p-6 space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">Name</span>
                    <span className="font-semibold">{profile.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Role</span>
                    <span className="font-semibold capitalize">{profile.role}</span>
                </div>
                {profile.email && (
                    <div className="flex justify-between">
                        <span className="text-gray-600">Email</span>
                        <span className="font-semibold">{profile.email}</span>
                    </div>
                )}
                {profile.phone && (
                    <div className="flex justify-between">
                        <span className="text-gray-600">Phone</span>
                        <span className="font-semibold">{profile.phone}</span>
                    </div>
                )}
                {profile.branch && (
                    <div className="flex justify-between">
                        <span className="text-gray-600">Branch</span>
                        <span className="font-semibold">{profile.branch}</span>
                    </div>
                )}
                {profile.college && (
                    <div className="flex justify-between">
                        <span className="text-gray-600">College</span>
                        <span className="font-semibold">{profile.college}</span>
                    </div>
                )}
            </div>

            {user?.role === 'customer' && (
                <div className="mt-6 text-right">
                    <Link to="/my-orders" className="text-indigo-600 hover:underline">View My Orders</Link>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
