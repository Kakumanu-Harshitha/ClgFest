import { createContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cartItems');
        try {
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (e) {
            console.error('Error parsing cart from localStorage:', e);
            return [];
        }
    });
    const [stallId, setStallId] = useState(() => {
        const savedStallId = localStorage.getItem('cartStallId');
        return savedStallId && savedStallId !== 'null' && savedStallId !== 'undefined' ? savedStallId : null;
    });

    // Save cart to local storage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            localStorage.setItem('cartStallId', stallId || '');
        } catch (e) {
            console.error('Error saving cart to localStorage:', e);
        }
    }, [cartItems, stallId]);

    const addToCart = (item, currentStallId) => {
        // Check if adding from a different stall
        if (stallId && stallId !== currentStallId && cartItems.length > 0) {
            if (!window.confirm('Adding items from a different stall will clear your current cart. Continue?')) {
                return;
            }
            setCartItems([]);
        }

        // Only update stallId if it's different or not set
        if (!stallId || stallId !== currentStallId) {
            setStallId(currentStallId);
        }

        setCartItems((prevItems) => {
            const existingItem = prevItems.find((i) => i._id === item._id);
            if (existingItem) {
                return prevItems.map((i) =>
                    i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
                );
            } else {
                return [...prevItems, { ...item, quantity: 1 }];
            }
        });
    };

    const removeFromCart = (itemId) => {
        setCartItems((prevItems) => {
            const newItems = prevItems.filter((i) => i._id !== itemId);
            if (newItems.length === 0) setStallId(null);
            return newItems;
        });
    };

    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(itemId);
            return;
        }
        setCartItems((prevItems) =>
            prevItems.map((i) => (i._id === itemId ? { ...i, quantity: newQuantity } : i))
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setStallId(null);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getCartItemCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                stallId,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getCartTotal,
                getCartItemCount
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;