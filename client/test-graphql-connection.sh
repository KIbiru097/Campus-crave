#!/bin/bash

echo "🔍 TESTING GRAPHQL CONNECTION"
echo "============================="

echo ""
echo "1️⃣ Testing GraphQL endpoint..."
curl -X POST https://campus-crave-1.onrender.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ cafes { id name location } }"}' | jq '.'

echo ""
echo "2️⃣ Testing authentication mutation..."
curl -X POST https://campus-crave-1.onrender.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(input: { email: \"test2@student.com\", password: \"Test123\" }) { token user { id username } } }"
  }' | jq '.'

echo ""
echo "✅ Test complete!"
