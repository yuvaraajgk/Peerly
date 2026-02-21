const { createClient } = require('@supabase/supabase-js')

// Supabase connection configuration
// Supabase uses PostgreSQL under the hood and provides a REST API
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️  Supabase credentials missing! Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Create Supabase client
// Using service role key for backend operations (bypasses Row Level Security)
// IMPORTANT: Service role key should ONLY be used server-side, never expose it to the client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

module.exports = {
  supabase
}
