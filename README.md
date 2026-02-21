# Peerly - College Marketplace

A web app that serves as a college-only marketplace where students can buy, sell, or rent items they need on campus.

## Project Structure

- `client/` - Next.js frontend application
- `server/` - Express.js backend API
- `public/` - Static assets

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier available)
- Google Cloud Console account (for OAuth)

### Installation

1. Install dependencies:
```bash
cd client && npm install
cd ../server && npm install
```

2. Set up Supabase:
   - Create a free account at [supabase.com](https://supabase.com)
   - Create a new project
   - Get your API keys from Settings → API
   - See `docss/SUPABASE_MIGRATION_GUIDE.md` for detailed instructions

3. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized origins: `http://localhost:3000`
   - Add redirect URI: `http://localhost:3000/auth/signup`

4. Set up environment variables:
   - Copy `.env.local.example` to `.env.local` in both `client/` and `server/` directories
   - Fill in your Supabase credentials, Google OAuth keys, and JWT secret
   - Configure allowed email domains (see `docss/EMAIL_DOMAIN_CONFIG.md`)

5. Set up the database:
```bash
cd server
npm run migrate
# Copy the generated SQL from migrate.sql
# Run it in Supabase Dashboard → SQL Editor
```

6. Create uploads directory:
```bash
mkdir -p server/uploads
```

7. Start development servers:
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

Visit `http://localhost:3000` to see the application.

## Technology Stack

- **Frontend**: Next.js 14+, React, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth + JWT
- **Real-time**: Socket.IO
- **Payment**: Cash-only transactions

## Features

- **Google OAuth Authentication** - Sign in with Google (no passwords needed)
- **Configurable Email Domain Validation** - Restrict access to specific college email domains
- **Username System** - Unique usernames for all users
- **Item Listings** - Buy, sell, or rent items with up to 5 images
- **Wishlist Functionality** - Mark items as "Interested" to track them
- **Rental Calculator** - Automatic cost calculation for rental items
- **Real-time Messaging** - Instant chat with Socket.IO
- **Contact Suggestions** - Auto-suggest contact information in messages
- **Cash-only Transactions** - Simple payment process
- **Dashboard** - Manage your listings and wishlist
- **Self-messaging Prevention** - Users cannot message themselves

## Documentation

- **Setup Guide**: `docss/SETUP.md` - Quick start guide
- **Complete Guide**: `docss/PEERLY_COMPLETE_GUIDE.md` - Comprehensive documentation
- **Supabase Migration**: `docss/SUPABASE_MIGRATION_GUIDE.md` - Database setup
- **Email Domain Config**: `docss/EMAIL_DOMAIN_CONFIG.md` - Configure allowed domains
- **Project Summary**: `docss/PROJECT_SUMMARY.md` - Overview of features
