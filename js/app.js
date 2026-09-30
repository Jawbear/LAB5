// ============================================
// Main Application Controller
// Navigation, Toast, Initialization
// ============================================

// Navigation
function navigateTo(page) {
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Show active page
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === `page-${page}`);
    });

    // Update header
    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Overview of scholarship monitoring metrics' },
        scholars: { title: 'Scholars', subtitle: 'Manage scholar records and assignments' },
        programs: { title: 'Scholarship Programs', subtitle: 'Configure scholarship requirements and policies' },
        submissions: { title: 'Grade Submissions', subtitle: 'Submit and verify semester grades' },
        compliance: { title: 'Compliance', subtitle: 'Academic compliance evaluation results' }
    };

    const info = titles[page] || { title: page, subtitle: '' };
    document.getElementById('page-title').textContent = info.title;
    document.getElementById('page-subtitle').textContent = info.subtitle;

    // Load page data
    switch (page) {
        case 'dashboard': loadDashboard(); break;
        case 'scholars': loadScholars(); break;
        case 'programs': loadPrograms(); break;
        case 'submissions': loadSubmissions(); break;
        case 'compliance': loadCompliance(); break;
    }
}

// Sidebar toggle for mobile
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Toast notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Status badge helper
function getStatusBadge(status) {
    const map = {
        'Active': 'active',
        'Pending': 'pending',
        'Pending Submission': 'pending-submission',
        'For Verification': 'for-verification',
        'Verified': 'verified',
        'Returned': 'returned',
        'Compliant': 'compliant',
        'With Deficiency': 'deficiency',
        'Probationary': 'probationary',
        'For Renewal': 'renewal',
        'Renewed': 'renewed',
        'Disqualified': 'disqualified'
    };
    const cls = map[status] || 'active';
    return `<span class="badge badge-${cls}">${status}</span>`;
}

// Date display
function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

// Initialize app
async function initApp() {
    updateDate();

    const initialized = await initSupabase();
    if (!initialized) {
        showToast('Failed to connect to database. Check configuration.', 'error');
        showLogin();
        return;
    }

    await checkSession();
}

// Boot
document.addEventListener('DOMContentLoaded', initApp);

// Allow Enter key to submit login
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const loginScreen = document.getElementById('login-screen');
        if (!loginScreen.classList.contains('hidden')) {
            handleLogin();
        }
    }
});
