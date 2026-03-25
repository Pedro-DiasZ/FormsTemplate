"""
models_users.py
---------------
Modelo SQLAlchemy para os usuários do painel administrativo.

Renomeie a classe e os campos conforme a necessidade do seu projeto.
Os usuários são armazenados em uma tabela separada para manter
o domínio de autenticação isolado do domínio de formulários.
"""

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database_users import BaseUsers


class Usuario(BaseUsers):
    """
    Representa um usuário com acesso ao dashboard administrativo.

    Campos personalizáveis:
        - nome       → nome de exibição do usuário
        - email      → identificador único para login
        - senha      → hash bcrypt (nunca armazene texto puro)
        - ativo      → flag para desativar sem excluir o registro
        - criado_em  → timestamp automático de criação
    """

    __tablename__ = "usuarios"

    id         = Column(String(36),  primary_key=True)
    nome       = Column(String(255), nullable=False)
    email      = Column(String(255), nullable=False, unique=True, index=True)
    senha      = Column(String(255), nullable=False)  # hash bcrypt
    ativo      = Column(Boolean,     default=True,    nullable=False)
    criado_em  = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Usuario email={self.email} ativo={self.ativo}>"
