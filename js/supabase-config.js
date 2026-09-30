// ============================================
// Supabase Configuration
// ============================================
// TODO: Replace these with your actual Supabase project credentials
// 1. Go to https://supabase.com and create a free project
// 2. Go to Project Settings > API
// 3. Copy the "Project URL" and "anon public" key
// ============================================

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Import Supabase client from CDN
// We load it dynamically to avoid module issues with GitHub Pages
let supabase = null;

async function initSupabase() {
    try {
        // Load Supabase JS client from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });

        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return false;
    }
}
