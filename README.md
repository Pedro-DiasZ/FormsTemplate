#  Form Template + Dashboard

> **Projeto de portfólio**
>
> Este sistema foi desenvolvido como projeto profissional real — aplicado em ambiente de produção de uma empresa para gerenciar um fluxo de trabalho interno. O código aqui presente foi **refatorado e anonimizado** para fins de portfólio: dados sensíveis foram removidos, campos específicos foram renomeados para nomes genéricos e comentários foram adicionados para documentar as decisões técnicas.
>
> O objetivo é demonstrar capacidade técnica em construção de sistemas full-stack — não distribuir o projeto como produto final. Sinta-se à vontade para explorar a arquitetura, o código e as soluções implementadas.

Sistema de formulário multi-etapas com painel de consulta de respostas.  
Construído com **FastAPI** (backend), **HTML/CSS/JS** (frontend) e **n8n** (automação de exportação).

---

##  Estrutura do Projeto

```
├── app/
│   ├── main.py              # Inicialização da API e CORS
│   ├── database.py          # Conexão com PostgreSQL (via .env)
│   ├── database_users.py    # Conexão com banco de usuários (autenticação)
│   ├── models.py            # Modelos do formulário (Submission + Seções A, B, C)
│   ├── models_users.py      # Modelo de usuário (autenticação)
│   ├── schemas.py           # Schemas Pydantic (validação de entrada/saída)
│   ├── security.py          # Hash de senha e geração de token JWT
│   └── routers/
│       └── form.py          # Rotas da API (CRUD + auth + webhook)
├── alembic/                 # Migrações de banco de dados
│   └── versions/
├── Control Dashboard/
│   ├── login.html           # Tela de login
│   ├── login.js
│   ├── login.css
│   ├── dashboard.html       # Painel de consulta
│   ├── dashboard.js
│   └── dashboard.css
├── frontEnd/
│   ├── index.html           # Formulário público
│   ├── script.js
│   ├── style.css
│   └── submit-handler.js
├── n8n_export_template.json # Workflow n8n de exportação CSV (importar no n8n)
├── .env.example             # Variáveis de ambiente (template)
├── .gitignore
├── alembic.ini
└── requirements.txt
```

---

##  Funcionalidades

- Formulário multi-etapas com 4 passos (dados + 3 seções opcionais)
- Upload e importação de planilhas Excel/CSV para listas de itens
- Validação de senha e duplicatas em tempo real
- Virtual scroll para listas grandes
- Dashboard com busca e visualização de respostas
- Autenticação via JWT
- Toggle dark/light mode
- Integração com webhook externo (n8n, Zapier, Make etc.)

---

##  Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Python | 3.10+ |
| PostgreSQL | 13+ |
| n8n | Qualquer (self-hosted ou cloud) |
| Node/npm | Não obrigatório (frontend estático) |

---

##  Como rodar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo
```

### 2. Crie e ative o ambiente virtual

```bash
python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate         # Windows
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Abra o `.env` e preencha com suas credenciais:

```env
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
DB_NAME=form_template

DB_USERS_USER=postgres
DB_USERS_PASSWORD=sua_senha
DB_USERS_HOST=localhost
DB_USERS_PORT=5432
DB_USERS_NAME=form_users

SECRET_KEY=troque_por_uma_chave_forte
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

WEBHOOK_URL=https://seu-webhook.com/endpoint
```

> ** Nunca suba o arquivo `.env` real para o Git.** Ele já está no `.gitignore`.

### 5. Crie os bancos de dados no PostgreSQL

```sql
CREATE DATABASE form_template;
CREATE DATABASE form_users;
```

### 6. Execute as migrações com Alembic

```bash
alembic upgrade head
```

### 7. Suba a API

```bash
uvicorn app.main:app --reload
```

A API estará disponível em `http://localhost:8000`.  
Documentação automática: `http://localhost:8000/docs`

### 8. Abra o frontend

Sirva os arquivos estáticos com qualquer servidor HTTP simples:

```bash
# Python (mais fácil)
cd frontEnd
python -m http.server 3000

# Ou com o Live Server do VS Code
```

Acesse `http://localhost:3000` para o formulário.  
Para o dashboard: abra `Control Dashboard/login.html` da mesma forma.

---

##  Banco de Dados

> Este projeto usa **PostgreSQL**. Não é necessário subir o banco para explorar o código ou contribuir — esta seção explica a estrutura para quem quiser rodá-lo.

### Tabelas criadas automaticamente pelo SQLAlchemy/Alembic

| Tabela | Descrição | Complexidade |
|---|---|---|
| `submissions` | Registro principal do formulário | Simples |
| `section_a_configs` | Dados da Seção A (1:1 com submission) | Simples |
| `section_b_configs` | Dados da Seção B (1:1 com submission) | Simples |
| `section_c_configs` | Dados da Seção C (1:1 com submission) | Simples |
| `section_c_items` | Lista de itens da Seção C (1:N) | Moderada |
| `users` | Usuários do dashboard | Simples |

### Dois bancos separados

O projeto usa **dois bancos distintos** por isolamento de responsabilidade:

- `form_template` — dados do formulário
- `form_users` — usuários do dashboard (autenticação)

Ambos são PostgreSQL e configurados separadamente no `.env`.

### Adicionar usuários para o dashboard

Não há tela de cadastro — usuários são inseridos diretamente no banco.  
Use o script auxiliar:

```bash
python add_user.py
```

Ou diretamente no banco:

```sql
INSERT INTO users (email, senha) VALUES ('admin@exemplo.com', '<hash_bcrypt>');
```

> A senha deve ser um hash bcrypt — use `security.py` para gerá-lo.

---

##  Autenticação

- Login via `POST /form/auth/login` com e-mail e senha
- Retorna um token JWT armazenado no `localStorage` do browser
- O dashboard verifica o token a cada carregamento
- Token expira conforme `ACCESS_TOKEN_EXPIRE_MINUTES` no `.env`

###  Usuário de demonstração (só no frontend)

O arquivo `Control Dashboard/login.js` possui um **bloco de demo** que aceita:

```
E-mail:  teste@teste.com
Senha:   Teste@123
```

Isso é **apenas para explorar o frontend sem backend rodando**.  
Em produção, remova o bloco marcado com ` BLOCO DE DEMO` no `login.js`.

---

##  Como personalizar

### Cores

Em cada arquivo CSS, edite as variáveis no topo:

```css
:root {
    --accent:      #4F7EF7;  /* cor principal */
    --accent-dark: #3A66D4;  /* hover/gradiente */
}
```

### Logo

Nos arquivos HTML, procure pelo comentário ` PERSONALIZE` e substitua o bloco:

```html
<!-- Antes -->
<div class="logo-placeholder">
    <span class="logo-icon">◈</span>
    <span class="logo-text">SUA LOGO</span>
</div>

<!-- Depois -->
<img src="/static/sua-logo.png" alt="Logo" height="40">
```

### Campos do formulário

Os campos são nomeados genericamente (`field_a1`, `field_b1`, etc.).  
Para renomear, altere em conjunto:

1. `app/models.py` — colunas do banco
2. `app/schemas.py` — schemas de validação
3. `frontEnd/index.html` — labels e inputs
4. `frontEnd/submit-handler.js` — mapeamento do payload
5. `Control Dashboard/dashboard.js` — exibição no modal

### URL da API

Em **três arquivos JS**, troque a constante `API_URL`:

```js
// frontEnd/submit-handler.js
const API_URL = 'https://api.seudominio.com';

// Control Dashboard/dashboard.js
const API_URL = 'https://api.seudominio.com';

// Control Dashboard/login.js
const API_URL = 'https://api.seudominio.com';
```

### Webhook externo

Configure no `.env`:

```env
WEBHOOK_URL=https://seu-n8n.com/webhook/endpoint
```

---

##  Workflow n8n — Exportação CSV

O arquivo `n8n_export_template.json` contém o workflow de automação que recebe uma requisição do dashboard e devolve um arquivo CSV em Base64 para download direto no browser.

### Como funciona

```
Dashboard (POST /webhook-export)
    └─▶ n8n Webhook
            └─▶ Switch (tipo de exportação)
                    ├─▶ Fluxo Export A: busca dados → monta CSV → Base64 → responde
                    └─▶ Fluxo Export B: busca dados → monta CSV → Base64 → responde
```

O frontend envia `{ referenceId, type: "export-a" | "export-b" }` e recebe `{ success, filename, fileBase64, mimeType }`.

### Como importar

1. No n8n, acesse **Settings > Import Workflow** e selecione o arquivo `n8n_export_template.json`
2. Configure a credencial do PostgreSQL: localize todos os nós marcados com `YOUR_POSTGRES_CREDENTIAL_ID` e vincule sua conexão
3. Ajuste as queries SQL para apontar para as suas tabelas (os nós marcados com `✏️` no JSON indicam onde alterar)
4. Ative o workflow e copie a URL do webhook gerada
5. Cole essa URL no `.env` do backend: `WEBHOOK_URL=https://seu-n8n.com/webhook/webhook-export`

### Nós do workflow

| Nó | Tipo | Função |
|---|---|---|
| Webhook | Trigger | Recebe o POST do dashboard |
| Switch | Lógica | Roteia para Export A ou Export B |
| Check Method | Condição | Responde preflight CORS (OPTIONS) |
| Select Submission | PostgreSQL | Busca o registro principal pelo `reference_id` |
| Search Config by ID | PostgreSQL | Busca a config da Seção C |
| Get Items | PostgreSQL | Busca os itens vinculados |
| Get Extra Field | Set | Extrai campo extra da config |
| Separate Fields | Set | Isola os campos para o merge |
| Merge | Merge | Combina dados via SQL |
| Build CSV | Code | Converte itens para CSV (separador `;`) |
| Convert to Base64 | Code | Codifica o CSV e gera nome do arquivo |
| Respond to Webhook | Response | Retorna o arquivo para o frontend |

---

##  Dependências principais

```
fastapi
uvicorn
sqlalchemy
psycopg2-binary
alembic
pydantic[email]
python-jose[cryptography]
passlib[bcrypt]
python-dotenv
httpx
```

Instale tudo com:

```bash
pip install -r requirements.txt
```

---

##  O que NÃO está no repositório

| Arquivo/Pasta | Motivo |
|---|---|
| `.env` | Contém senhas e chaves secretas |
| `venv/` | Ambiente virtual local |
| `__pycache__/` | Cache Python gerado automaticamente |
| Dados do banco | Banco PostgreSQL roda localmente |
