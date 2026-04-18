# SocialMind 🧠

A multi-agent AI system that researches, writes, and posts content across Facebook, Instagram, TikTok, and YouTube. Built with Next.js, OpenAI (GPT-4o), and Supabase.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fsocialmind&env=OPENAI_API_KEY,NEXT_PUBLIC_APP_URL,ENCRYPTION_KEY&envDescription=OpenAI%20API%20key%20required.%20Generate%20ENCRYPTION_KEY%20with%20%60openssl%20rand%20-hex%2032%60.&project-name=socialmind&repository-name=socialmind)

**⚠️ Update `YOUR_USERNAME` in the button URL above** after pushing to your GitHub, or follow `DEPLOY.md` for step-by-step instructions.

## What's Working

✅ **5 AI agents** powered by GPT-4o — Research, Strategist, Script & Creative, Publisher, Analytics
✅ **Script Studio** generates Veo 3 prompts, Nano Banana prompts, TikTok hooks, Reel scripts, carousels
✅ **Approval Queue** — drafts persist, approve/reject, real publish-to-platform calls
✅ **Agent Console** — chat with each agent, full history per agent
✅ **OAuth one-click connect** for FB, IG, TikTok, YouTube
✅ **Brand DNA training** — niche, vocabulary, voice examples (all agents reference it)
✅ **Encrypted token storage** — AES-256-GCM for OAuth tokens
✅ **Supabase OR in-memory** — works without a database for local dev

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Get API keys (minimum to run)
- **OpenAI key** (required): https://platform.openai.com/api-keys

### 3. Configure
```bash
cp .env.example .env.local
```
Edit `.env.local` and add `OPENAI_API_KEY`. Everything else is optional for first run.

### 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000

The Script Studio works immediately. Connections will show "not configured" errors until you add platform credentials.

## Deploying to Vercel

```bash
npm install -g vercel
vercel deploy
```

Then in the Vercel dashboard → Project → Settings → Environment Variables, add:
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your deployed URL, e.g. `https://socialmind.vercel.app`)
- Any platform credentials you have

Redeploy after adding env vars.

## Adding Database (Supabase)

1. Create a project at https://supabase.com (free tier is plenty)
2. Run `supabase-schema.sql` in the SQL Editor
3. Copy your URL + service role key into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
4. Restart — drafts now persist permanently

## Connecting Platforms

Each platform requires its own developer account + app + approval process. Realistic timelines:

| Platform | Where | Typical timeline |
|---|---|---|
| **YouTube** | https://console.cloud.google.com/apis/credentials | 1-3 days for OAuth verification |
| **Facebook + Instagram** | https://developers.facebook.com/apps | 2-6 weeks (Meta App Review) |
| **TikTok** | https://developers.tiktok.com/apps | 2-8 weeks (Content Posting API approval) |

For each platform, set the OAuth callback URL to:
```
https://YOUR_APP_URL/api/auth/[platform]/callback
```

Then add the credentials to your env vars and the "Connect" buttons in `/settings/connections` will work.

### Dev mode (fastest)
For your own accounts only, all platforms allow dev/test mode without full approval. Connect your own accounts in dev mode → start posting in hours, not weeks.

## Project Structure

```
socialmind-app/
├── app/
│   ├── page.tsx                          # Dashboard
│   ├── studio/page.tsx                   # Script Studio (functional)
│   ├── approval/page.tsx                 # Approval Queue (functional)
│   ├── agents/page.tsx                   # Agent Console (functional)
│   ├── calendar/page.tsx                 # Calendar (UI)
│   ├── automation/page.tsx               # Automation Hub (UI)
│   ├── training/page.tsx                 # Brand DNA editor (functional)
│   ├── analytics/page.tsx                # Analytics (UI)
│   ├── settings/connections/page.tsx     # OAuth connect screen (functional)
│   ├── globals.css                       # Full design system
│   ├── layout.tsx                        # Sidebar shell
│   └── api/
│       ├── agents/[name]/route.ts        # Generic agent endpoint
│       ├── drafts/route.ts               # Draft CRUD
│       ├── connections/route.ts          # List/delete connections
│       ├── publish/[platform]/route.ts   # Post to live platforms
│       └── auth/
│           ├── facebook/{route, callback}
│           ├── instagram/{route, callback}
│           ├── tiktok/{route, callback}
│           └── youtube/{route, callback}
├── lib/
│   ├── openai.ts                         # GPT-4o wrapper
│   ├── agents.ts                         # All 5 agent system prompts
│   ├── platforms.ts                      # OAuth + posting functions
│   ├── crypto.ts                         # AES-256 token encryption
│   └── db.ts                             # Supabase + in-memory fallback
├── components/
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── supabase-schema.sql                   # Database tables
└── .env.example                          # Every env var documented
```

## What's NOT Built (Honest)

These are stubbed out but need work:
- **YouTube video upload** — needs multipart resumable upload (file handling)
- **Veo 3 / Nano Banana actual generation** — currently generates the *prompt*; you'd need Gemini API to render the actual video/image
- **Automation execution** — UI shows templates but no Cron/job runner wired (use Vercel Cron or Inngest)
- **Analytics ingestion** — no platform Insights API calls yet (each platform has its own)
- **Feedback training loop** — UI shows the "why?" prompts but doesn't yet feed back into agent prompts

## Cost Estimate

| Item | Approx cost |
|---|---|
| OpenAI API (GPT-4o, moderate use) | $10-50/mo |
| Supabase free tier | $0 |
| Vercel hobby tier | $0 |
| Veo 3 (when wired up) | ~$0.50/sec generated |
| Nano Banana (when wired up) | ~$0.04/image |

## Tech Stack

- **Next.js 14** (App Router)
- **OpenAI** GPT-4o for all agents
- **Supabase** for persistence (optional — falls back to in-memory)
- **TypeScript**
- **No CSS framework** — handcrafted design system in `globals.css`
- **No state library** — React hooks only

## License

MIT — do whatever.
