# Deployment Guide

## Quick Start

### First Time Setup

1. **Initialize Git Repository**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Create GitHub Repository**
   - Go to GitHub and create a new repository
   - Copy the repository URL

3. **Connect Local Repository**
```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

4. **Set Up GitHub Secrets**
   - Go to Repository Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `DATABASE_URL` - Your Supabase connection string
     - `VERCEL_TOKEN` - Get from Vercel dashboard
     - `VERCEL_ORG_ID` - Get from Vercel dashboard
     - `VERCEL_PROJECT_ID` - Get from Vercel dashboard
     - `DEPLOYMENT_URL` - Your production URL

## Deployment Workflow

### Automatic Deployment

1. **Push to Main Branch**
```bash
git checkout main
git pull origin main
# Make your changes
git add .
git commit -m "Your commit message"
git push origin main
```

2. **CI/CD Pipeline Automatically:**
   - Runs linting
   - Builds the application
   - Deploys to production

### Manual Deployment

```bash
npm run deploy production
```

## Rollback Procedures

### Option 1: GitHub Actions Rollback (Recommended)

1. Go to GitHub Actions tab
2. Select "Rollback Deployment" workflow
3. Click "Run workflow"
4. Enter the backup tag (e.g., `backup-20241120-143000`)
5. Click "Run workflow"

### Option 2: Script Rollback

```bash
# List available backup tags
git tag | grep backup

# Rollback to specific tag
npm run deploy:rollback backup-20241120-143000
```

### Option 3: Manual Rollback

```bash
# Find the commit/tag to rollback to
git log --oneline

# Checkout the version
git checkout <commit-hash-or-tag>

# Rebuild and redeploy
npm ci
npm run build
# Deploy using your platform's method
```

## Creating Backups

Before major deployments, always create a backup tag:

```bash
# Create backup tag
git tag backup-$(date +%Y%m%d-%H%M%S)

# Push tag to remote
git push origin --tags
```

## Database Migrations

### Before Deployment

1. **Check Migration Status**
```bash
npm run db:status
```

2. **Create Migration (if needed)**
```bash
npx prisma migrate dev --name migration_name
```

3. **Test Migrations Locally**
```bash
npm run db:migrate
```

### During Deployment

Migrations run automatically in the CI/CD pipeline. The pipeline will:
- Generate Prisma client
- Run `prisma migrate deploy`
- Build and deploy the application

## Monitoring Deployments

### Check Deployment Status

1. **GitHub Actions**
   - Go to Actions tab
   - View latest workflow runs
   - Check for any failures

2. **Vercel Dashboard**
   - Check deployment logs
   - Monitor build status
   - Review deployment history

### Post-Deployment Checklist

- [ ] Verify application is accessible
- [ ] Check database connections
- [ ] Test critical features
- [ ] Monitor error logs
- [ ] Check performance metrics

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions Logs**
   - Identify the failing step
   - Review error messages
   - Fix issues and push again

2. **Common Issues**
   - Missing environment variables
   - Database connection issues
   - Build errors
   - Migration conflicts

### Rollback Fails

1. **Verify Tag Exists**
```bash
git tag | grep <tag-name>
```

2. **Check Database State**
   - Ensure database is in a rollback-compatible state
   - Review migration history

3. **Manual Intervention**
   - May need to manually revert database migrations
   - Contact database administrator if needed

## Best Practices

1. **Always Test Locally**
   - Test changes before pushing
   - Run migrations locally first
   - Verify build succeeds

2. **Create Backups**
   - Tag before major changes
   - Document what each deployment includes

3. **Monitor After Deployment**
   - Watch for errors
   - Check application health
   - Monitor database performance

4. **Use Feature Branches**
   - Develop in feature branches
   - Test thoroughly before merging
   - Use pull requests for review

## Emergency Procedures

### Immediate Rollback

If production is broken:

1. **Quick Rollback via GitHub Actions**
   - Use the rollback workflow
   - Select the last known good version

2. **Database Issues**
   - Check migration status
   - May need to manually revert migrations
   - Restore from backup if necessary

3. **Contact Team**
   - Notify team members
   - Document the issue
   - Create incident report

