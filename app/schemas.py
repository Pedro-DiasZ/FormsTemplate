from pydantic import BaseModel, EmailStr
from typing import List, Optional


# ──────────────────────────────────────────────
#  SUBMISSÃO PRINCIPAL
# ──────────────────────────────────────────────

class SubmissionBase(BaseModel):
    reference_id:       str
    requester_name:     str
    phone:              str
    email:              EmailStr
    ticket_number:      str
    section_a_enabled:  str   # "sim" / "não"
    section_b_enabled:  str
    section_c_enabled:  str


# ──────────────────────────────────────────────
#  SEÇÃO A  (ex: DNS / credenciais de acesso)
# ──────────────────────────────────────────────

class SectionACreate(BaseModel):
    field_a1: str
    field_a2: str
    field_a3: Optional[str] = None


# ──────────────────────────────────────────────
#  SEÇÃO B  (ex: FTP / storage)
# ──────────────────────────────────────────────

class SectionBCreate(BaseModel):
    field_b1: str
    field_b2: str
    field_b3: Optional[str] = None


# ──────────────────────────────────────────────
#  SEÇÃO C  (ex: configuração + lista de itens)
# ──────────────────────────────────────────────

class SectionCCreate(BaseModel):
    field_c1: Optional[str] = None
    field_c2: Optional[str] = None
    field_c3: Optional[str] = None
    field_c4: Optional[str] = None


class SectionCItemCreate(BaseModel):
    item_name:       str
    item_name2:      str
    source_field:    str
    source_password: str
    target_field:    str
    target_password: str
    extra_field:     Optional[str] = None


# ──────────────────────────────────────────────
#  PAYLOAD FINAL  (criação)
# ──────────────────────────────────────────────

class SubmissionCreate(SubmissionBase):
    section_a: Optional[SectionACreate]          = None
    section_b: Optional[SectionBCreate]          = None
    section_c: Optional[SectionCCreate]          = None
    section_c_items: Optional[List[SectionCItemCreate]] = []


# ──────────────────────────────────────────────
#  RESPONSES
# ──────────────────────────────────────────────

class SubmissionResponse(BaseModel):
    id:             str
    reference_id:   str
    requester_name: str
    email:          str
    ticket_number:  str
    message:        Optional[str] = None

    class Config:
        from_attributes = True


class SubmissionListItem(BaseModel):
    id:               str
    reference_id:     str
    requester_name:   str
    email:            str
    ticket_number:    str
    section_a_enabled: str
    section_b_enabled: str
    section_c_enabled: str

    class Config:
        from_attributes = True


class SectionAResponse(BaseModel):
    id:       str
    field_a1: str
    field_a3: Optional[str] = None

    class Config:
        from_attributes = True


class SectionBResponse(BaseModel):
    id:       str
    field_b1: str
    field_b3: Optional[str] = None

    class Config:
        from_attributes = True


class SectionCResponse(BaseModel):
    id:       str
    field_c1: Optional[str] = None
    field_c2: Optional[str] = None
    field_c3: Optional[str] = None
    field_c4: Optional[str] = None

    class Config:
        from_attributes = True


class SectionCItemResponse(BaseModel):
    id:           str
    item_name:    str
    item_name2:   str
    source_field: str
    target_field: str
    extra_field:  Optional[str] = None

    class Config:
        from_attributes = True


class SubmissionDetail(BaseModel):
    id:               str
    reference_id:     str
    requester_name:   str
    email:            str
    phone:            str
    ticket_number:    str
    section_a_enabled: str
    section_b_enabled: str
    section_c_enabled: str

    section_a: Optional[SectionAResponse] = None
    section_b: Optional[SectionBResponse] = None
    section_c: Optional[SectionCResponse] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
#  AUTENTICAÇÃO
# ──────────────────────────────────────────────

class UserLogin(BaseModel):
    email:    str
    password: str