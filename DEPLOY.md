# Deploy SocialMind to Vercel

Two ways — pick whichever is easier for you.

---

## 🖱 Option A: Dashboard (no terminal, ~5 min)

### Step 1 · Push to GitHub
1. Go to https://github.com/new and create a new private repo called `socialmind` (don't initialize with README)
2. Unzip `socialmind-app.zip` on your computer
3. Upload the folder contents via the GitHub web UI (drag-drop into the "upload files" interface) OR in terminal:
   ```bash
   cd socialmind-app
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/socialmind.git
   git branch -M main
   git push -u origin main
   ```

### Step 2 · Import into Vercel
1. Go to https://vercel.com/new
2. Click "Import" next to your `socialmind` repo
3. Vercel auto-detects **Next.js** — don't change any build settings
4. Expand **Environment Variables** and add **at minimum**:
   | Name | Value |
   |---|---|
   | `OPENAI_API_KEY` | `sk-proj-...` (get at platform.openai.com/api-keys) |
   | `NEXT_PUBLIC_APP_URL` | `https://socialmind.vercel.app` (you'll update this after deploy) |
   | `ENCRYPTION_KEY` | Run `openssl rand -hex 32` in terminal, paste output |

5. Click **Deploy**
6. Wait ~90 seconds → you're live 🎉

### Step 3 · Update the app URL
1. Copy your live URL (e.g. `https://socialmind-xyz123.vercel.app`)
2. Go to Vercel → your project → Settings → Environment Variables
3. Edit `NEXT_PUBLIC_APP_URL` → paste the real URL
4. Go to Deployments tab → click "..." on latest → Redeploy

---

## ⌨️ Option B: CLI (faster if you're in a terminal)

```bash
# 1. Unzip & install
unzip socialmind-app.zip
cd socialmind-app
npm install

# 2. Install Vercel CLI (one time)
npm i -g vercel

# 3. Login (opens browser)
vercel login

# 4. Deploy
vercel                # → first run creates the project, gives you a preview URL
vercel --prod         # → promotes to production

# 5. Add env vars
vercel env add OPENAI_API_KEY production
# paste your key when prompted
vercel env add NEXT_PUBLIC_APP_URL production
# paste your production URL
vercel env add ENCRYPTION_KEY production
# run `openssl rand -hex 32` in another terminal, paste the output

# 6. Redeploy with the new env vars
vercel --prod
```

---

## Optional: Add Supabase (to persist data between visits)

Without Supabase, drafts are stored in memory and wipe on every serverless cold start. For real use, add Supabase (free tier, ~5 min):

1. Go to https://supabase.com/dashboard → New Project → free tier
2. Wait ~2 min for provisioning
3. SQL Editor → paste contents of `supabase-schema.sql` → Run
4. Settings → API → copy these three values
5. Add to Vercel env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Redeploy

---

## Optional: Connect platforms (for real posting)

Only needed when you want actual FB/IG/TikTok/YouTube posting to work. Everything else works without these.

Timelines to realistically get each platform working:
- **YouTube:** Google Cloud OAuth → 1-3 days
- **Facebook + Instagram:** Meta App Review → 2-6 weeks
- **TikTok:** Content Posting API approval → 2-8 weeks

Start with YouTube since it's fastest. For each platform:
1. Create an app in the platform's developer portal
2. Set OAuth redirect URI to `https://YOUR_APP_URL/api/auth/[platform]/callback`
3. Add credentials to Vercel env vars (see `.env.example`)
4. Redeploy
5. Go to `/settings/connections` in your app → click Connect

---

## Troubleshooting

**"OPENAI_API_KEY is missing"** → Check Vercel → Settings → Environment Variables. Make sure it's set for the **Production** environment. Redeploy after adding.

**OAuth callback returns error** → Your redirect URL in the platform's developer portal must match EXACTLY: `https://YOUR_APP_URL/api/auth/[platform]/callback` — no trailing slash, correct platform name.

**Script Studio shows generic error** → Check Vercel logs: Project → Deployments → latest → Functions tab → click any function to see runtime errors.

**Build fails** → Run `npm run build` locally first. If it passes there, it passes on Vercel.
