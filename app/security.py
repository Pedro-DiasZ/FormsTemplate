"""
security.py
-----------
Utilitários de autenticação JWT e hashing de senhas.

Variáveis de ambiente necessárias (.env):
    SECRET_KEY   → chave secreta para assinar os tokens (use uma string longa e aleatória)
    ALGORITHM    → algoritmo JWT (padrão: HS256)
    TOKEN_EXPIRE → minutos de validade do token (padrão: 60)
"""

import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status


#  CONFIGURAÇÃO

SECRET_KEY   = os.getenv("SECRET_KEY", "troque-esta-chave-por-uma-string-longa-e-aleatoria")
ALGORITHM    = os.getenv("ALGORITHM", "HS256")
TOKEN_EXPIRE = int(os.getenv("TOKEN_EXPIRE", "60"))  # minutos

# Contexto de hashing — usa bcrypt por padrão
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



#  HASH DE SENHAS

def hash_password(plain_password: str) -> str:
    """Retorna o hash bcrypt de uma senha em texto puro."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto puro bate com o hash armazenado."""
    return pwd_context.verify(plain_password, hashed_password)



#  TOKENS JWT
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Gera um token JWT assinado.

    Parâmetros:
        data          → payload a incluir no token (ex: {"sub": usuario.email})
        expires_delta → sobrescreve o tempo de expiração padrão (TOKEN_EXPIRE minutos)
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=TOKEN_EXPIRE))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decodifica e valida um token JWT.

    Lança HTTPException 401 se o token for inválido ou expirado.
    Retorna o payload do token como dicionário.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
