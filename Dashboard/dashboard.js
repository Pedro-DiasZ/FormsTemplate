// ═══════════════════════════════════════════════════
//  DASHBOARD — busca, resultados e modal de detalhes
// ═══════════════════════════════════════════════════

// ──────────────────────────────────────────────
//  ✏️ URL da API — troque pela URL do seu backend
//  Exemplos:
//    'http://localhost:8000'
//    'https://api.seudominio.com'
// ──────────────────────────────────────────────
const API_URL      = '/api';
const API_BASE_URL = `${API_URL}/form`;


// ══════════════════════════════════════════════
//  AUTENTICAÇÃO
// ══════════════════════════════════════════════

function checkAuthAndLoadUser() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const userName = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
    if (userName) {
        const el = document.getElementById('userName');
        // Exibe só a parte antes do @ caso seja um e-mail
        if (el) el.textContent = userName.split('@')[0];
    }
}

function handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    window.location.href = 'login.html';
}


// ══════════════════════════════════════════════
//  CHAMADAS À API
// ══════════════════════════════════════════════

async function fetchSubmissions() {
    try {
        const res = await fetch(`${API_BASE_URL}/submissions`);
        if (!res.ok) throw new Error('Erro ao buscar registros');
        return await res.json();
    } catch (err) {
        console.error('[dashboard] fetchSubmissions:', err);
        return [];
    }
}

async function fetchSubmissionDetails(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/submissions/${id}`);
        if (!res.ok) throw new Error('Registro não encontrado');
        return await res.json();
    } catch (err) {
        console.error('[dashboard] fetchSubmissionDetails:', err);
        return null;
    }
}

async function searchSubmissions(term) {
    try {
        const res = await fetch(`${API_BASE_URL}/submissions/search?q=${encodeURIComponent(term)}`);
        if (!res.ok) throw new Error('Erro na busca');
        return await res.json();
    } catch (err) {
        console.error('[dashboard] searchSubmissions:', err);
        return [];
    }
}


// ══════════════════════════════════════════════
//  BUSCA
// ══════════════════════════════════════════════

async function handleSearch(event) {
    event.preventDefault();
    const term = document.getElementById('searchInput').value.trim();
    if (!term) return;
    showLoading();
    const results = await searchSubmissions(term);
    displayResults(results, term);
}

function showLoading() {
    document.querySelector('.results-container')?.remove();
    const container = document.createElement('div');
    container.className = 'results-container show';
    container.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Buscando...</p>
        </div>`;
    document.querySelector('.search-container').parentElement.appendChild(container);
}

function displayResults(results, searchTerm) {
    document.querySelector('.results-container')?.remove();

    const container = document.createElement('div');
    container.className = 'results-container';

    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon"><i class="fas fa-search"></i></div>
                <div class="no-results-text">Nenhum resultado encontrado</div>
                <div class="no-results-suggestion">Tente buscar por outros termos</div>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="results-header">
                <h2 class="results-title">Resultados</h2>
                <span class="results-count">
                    ${results.length} registro${results.length > 1 ? 's' : ''} encontrado${results.length > 1 ? 's' : ''}
                </span>
            </div>
            <div class="results-grid">
                ${results.map(r => `
                    <div class="result-card" onclick="selectSubmission('${r.id}')">
                        <div class="result-header">
                            <div class="result-icon"><i class="fas fa-file-alt"></i></div>
                            <div class="result-badge">
                                <i class="fas fa-hashtag"></i> ${r.ticket_number}
                            </div>
                        </div>
                        <!-- ✏️ Adapte os campos exibidos no card conforme seu modelo -->
                        <h3 class="result-name">${r.reference_id}</h3>
                        <div class="result-tech">
                            <i class="fas fa-user"></i>
                            <span>${r.requester_name}</span>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }

    document.querySelector('.search-container').parentElement.appendChild(container);
    setTimeout(() => container.classList.add('show'), 100);
}


// ══════════════════════════════════════════════
//  MODAL DE DETALHES
// ══════════════════════════════════════════════

async function selectSubmission(id) {
    const submission = await fetchSubmissionDetails(id);
    if (!submission) {
        alert('Erro ao carregar detalhes. Por favor, tente novamente.');
        return;
    }
    showSubmissionModal(submission);
}

function showSubmissionModal(s) {
    // ✏️ Adapte os campos exibidos no modal conforme seu modelo (schemas.py → SubmissionDetail)
    const modalHTML = `
        <div class="modal fade" id="submissionModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-file-alt"></i> ${s.reference_id}
                        </h5>
                    </div>
                    <div class="modal-body">
                        <div class="migration-details">

                            <!-- Informações Gerais -->
                            <div class="detail-section">
                                <h6><i class="fas fa-info-circle"></i> Informações Gerais</h6>
                                <p><strong>Responsável:</strong> ${s.requester_name}</p>
                                <p><strong>E-mail:</strong> ${s.email}</p>
                                <p><strong>Telefone:</strong> ${s.phone}</p>
                                <p><strong>Chamado:</strong> #${s.ticket_number}</p>
                            </div>

                            <!-- ✏️ Seção A — exibe só se habilitada -->
                            ${s.section_a_enabled === 'sim' && s.section_a ? `
                                <div class="detail-section">
                                    <h6><i class="fas fa-key"></i> Seção A</h6>
                                    <p><strong>Campo A1:</strong> ${s.section_a.field_a1}</p>
                                    ${s.section_a.field_a3 ? `<p><strong>Campo A3:</strong> ${s.section_a.field_a3}</p>` : ''}
                                </div>
                            ` : ''}

                            <!-- ✏️ Seção B — exibe só se habilitada -->
                            ${s.section_b_enabled === 'sim' && s.section_b ? `
                                <div class="detail-section">
                                    <h6><i class="fas fa-desktop"></i> Seção B</h6>
                                    <p><strong>Campo B1:</strong> ${s.section_b.field_b1}</p>
                                    ${s.section_b.field_b3 ? `<p><strong>Link:</strong> ${s.section_b.field_b3}</p>` : ''}
                                </div>
                            ` : ''}

                            <!-- ✏️ Seção C — exibe só se habilitada -->
                            ${s.section_c_enabled === 'sim' && s.section_c ? `
                                <div class="detail-section">
                                    <h6><i class="fas fa-list"></i> Seção C</h6>
                                    <p><strong>Campo C1:</strong> ${s.section_c.field_c1}</p>
                                    <p><strong>Campo C2:</strong> ${s.section_c.field_c2}</p>
                                    ${s.section_c.field_c3 ? `<p><strong>Campo C3:</strong> ${s.section_c.field_c3}</p>` : ''}
                                </div>
                            ` : ''}

                        </div>
                    </div>
                    <div class="modal-footer">
                        <!-- ✏️ Remova ou adapte os botões de download conforme necessário -->
                        <button type="button" class="btn btn-primary" id="btn-download-a"
                            onclick="triggerWebhook('${s.id}', '${s.reference_id}', 'type_a')">
                            <i class="fas fa-download"></i> Exportar A
                        </button>
                        <button type="button" class="btn btn-success" id="btn-download-b"
                            onclick="triggerWebhook('${s.id}', '${s.reference_id}', 'type_b')">
                            <i class="fas fa-download"></i> Exportar B
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>`;

    document.getElementById('submissionModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('submissionModal')).show();
}


// ══════════════════════════════════════════════
//  WEBHOOK / EXPORTAÇÃO
//  ✏️ Adapte os tipos e o payload conforme sua integração
// ══════════════════════════════════════════════

async function triggerWebhook(id, referenceId, type) {
    const btnId   = type === 'type_a' ? 'btn-download-a' : 'btn-download-b';
    const btn     = document.getElementById(btnId);
    const origTxt = btn.innerHTML;

    btn.disabled  = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    try {
        const res = await fetch(`${API_BASE_URL}/api/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referenceId, type }),
        });

        if (!res.ok) throw new Error('Erro na requisição');
        const data = await res.json();

        if (data.success && data.fileBase64) {
            const bytes    = atob(data.fileBase64);
            const arr      = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
            const blob     = new Blob([arr], { type: data.mimeType || 'text/csv' });
            const url      = URL.createObjectURL(blob);
            const link     = document.createElement('a');
            link.href      = url;
            link.download  = data.filename || `export_${referenceId}_${type}.csv`;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
            showToast('Arquivo exportado com sucesso!', 'success');
        } else {
            throw new Error('Arquivo não encontrado na resposta');
        }
    } catch (err) {
        console.error('[dashboard] triggerWebhook:', err);
        showToast('Erro ao exportar arquivo. Tente novamente.', 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = origTxt;
    }
}


// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════

function showToast(message, type = 'info') {
    document.querySelector('.toast-notification')?.remove();
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}


// ══════════════════════════════════════════════
//  TEMA DARK / LIGHT
// ══════════════════════════════════════════════

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);   // ✏️ altere a chave se preferir
    const sw = document.getElementById('switch');
    if (sw) sw.classList.toggle('light', theme === 'light');
}

function togglemode() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initializeTheme() {
    const saved  = localStorage.getItem('app-theme');
    const system = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    applyTheme(saved || system);
}

if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
        if (!localStorage.getItem('app-theme')) applyTheme(e.matches ? 'light' : 'dark');
    });
}


// ══════════════════════════════════════════════
//  INICIALIZAÇÃO
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadUser();
    initializeTheme();

    // Carrega todos os registros ao abrir
    fetchSubmissions().then(data => {
        if (data.length > 0) displayResults(data, 'todos os registros');
    });

    // Navbar mobile
    document.querySelector('.navbar-toggler')?.addEventListener('click', () => {
        document.querySelector('.navbar-collapse')?.classList.toggle('show');
    });

    // Busca em tempo real (debounce 500ms)
    let searchTimeout;
    document.getElementById('searchInput')?.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const term = this.value.trim();
            if (term.length >= 3) {
                showLoading();
                displayResults(await searchSubmissions(term), term);
            } else if (term.length === 0) {
                const all = await fetchSubmissions();
                displayResults(all, 'todos os registros');
            }
        }, 500);
    });
});