// ============================================
// Dashboard Module
// Implements: FR-10, FR-15
// Live database counts for monitoring
// ============================================

async function loadDashboard() {
    await Promise.all([
        loadDashboardStats(),
        loadRecentSubmissions()
    ]);
}

async function loadDashboardStats() {
    try {
        // Total active scholars
        const { count: totalScholars } = await supabase
            .from('scholars')
            .select('*', { count: 'exact', head: true });

        // Pending grade submissions
        const { count: pendingCount } = await supabase
            .from('grade_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('submission_status', 'Pending');

        // Verified submissions
        const { count: verifiedCount } = await supabase
            .from('grade_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('submission_status', 'Verified');

        // Compliant scholars
        const { count: compliantCount } = await supabase
            .from('scholars')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Compliant');

        // With Deficiency scholars
        const { count: deficiencyCount } = await supabase
            .from('scholars')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'With Deficiency');

        // Update DOM with animated counters
        animateCounter('stat-total-scholars', totalScholars || 0);
        animateCounter('stat-pending', pendingCount || 0);
        animateCounter('stat-verified', verifiedCount || 0);
        animateCounter('stat-compliant', compliantCount || 0);
        animateCounter('stat-deficiency', deficiencyCount || 0);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    const startValue = parseInt(el.textContent) || 0;
    const duration = 600;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startValue + (targetValue - startValue) * eased);
        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

async function loadRecentSubmissions() {
    try {
        const { data, error } = await supabase
            .from('grade_submissions')
            .select(`
                *,
                scholars (
                    full_name, student_id,
                    scholarship_programs ( program_name )
                )
            `)
            .order('submitted_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const tbody = document.getElementById('dashboard-recent-submissions');

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No submissions yet</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(s => {
            const scholar = s.scholars;
            const scholarName = scholar ? escapeHtml(scholar.full_name) : 'Unknown';
            const programName = scholar?.scholarship_programs ? escapeHtml(scholar.scholarship_programs.program_name) : '—';
            const date = s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

            return `
                <tr>
                    <td><strong>${scholarName}</strong></td>
                    <td>${programName}</td>
                    <td>${escapeHtml(s.academic_year)}</td>
                    <td>${escapeHtml(s.semester)}</td>
                    <td>${s.gwa !== null ? s.gwa.toFixed(2) : '—'}</td>
                    <td>${getStatusBadge(s.submission_status)}</td>
                    <td>${date}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent submissions:', error);
    }
}
