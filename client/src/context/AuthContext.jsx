import { createContext, useState, useContext } from 'react';
import apiClient from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    });

    const login = async (identifier, password, role) => {
        // identifier can be email or phone
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const body = {};
        if (role === 'customer') {
             body.phone = identifier;
        } else {
             body.email = identifier;
        }

        body.password = password;

        const { data } = await apiClient.post('/api/auth/login', body, config);

        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
    };

    const register = async (name, email, phone, password, role, branch, college, otp) => {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const { data } = await apiClient.post(
            '/api/auth/register',
            { name, email, phone, password, role, branch, college }, // Removed otp parameter
            config
        );

        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
    };

    // Removed OTP functionality
    // const requestOTP = async (phone, type) => {
    //     const config = { headers: { 'Content-Type': 'application/json' } };
    //     const { data } = await axios.post('http://localhost:5000/api/auth/request-otp', { phone, type }, config);
    //     return data;
    // };

    const resetPassword = async (phone, newPassword) => {
        const config = { headers: { 'Content-Type': 'application/json' } };
        await apiClient.post('/api/auth/reset-password', { phone, newPassword }, config);
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};
export default AuthContext;
