#!/bin/bash

# YM Soccer Database Setup Script
# This script helps you set up the database and load data

echo "🏟️  YM Soccer League - Database Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local file not found"
    echo ""
    echo "Creating .env.local template..."
    cat > .env.local << 'EOF'
# Supabase Configuration
# Replace these with your actual Supabase credentials

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Service role key (for data loading - keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Admin password
NEXT_PUBLIC_ADMIN_PASSWORD=sport2233
EOF
    echo "✅ Created .env.local template"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your Supabase credentials!"
    echo "   1. Go to your Supabase project settings"
    echo "   2. Copy Project URL and API keys"
    echo "   3. Paste them into .env.local"
    echo ""
    read -p "Press Enter when you've updated .env.local..."
fi

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules/@supabase" ] || [ ! -d "node_modules/csv-parse" ]; then
    echo "Installing required packages..."
    npm install @supabase/supabase-js csv-parse
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Check if CSV files exist
echo "📄 Checking CSV files..."
if [ ! -f "league_data/rosters.csv" ]; then
    echo "❌ Error: league_data/rosters.csv not found"
    exit 1
fi
echo "✅ Found rosters.csv"

if [ ! -f "league_data/schedule.csv" ]; then
    echo "❌ Error: league_data/schedule.csv not found"
    exit 1
fi
echo "✅ Found schedule.csv"
echo ""

# Check if schema.sql exists
if [ ! -f "database/schema.sql" ]; then
    echo "❌ Error: database/schema.sql not found"
    exit 1
fi
echo "✅ Found database schema"
echo ""

# Instructions
echo "📋 Next Steps:"
echo ""
echo "1. Set up your Supabase database schema:"
echo "   - Go to your Supabase project (https://app.supabase.com)"
echo "   - Navigate to SQL Editor"
echo "   - Copy the contents of 'database/schema.sql'"
echo "   - Paste and run in the SQL Editor"
echo ""
echo "2. Load your data:"
echo "   node database/loadData.js"
echo ""
echo "3. Start your Next.js application:"
echo "   npm run dev"
echo ""

read -p "Have you already run the schema.sql in Supabase? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Loading data into Supabase..."
    echo ""
    node database/loadData.js
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✨ Setup complete! ✨"
        echo ""
        echo "You can now run: npm run dev"
    else
        echo ""
        echo "❌ Data load failed. Please check the error messages above."
        echo "   Common issues:"
        echo "   - Incorrect Supabase credentials in .env.local"
        echo "   - Schema not run in Supabase SQL Editor"
        echo "   - Network connection issues"
    fi
else
    echo ""
    echo "Please run the schema.sql first, then run this script again."
    echo "Or manually run: node database/loadData.js"
fi

