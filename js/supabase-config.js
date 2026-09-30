// ============================================
// Supabase Configuration
// ============================================

const SUPABASE_URL = 'https://qdruipcdpdvxsknreiro.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnVpcGNkcGR2eHNrbnJlaXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTAyMzYsImV4cCI6MjEwNjI4NjIzNn0.t7bV_4W7h8kwX2e8ZLjn-Yhbl5tJs5lpD5JF1YGwG14';

// Supabase client instance
let _supabaseClient = null;

// Immediate initialization if CDN is already loaded
if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    try {
        _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.db = _supabaseClient;
    } catch (e) {
        console.warn('Initial Supabase creation warning:', e);
    }
}

// Getter so all modules use the same reference
function getSupabase() {
    return _supabaseClient;
}

async function initSupabase() {
    if (_supabaseClient) {
        window.db = _supabaseClient;
        return true;
    }

    try {
        // If not yet available on window, load CDN dynamically
        if (!window.supabase || !window.supabase.createClient) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        const { createClient } = window.supabase;
        _supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.db = _supabaseClient;
        console.log('Supabase client initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return false;
    }
}

