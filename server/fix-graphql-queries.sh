#!/bin/bash

echo "🔧 FIXING GRAPHQL QUERIES"
echo "========================="

echo ""
echo "1️⃣ Searching for 'deleted_at' in frontend code..."
cd ~/vercel/Campus-crave/client
grep -r "deleted_at" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || echo "No 'deleted_at' found in frontend"

echo ""
echo "2️⃣ Testing cafe query without deleted_at..."
curl -s -X POST https://campus-crave-1.onrender.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ cafes { id name location } }"}' | jq '.'

echo ""
echo "3️⃣ Testing menu items query without deleted_at..."
curl -s -X POST https://campus-crave-1.onrender.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ menuItems { id name price } }"}' | jq '.'

echo ""
echo "✅ If both work, the issue is in your frontend queries!"
echo "Update your frontend to remove 'deleted_at' from all GraphQL queries."
