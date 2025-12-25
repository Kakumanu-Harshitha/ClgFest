@echo off
echo Installing server dependencies...
cd server
npm install stripe
cd ..

echo Installing client dependencies...
cd client
npm install @stripe/stripe-js @stripe/elements
cd ..

echo Installation complete! You can now run the application.
pause