# Form Template + Dashboard

> Projeto desenvolvido e aplicado em ambiente de produção para gerenciar um fluxo de trabalho interno de uma empresa. O código foi refatorado e anonimizado para portfólio — dados sensíveis removidos, campos renomeados para nomes genéricos.

Sistema de formulário multi-etapas com painel de consulta de respostas e exportação automatizada via n8n.

---

## Sobre

O desafio era construir um sistema interno completo — do formulário público até o painel administrativo — com exportação de dados automatizada. A solução integra um backend FastAPI, frontend estático e um workflow n8n que gera e entrega arquivos CSV direto no browser sem servidor de arquivos.

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic
- **Frontend:** HTML, CSS e JavaScript puro
- **Banco de dados:** PostgreSQL
- **Automação:** n8n (exportação CSV via webhook)
- **Autenticação:** JWT com bcrypt

## Funcionalidades

- Formulário multi-etapas com 4 passos
- Upload e importação de planilhas Excel/CSV
- Virtual scroll para listas grandes
- Dashboard com busca e visualização de respostas
- Exportação CSV automatizada via n8n
- Autenticação JWT no painel administrativo
- Tema claro/escuro

## Arquitetura
```
Formulário público (frontEnd/)
    └─▶ POST /form/submit
            └─▶ FastAPI salva no PostgreSQL

Dashboard (Control Dashboard/)
    └─▶ POST /webhook-export
            └─▶ n8n busca dados → gera CSV → Base64 → browser faz download
```

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/form/submit` | Envia formulário |
| GET | `/form/submissions` | Lista respostas (auth) |
| GET | `/form/submissions/{id}` | Detalhe de uma resposta (auth) |
| POST | `/form/auth/login` | Autentica e retorna token |
| POST | `/webhook-export` | Dispara exportação CSV via n8n |

## Como rodar localmente
```bash
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # preencha com suas credenciais
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend é estático — abra `frontEnd/index.html` com Live Server ou `python -m http.server`.
