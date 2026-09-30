// ============================================
// Supabase Configuration
// ============================================

const SUPABASE_URL = 'https://qdruipcdpdvxsknreiro.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnVpcGNkcGR2eHNrbnJlaXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTAyMzYsImV4cCI6MjEwNjI4NjIzNn0.t7bV_4W7h8kwX2e8ZLjn-Yhbl5tJs5lpD5JF1YGwG14';

// Supabase client instance (initialized after CDN loads)
let _supabaseClient = null;

// Getter so all modules use the same reference
function getSupabase() {
    return _supabaseClient;
}

async function initSupabase() {
    try {
        // Load Supabase JS client from CDN
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        // The CDN exposes window.supabase with createClient
        const { createClient } = window.supabase;
        _supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Make it globally accessible as 'supabase' for all modules
        window.db = _supabaseClient;
        console.log('Supabase client initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return false;
    }
}

