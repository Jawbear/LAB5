// ============================================
// Grade Submission & Verification Module
// Implements: FR-04, FR-05, FR-06, FR-10
// Business Rules: BR-03, BR-04, BR-05, BR-09
// ============================================

let allSubmissions = [];

async function loadSubmissions() {
    try {
        const { data, error } = await supabase
            .from('grade_submissions')
            .select(`
                *,
                scholars ( student_id, full_name, scholarship_id )
            `)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        allSubmissions = data || [];
        renderSubmissionsTable(allSubmissions);
    } catch (error) {
        console.error('Error loading submissions:', error);
        showToast('Error loading submissions.', 'error');
    }
}

function renderSubmissionsTable(submissions) {
    const tbody = document.getElementById('submissions-table-body');

    if (!submissions || submissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No grade submissions yet</td></tr>';
        return;
    }

    tbody.innerHTML = submissions.map(s => {
        const scholarName = s.scholars ? `${escapeHtml(s.scholars.full_name)} (${escapeHtml(s.scholars.student_id)})` : 'Unknown';
        const canVerify = s.submission_status === 'Pending' && isAuthorizedStaff();

        return `
            <tr>
                <td><strong>${scholarName}</strong></td>
                <td>${escapeHtml(s.academic_year)}</td>
                <td>${escapeHtml(s.semester)}</td>
                <td>${s.gwa !== null ? s.gwa.toFixed(2) : '—'}</td>
                <td>${s.units_enrolled || '—'}</td>
                <td>${s.failed_subjects || 0}</td>
                <td>${s.incomplete_subjects || 0}</td>
                <td>${getStatusBadge(s.submission_status)}</td>
                <td>
                    <div class="action-btns">
                        ${canVerify ? `
                            <button class="btn btn-sm btn-success" onclick="verifySubmission('${s.id}')" title="Verify">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                                Verify
                            </button>
                        ` : ''}
                        ${s.submission_status === 'Verified' ? `
                            <button class="btn btn-sm btn-primary" onclick="evaluateCompliance('${s.id}')" title="Evaluate">
                                Evaluate
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openSubmissionModal() {
    // Load scholars for dropdown
    loadScholarDropdown();
    document.getElementById('sub-ay').value = '';
    document.getElementById('sub-semester').value = '';
    document.getElementById('sub-gwa').value = '';
    document.getElementById('sub-units').value = '';
    document.getElementById('sub-failed').value = '0';
    document.getElementById('sub-inc').value = '0';

    document.getElementById('submission-modal').classList.remove('hidden');
}

function closeSubmissionModal() {
    document.getElementById('submission-modal').classList.add('hidden');
}

async function loadScholarDropdown() {
    const select = document.getElementById('sub-scholar');
    select.innerHTML = '<option value="">Select Scholar</option>';

    try {
        const { data } = await supabase
            .from('scholars')
            .select('id, student_id, full_name')
            .order('full_name');

        if (data) {
            data.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${escapeHtml(s.full_name)} (${escapeHtml(s.student_id)})</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading scholars dropdown:', error);
    }
}

async function saveSubmission() {
    const scholarId = document.getElementById('sub-scholar').value;
    const academicYear = document.getElementById('sub-ay').value.trim();
    const semester = document.getElementById('sub-semester').value;
    const gwa = parseFloat(document.getElementById('sub-gwa').value);
    const units = parseInt(document.getElementById('sub-units').value);
    const failed = parseInt(document.getElementById('sub-failed').value) || 0;
    const inc = parseInt(document.getElementById('sub-inc').value) || 0;

    // Validation
    if (!scholarId) {
        showToast('Please select a scholar.', 'error');
        return;
    }
    if (!academicYear) {
        showToast('Academic year is required.', 'error');
        return;
    }
    if (!semester) {
        showToast('Please select a semester.', 'error');
        return;
    }

    // GWA validation — Philippine grading system: 1.00 (highest) to 5.00 (lowest)
    if (isNaN(gwa) || gwa < 1.0 || gwa > 5.0) {
        showToast('GWA must be between 1.00 and 5.00.', 'error');
        return;
    }

    if (isNaN(units) || units < 0) {
        showToast('Units enrolled cannot be negative.', 'error');
        return;
    }

    if (failed < 0) {
        showToast('Failed subjects cannot be negative.', 'error');
        return;
    }

    if (inc < 0) {
        showToast('Incomplete subjects cannot be negative.', 'error');
        return;
    }

    // BR-03: A grade submission must belong to one scholar, academic year, and semester
    const submissionData = {
        scholar_id: scholarId,
        academic_year: academicYear,
        semester: semester,
        gwa: gwa,
        units_enrolled: units,
        failed_subjects: failed,
        incomplete_subjects: inc,
        submission_status: 'Pending',  // Initially marked as Pending (FR-10)
        submitted_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase
            .from('grade_submissions')
            .insert([submissionData]);

        if (error) throw error;

        // Update scholar status to "For Verification"
        await supabase
            .from('scholars')
            .update({ status: 'For Verification' })
            .eq('id', scholarId);

        showToast('Grade submission saved as Pending!', 'success');
        closeSubmissionModal();
        loadSubmissions();
    } catch (error) {
        console.error('Error saving submission:', error);
        showToast('Error saving submission: ' + error.message, 'error');
    }
}

async function verifySubmission(submissionId) {
    // BR-04: Only authorized personnel may verify submitted grades
    if (!isAuthorizedStaff()) {
        showToast('Only authorized staff can verify submissions (BR-04).', 'error');
        return;
    }

    if (!confirm('Are you sure you want to verify this grade submission?')) return;

    try {
        // BR-09: A submission cannot be verified twice without an authorized correction process
        const { data: sub } = await supabase
            .from('grade_submissions')
            .select('submission_status, scholar_id')
            .eq('id', submissionId)
            .single();

        if (sub && sub.submission_status === 'Verified') {
            showToast('This submission has already been verified (BR-09).', 'warning');
            return;
        }

        const { error } = await supabase
            .from('grade_submissions')
            .update({
                submission_status: 'Verified',
                verified_by: currentUser.id,
                verified_at: new Date().toISOString()
            })
            .eq('id', submissionId);

        if (error) throw error;

        showToast('Submission verified successfully!', 'success');
        loadSubmissions();

        // Auto-evaluate compliance after verification
        await evaluateCompliance(submissionId);
    } catch (error) {
        console.error('Error verifying submission:', error);
        showToast('Error verifying submission.', 'error');
    }
}

function filterSubmissions() {
    const statusFilter = document.getElementById('submission-filter-status').value;

    let filtered = allSubmissions;
    if (statusFilter) {
        filtered = filtered.filter(s => s.submission_status === statusFilter);
    }

    renderSubmissionsTable(filtered);
}
