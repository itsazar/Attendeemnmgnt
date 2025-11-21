# Quick Vercel Deployment Guide

## 🚀 Fastest Way to Deploy

### Method 1: Vercel Dashboard (Recommended - 5 minutes)

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign up/Login with GitHub

2. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Select your `demoattendee` repository
   - Click **"Import"**

3. **Configure Environment Variables**
   - Click **"Environment Variables"**
   - Add:
     ```
     DATABASE_URL = your_supabase_connection_string
     PRISMA_CLIENT_ENGINE_TYPE = binary
     ```
   - Select: Production, Preview, Development
   - Click **"Save"**

4. **Deploy**
   - Click **"Deploy"**
   - Wait 2-5 minutes
   - ✅ Done! Your app is live!

### Method 2: Vercel CLI (For Developers)

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from project directory)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No (first time)
# - Project name? demoattendee
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add DATABASE_URL
# Paste your Supabase connection string
# Select: Production, Preview, Development

vercel env add PRISMA_CLIENT_ENGINE_TYPE
# Enter: binary
# Select: Production, Preview, Development

# Deploy to production
vercel --prod
```

## 📋 Post-Deployment Checklist

- [ ] App loads at Vercel URL
- [ ] Database connection works
- [ ] Can import participants
- [ ] Dashboard shows data
- [ ] Run migrations (if needed)

## 🔧 Run Database Migrations

After first deployment:

**Option 1: Via API (Easiest)**
```powershell
# Set migration secret in Vercel
# Then call:
curl -X POST https://your-app.vercel.app/api/migrate \
  -H "Authorization: Bearer YOUR_MIGRATION_SECRET"
```

**Option 2: Via Vercel CLI**
```powershell
vercel env pull .env.local
npx prisma migrate deploy
```

**Option 3: Via Supabase Dashboard**
- Go to Supabase SQL Editor
- Run migration SQL manually

## 🎯 Your App URL

After deployment, you'll get:
- **Production:** `https://demoattendee.vercel.app`
- **Preview:** `https://demoattendee-git-branch.vercel.app`

## ⚠️ Common Issues

### Build Fails
- Check environment variables are set
- Verify `DATABASE_URL` is correct
- Check build logs in Vercel dashboard

### Database Connection Error
- Verify Supabase connection string
- Check SSL mode: `?sslmode=require`
- Ensure database is accessible

### Migrations Not Run
- Use migration API endpoint
- Or run manually via CLI
- Or run SQL in Supabase dashboard

## 📚 Full Guide

For detailed instructions, see `VERCEL_DEPLOYMENT.md`

## 🎉 Success!

Once deployed:
1. Share your Vercel URL
2. Set up custom domain (optional)
3. Configure GitHub Actions (optional)
4. Start using your app!

