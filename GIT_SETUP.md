# Git Setup Guide

## Step 1: Install Git (if not installed)

### Windows
1. Download Git from: https://git-scm.com/download/win
2. Run the installer
3. Restart your terminal/PowerShell

### Verify Installation
```bash
git --version
```

## Step 2: Configure Git (First Time Only)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 3: Initialize Repository

```bash
# Navigate to your project directory
cd C:\Users\moahm\OneDrive\Desktop\demoattendee

# Initialize Git repository
git init

# Check status
git status
```

## Step 4: Create .gitignore (Already Created)

The `.gitignore` file is already set up to exclude:
- `node_modules/`
- `.env` files
- `.next/` build files
- Database files
- Other sensitive/unnecessary files

## Step 5: Create GitHub Repository

1. Go to https://github.com
2. Click the "+" icon → "New repository"
3. Name it: `demoattendee` (or your preferred name)
4. **Don't** initialize with README, .gitignore, or license
5. Click "Create repository"

## Step 6: Connect Local Repository to GitHub

```bash
# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Event Participant Management Dashboard"

# Add remote repository (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/demoattendee.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 7: Set Up GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

### Required Secrets:

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `DATABASE_URL` | Your Supabase PostgreSQL connection string | From Supabase dashboard → Settings → Database |
| `VERCEL_TOKEN` | Vercel deployment token | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel project ID | Vercel Dashboard → Project Settings |
| `DEPLOYMENT_URL` | Your production URL | Your deployed app URL (e.g., https://yourapp.vercel.app) |

## Step 8: Verify Setup

```bash
# Check remote connection
git remote -v

# Check branches
git branch

# View commit history
git log --oneline
```

## Daily Workflow

### Making Changes

```bash
# Check what files changed
git status

# Add specific files
git add src/app/page.tsx

# Or add all changes
git add .

# Commit with descriptive message
git commit -m "Add new feature: dashboard improvements"

# Push to GitHub
git push origin main
```

### Working with Branches

```bash
# Create a new branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push branch to GitHub
git push origin feature/new-feature

# Switch back to main
git checkout main

# Merge feature branch
git merge feature/new-feature
```

## Troubleshooting

### "Git is not recognized"
- Install Git from https://git-scm.com/download/win
- Restart your terminal after installation

### "Permission denied"
- Check your GitHub credentials
- Use Personal Access Token if 2FA is enabled

### "Remote origin already exists"
```bash
# Remove existing remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/YOUR_USERNAME/demoattendee.git
```

### "Failed to push"
```bash
# Pull latest changes first
git pull origin main --rebase

# Then push
git push origin main
```

## Next Steps

1. ✅ Repository initialized
2. ✅ Connected to GitHub
3. ✅ Secrets configured
4. ✅ CI/CD pipeline ready
5. 🚀 Start deploying!

See `DEPLOYMENT.md` for deployment instructions.


