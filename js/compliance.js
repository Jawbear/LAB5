// ============================================
// Compliance Evaluation Module
// Implements: FR-07, FR-08, FR-09
// Business Rules: BR-02, BR-05, BR-06, BR-07
//
// GRADING SYSTEM: Philippine System
// Lower GWA is better. 1.00 = highest, 5.00 = lowest.
// A scholar's GWA must be ≤ the scholarship's required_gwa
// to satisfy the GWA requirement.
// ============================================

let allEvaluations = [];

async function evaluateCompliance(submissionId) {
    try {
        // Get the submission with scholar and scholarship details
        const { data: submission, error: subError } = await window.db
            .from('grade_submissions')
            .select(`
                *,
                scholars (
                    id, student_id, full_name, scholarship_id,
                    scholarship_programs ( id, program_name, required_gwa, min_units, allow_failing_grade )
                )
            `)
            .eq('id', submissionId)
            .single();

        if (subError) throw subError;

        // BR-05: Only verified submissions may be used for final compliance evaluation
        if (submission.submission_status !== 'Verified') {
            showToast('Only verified submissions can be evaluated (BR-05).', 'warning');
            return;
        }

        const scholar = submission.scholars;
        const program = scholar?.scholarship_programs;

        if (!program) {
            showToast('Scholar has no assigned scholarship program. Cannot evaluate (BR-02).', 'error');
            return;
        }

        // ============================================
        // COMPLIANCE LOGIC
        // Philippine Grading System: lower GWA = better
        // Scholar GWA must be ≤ required_gwa
        // ============================================

        const deficiencies = [];
        let isCompliant = true;

        // 1. GWA Check: Scholar's GWA must be ≤ program's required_gwa (lower is better)
        if (submission.gwa > program.required_gwa) {
            deficiencies.push(`GWA ${submission.gwa.toFixed(2)} exceeds maximum allowed ${program.required_gwa.toFixed(2)}`);
            isCompliant = false;
        }

        // 2. Units Check: Must meet minimum units
        if (submission.units_enrolled < program.min_units) {
            deficiencies.push(`Enrolled ${submission.units_enrolled} units, minimum required is ${program.min_units}`);
            isCompliant = false;
        }

        // 3. Failing Grade Check
        if (!program.allow_failing_grade && submission.failed_subjects > 0) {
            deficiencies.push(`Has ${submission.failed_subjects} failing subject(s), failing grades not allowed`);
            isCompliant = false;
        }

        // BR-06: A scholar cannot be marked Compliant while mandatory requirements are incomplete
        const evaluationResult = isCompliant ? 'Compliant' : 'With Deficiency';
        const deficiencyText = deficiencies.length > 0 ? deficiencies.join('; ') : null;

        // Update scholar status — BR-07: Scholar status must be based on scholarship rules
        await window.db
            .from('scholars')
            .update({ status: evaluationResult })
            .eq('id', scholar.id);

        // Store/update evaluation record in grade_submissions (using a separate approach)
        // We'll update the submission itself with the evaluation result
        await window.db
            .from('grade_submissions')
            .update({
                evaluation_result: evaluationResult,
                deficiencies: deficiencyText
            })
            .eq('id', submissionId);

        if (isCompliant) {
            showToast(`${scholar.full_name} is COMPLIANT! All requirements met.`, 'success');
        } else {
            showToast(`${scholar.full_name} has DEFICIENCIES: ${deficiencyText}`, 'warning');
        }

        // Refresh data
        loadSubmissions();
        loadCompliance();

    } catch (error) {
        console.error('Error evaluating compliance:', error);
        showToast('Error during compliance evaluation: ' + error.message, 'error');
    }
}

async function loadCompliance() {
    try {
        // Load all verified & evaluated submissions
        const { data, error } = await window.db
            .from('grade_submissions')
            .select(`
                *,
                scholars (
                    student_id, full_name, scholarship_id,
                    scholarship_programs ( program_name, required_gwa, min_units, allow_failing_grade )
                )
            `)
            .eq('submission_status', 'Verified')
            .not('evaluation_result', 'is', null)
            .order('verified_at', { ascending: false });

        if (error) throw error;
        allEvaluations = data || [];
        renderComplianceTable(allEvaluations);
    } catch (error) {
        console.error('Error loading compliance:', error);
        showToast('Error loading compliance evaluations.', 'error');
    }
}

function renderComplianceTable(evaluations) {
    const tbody = document.getElementById('compliance-table-body');

    if (!evaluations || evaluations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty-state">No compliance evaluations yet. Verify grade submissions first.</td></tr>';
        return;
    }

    tbody.innerHTML = evaluations.map(e => {
        const scholar = e.scholars;
        const program = scholar?.scholarship_programs;
        const scholarName = scholar ? `${escapeHtml(scholar.full_name)} (${escapeHtml(scholar.student_id)})` : 'Unknown';

        return `
            <tr>
                <td><strong>${scholarName}</strong></td>
                <td>${program ? escapeHtml(program.program_name) : '—'}</td>
                <td>${escapeHtml(e.academic_year)}</td>
                <td>${escapeHtml(e.semester)}</td>
                <td>${e.gwa !== null ? e.gwa.toFixed(2) : '—'}</td>
                <td>${program ? program.required_gwa.toFixed(2) : '—'}</td>
                <td>${e.units_enrolled || '—'}</td>
                <td>${program ? program.min_units : '—'}</td>
                <td>${e.failed_subjects || 0}</td>
                <td>${getStatusBadge(e.evaluation_result)}</td>
                <td>${e.deficiencies ? `<span style="color: var(--rose-600); font-size: 0.8125rem;">${escapeHtml(e.deficiencies)}</span>` : '<span style="color: var(--emerald-600);">None</span>'}</td>
            </tr>
        `;
    }).join('');
}

function filterCompliance() {
    const filter = document.getElementById('compliance-filter').value;
    let filtered = allEvaluations;
    if (filter) {
        filtered = filtered.filter(e => e.evaluation_result === filter);
    }
    renderComplianceTable(filtered);
}
