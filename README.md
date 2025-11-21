# Event Participant Management Dashboard

A modern Next.js application for managing event participants, tracking attendance, and managing blocklists.

## Features

- 📊 **Dashboard Overview** - Visual analytics and insights
- 📥 **Import & Attendance** - Import participants and record attendance
- 📅 **Event History** - Track all events and their statistics
- ⚠️ **No-Show History** - Monitor no-show incidents
- 🚫 **Blocklist Management** - Manage permanently blocklisted participants
- 🔄 **Auto-Blocklist** - Automatically blocklist participants with 2+ no-shows

## Tech Stack

- **Framework**: Next.js 16
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Styling**: CSS with modern dark theme
- **File Processing**: XLSX

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL database (Supabase recommended)
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd demoattendee
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add:
```
DATABASE_URL=your_supabase_connection_string
PRISMA_CLIENT_ENGINE_TYPE=binary
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate deploy
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Git Setup

### Initial Setup

1. Initialize Git (if not already):
```bash
git init
```

2. Add remote repository:
```bash
git remote add origin <your-github-repo-url>
```

3. Create and switch to main branch:
```bash
git checkout -b main
```

4. Stage and commit files:
```bash
git add .
git commit -m "Initial commit: Event Participant Management Dashboard"
```

5. Push to remote:
```bash
git push -u origin main
```

### Branch Strategy

- `main` - Production branch (auto-deploys)
- `develop` - Development branch
- Feature branches: `feature/feature-name`
- Hotfix branches: `hotfix/issue-name`

## CI/CD Pipeline

### GitHub Actions Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on push to `main` or `develop`
   - Lints code
   - Runs tests
   - Builds application
   - Deploys to production (main branch only)

2. **Rollback Workflow** (`.github/workflows/rollback.yml`)
   - Manual trigger for rollbacks
   - Deploys previous version
   - Creates rollback tags

### Required Secrets

Add these secrets in GitHub Settings > Secrets:

- `DATABASE_URL` - PostgreSQL connection string
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `DEPLOYMENT_URL` - Production deployment URL

### Deployment

#### Automatic Deployment

- Push to `main` branch triggers automatic deployment
- CI pipeline runs tests, builds, and deploys

#### Manual Deployment

```bash
npm run deploy production
```

#### Rollback

**Option 1: Using GitHub Actions**
1. Go to Actions tab
2. Select "Rollback Deployment" workflow
3. Click "Run workflow"
4. Enter the version tag to rollback to
5. Click "Run workflow"

**Option 2: Using Script**
```bash
npm run deploy:rollback <tag-or-commit>
```

**Option 3: Manual Rollback**
```bash
git checkout <backup-tag>
npm ci
npm run build
# Deploy using your platform's method
```

## Database Management

### Migrations

```bash
# Check migration status
npm run db:status

# Apply migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

### Backup

Before major deployments, create a backup tag:
```bash
git tag backup-$(date +%Y%m%d-%H%M%S)
git push origin --tags
```

## Project Structure

```
demoattendee/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI/CD pipeline
│       └── rollback.yml     # Rollback workflow
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── scripts/
│   ├── deploy.sh            # Deployment script
│   └── rollback.sh          # Rollback script
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   ├── page.tsx         # Main dashboard
│   │   └── globals.css      # Global styles
│   └── lib/
│       ├── prisma.ts        # Prisma client
│       ├── excel.ts         # Excel utilities
│       └── validators.ts    # Validation schemas
└── package.json
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `PRISMA_CLIENT_ENGINE_TYPE` | Prisma engine type (`binary` or `library`) | Yes |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to production
- `npm run deploy:rollback` - Rollback to previous version
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:status` - Check migration status

## Troubleshooting

### Prisma Client Engine Error
Ensure `PRISMA_CLIENT_ENGINE_TYPE=binary` is set in your environment.

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Supabase connection settings
- Ensure SSL mode is enabled: `?sslmode=require`

### Build Failures
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Regenerate Prisma client: `npm run db:generate`

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Commit: `git commit -m "Add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

Private - All rights reserved

## Support

For issues and questions, please open an issue in the repository.
