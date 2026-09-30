// ============================================
// Scholar Management Module
// Implements: FR-01, FR-02, FR-09, FR-10
// Business Rules: BR-01, BR-07
// ============================================

let allScholars = [];
let editingScholarId = null;

async function loadScholars() {
    try {
        const { data, error } = await supabase
            .from('scholars')
            .select(`
                *,
                scholarship_programs ( program_name )
            `)
            .order('full_name', { ascending: true });

        if (error) throw error;
        allScholars = data || [];
        renderScholarsTable(allScholars);
        populateScholarFilters();
    } catch (error) {
        console.error('Error loading scholars:', error);
        showToast('Error loading scholars.', 'error');
    }
}

function renderScholarsTable(scholars) {
    const tbody = document.getElementById('scholars-table-body');

    if (!scholars || scholars.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No scholars found</td></tr>';
        return;
    }

    tbody.innerHTML = scholars.map(s => `
        <tr>
            <td><strong>${escapeHtml(s.student_id)}</strong></td>
            <td>${escapeHtml(s.full_name)}</td>
            <td>${escapeHtml(s.degree_program || '')}</td>
            <td>${s.year_level || ''}</td>
            <td>${s.scholarship_programs ? escapeHtml(s.scholarship_programs.program_name) : '—'}</td>
            <td>${getStatusBadge(s.status || 'Active')}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-icon" onclick="editScholar('${s.id}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openScholarModal(scholarId = null) {
    editingScholarId = scholarId;
    document.getElementById('scholar-modal-title').textContent = scholarId ? 'Edit Scholar' : 'Add New Scholar';
    document.getElementById('scholar-save-btn').textContent = scholarId ? 'Update Scholar' : 'Save Scholar';

    // Populate scholarship dropdown
    loadScholarshipDropdown('scholar-scholarship');

    if (!scholarId) {
        // Reset form
        document.getElementById('scholar-student-id').value = '';
        document.getElementById('scholar-full-name').value = '';
        document.getElementById('scholar-degree').value = '';
        document.getElementById('scholar-year').value = '';
        document.getElementById('scholar-scholarship').value = '';
        document.getElementById('scholar-status').value = 'Active';
        document.getElementById('error-student-id').textContent = '';
        document.getElementById('error-scholarship').textContent = '';
    }

    document.getElementById('scholar-modal').classList.remove('hidden');
}

function closeScholarModal() {
    document.getElementById('scholar-modal').classList.add('hidden');
    editingScholarId = null;
}

async function editScholar(id) {
    try {
        const { data, error } = await supabase
            .from('scholars')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        openScholarModal(id);

        // Wait for dropdown to populate
        setTimeout(() => {
            document.getElementById('scholar-student-id').value = data.student_id || '';
            document.getElementById('scholar-full-name').value = data.full_name || '';
            document.getElementById('scholar-degree').value = data.degree_program || '';
            document.getElementById('scholar-year').value = data.year_level || '';
            document.getElementById('scholar-scholarship').value = data.scholarship_id || '';
            document.getElementById('scholar-status').value = data.status || 'Active';
        }, 300);
    } catch (error) {
        console.error('Error loading scholar:', error);
        showToast('Error loading scholar details.', 'error');
    }
}

async function saveScholar() {
    const studentId = document.getElementById('scholar-student-id').value.trim();
    const fullName = document.getElementById('scholar-full-name').value.trim();
    const degree = document.getElementById('scholar-degree').value.trim();
    const year = document.getElementById('scholar-year').value;
    const scholarshipId = document.getElementById('scholar-scholarship').value;
    const status = document.getElementById('scholar-status').value;

    // Validation — FR: Student ID cannot be blank (BR-01)
    document.getElementById('error-student-id').textContent = '';
    document.getElementById('error-scholarship').textContent = '';

    let hasError = false;

    if (!studentId) {
        document.getElementById('error-student-id').textContent = 'Student ID is required.';
        hasError = true;
    }

    if (!fullName) {
        showToast('Full Name is required.', 'error');
        hasError = true;
    }

    if (!scholarshipId) {
        document.getElementById('error-scholarship').textContent = 'Scholarship program must be selected (BR-01).';
        hasError = true;
    }

    if (hasError) return;

    // Check uniqueness of Student ID
    if (!editingScholarId) {
        const { data: existing } = await supabase
            .from('scholars')
            .select('id')
            .eq('student_id', studentId)
            .maybeSingle();

        if (existing) {
            document.getElementById('error-student-id').textContent = 'Student ID already exists.';
            return;
        }
    }

    const scholarData = {
        student_id: studentId,
        full_name: fullName,
        degree_program: degree,
        year_level: parseInt(year) || null,
        scholarship_id: scholarshipId,
        status: status
    };

    try {
        if (editingScholarId) {
            const { error } = await supabase
                .from('scholars')
                .update(scholarData)
                .eq('id', editingScholarId);
            if (error) throw error;
            showToast('Scholar updated successfully!', 'success');
        } else {
            const { error } = await supabase
                .from('scholars')
                .insert([scholarData]);
            if (error) throw error;
            showToast('Scholar registered successfully!', 'success');
        }

        closeScholarModal();
        loadScholars();
    } catch (error) {
        console.error('Error saving scholar:', error);
        showToast('Error saving scholar: ' + error.message, 'error');
    }
}

function searchScholars() {
    const query = document.getElementById('scholar-search').value.toLowerCase().trim();
    const programFilter = document.getElementById('scholar-filter-program').value;
    const statusFilter = document.getElementById('scholar-filter-status').value;

    let filtered = allScholars;

    if (query) {
        filtered = filtered.filter(s =>
            s.student_id.toLowerCase().includes(query) ||
            s.full_name.toLowerCase().includes(query)
        );
    }

    if (programFilter) {
        filtered = filtered.filter(s => s.scholarship_id === programFilter);
    }

    if (statusFilter) {
        filtered = filtered.filter(s => s.status === statusFilter);
    }

    renderScholarsTable(filtered);
}

function filterScholars() {
    searchScholars(); // Reuse combined search & filter
}

async function populateScholarFilters() {
    const select = document.getElementById('scholar-filter-program');
    // Keep first option
    select.innerHTML = '<option value="">All Programs</option>';

    try {
        const { data } = await supabase
            .from('scholarship_programs')
            .select('id, program_name')
            .eq('active', true)
            .order('program_name');

        if (data) {
            data.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${escapeHtml(p.program_name)}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading programs for filter:', error);
    }
}

async function loadScholarshipDropdown(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select Scholarship</option>';

    try {
        const { data } = await supabase
            .from('scholarship_programs')
            .select('id, program_name')
            .eq('active', true)
            .order('program_name');

        if (data) {
            data.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${escapeHtml(p.program_name)}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading scholarships:', error);
    }
}

// Escape HTML utility
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
