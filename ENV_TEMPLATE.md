# Supabase Environment Variables Template
# 
# INSTRUCTIONS:
# 1. Create a file named .env.local in the project root (same folder as package.json)
# 2. Copy the content below into .env.local
# 3. Replace the placeholder values with your actual Supabase credentials

# ==============================================================================
# HOW TO GET YOUR CREDENTIALS:
# ==============================================================================
# 1. Go to https://app.supabase.com
# 2. Click on your project
# 3. Go to Settings (gear icon) → API
# 4. Copy the values below:

# Project URL (find this under "Project URL")
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Anon/Public Key (find this under "Project API keys" → "anon public")
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (find this under "Project API keys" → "service_role")
# ⚠️ IMPORTANT: This key bypasses Row Level Security - keep it SECRET!
# Only use this in server-side code or scripts, NEVER expose to browser
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin password for your application
NEXT_PUBLIC_ADMIN_PASSWORD=sport2233

# ==============================================================================
# SECURITY NOTES:
# ==============================================================================
# - NEXT_PUBLIC_* variables are exposed to the browser (safe)
# - SUPABASE_SERVICE_ROLE_KEY must NEVER be exposed to browser
# - .env.local is in .gitignore - it won't be committed to Git
# - Never share your service role key publicly

