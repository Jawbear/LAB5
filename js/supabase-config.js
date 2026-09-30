// ============================================
// Supabase Configuration
// ============================================
// TODO: Replace these with your actual Supabase project credentials
// 1. Go to https://supabase.com and create a free project
// 2. Go to Project Settings > API
// 3. Copy the "Project URL" and "anon public" key
// ============================================

const SUPABASE_URL = 'https://qdruipcdpdvxsknreiro.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnVpcGNkcGR2eHNrbnJlaXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTAyMzYsImV4cCI6MjEwNjI4NjIzNn0.t7bV_4W7h8kwX2e8ZLjn-Yhbl5tJs5lpD5JF1YGwG14';

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
