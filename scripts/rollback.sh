#!/bin/bash

# Rollback script
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/rollback.sh <tag-or-commit>"
  echo "Example: ./scripts/rollback.sh backup-20241120-143000"
  exit 1
fi

ROLLBACK_TO=$1

echo "⚠️  WARNING: This will rollback to $ROLLBACK_TO"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Rollback cancelled"
  exit 1
fi

# Checkout the specified version
echo "📦 Checking out version: $ROLLBACK_TO"
git checkout "$ROLLBACK_TO"

# Install dependencies
echo "📥 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build application
echo "🏗️ Building application..."
npm run build

# Deploy rolled back version
echo "🌐 Deploying rolled back version..."
# Add your deployment command here
# Example for Vercel: vercel --prod

echo "✅ Rollback completed!"
echo "📌 Current version: $ROLLBACK_TO"

