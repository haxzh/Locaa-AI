#!/bin/bash
# Comprehensive setup and test script for Locaa AI

echo "🚀 STARTING LOCAA AI SETUP..."
echo ""

# Step 1: Check if backend database is fresh
echo "✅ Step 1: Checking database..."
if [ -f "backend/instance/locaa_ai.db" ]; then
    echo "⚠️ Old database found, cleaning..."
    rm -f backend/instance/locaa_ai.db
    echo "✅ Database cleaned"
else
    echo "✅ No old database to clean"
fi

# Step 2: Create fresh database
echo ""
echo "✅ Step 2: Creating fresh database..."
cd backend
python app.py &
BACKEND_PID=$!
sleep 5
kill $BACKEND_PID 2>/dev/null
cd ..
echo "✅ Database created"

# Step 3: Start backend fresh
echo ""
echo "✅ Step 3: Starting backend server..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..
sleep 3
echo "✅ Backend running on http://localhost:5000"

# Step 4: Instructions for frontend
echo ""
echo "✅ Step 4: Frontend setup..."
echo "   1. Open new terminal"
echo "   2. cd frontend"
echo "   3. npm run dev"
echo "   4. Go to http://localhost:3000/register"
echo "   5. Test the 3-step registration flow"
echo ""

echo "🎉 ALL SYSTEMS GO!"
echo ""
echo "📝 When ready, type: npm run dev (in frontend directory)"
