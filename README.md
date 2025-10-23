# KidsQuest

A simple web application that generates safe, short activity scenarios ("quests") for children aged 3-10 in seconds. KidsQuest helps parents and caregivers quickly move from "I don't know what to do" to starting an engaging activity by providing AI-generated or manually created quests tailored to the child's age, available time, location, energy level, and available props.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Database Setup](#database-setup)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

KidsQuest is an MVP (Minimum Viable Product) web application designed for Polish-speaking parents and caregivers. The application focuses on reducing decision friction by providing:

- **AI-powered quest generation** based on customizable parameters
- **Manual quest creation** for personal activity ideas
- **Quest management** with favorites, filtering, and completion tracking
- **Safety-first content policy** ensuring all activities are age-appropriate and safe
- **Quick preset options** for instant quest generation

### Key Features

- Generate quests for children aged 3-10 years (grouped as 3-4, 5-6, 7-8, 9-10 years)
- Customize by time (default 30 minutes), location (home/outdoor), energy level, and available props
- Each quest includes a hook, 3 steps, easier/harder variants, and safety notes
- User accounts with email/password and Google OAuth authentication
- Quest library with favorites, filtering, and completion tracking
- Content safety validation with hard-ban and soft-ban policies

### Business Goals

- **Start Rate ≥ 75%**: At least 75% of generated quests are accepted and started
- **AI Share ≥ 75%**: At least 75% of started quests come from AI generation
- **Zero incidents**: No hard-banned content in production

## Tech Stack

### Frontend
- **Astro 5** - Fast, efficient web application framework with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static typing and better IDE support
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Accessible React component library

### Backend
- **Supabase** - Complete backend solution providing:
  - PostgreSQL database
  - User authentication
  - Backend-as-a-Service SDK

### AI Integration
- **Openrouter.ai** - Access to multiple AI models (OpenAI, Anthropic, Google, etc.)

### Development & Deployment
- **GitHub Actions** - CI/CD pipelines
- **Netlify** - Application hosting with Git-based deployment
- **ESLint & Prettier** - Code quality and formatting
- **Husky** - Git hooks for code quality

## Getting Started Locally

### Prerequisites

- Node.js version 22.14.0 (specified in `.nvmrc`)
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mvp
   ```

2. **Use the correct Node.js version**
   ```bash
   nvm use
   # or
   nvm install 22.14.0 && nvm use 22.14.0
   ```

3. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

### Environment Configuration

You'll need to configure the following services:
- **Supabase**: Database and authentication
- **Openrouter.ai**: AI model access for quest generation

Refer to `.env.example` for required environment variables.

## Database Setup

KidsQuest uses **PostgreSQL** via **Supabase** for data storage and authentication.

### Local Database Setup

1. **Install Supabase CLI**
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # Windows (via Scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

2. **Start local Supabase instance**
   ```bash
   supabase start
   ```
   
   This will start local Docker containers and apply all migrations automatically.

3. **Access Supabase Studio**
   
   Open your browser at `http://localhost:54323` to view tables, run SQL queries, and manage data.

4. **Copy connection details**
   
   After `supabase start`, copy the `API URL` and `anon key` to your `.env.local` file:
   ```
   PUBLIC_SUPABASE_URL=http://localhost:54321
   PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

### Database Schema

The database consists of:
- **User tables**: profiles (with default preferences)
- **Quest tables**: quests, quest_props (many-to-many with props)
- **Dictionary tables**: age_groups, props, content_policy_rules
- **Telemetry**: events (90-day retention)

All tables are protected by Row Level Security (RLS) policies.

📄 **Detailed schema documentation**: [`/supabase/README.md`](supabase/README.md)  
📋 **Complete database plan**: [`/.ai/db-plan.md`](.ai/db-plan.md)

### Database Migrations

Migrations are located in `/supabase/migrations/` and applied automatically:

1. `20251011000001_create_types_and_enums.sql` - ENUM types
2. `20251011000002_create_tables.sql` - Table definitions
3. `20251011000003_create_indexes.sql` - Performance indexes
4. `20251011000004_create_functions_and_triggers.sql` - Functions and triggers
5. `20251011000005_enable_rls.sql` - RLS policies
6. `20251011000006_seed_reference_data.sql` - Dictionary data

**Useful commands**:
```bash
# Reset and reapply all migrations
supabase db reset

# Generate TypeScript types from database
supabase gen types typescript --local > src/db/database.types.ts

# View migration status
supabase migration list

# Stop local instance
supabase stop
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code analysis
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

## Deployment

### Hosting Platform: Netlify

KidsQuest is deployed on **Netlify** using GitHub Actions for CI/CD.

#### Deployment Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- **Pull Requests** (`.github/workflows/pull-request.yml`):
  - Linting
  - Unit tests with coverage
  - Automated status comments

- **Production Deployment** (`.github/workflows/master.yml`):
  - Linting
  - Unit tests with coverage
  - Build
  - Automated deployment to Netlify
  - Status notifications

Every push to `main` branch automatically triggers the full CI/CD pipeline and deploys to production.

#### Quick Setup

**1. Prerequisites:**
- Netlify account and project created
- GitHub repository with Actions enabled

**2. Configure GitHub Secrets:**

Add these secrets in GitHub repository settings (Settings > Secrets and variables > Actions):

```
PUBLIC_SUPABASE_URL          # Supabase project URL
PUBLIC_SUPABASE_ANON_KEY     # Supabase public (anon) key
OPENROUTER_API_KEY           # OpenRouter API key
NETLIFY_SITE_ID              # Netlify site ID
NETLIFY_AUTH_TOKEN           # Netlify personal access token
```

**3. Configure Netlify:**

Add environment variables in Netlify dashboard (Site settings > Environment variables):

```
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
OPENROUTER_API_KEY
```

**4. Deploy:**

Push to `main` branch:
```bash
git push origin main
```

The GitHub Actions workflow will automatically build and deploy to Netlify.

📄 **Detailed deployment guide**: [`.github/DEPLOYMENT.md`](.github/DEPLOYMENT.md)

#### Technical Configuration

**Adapter:**

The project uses `@astrojs/netlify` adapter for SSR support:

```javascript
// astro.config.mjs
import netlify from '@astrojs/netlify';

export default defineConfig({
  adapter: netlify(),
  output: 'server'
});
```

**Build Configuration:**

Build settings are defined in `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22.14.0"
```

#### Local Testing

Test the production build locally:

```bash
npm run build
npm run preview
```

#### Why Netlify?

**Key Advantages:**
- **Excellent Astro support** - Official adapter maintained by Astro core team
- **Automatic preview deployments** - Every PR gets a unique preview URL
- **Edge network** - Global CDN for fast content delivery
- **Predictable pricing** - Clear $19/month Pro tier for commercial use

**Pricing:**
- **Starter (Free)**: 100 GB bandwidth - Non-commercial use only
- **Pro ($19/month)**: 1 TB bandwidth - Commercial use allowed

⚠️ **Important**: For commercial projects, the **Pro plan ($19/month) is required**.

📄 **Full hosting analysis**: [`/.ai/hosting-analysis.md`](.ai/hosting-analysis.md)

## Project Scope

### Included in MVP

✅ **Core Features**
- AI quest generation with customizable parameters
- Manual quest creation
- User authentication (email/password + Google OAuth)
- Quest management (save, favorite, complete, delete)
- Content safety validation
- Responsive web interface
- Basic telemetry and error handling

✅ **Quest Parameters**
- Age groups: 3-4, 5-6, 7-8, 8-9, 10 years
- Time: customizable (default 30 minutes)
- Location: home or outdoor (safe locations only)
- Energy level: low, medium, high
- Props: blocks, drawing, paper+pencil, storytelling, puzzles, toy cars, no props

### Explicitly Out of Scope

❌ **Not in MVP**
- Multi-language support (Polish only)
- Social sharing and community features
- Multiple child profiles
- Gamification (points, levels, badges)
- Native mobile apps (iOS/Android)
- Quest illustration generation
- Advanced analytics and BI dashboards
- Content editing and regeneration (except generating new quest with same parameters)
- Text-to-speech and pictograms
- Calendar integration and reminders

## Project Status

🚧 **Current Phase**: MVP Development

The project is in active development with a 3-week timeline. The focus is on delivering a functional, safe, and user-friendly quest generation platform for Polish-speaking families.

### Success Metrics Being Tracked
- Start Rate (target ≥ 75%)
- AI Share (target ≥ 75%)
- Completion Rate
- Content Safety (zero hard-ban incidents)
- Time-to-First-Start
- Error Rate

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Target Audience**: Parents and caregivers of children aged 3-10 years  
**Language**: Polish  
**Platform**: Web (desktop and mobile browsers)
