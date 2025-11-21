# Vercel Deployment Guide

Complete step-by-step guide to deploy your Event Participant Management Dashboard to Vercel.

## Prerequisites

- ✅ Vercel account (free tier works)
- ✅ GitHub repository (or Git installed)
- ✅ Supabase database connection string
- ✅ Project working locally

## Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended - easier integration)
4. Authorize Vercel to access your GitHub account

## Step 2: Install Vercel CLI (Optional but Recommended)

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Verify installation
vercel --version
```

## Step 3: Prepare Your Project

### 3.1 Ensure Environment Variables are Set

Create a `.env.local` file (for local testing) with:

```env
DATABASE_URL=your_supabase_connection_string
PRISMA_CLIENT_ENGINE_TYPE=binary
```

### 3.2 Test Build Locally

```powershell
# Generate Prisma client
npx prisma generate

# Test build
npm run build

# If build succeeds, you're ready!
```

## Step 4: Deploy via Vercel Dashboard (Easiest Method)

### 4.1 Import Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. If your GitHub repo is connected:
   - Select your repository: `demoattendee`
   - Click **"Import"**
4. If not connected:
   - Click **"Import Git Repository"**
   - Enter your GitHub repo URL
   - Authorize access if needed

### 4.2 Configure Project

Vercel will auto-detect Next.js. Configure:

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (default)

**Build Command:** 
```
npm run build
```

**Output Directory:** 
```
.next
```

**Install Command:**
```
npm install
```

### 4.3 Environment Variables

**CRITICAL:** Add these environment variables in Vercel:

1. Click **"Environment Variables"**
2. Add each variable:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `DATABASE_URL` | Your Supabase connection string | Production, Preview, Development |
| `PRISMA_CLIENT_ENGINE_TYPE` | `binary` | Production, Preview, Development |

**How to add:**
- Click **"Add"** for each variable
- Paste the value
- Select all environments (Production, Preview, Development)
- Click **"Save"**

### 4.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. You'll see build logs in real-time

## Step 5: Post-Deployment Setup

### 5.1 Run Database Migrations

After first deployment, run migrations:

**Option A: Via Vercel CLI**
```powershell
# Login to Vercel
vercel login

# Link project
vercel link

# Run migrations
vercel env pull .env.local
npx prisma migrate deploy
```

**Option B: Via Supabase Dashboard**
- Go to Supabase SQL Editor
- Run your migration SQL manually

**Option C: Via Vercel Functions (Recommended)**

Create a migration script that runs automatically.

### 5.2 Verify Deployment

1. Visit your deployment URL (e.g., `https://demoattendee.vercel.app`)
2. Check if the app loads
3. Test key features:
   - Dashboard loads
   - Can import participants
   - Database connections work

## Step 6: Get Vercel Project IDs (For CI/CD)

For GitHub Actions integration:

1. Go to **Project Settings** → **General**
2. Copy:
   - **Project ID** → Use for `VERCEL_PROJECT_ID` secret
   - **Team ID** → Use for `VERCEL_ORG_ID` secret

3. Create API Token:
   - Go to **Settings** → **Tokens**
   - Click **"Create Token"**
   - Name it: `GitHub Actions`
   - Copy token → Use for `VERCEL_TOKEN` secret

## Step 7: Set Up Automatic Deployments

### 7.1 Connect GitHub Repository

If not already connected:

1. Go to **Project Settings** → **Git**
2. Connect your GitHub repository
3. Select branch: `main` (production)
4. Enable **"Automatic deployments"**

### 7.2 Configure Branch Deployments

- **Production Branch:** `main`
- **Preview Branches:** All other branches
- **Auto-deploy:** Enabled

## Step 8: Update GitHub Secrets

Add Vercel secrets to GitHub (for CI/CD):

1. Go to GitHub → Your Repository → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret Name | Value | Where to Find |
|------------|-------|---------------|
| `VERCEL_TOKEN` | Your Vercel API token | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Your Team/Org ID | Vercel → Project Settings → General |
| `VERCEL_PROJECT_ID` | Your Project ID | Vercel → Project Settings → General |

## Step 9: Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically configure SSL

## Troubleshooting

### Build Fails: "Prisma Client not generated"

**Solution:**
Add to `package.json` build script:
```json
"build": "prisma generate && cross-env PRISMA_CLIENT_ENGINE_TYPE=binary next build"
```

Or add to Vercel build settings:
- **Build Command:** `npx prisma generate && npm run build`

### Build Fails: "DATABASE_URL not found"

**Solution:**
- Verify environment variables are set in Vercel
- Check they're enabled for Production environment
- Redeploy after adding variables

### Database Connection Errors

**Solution:**
- Verify `DATABASE_URL` is correct
- Check Supabase allows connections from Vercel IPs
- Ensure SSL mode: `?sslmode=require` in connection string

### Migration Issues

**Solution:**
Run migrations manually:
```powershell
vercel env pull .env.local
npx prisma migrate deploy
```

Or create a Vercel serverless function to run migrations.

## Advanced: Automatic Migrations

Create `api/migrate/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Simple auth check (use better auth in production)
  if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await execAsync('npx prisma migrate deploy');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

Then call: `POST /api/migrate` with authorization header.

## Quick Deploy Checklist

- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Project imported to Vercel
- [ ] Environment variables added:
  - [ ] `DATABASE_URL`
  - [ ] `PRISMA_CLIENT_ENGINE_TYPE`
- [ ] Build successful
- [ ] Database migrations run
- [ ] App accessible at Vercel URL
- [ ] GitHub secrets configured (for CI/CD)
- [ ] Automatic deployments enabled

## Deployment URLs

After deployment, you'll get:

- **Production:** `https://your-project.vercel.app`
- **Preview:** `https://your-project-git-branch.vercel.app`
- **Custom Domain:** `https://yourdomain.com` (if configured)

## Next Steps

1. ✅ App deployed to Vercel
2. ✅ Environment variables configured
3. ✅ Database connected
4. 🚀 Start using your deployed app!

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Vercel Support: https://vercel.com/support

