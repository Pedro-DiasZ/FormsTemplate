from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, schemas
from app.database_users import get_db_users
from app.models_users import Usuario
from app import security
from typing import List
import uuid
import httpx

router = APIRouter(prefix="/form", tags=["Formulário"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ──────────────────────────────────────────────
#  CRIAR SUBMISSÃO  (POST)
# ──────────────────────────────────────────────

@router.post(
    "/submissions",
    status_code=status.HTTP_201_CREATED,
    response_model=schemas.SubmissionResponse
)
def create_submission(
    payload: schemas.SubmissionCreate,
    db: Session = Depends(get_db)
):
    try:
        # Evitar duplicatas pelo reference_id
        existing = db.query(models.Submission).filter(
            models.Submission.reference_id == payload.reference_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Já existe uma submissão para o ID: {payload.reference_id}"
            )

        # Registro principal
        submission = models.Submission(
            id=str(uuid.uuid4()),
            reference_id=payload.reference_id,
            requester_name=payload.requester_name,
            phone=payload.phone,
            email=payload.email,
            ticket_number=payload.ticket_number,
            section_a_enabled=payload.section_a_enabled,
            section_b_enabled=payload.section_b_enabled,
            section_c_enabled=payload.section_c_enabled,
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

        # Seção A
        if payload.section_a and payload.section_a_enabled.lower() == "sim":
            section_a = models.SectionAConfig(
                id=str(uuid.uuid4()),
                submission_id=submission.id,
                field_a1=payload.section_a.field_a1,
                field_a2=payload.section_a.field_a2,
                field_a3=payload.section_a.field_a3,
            )
            db.add(section_a)

        # Seção B
        if payload.section_b and payload.section_b_enabled.lower() == "sim":
            section_b = models.SectionBConfig(
                id=str(uuid.uuid4()),
                submission_id=submission.id,
                field_b1=payload.section_b.field_b1,
                field_b2=payload.section_b.field_b2,
                field_b3=payload.section_b.field_b3,
            )
            db.add(section_b)

        # Seção C + itens
        if payload.section_c and payload.section_c_enabled.lower() == "sim":
            section_c = models.SectionCConfig(
                id=str(uuid.uuid4()),
                submission_id=submission.id,
                field_c1=payload.section_c.field_c1,
                field_c2=payload.section_c.field_c2,
                field_c3=payload.section_c.field_c3,
                field_c4=payload.section_c.field_c4,
            )
            db.add(section_c)

            for item in payload.section_c_items or []:
                c_item = models.SectionCItem(
                    id=str(uuid.uuid4()),
                    section_c_config_id=section_c.id,
                    item_name=item.item_name,
                    item_name2=item.item_name2,
                    source_field=item.source_field,
                    source_password=item.source_password,
                    target_field=item.target_field,
                    target_password=item.target_password,
                    extra_field=item.extra_field,
                )
                db.add(c_item)

        # Commit único no final (atomicidade)
        db.commit()

        return {
            "id": submission.id,
            "reference_id": submission.reference_id,
            "requester_name": submission.requester_name,
            "email": submission.email,
            "ticket_number": submission.ticket_number,
            "message": "Formulário enviado com sucesso",
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao salvar formulário: {str(e)}"
        )


# ──────────────────────────────────────────────
#  LISTAR SUBMISSÕES  (GET)
# ──────────────────────────────────────────────

@router.get(
    "/submissions",
    response_model=List[schemas.SubmissionListItem]
)
def list_submissions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Lista todas as submissões cadastradas."""
    return (
        db.query(models.Submission)
        .order_by(models.Submission.reference_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ──────────────────────────────────────────────
#  BUSCAR POR TERMO  (GET)
# ──────────────────────────────────────────────

@router.get(
    "/submissions/search",
    response_model=List[schemas.SubmissionListItem]
)
def search_submissions(
    q: str,
    db: Session = Depends(get_db)
):
    """Busca por reference_id ou requester_name."""
    return (
        db.query(models.Submission)
        .filter(
            (models.Submission.reference_id.ilike(f"%{q}%")) |
            (models.Submission.requester_name.ilike(f"%{q}%"))
        )
        .all()
    )


# ──────────────────────────────────────────────
#  DETALHES DE UMA SUBMISSÃO  (GET)
# ──────────────────────────────────────────────

@router.get(
    "/submissions/{submission_id}",
    response_model=schemas.SubmissionDetail
)
def get_submission(
    submission_id: str,
    db: Session = Depends(get_db)
):
    """Retorna detalhes completos de uma submissão."""
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail=f"Submissão {submission_id} não encontrada"
        )

    return submission


# ──────────────────────────────────────────────
#  WEBHOOK / INTEGRAÇÃO EXTERNA  (POST)
#  Substitua a URL pelo seu endpoint de webhook
# ──────────────────────────────────────────────

@router.post("/api/webhook")
async def trigger_webhook(request: Request):
    """
    Repassa o payload para um webhook externo (ex: n8n, Zapier, Make).
    Configure WEBHOOK_URL no seu .env.
    """
    import os
    webhook_url = os.getenv("WEBHOOK_URL", "")
    if not webhook_url:
        raise HTTPException(status_code=500, detail="WEBHOOK_URL não configurada no .env")

    try:
        body = await request.json()
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=body, timeout=30.0)
            return response.json()
    except Exception as e:
        return {"success": False, "error": str(e)}


# ──────────────────────────────────────────────
#  AUTENTICAÇÃO  (POST)
# ──────────────────────────────────────────────

@router.post("/auth/login")
async def login(
    login_data: schemas.UserLogin,
    db: Session = Depends(get_db_users)
):
    usuario = db.query(Usuario).filter(
        Usuario.email == login_data.email
    ).first()

    if not usuario or not security.verify_password(login_data.password, usuario.senha):
        return {"success": False, "message": "Credenciais inválidas"}

    token = security.create_access_token(data={"sub": usuario.email})

    return {
        "success": True,
        "token": token,
        "user": {"email": usuario.email},
    }