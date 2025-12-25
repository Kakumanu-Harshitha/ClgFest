import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import StallsPage from './pages/StallsPage';
import StallDetailsPage from './pages/StallDetailsPage';
import CartPage from './pages/CartPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import MyOrdersPage from './pages/MyOrdersPage';
import StallOwnerDashboard from './pages/StallOwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import { CartProvider } from './context/CartContext';
import ProfilePage from './pages/ProfilePage';
import { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

// Dark Mode Context
const DarkModeContext = createContext();

const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirects if already logged in)
const PublicRoute = ({ children, redirectPath = "/" }) => {
  const { user } = useContext(AuthContext);
  return !user ? children : <Navigate to={redirectPath} />;
};

// Redirect if already logged in
const RedirectToApp = () => {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to="/" /> : <Navigate to="/login" />;
};

// Toast Notification Component
const ToastNotification = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[1000] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-enter px-4 py-3 rounded-lg shadow-lg text-sm ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : toast.type === 'error' 
                ? 'bg-red-500 text-white' 
                : toast.type === 'warning' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-blue-500 text-white'
          }`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

// Dark Mode Toggle Component
const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
};

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </DarkModeProvider>
  );
}

// Separate component to access dark mode context
const AppContent = () => {
  const { darkMode } = useDarkMode();
  
  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Header darkModeToggle={<DarkModeToggle />} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            <PublicRoute redirectPath="/"><LoginPage /></PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute redirectPath="/"><RegisterPage /></PublicRoute>
          } />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/stalls" element={<ProtectedRoute><StallsPage /></ProtectedRoute>} />
          <Route path="/stalls/:id" element={<ProtectedRoute><StallDetailsPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
          <Route path="/stall-owner" element={<ProtectedRoute><StallOwnerDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/customer-dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<div className="p-8 text-center"><h2 className="text-2xl font-bold">Page Not Found</h2><p className="text-gray-600 mt-2">The page you requested does not exist.</p></div>} />
        </Routes>
      </main>
      <footer className="bg-gray-800 dark:bg-gray-700 text-white py-6 text-center">
        <p>&copy; COLORIDO 2K25. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Toast Provider Component
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const id = Date.now() + Math.random();
    const newToast = { id, type, message };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Make addToast globally available
  useEffect(() => {
    window.showToast = (type, message) => addToast(type, message);
  }, []);

  return (
    <>
      {children}
      <ToastNotification toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default App;