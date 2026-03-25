"""
-----------------
Conexão e sessão SQLAlchemy para o banco de usuários administrativos.

Por padrão aponta para o mesmo banco que o formulário (DATABASE_URL),
mas pode ser facilmente separado trocando a variável de ambiente para
USERS_DATABASE_URL — útil quando você quer bancos completamente isolados.

Variáveis de ambiente (.env):
    USERS_DATABASE_URL  → URL completa do banco de usuários (opcional)
                          Se ausente, usa DATABASE_URL como fallback.

    Formato da URL:
        postgresql://usuario:senha@host:porta/nome_banco
"""

import os
from dotenv import load_dotenv
from urllib.parse import quote
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# ──────────────────────────────────────────────
#  URL DO BANCO DE USUÁRIOS
#  Usa USERS_DATABASE_URL se definida;
#  caso contrário, cai no DATABASE_URL principal.
# ──────────────────────────────────────────────

def _build_default_url() -> str:
    """Monta a DATABASE_URL padrão a partir das variáveis individuais."""
    user     = os.getenv("DB_USER",     "postgres")
    password = os.getenv("DB_PASSWORD", "")
    host     = os.getenv("DB_HOST",     "localhost")
    port     = os.getenv("DB_PORT",     "5432")
    name     = os.getenv("DB_NAME",     "form_template")
    encoded  = quote(password, safe="")
    return f"postgresql://{user}:{encoded}@{host}:{port}/{name}"


USERS_DATABASE_URL = (
    os.getenv("USERS_DATABASE_URL")          # banco dedicado de usuários (opcional)
    or os.getenv("DATABASE_URL")             # fallback: mesma URL do formulário
    or _build_default_url()                  # fallback final: monta da .env
)


#  ENGINE E SESSÃO

users_engine = create_engine(USERS_DATABASE_URL, pool_pre_ping=True, echo=False)

UsersSession = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=users_engine,
)

# Base separada para não misturar tabelas de usuários com as do formulário
BaseUsers = declarative_base()



#  DEPENDENCY INJECTION (FastAPI)


def get_db_users():
    """
    Gerador de sessão para injeção via Depends() nas rotas.

    Uso:
        @router.post("/auth/login")
        def login(db: Session = Depends(get_db_users)):
            ...
    """
    db = UsersSession()
    try:
        yield db
    finally:
        db.close()


#  CRIAÇÃO AUTOMÁTICA DAS TABELAS

def create_users_tables():
    """
    Cria as tabelas de usuários no banco (se não existirem).
    Chamado em app/main.py na inicialização.
    """
    # Importação local para evitar circular imports
    from app import models_users  # noqa: F401
    BaseUsers.metadata.create_all(bind=users_engine)
