# Quick Start Guide

## Prerequisites Checklist

- [ ] Git installed (see `INSTALL_GIT.md`)
- [ ] GitHub account created
- [ ] Node.js installed (already done ✅)
- [ ] Project dependencies installed (already done ✅)

## Step-by-Step Setup

### 1. Install Git (If Not Done)

**If Git is NOT installed:**
- Follow instructions in `INSTALL_GIT.md`
- Download from: https://git-scm.com/download/win
- Restart PowerShell after installation

**Verify Git is installed:**
```powershell
git --version
```

### 2. Configure Git (First Time Only)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Initialize Git Repository

```powershell
# Make sure you're in the project directory
cd C:\Users\moahm\OneDrive\Desktop\demoattendee

# Initialize Git
git init

# Check status
git status
```

### 4. Create Initial Commit

```powershell
# Add all files
git add .

# Create commit
git commit -m "Initial commit: Event Participant Management Dashboard"
```

### 5. Create GitHub Repository

1. Go to https://github.com
2. Click the **"+"** icon in top right
3. Select **"New repository"**
4. Repository name: `demoattendee` (or your choice)
5. Description: "Event Participant Management Dashboard"
6. Choose **Private** or **Public**
7. **DO NOT** check:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
8. Click **"Create repository"**

### 6. Connect Local Repository to GitHub

```powershell
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/demoattendee.git

# Verify remote
git remote -v

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

**Note:** You may be prompted for GitHub credentials:
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Create token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate new token with `repo` permissions

### 7. Set Up GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret:

| Secret Name | Value | Where to Find |
|------------|-------|---------------|
| `DATABASE_URL` | Your Supabase connection string | Supabase Dashboard → Settings → Database → Connection string |
| `VERCEL_TOKEN` | Vercel API token | Vercel Dashboard → Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | Vercel Org ID | Vercel Dashboard → Settings → General → Organization ID |
| `VERCEL_PROJECT_ID` | Vercel Project ID | Vercel Dashboard → Project Settings → General → Project ID |
| `DEPLOYMENT_URL` | Your app URL | After first deployment, your Vercel URL |

### 8. Verify Setup

```powershell
# Check Git status
git status

# View commit history
git log --oneline

# Check remote connection
git remote -v
```

## Common Issues & Solutions

### Issue: "git: command not found"
**Solution:** Install Git (see `INSTALL_GIT.md`) and restart PowerShell

### Issue: "Permission denied" when pushing
**Solution:** 
- Use Personal Access Token instead of password
- Create token: GitHub → Settings → Developer settings → Personal access tokens

### Issue: "Remote origin already exists"
**Solution:**
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/demoattendee.git
```

### Issue: "Failed to push some refs"
**Solution:**
```powershell
git pull origin main --allow-unrelated-histories
git push origin main
```

## Next Steps

Once Git is set up:

1. ✅ Repository initialized
2. ✅ Connected to GitHub  
3. ✅ Secrets configured
4. 🚀 Ready to deploy!

**See `DEPLOYMENT.md` for deployment instructions.**

## Daily Workflow

```powershell
# Make changes to your code...

# Check what changed
git status

# Add changes
git add .

# Commit
git commit -m "Description of changes"

# Push to GitHub (triggers automatic deployment)
git push origin main
```

## Need Help?

- Git installation: See `INSTALL_GIT.md`
- Git setup: See `GIT_SETUP.md`
- Deployment: See `DEPLOYMENT.md`
- General info: See `README.md`

