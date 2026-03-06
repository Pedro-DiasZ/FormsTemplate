// ═══════════════════════════════════════════════════
//  SCRIPT PRINCIPAL — navegação, validação, upload
// ═══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

    // ──────────────────────────────────────────────
    //  ✏️ PLANOS — adapte para as categorias do seu form
    //  Chave = valor do <select id="emailTechnology">
    // ──────────────────────────────────────────────
    const plans = {
        tipo_a: ['Categoria 1', 'Categoria 2', 'Categoria 3'],
        tipo_b: ['Opção X', 'Opção Y'],
    };

    // ──────────────────────────────────────────────
    //  ✏️ ETAPAS da barra de progresso
    //  Altere name e icon conforme suas etapas
    // ──────────────────────────────────────────────
    const progressSteps = [
        { name: 'Dados Iniciais', icon: '<i class="fa fa-file-text-o"></i>' },
        { name: 'Seção A',        icon: '<i class="fa fa-key"></i>' },
        { name: 'Seção B',        icon: '<i class="fa fa-desktop"></i>' },
        { name: 'Seção C',        icon: '<i class="fa fa-list"></i>' },
    ];

    const form            = document.getElementById('migration-form');
    const progressBar     = document.getElementById('progress-bar');
    const excelUploadInput = document.getElementById('excel-upload');
    let currentStep = 0;

    // ══════════════════════════════════════════════
    //  VIRTUAL SCROLLER — renderiza apenas as linhas visíveis
    //  (necessário para listas grandes)
    // ══════════════════════════════════════════════
    const VirtualScroller = (() => {
        const ROW_HEIGHT   = 58;
        const BUFFER       = 5;
        const CONTAINER_H  = 400;
        const VISIBLE_ROWS = Math.ceil(CONTAINER_H / ROW_HEIGHT);

        let emailRows        = [];
        let renderStart      = 0;
        let renderEnd        = 0;
        let duplicateIndices = new Set();
        let scrollContainer  = null;
        let tableBody        = null;
        let topSpacer        = null;
        let bottomSpacer     = null;

        const escHtml = (str) =>
            String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

        const buildRow = (rowData, dataIndex) => {
            const tech = document.getElementById('emailTechnology')?.value || '';
            const planList = plans[tech] || [];

            // ✏️ Se tiver planos cadastrados, usa <select>; senão, usa <input>
            const planField = planList.length
                ? `<select name="emailPlan[]" class="form-control">
                       <option value="">Categoria</option>
                       ${planList.map(p => `<option value="${p.toLowerCase()}" ${p.toLowerCase()===rowData.plan?'selected':''}>${p}</option>`).join('')}
                   </select>`
                : `<input type="text" name="emailPlan[]" class="form-control" placeholder="Categoria" value="${escHtml(rowData.plan||'')}">`;

            const tr = document.createElement('tr');
            tr.dataset.index = dataIndex;
            tr.style.height  = ROW_HEIGHT + 'px';

            tr.innerHTML = `
                <td><input type="text"  name="emailFirstName[]"  class="form-control" value="${escHtml(rowData.firstName||'')}"></td>
                <td><input type="text"  name="emailLastName[]"   class="form-control" value="${escHtml(rowData.lastName||'')}"></td>
                <td><input type="email" name="emailOrigin[]"     class="form-control" value="${escHtml(rowData.origin||'')}"></td>
                <td><input type="text"  name="emailOriginPass[]" class="form-control" value="${escHtml(rowData.originPass||'')}"></td>
                <td><input type="email" name="emailDest[]"       class="form-control" value="${escHtml(rowData.dest||'')}"></td>
                <td><input type="text"  name="emailDestPass[]"   class="form-control" value="${escHtml(rowData.destPass||'')}"></td>
                <td>${planField}</td>
                <td><button type="button" class="btn btn-sm btn-danger remove-row">×</button></td>
                <td class="row-status-cell"></td>`;

            tr.querySelector('input[name="emailFirstName[]"]').required = true;
            addPasswordValidation(tr.querySelector('input[name="emailDestPass[]"]'));
            addEmailValidation(tr.querySelector('input[name="emailOrigin[]"]'));
            addEmailValidation(tr.querySelector('input[name="emailDest[]"]'));

            tr.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('input',  () => syncRowData(tr));
                input.addEventListener('change', () => { syncRowData(tr); updateEmailStats(); });
            });

            tr.querySelector('.remove-row').addEventListener('click', () => {
                emailRows.splice(parseInt(tr.dataset.index, 10), 1);
                render(true);
                updateEmailStats();
            });

            return tr;
        };

        const syncRowData = (tr) => {
            const idx = parseInt(tr.dataset.index, 10);
            if (idx < 0 || idx >= emailRows.length) return;
            emailRows[idx].firstName  = tr.querySelector('input[name="emailFirstName[]"]').value;
            emailRows[idx].lastName   = tr.querySelector('input[name="emailLastName[]"]').value;
            emailRows[idx].origin     = tr.querySelector('input[name="emailOrigin[]"]').value;
            emailRows[idx].originPass = tr.querySelector('input[name="emailOriginPass[]"]').value;
            emailRows[idx].dest       = tr.querySelector('input[name="emailDest[]"]').value;
            emailRows[idx].destPass   = tr.querySelector('input[name="emailDestPass[]"]').value;
            emailRows[idx].plan = (tr.querySelector('input[name="emailPlan[]"]') || tr.querySelector('select[name="emailPlan[]"]'))?.value || '';
        };

        const calcRange = () => {
            if (!scrollContainer) return { start: 0, end: Math.min(VISIBLE_ROWS + BUFFER * 2, emailRows.length) };
            const firstVisible = Math.floor(scrollContainer.scrollTop / ROW_HEIGHT);
            return { start: Math.max(0, firstVisible - BUFFER), end: Math.min(emailRows.length, firstVisible + VISIBLE_ROWS + BUFFER) };
        };

        const render = (force = false) => {
            if (!tableBody) return;
            const { start, end } = calcRange();
            if (!force && start === renderStart && end === renderEnd && tableBody.querySelectorAll('tr').length === (end - start)) return;
            renderStart = start; renderEnd = end;
            if (topSpacer)    topSpacer.style.height    = (start * ROW_HEIGHT) + 'px';
            if (bottomSpacer) bottomSpacer.style.height = ((emailRows.length - end) * ROW_HEIGHT) + 'px';
            tableBody.innerHTML = '';
            for (let i = start; i < end; i++) {
                const tr = buildRow(emailRows[i], i);
                if (duplicateIndices.has(i)) { tr.classList.add('duplicate-row'); tr.title = 'Item duplicado'; }
                tableBody.appendChild(tr);
            }
            updateRowCounter();
        };

        const updateRowCounter = () => {
            let counter = document.getElementById('vs-row-counter');
            if (!counter) {
                counter = document.createElement('div');
                counter.id = 'vs-row-counter';
                counter.style.cssText = 'font-size:.82em;color:#888;margin-bottom:4px;text-align:right;';
                const tableWrap = document.querySelector('.table-responsive');
                if (tableWrap) tableWrap.before(counter);
            }
            const total = emailRows.length;
            counter.textContent = total === 0 ? '' :
                `${total} item${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}` +
                (total > VISIBLE_ROWS ? ` — virtual scroll ativo (${renderStart + 1}–${renderEnd})` : '');
        };

        const init = () => {
            const tableWrap = document.querySelector('.table-responsive');
            if (!tableWrap || scrollContainer === tableWrap) return;
            tableWrap.style.cssText = `max-height:${CONTAINER_H}px;overflow-y:auto;overflow-x:auto;position:relative;border:1px solid #dee2e6;border-radius:4px;`;
            scrollContainer = tableWrap;
            tableBody = document.getElementById('email-table-body');
            if (!tableBody) return;
            const table = tableBody.closest('table');
            if (table) {
                const topTr = document.createElement('tr');
                topSpacer = document.createElement('td'); topSpacer.colSpan = 9; topSpacer.style.cssText = 'padding:0;height:0;';
                topTr.appendChild(topSpacer); table.querySelector('thead').after(topTr);
                const bottomTr = document.createElement('tr');
                bottomSpacer = document.createElement('td'); bottomSpacer.colSpan = 9; bottomSpacer.style.cssText = 'padding:0;height:0;';
                bottomTr.appendChild(bottomSpacer); table.appendChild(bottomTr);
            }
            scrollContainer.addEventListener('scroll', () => render(), { passive: true });
            const thead = tableBody.closest('table')?.querySelector('thead tr');
            if (thead && !thead.querySelector('.th-status')) {
                const th = document.createElement('th'); th.className = 'th-status'; th.style.width = '28px'; thead.appendChild(th);
            }
        };

        const addRow  = (data = {}) => {
            emailRows.push({ firstName: data.firstName||'', lastName: data.lastName||'', origin: data.origin||'', originPass: data.originPass||'', dest: data.dest||'', destPass: data.destPass||'', plan: data.plan||'' });
            render(true);
            if (scrollContainer && emailRows.length > VISIBLE_ROWS)
                setTimeout(() => { scrollContainer.scrollTop = scrollContainer.scrollHeight; }, 0);
        };
        const setRows = (arr) => { emailRows = arr.map(d => ({ firstName: d.firstName||'', lastName: d.lastName||'', origin: d.origin||'', originPass: d.originPass||'', dest: d.dest||'', destPass: d.destPass||'', plan: d.plan||'' })); if (scrollContainer) scrollContainer.scrollTop = 0; render(true); };
        const clear   = () => { emailRows = []; render(true); };
        const getAllRows = () => [...emailRows];
        const markDuplicates = (indices) => {
            duplicateIndices = indices;
            if (tableBody) tableBody.querySelectorAll('tr[data-index]').forEach(tr => {
                const idx = parseInt(tr.dataset.index, 10);
                tr.classList.toggle('duplicate-row', duplicateIndices.has(idx));
                if (duplicateIndices.has(idx)) tr.title = 'Item duplicado'; else tr.removeAttribute('title');
            });
        };
        return { init, addRow, setRows, clear, getAllRows, render, markDuplicates };
    })();


    // ══════════════════════════════════════════════
    //  VALIDAÇÕES
    // ══════════════════════════════════════════════
    const validateEmail = (email) => {
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        return { isValid: valid, message: valid ? 'E-mail válido' : 'E-mail inválido' };
    };

    // ✏️ Adapte as regras de senha conforme a política da sua empresa
    const validatePassword = (password, firstName = '', originEmail = '', destEmail = '') => {
        if (/[\/\[\]"';]/.test(password)) return { isValid: false, message: 'Senha contém caracteres proibidos: / [ ] " \' ;' };
        if (password.length < 8)          return { isValid: false, message: 'Mínimo 8 caracteres' };
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password))
            return { isValid: false, message: 'Precisa de: Maiúscula, Minúscula, Número e Especial' };

        const normalize  = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
        const substrings = (t, min=3) => { const n=normalize(t), s=[]; for(let i=0;i<=n.length-min;i++) for(let j=i+min;j<=n.length;j++) s.push(n.slice(i,j)); return s; };
        const np = normalize(password);

        if (firstName?.trim()) for (const s of substrings(firstName)) if (np.includes(s)) return { isValid: false, message: 'Senha não pode conter partes do nome' };
        if (originEmail?.trim()) for (const s of substrings(originEmail.split('@')[0])) if (np.includes(s)) return { isValid: false, message: 'Senha não pode conter partes do campo origem' };
        if (destEmail?.trim()) { const [u,d]=destEmail.split('@'); for (const s of substrings((u||'')+(d?d.split('.')[0]:''))) if (np.includes(s)) return { isValid: false, message: 'Senha não pode conter partes do campo destino' }; }
        return { isValid: true, message: 'Senha forte!' };
    };

    const addPasswordValidation = (input) => {
        const feedback = document.createElement('small');
        feedback.style.cssText = 'display:block;margin-top:4px;font-size:.85em;';
        input.parentElement.appendChild(feedback);
        input.addEventListener('input', () => {
            const row = input.closest('tr');
            const res = validatePassword(input.value, row?.querySelector('[name="emailFirstName[]"]')?.value||'', row?.querySelector('[name="emailOrigin[]"]')?.value||'', row?.querySelector('[name="emailDest[]"]')?.value||'');
            if (!input.value) { feedback.textContent=''; input.classList.remove('is-valid','is-invalid'); updateEmailStats(); return; }
            feedback.textContent = res.message; feedback.style.color = res.isValid ? 'green' : 'red';
            input.classList.toggle('is-valid', res.isValid); input.classList.toggle('is-invalid', !res.isValid);
            updateEmailStats();
        });
    };

    const addEmailValidation = (input) => {
        const feedback = document.createElement('small');
        feedback.style.cssText = 'display:block;margin-top:4px;font-size:.85em;';
        input.parentElement.appendChild(feedback);
        input.addEventListener('input', () => {
            const res = validateEmail(input.value);
            if (!input.value) { feedback.textContent=''; input.classList.remove('is-valid','is-invalid'); updateEmailStats(); return; }
            feedback.textContent = res.message; feedback.style.color = res.isValid ? 'green' : 'red';
            input.classList.toggle('is-valid', res.isValid); input.classList.toggle('is-invalid', !res.isValid);
            updateEmailStats();
        });
    };


    // ══════════════════════════════════════════════
    //  PAINEL DE ESTATÍSTICAS
    // ══════════════════════════════════════════════
    const createStatsPanel = () => {
        const emailConditional = document.getElementById('email-conditional');
        if (!emailConditional || document.getElementById('stats-panel')) return;
        const statsPanel = document.createElement('div');
        statsPanel.id = 'stats-panel';
        statsPanel.innerHTML = `
        <style>
            #stats-panel { margin-bottom: 16px; }
            .stats-grid { display:flex; flex-direction:row; gap:10px; width:100%; margin-top:10px; }
            .stat-card { flex:1; background:#f8f9fa; border-radius:4px; padding:10px 15px; border-left:4px solid #ccc; }
            .stat-valid   { border-left-color:#28a745; }
            .stat-warning { border-left-color:#ffc107; }
            .stat-error   { border-left-color:#dc3545; }
            .stat-number  { font-weight:bold; font-size:1.1em; color:#333; }
            .stat-label   { font-size:.85em; color:#666; }
        </style>
        <h6><i class="fa fa-bar-chart"></i> Status dos Itens</h6>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-number" id="stat-total">0</div><div class="stat-label">Total</div></div>
            <div class="stat-card stat-valid"><div class="stat-number" id="stat-valid">0</div><div class="stat-label">Válidos</div></div>
            <div class="stat-card stat-warning"><div class="stat-number" id="stat-warning">0</div><div class="stat-label">Avisos</div></div>
            <div class="stat-card stat-error"><div class="stat-number" id="stat-error">0</div><div class="stat-label">Erros</div></div>
        </div>`;
        const tableContainer = emailConditional.querySelector('.table-responsive');
        if (tableContainer) tableContainer.parentNode.insertBefore(statsPanel, tableContainer);
    };

    const validateRow = (row) => {
        const errs = [];
        if (!row.firstName.trim()) errs.push('Nome vazio');
        if (row.origin.trim() && !validateEmail(row.origin).isValid) errs.push('Campo origem inválido');
        if (row.dest.trim()   && !validateEmail(row.dest).isValid)   errs.push('Campo destino inválido');
        if (row.destPass.trim()) { const v = validatePassword(row.destPass, row.firstName, row.origin, row.dest); if (!v.isValid) errs.push(v.message); }
        return errs;
    };

    const getDuplicateMap = () => {
        const allRows = VirtualScroller.getAllRows();
        const seenOrigin = new Map(), seenDest = new Map(), dupes = new Map();
        allRows.forEach((row, i) => {
            const origin = row.origin.trim().toLowerCase(), dest = row.dest.trim().toLowerCase();
            if (origin) { if (seenOrigin.has(origin)) { const fi=seenOrigin.get(origin); dupes.set(fi,[...(dupes.get(fi)||[]),`Duplicado com linha ${i+1}`]); dupes.set(i,[...(dupes.get(i)||[]),`Duplicado com linha ${fi+1}`]); } else seenOrigin.set(origin,i); }
            if (dest)   { if (seenDest.has(dest))     { const fi=seenDest.get(dest);     dupes.set(fi,[...(dupes.get(fi)||[]),`Destino duplicado com linha ${i+1}`]); dupes.set(i,[...(dupes.get(i)||[]),`Destino duplicado com linha ${fi+1}`]); } else seenDest.set(dest,i); }
        });
        return dupes;
    };

    const updateRowIcons = () => {
        const tableBody = document.getElementById('email-table-body');
        if (!tableBody) return;
        const dupeMap = getDuplicateMap(), allRows = VirtualScroller.getAllRows();
        VirtualScroller.markDuplicates(new Set(dupeMap.keys()));
        tableBody.querySelectorAll('tr[data-index]').forEach(tr => {
            const idx = parseInt(tr.dataset.index,10), row = allRows[idx], cell = tr.querySelector('.row-status-cell');
            if (!cell || !row) return;
            const errs = [...validateRow(row), ...(dupeMap.get(idx)||[])];
            cell.innerHTML = errs.length > 0 ? `<span style="color:#e74c3c;cursor:help;font-size:16px;" title="${errs.join('\n')}">⚠</span>` : '';
        });
    };

    const updateEmailStats = () => {
        const allRows = VirtualScroller.getAllRows();
        let total=0, valid=0, errors=0;
        allRows.forEach(row => { if (!Object.values(row).some(v=>v.trim())) return; total++; validateRow(row).length>0 ? errors++ : valid++; });
        const set = (id,val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
        set('stat-total',total); set('stat-valid',valid); set('stat-warning',0); set('stat-error',errors);
        updateRowIcons();
    };


    // ══════════════════════════════════════════════
    //  PERSISTÊNCIA (sessionStorage)
    // ══════════════════════════════════════════════
    const STORAGE_KEY = 'form_template_state';

    const saveState = () => {
        const fields = {};
        form.querySelectorAll('input, select, textarea').forEach(el => { if (el.name||el.id) fields[el.id||el.name] = el.value; });
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step: currentStep, fields, emailRows: VirtualScroller.getAllRows() }));
    };

    const restoreState = () => {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        try {
            const state = JSON.parse(raw);
            Object.entries(state.fields||{}).forEach(([key,value]) => { const el=document.getElementById(key)||form.querySelector(`[name="${key}"]`); if(el) el.value=value; });
            ['dnsMigration','siteMigration','emailMigration','emailTechnology','emailProtocol'].forEach(id => { const el=document.getElementById(id); if(el?.value) el.dispatchEvent(new Event('change',{bubbles:true})); });
            if (state.emailRows?.length) setTimeout(() => { VirtualScroller.setRows(state.emailRows); updateEmailStats(); }, 150);
            if (state.step > 0) goToStep(state.step);
            return true;
        } catch(e) { return false; }
    };


    // ══════════════════════════════════════════════
    //  NAVEGAÇÃO
    // ══════════════════════════════════════════════
    const goToStep = (stepIndex) => {
        if (stepIndex < 0 || stepIndex >= progressSteps.length) return;
        currentStep = stepIndex;
        form.querySelectorAll('.form-step').forEach((step,index) => step.classList.toggle('hidden', index !== stepIndex));
        updateProgress();
        saveState();
        if (stepIndex === 3) setTimeout(() => { createStatsPanel(); VirtualScroller.init(); updateEmailStats(); }, 100);
    };

    const updateProgress = () => {
        progressBar.querySelectorAll('.progress-step').forEach((stepEl,index) => {
            stepEl.classList.toggle('completed', index < currentStep);
            stepEl.querySelector('.progress-circle').classList.toggle('active', index === currentStep);
            stepEl.querySelector('.progress-label').classList.toggle('active',  index === currentStep);
        });
    };

    const validateStep = () => {
        const currentStepContainer = form.querySelector('.form-step:not(.hidden)');
        let isValid = true; const errors = [];
        currentStepContainer.querySelectorAll('input[required], select[required]').forEach(field => {
            if (field.offsetParent !== null && field.value.trim() === '') {
                isValid = false; field.classList.add('error');
                errors.push(`Campo "${field.previousElementSibling?.textContent || field.name}" é obrigatório`);
                field.addEventListener('input', () => field.classList.remove('error'), { once: true });
                field.addEventListener('change', () => field.classList.remove('error'), { once: true });
            } else { field.classList.remove('error'); }
        });

        if (currentStep === 3 && document.getElementById('emailMigration').value === 'sim') {
            const allRows = VirtualScroller.getAllRows();
            if (allRows.filter(r=>Object.values(r).some(v=>v.trim())).length === 0) { isValid=false; errors.push('Adicione pelo menos um item'); }
            allRows.forEach((row,index) => {
                if (row.destPass.trim()) { const v=validatePassword(row.destPass,row.firstName,row.origin,row.dest); if(!v.isValid) { isValid=false; errors.push(`Linha ${index+1}: ${v.message}`); } }
                if (row.origin.trim() && !validateEmail(row.origin).isValid) { isValid=false; errors.push(`Campo origem inválido: ${row.origin}`); }
                if (row.dest.trim()   && !validateEmail(row.dest).isValid)   { isValid=false; errors.push(`Campo destino inválido: ${row.dest}`); }
            });
        }

        if (!isValid && errors.length > 0) alert('Por favor, corrija:\n\n' + errors.join('\n'));
        return isValid;
    };


    // ══════════════════════════════════════════════
    //  UTILITÁRIOS
    // ══════════════════════════════════════════════
    const toggleVisibility = (selector, show) => { const el=document.querySelector(selector); if(el) el.classList.toggle('hidden',!show); };
    const setRequired      = (id, req)         => { const el=document.getElementById(id); if(el) el.required=req; };
    const copyToClipboard  = (text)             => { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); };


    // ──────────────────────────────────────────────
    //  ✏️ Template CSV para download
    //  Adapte os cabeçalhos e exemplos
    // ──────────────────────────────────────────────
    const downloadTemplate = () => {
        const csvContent = `Nome,Sobrenome,Campo Origem,Senha Origem,Campo Destino,Senha Destino,Categoria
Joao,Silva,joao@origem.com,Senha@123,joao@destino.com,Nova@456,categoria 1
Maria,Santos,maria@origem.com,Maria@2025,maria@destino.com,Maria@2026,categoria 2

INSTRUÇÕES:
- Preencha a partir da linha 2
- Não altere os cabeçalhos
- Senhas: mín. 8 chars, maiúscula, minúscula, número e especial
- NÃO USE nas senhas: / [ ] " ' ;`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'template-formulario.csv';
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    // ══════════════════════════════════════════════
    //  PROCESSAMENTO DE ARQUIVOS (CSV / XLSX)
    // ══════════════════════════════════════════════
    const cleanValue = (v) => v ? v.trim().replace(/^["']|["']$/g,'').trim() : '';

    // ✏️ Mapa de normalização de categorias — adapte para os seus planos
    const normalizeCategory = (name) => {
        if (!name) return '';
        const map = {
            'categoria 1': 'categoria 1', 'cat1': 'categoria 1',
            'categoria 2': 'categoria 2', 'cat2': 'categoria 2',
        };
        const n = name.toLowerCase().trim().replace(/\s+/g,' ');
        return map[n] || name.trim();
    };

    const processXLSXData = (arrayBuffer) => {
        if (typeof XLSX === 'undefined') { alert('Erro ao processar arquivo. Contate o administrador.'); return; }
        const wb = XLSX.read(arrayBuffer, { type:'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
        const rowsData=[], errors=[];
        for (let i=1; i<json.length; i++) {
            const row=json[i]; if (!row||row.every(c=>!c)) continue;
            const rd = { firstName:cleanValue(row[0]), lastName:cleanValue(row[1]), origin:cleanValue(row[2]), originPass:cleanValue(row[3]), dest:cleanValue(row[4]), destPass:cleanValue(row[5]), plan:normalizeCategory(cleanValue(row[6])) };
            if (!rd.firstName||!rd.origin) { errors.push(`Linha ${i+1}: falta nome ou campo obrigatório`); continue; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rd.origin)) { errors.push(`Linha ${i+1}: formato inválido (${rd.origin})`); continue; }
            rowsData.push(rd);
        }
        if (rowsData.length>0) { VirtualScroller.setRows(rowsData); let msg=`${rowsData.length} item(s) importado(s) com sucesso!`; if(errors.length>0) msg+=`\n\n${errors.length} linha(s) com problema:\n${errors.slice(0,5).join('\n')}`; alert(msg); updateEmailStats(); }
        else alert('Nenhum item válido encontrado.\n\nFormato: A:Nome | B:Sobrenome | C:Origem | D:Senha | E:Destino | F:Senha | G:Categoria');
    };

    const processCustomCSV = (csvText) => {
        const lines = csvText.split('\n').filter(l=>l.trim()!=='');
        let startLine = 0;
        if (lines[0].toLowerCase().includes('nome')||lines[0].toLowerCase().includes('campo')) startLine=1;
        const rowsData=[], errors=[];
        for (let i=startLine; i<lines.length; i++) {
            const sep=lines[i].includes(';')?';':',', cols=lines[i].split(sep).map(c=>c.trim());
            if (cols.length<3) { errors.push(`Linha ${i+1}: poucos campos`); continue; }
            const rd = { firstName:cols[0], lastName:cols[1]||'', origin:cols[2], originPass:cols[3]||'', dest:cols[4]||'', destPass:cols[5]||'', plan:normalizeCategory(cols[6]||'') };
            if (!rd.firstName||!rd.origin) { errors.push(`Linha ${i+1}: falta nome ou campo obrigatório`); continue; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rd.origin)) { errors.push(`Linha ${i+1}: formato inválido`); continue; }
            rowsData.push(rd);
        }
        if (rowsData.length>0) { VirtualScroller.setRows(rowsData); alert(`${rowsData.length} item(s) importado(s)!`); updateEmailStats(); }
        else alert('Nenhum item válido encontrado.\n\nFormato: Nome;Sobrenome;Origem;Senha;Destino;SenhaDestino;Categoria');
    };

    const handleExcelUpload = (file) => {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        const display = document.getElementById('file-name');
        if (display) display.textContent = file.name;
        if (ext==='csv') { const r=new FileReader(); r.onload=(e)=>{try{processCustomCSV(e.target.result);}catch{alert('Erro ao processar CSV.');}}; r.readAsText(file,'UTF-8'); }
        else if (ext==='xlsx'||ext==='xls') { const r=new FileReader(); r.onload=(e)=>{try{processXLSXData(e.target.result);}catch{alert('Erro ao processar Excel.');}}; r.readAsArrayBuffer(file); }
        else alert('Formato não suportado. Aceitos: CSV, XLSX, XLS');
    };


    // ══════════════════════════════════════════════
    //  HANDLERS DOS SELECTS
    // ══════════════════════════════════════════════
    const handleDnsMigrationChange   = (v) => { toggleVisibility('#dns-sim-fields',v==='sim'); toggleVisibility('#dns-nao-fields',v==='nao'); setRequired('dnsUser',v==='sim'); setRequired('dnsPass',v==='sim'); };
    const handleSiteMigrationChange  = (v) => { toggleVisibility('#site-conditional',v==='sim'); setRequired('siteUser',v==='sim'); setRequired('sitePass',v==='sim'); };
    const handleEmailMigrationChange = (v) => { toggleVisibility('#email-conditional',v==='sim'); setRequired('emailTechnology',v==='sim'); if(v==='sim') setTimeout(()=>{createStatsPanel();VirtualScroller.init();updateEmailStats();},100); };
    const handleEmailTechnologyChange= (v) => { toggleVisibility('#email-protocol-container',!!v); toggleVisibility('#email-details-fields',!!v); toggleVisibility('#imap-fields',false); setRequired('emailProtocol',!!v); setRequired('emailProvider',false); setRequired('imapServer',false); document.getElementById('emailProtocol').value=''; VirtualScroller.clear(); if(v){VirtualScroller.init();VirtualScroller.addRow();} updateEmailStats(); };
    const handleEmailProtocolChange  = (v) => { const isImap=['imap','ambos'].includes(v); toggleVisibility('#imap-fields',isImap); setRequired('emailProvider',isImap); setRequired('imapServer',isImap); };


    // ══════════════════════════════════════════════
    //  EVENT LISTENERS
    // ══════════════════════════════════════════════
    const setupEventListeners = () => {
        form.addEventListener('click', (e) => {
            const target = e.target.closest('button'); if (!target) return;
            if (target.classList.contains('next-btn')) { if(validateStep()) { if(target.type!=='submit') goToStep(currentStep+1); } else e.preventDefault(); }
            if (target.classList.contains('prev-btn')) goToStep(currentStep-1);
            if (target.id==='add-email-row') { VirtualScroller.addRow(); updateEmailStats(); }
        });

        form.addEventListener('change', (e) => {
            const { id, value } = e.target;
            switch(id) {
                case 'dnsMigration':    handleDnsMigrationChange(value);    break;
                case 'siteMigration':   handleSiteMigrationChange(value);   break;
                case 'emailMigration':  handleEmailMigrationChange(value);  break;
                case 'emailTechnology': handleEmailTechnologyChange(value); break;
                case 'emailProtocol':   handleEmailProtocolChange(value);   break;
            }
            saveState();
        });

        form.addEventListener('input', () => saveState());
        form.addEventListener('keydown', (e) => { if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA') e.preventDefault(); });
        form.addEventListener('submit', (e) => { if(!validateStep()) { e.preventDefault(); e.stopPropagation(); return false; } sessionStorage.removeItem(STORAGE_KEY); });

        document.body.addEventListener('click', (e) => {
            if (e.target.closest('#copy-registro-br')) {
                copyToClipboard(document.getElementById('registroBr').value);
                const icon=e.target.closest('#copy-registro-br').querySelector('i');
                icon.classList.replace('fa-clone','fa-check');
                setTimeout(()=>icon.classList.replace('fa-check','fa-clone'), 2000);
            }
            if (e.target.closest('#download-template')) { e.preventDefault(); downloadTemplate(); }
            if (e.target.closest('#upload-area-trigger')) excelUploadInput.click();
        });

        excelUploadInput.addEventListener('change', (e) => { handleExcelUpload(e.target.files[0]); e.target.value=null; });
    };


    // ══════════════════════════════════════════════
    //  INICIALIZAÇÃO
    // ══════════════════════════════════════════════
    const initializeForm = () => {
        if (!progressBar) { console.error('[script] #progress-bar não encontrado'); return; }

        if (!document.getElementById('duplicate-row-style')) {
            const style = document.createElement('style');
            style.id = 'duplicate-row-style';
            style.textContent = `
                tr.duplicate-row td { background-color:#fff3cd!important; border-left:3px solid #e74c3c!important; }
                .row-status-cell { width:28px; text-align:center; vertical-align:middle; }`;
            document.head.appendChild(style);
        }

        progressBar.innerHTML = progressSteps.map(step => `
            <div class="progress-step">
                <div class="progress-circle">${step.icon}</div>
                <div class="progress-label">${step.name}</div>
            </div>`).join('');

        setupEventListeners();
        if (!restoreState()) goToStep(0);
    };

    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', initializeForm);
    else initializeForm();
});