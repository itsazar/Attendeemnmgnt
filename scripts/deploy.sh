#!/bin/bash

# Deployment script with rollback capability
set -e

ENVIRONMENT=${1:-production}
VERSION=${2:-latest}

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Check if we're on the right branch
if [ "$ENVIRONMENT" == "production" ] && [ "$(git branch --show-current)" != "main" ]; then
  echo "❌ Production deployments must be from main branch"
  exit 1
fi

# Create a backup tag before deployment
BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup tag: $BACKUP_TAG"
git tag "$BACKUP_TAG"
git push origin "$BACKUP_TAG"

# Install dependencies
echo "📥 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build application
echo "🏗️ Building application..."
npm run build

# Deploy (adjust based on your hosting platform)
if [ "$ENVIRONMENT" == "production" ]; then
  echo "🌐 Deploying to production..."
  # Add your deployment command here
  # Example for Vercel: vercel --prod
  # Example for other platforms: add your deployment command
fi

echo "✅ Deployment completed successfully!"
echo "📌 Backup tag created: $BACKUP_TAG"
echo "💡 To rollback, use: git checkout $BACKUP_TAG && npm run deploy:rollback"

