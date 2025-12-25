# Dictators Stalls - Setup Instructions

## Payment Gateway Configuration

To complete the payment integration, please follow these steps:

### 1. Install Dependencies
Run the batch file to install required packages:
```
install-dependencies.bat
```

Alternatively, you can manually install:
- Server: `npm install stripe`
- Client: `npm install @stripe/stripe-js @stripe/elements`

### 2. Configure Environment Variables

Update your `.env` files with real API keys:

**Server (.env in server folder):**
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

**Client (.env in client folder):**
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

### 3. Features Implemented

1. **OTP Authentication System** - Enhanced OTP functionality for registration/login
2. **Payment Integration** - Stripe and Razorpay payment gateways
3. **Offer Management** - Delete button for stall owners to manage offers
4. **Enhanced Homepage** - "WELCOME TO DICTATORS STALLS" with lion animation
5. **Highlighted Offers** - Prominent offers section at the top of homepage

### 4. Running the Application

1. Start the server: `cd server && npm run dev`
2. Start the client: `cd client && npm run dev`

The application is now ready to use with all requested features!