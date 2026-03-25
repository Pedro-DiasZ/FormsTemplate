from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.database_users import create_users_tables
from app.routers import form
from dotenv import load_dotenv

load_dotenv()

# Criar tabelas no banco
Base.metadata.create_all(bind=engine)
create_users_tables()

app = FastAPI(
    title="Form Template API",
    description="Template de formulário com dashboard de respostas",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, substitua pelo domínio do seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "message": "Form Template API",
        "status": "online",
        "docs": "/docs",
        "endpoints": {
            "criar_registro": "POST /form/submissions",
            "login": "POST /form/auth/login"
        }
    }


app.include_router(form.router)
