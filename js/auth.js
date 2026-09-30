// ============================================
// Authentication Module
// Handles login, logout, session management
// Implements: FR-16 (Login/Logout), NFR-01 (Security)
// ============================================

let currentUser = null;
let currentProfile = null;

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    if (!email || !password) {
        showLoginError('Please enter both email and password.');
        return;
    }

    const loginBtn = document.getElementById('login-btn');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span>Signing in...</span>';

    try {
        const { data, error } = await window.db.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        currentUser = data.user;
        await loadUserProfile();
        showApp();
        showToast('Welcome back!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showLoginError(error.message || 'Invalid credentials. Please try again.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Sign In</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
}

async function handleLogout() {
    try {
        await window.db.auth.signOut();
        currentUser = null;
        currentProfile = null;
        showLogin();
        showToast('Signed out successfully.', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error signing out.', 'error');
    }
}

async function loadUserProfile() {
    try {
        const { data, error } = await window.db
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;
        currentProfile = data;

        // Update sidebar user info
        document.getElementById('user-name').textContent = currentProfile.full_name || currentUser.email;
        document.getElementById('user-role').textContent = currentProfile.role || 'staff';
        document.getElementById('user-avatar').textContent = (currentProfile.full_name || 'U')[0].toUpperCase();
    } catch (error) {
        console.error('Profile load error:', error);
        // Set defaults if profile doesn't exist
        currentProfile = { role: 'staff', full_name: currentUser.email };
        document.getElementById('user-name').textContent = currentUser.email;
        document.getElementById('user-role').textContent = 'staff';
    }
}

async function checkSession() {
    try {
        const { data: { session } } = await window.db.auth.getSession();
        if (session) {
            currentUser = session.user;
            await loadUserProfile();
            showApp();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Session check error:', error);
        showLogin();
    }
}

function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').classList.add('hidden');
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    navigateTo('dashboard');
}

function showLoginError(message) {
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function isAuthorizedStaff() {
    return currentProfile && (currentProfile.role === 'admin' || currentProfile.role === 'staff');
}
