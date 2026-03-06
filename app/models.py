from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


# ──────────────────────────────────────────────
#  MODELO PRINCIPAL
#  Renomeie "Submission" para o conceito do seu
#  formulário (ex: Order, Request, Registration)
# ──────────────────────────────────────────────

class Submission(Base):
    __tablename__ = "submissions"

    id             = Column(String(36), primary_key=True)  # UUID

    # Campos de identificação — personalize conforme necessário
    reference_id   = Column(String(255), nullable=False)   # ex: código, CID, número do pedido
    requester_name = Column(String(255), nullable=False)   # nome do solicitante / técnico
    phone          = Column(String(50),  nullable=False)
    email          = Column(String(255), nullable=False)
    ticket_number  = Column(String(100), nullable=False)

    # Flags de seções opcionais (sim/não)
    # Adicione/remova conforme as etapas do seu formulário
    section_a_enabled = Column(String(10), nullable=False)
    section_b_enabled = Column(String(10), nullable=False)
    section_c_enabled = Column(String(10), nullable=False)

    # Relacionamentos com as seções opcionais
    section_a = relationship(
        "SectionAConfig",
        back_populates="submission",
        uselist=False,
        cascade="all, delete-orphan"
    )
    section_b = relationship(
        "SectionBConfig",
        back_populates="submission",
        uselist=False,
        cascade="all, delete-orphan"
    )
    section_c = relationship(
        "SectionCConfig",
        back_populates="submission",
        uselist=False,
        cascade="all, delete-orphan"
    )


# ──────────────────────────────────────────────
#  SEÇÃO A — personalize o nome e os campos
#  Exemplo original: DNSConfig
# ──────────────────────────────────────────────

class SectionAConfig(Base):
    __tablename__ = "section_a_configs"

    id            = Column(String(36), primary_key=True)
    submission_id = Column(
        String(36),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    # Campos da seção A — substitua pelos seus
    field_a1 = Column(String(255), nullable=False)   # ex: username
    field_a2 = Column(String(255), nullable=False)   # ex: password
    field_a3 = Column(String(50),  nullable=True)    # ex: provider / registro

    submission = relationship("Submission", back_populates="section_a")


# ──────────────────────────────────────────────
#  SEÇÃO B — personalize o nome e os campos
#  Exemplo original: SiteConfig
# ──────────────────────────────────────────────

class SectionBConfig(Base):
    __tablename__ = "section_b_configs"

    id            = Column(String(36), primary_key=True)
    submission_id = Column(
        String(36),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    # Campos da seção B — substitua pelos seus
    field_b1 = Column(String(255), nullable=False)   # ex: ftp_user
    field_b2 = Column(String(255), nullable=False)   # ex: ftp_password
    field_b3 = Column(String(500), nullable=True)    # ex: link / URL

    submission = relationship("Submission", back_populates="section_b")


# ──────────────────────────────────────────────
#  SEÇÃO C — personalize o nome e os campos
#  Exemplo original: EmailConfig + EmailAccount
# ──────────────────────────────────────────────

class SectionCConfig(Base):
    __tablename__ = "section_c_configs"

    id            = Column(String(36), primary_key=True)
    submission_id = Column(
        String(36),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    # Campos da seção C — substitua pelos seus
    field_c1 = Column(String(100), nullable=True)   # ex: technology
    field_c2 = Column(String(50),  nullable=True)   # ex: protocol
    field_c3 = Column(String(100), nullable=True)   # ex: provider
    field_c4 = Column(String(255), nullable=True)   # ex: server / endpoint

    submission = relationship("Submission", back_populates="section_c")

    # Lista de itens vinculados (ex: contas, produtos, participantes)
    items = relationship(
        "SectionCItem",
        back_populates="section_c_config",
        cascade="all, delete-orphan"
    )


class SectionCItem(Base):
    """
    Itens de lista dentro da Seção C.
    Exemplo original: EmailAccount
    Adapte os campos para o seu caso de uso.
    """
    __tablename__ = "section_c_items"

    id               = Column(String(36), primary_key=True)
    section_c_config_id = Column(
        String(36),
        ForeignKey("section_c_configs.id", ondelete="CASCADE"),
        nullable=False
    )

    # Campos do item — substitua pelos seus
    item_name        = Column(String(100), nullable=False)   # ex: first_name
    item_name2       = Column(String(100), nullable=False)   # ex: last_name
    source_field     = Column(String(255), nullable=False)   # ex: email_from
    source_password  = Column(String(255), nullable=False)   # ex: password_from
    target_field     = Column(String(255), nullable=False)   # ex: email_to
    target_password  = Column(String(255), nullable=False)   # ex: password_to
    extra_field      = Column(String(100), nullable=True)    # ex: plan / role

    section_c_config = relationship("SectionCConfig", back_populates="items")