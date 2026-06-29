# Railway Backend Deployment Guide

## Quick Steps to Deploy Your Express Backend

### 1. Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended) or email
3. Create a new project

### 2. Deploy from GitHub (Recommended)
1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `peerly` repository
4. Railway will auto-detect it's a Node.js project
5. **Important**: Set the **Root Directory** to `server` (not the root!)

### 3. Configure Environment Variables
In Railway dashboard, go to your project → Variables tab, and add these:

```
PORT=5000
NODE_ENV=production

# Supabase (from your .env.local)
SUPABASE_URL=https://mqgqfvgctlgcedtkudwr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZ3FmdmdjdGxnY2VkdGt1ZHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MTYwMTIsImV4cCI6MjA4NjA5MjAxMn0.AEzbYD8IZxooT8HcTXeXKO7JcvkvNpsoFO5FUvTjF9o
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZ3FmdmdjdGxnY2VkdGt1ZHdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUxNjAxMiwiZXhwIjoyMDg2MDkyMDEyfQ.zewEWoJMiBN3AN_Hpys6t9Us04DmtiK2UW57X1k9P9w

# JWT Secret
JWT_SECRET=b4df0038ac83787df181088ff84302840704c9c0614aa53e7d23c7a0e6d5b6fa

# Google OAuth
GOOGLE_CLIENT_ID=6064992358-f7okbntf4f8uj82kk1qbbbvlf8m3ft2b.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Email Configuration
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yuvaraajoff@gmail.com
SMTP_PASSWORD=vdpmukusegvqbunw
EMAIL_FROM=yuvaraajoff@gmail.com

# Allowed Email Domains
ALLOWED_EMAIL_DOMAINS=@gmail.com

# Client URL (your Vercel frontend URL - update this!)
CLIENT_URL=https://peerly-drab.vercel.app

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=2097152
```

### 4. Get Your Backend URL
1. Once deployed, Railway will give you a URL like: `https://your-app-name.up.railway.app`
2. Copy this URL - you'll need it for Vercel!

### 5. Update Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/yuvaraajgks-projects/peerly/settings/environment-variables)
2. Update these variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-railway-url.up.railway.app/api`
   - `NEXT_PUBLIC_WS_URL` = `https://your-railway-url.up.railway.app`

### 6. Update Google OAuth Redirect URIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URI: `https://peerly-drab.vercel.app/auth/signup`
5. Add authorized JavaScript origins: `https://peerly-drab.vercel.app`

### 7. Redeploy Vercel
After updating environment variables, trigger a new deployment in Vercel dashboard.

---

## Troubleshooting

- **Build fails?** Make sure Root Directory is set to `server` in Railway
- **CORS errors?** Update `CLIENT_URL` in Railway to match your Vercel URL
- **Socket.IO not working?** Make sure `NEXT_PUBLIC_WS_URL` matches your Railway URL (without `/api`)
