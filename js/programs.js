// ============================================
// Scholarship Programs Module
// Implements: FR-02, FR-03
// Business Rules: BR-01, BR-02
// ============================================

let allPrograms = [];
let editingProgramId = null;

async function loadPrograms() {
    try {
        const { data, error } = await window.db
            .from('scholarship_programs')
            .select('*')
            .order('program_name', { ascending: true });

        if (error) throw error;
        allPrograms = data || [];
        renderProgramCards(allPrograms);
    } catch (error) {
        console.error('Error loading programs:', error);
        showToast('Error loading scholarship programs.', 'error');
    }
}

function renderProgramCards(programs) {
    const grid = document.getElementById('programs-grid');

    if (!programs || programs.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-card">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 10 3 12 0v-5"/></svg>
                <p>No scholarship programs configured yet</p>
            </div>`;
        return;
    }

    grid.innerHTML = programs.map(p => `
        <div class="program-card">
            <h3>${escapeHtml(p.program_name)}</h3>
            <div class="program-requirements">
                <div class="program-req-item">
                    <span class="req-label">Required GWA ≤</span>
                    <span class="req-value">${p.required_gwa !== null ? p.required_gwa.toFixed(2) : '—'}</span>
                </div>
                <div class="program-req-item">
                    <span class="req-label">Min Units</span>
                    <span class="req-value">${p.min_units !== null ? p.min_units : '—'}</span>
                </div>
                <div class="program-req-item">
                    <span class="req-label">Failing Grades</span>
                    <span class="req-value">${p.allow_failing_grade ? 'Allowed' : 'Not Allowed'}</span>
                </div>
                <div class="program-req-item">
                    <span class="req-label">Status</span>
                    <span class="req-value">${p.active ? '🟢 Active' : '🔴 Inactive'}</span>
                </div>
            </div>
            <div class="program-card-footer">
                <span class="badge badge-${p.active ? 'active' : 'disqualified'}">${p.active ? 'Active' : 'Inactive'}</span>
                <button class="btn btn-sm btn-icon" onclick="editProgram('${p.id}')" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

function openProgramModal(programId = null) {
    editingProgramId = programId;
    document.getElementById('program-modal-title').textContent = programId ? 'Edit Scholarship Program' : 'Add Scholarship Program';
    document.getElementById('program-save-btn').textContent = programId ? 'Update Program' : 'Save Program';

    if (!programId) {
        document.getElementById('program-name').value = '';
        document.getElementById('program-gwa').value = '';
        document.getElementById('program-units').value = '';
        document.getElementById('program-failing').value = 'false';
        document.getElementById('program-active').value = 'true';
    }

    document.getElementById('program-modal').classList.remove('hidden');
}

function closeProgramModal() {
    document.getElementById('program-modal').classList.add('hidden');
    editingProgramId = null;
}

async function editProgram(id) {
    try {
        const { data, error } = await window.db
            .from('scholarship_programs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        openProgramModal(id);

        document.getElementById('program-name').value = data.program_name || '';
        document.getElementById('program-gwa').value = data.required_gwa || '';
        document.getElementById('program-units').value = data.min_units || '';
        document.getElementById('program-failing').value = data.allow_failing_grade ? 'true' : 'false';
        document.getElementById('program-active').value = data.active ? 'true' : 'false';
    } catch (error) {
        console.error('Error loading program:', error);
        showToast('Error loading program details.', 'error');
    }
}

async function saveProgram() {
    const name = document.getElementById('program-name').value.trim();
    const gwa = parseFloat(document.getElementById('program-gwa').value);
    const units = parseInt(document.getElementById('program-units').value);
    const allowFailing = document.getElementById('program-failing').value === 'true';
    const active = document.getElementById('program-active').value === 'true';

    // Validation — BR-02: Every scholarship program must define its academic requirements
    if (!name) {
        showToast('Program name is required.', 'error');
        return;
    }

    if (isNaN(gwa) || gwa < 1.0 || gwa > 5.0) {
        showToast('Required GWA must be between 1.00 and 5.00.', 'error');
        return;
    }

    if (isNaN(units) || units < 0) {
        showToast('Minimum units cannot be negative.', 'error');
        return;
    }

    const programData = {
        program_name: name,
        required_gwa: gwa,
        min_units: units,
        allow_failing_grade: allowFailing,
        active: active
    };

    try {
        if (editingProgramId) {
            const { error } = await window.db
                .from('scholarship_programs')
                .update(programData)
                .eq('id', editingProgramId);
            if (error) throw error;
            showToast('Program updated successfully!', 'success');
        } else {
            const { error } = await window.db
                .from('scholarship_programs')
                .insert([programData]);
            if (error) throw error;
            showToast('Program created successfully!', 'success');
        }

        closeProgramModal();
        loadPrograms();
    } catch (error) {
        console.error('Error saving program:', error);
        showToast('Error saving program: ' + error.message, 'error');
    }
}
