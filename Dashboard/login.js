// ═══════════════════════════════════════════════════
//  LOGIN — autenticação via API + fallback de demo
// ═══════════════════════════════════════════════════

// ──────────────────────────────────────────────
//  ✏️ URL da API — troque pela URL do seu backend
// ──────────────────────────────────────────────
const API_URL      = '/api';
const API_BASE_URL = `${API_URL}/form`;


// ══════════════════════════════════════════════
//  ⚠️  USUÁRIO DE DEMONSTRAÇÃO
//  Isso é APENAS para teste local/GitHub demo.
//  Em produção, REMOVA este bloco e use somente
//  a autenticação real via API (seção abaixo).
// ══════════════════════════════════════════════
const DEMO_USER = {
    email:    'teste@teste.com',
    password: 'Teste@123',
};
// ══════════════════════════════════════════════


// ══════════════════════════════════════════════
//  TEMA DARK / LIGHT
// ══════════════════════════════════════════════

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);   // ✏️ mesma chave usada no dashboard
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


// ══════════════════════════════════════════════
//  UI HELPERS
// ══════════════════════════════════════════════

function togglePasswordVisibility() {
    const input  = document.getElementById('password');
    const toggle = document.querySelector('.password-toggle');
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    toggle.innerHTML = `<i class="fas fa-eye${isHidden ? '-slash' : ''}"></i>`;
}

function showError(msg) {
    const alert = document.getElementById('errorAlert');
    document.getElementById('errorMessage').textContent = msg;
    alert.style.display = 'flex';
}

function hideError() {
    document.getElementById('errorAlert').style.display = 'none';
}

function setLoading(on) {
    document.getElementById('loadingMessage').style.display = on ? 'flex' : 'none';
    const btn = document.querySelector('.login-btn');
    if (btn) btn.disabled = on;
}


// ══════════════════════════════════════════════
//  AUTENTICAÇÃO
// ══════════════════════════════════════════════

async function handleLogin(event) {
    event.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) { showError('Preencha todos os campos.'); return; }
    if (password.length < 6)  { showError('A senha deve ter pelo menos 6 caracteres.'); return; }

    hideError();
    setLoading(true);

    try {
        // ── ⚠️ BLOCO DE DEMO ─────────────────────────────
        //  Compara com o usuário fixo acima.
        //  REMOVA em produção — deixe apenas a chamada à API.
        if (email === DEMO_USER.email && password === DEMO_USER.password) {
            localStorage.setItem('auth_token', 'demo-token');
            localStorage.setItem('auth_user',  email);
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 400);
            return;
        }
        // ── FIM DO BLOCO DE DEMO ──────────────────────────

        // ── AUTENTICAÇÃO REAL via API ─────────────────────
        //  Em produção, este trecho autentica contra o backend.
        //  Certifique-se de que API_URL aponta para o seu servidor.
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user',  data.user?.email || email);
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 400);
        } else {
            showError(data.message || 'Credenciais inválidas. Tente novamente.');
        }
        // ─────────────────────────────────────────────────

    } catch (err) {
        console.error('[login]', err);
        // ⚠️ Se a API não estiver disponível, o erro chega aqui.
        //  Em demo local isso é esperado — a autenticação real requer o backend rodando.
        showError('Erro de conexão com o servidor. Verifique se o backend está rodando.');
    } finally {
        setLoading(false);
    }
}

function checkAuthentication() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) window.location.href = 'dashboard.html';
}


// ══════════════════════════════════════════════
//  INICIALIZAÇÃO
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    checkAuthentication();

    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
});