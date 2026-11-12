from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.security import generate_invite_code, hash_invite_code
from ..database import get_db
from ..models.invite import Invite
from ..models.user import User
from ..schemas.invite import Invite as InviteSchema, InviteCreate, InviteCreated
from .deps import get_current_admin, get_current_user

router = APIRouter(prefix="/invites", tags=["Invites"])

INVITE_TTL_DAYS = 7


@router.post("/", response_model=InviteCreated, status_code=status.HTTP_201_CREATED)
def create_invite(
    data: InviteCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Создать одноразовый инвайт на 7 дней для указанного email."""
    existing = (
        db.query(Invite)
        .filter(
            Invite.email == data.email.lower(),
            Invite.used_at.is_(None),
            Invite.expires_at > datetime.now(timezone.utc).replace(tzinfo=None),
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Для этого email уже есть действующий инвайт",
        )

    code = generate_invite_code()
    invite = Invite(
        code_hash=hash_invite_code(code),
        email=data.email.lower(),
        created_by=admin.id,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=INVITE_TTL_DAYS),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    return InviteCreated(
        id=invite.id,
        email=invite.email,
        code=code,
        expires_at=invite.expires_at,
    )


@router.get("/", response_model=list[InviteSchema])
def list_invites(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Список инвайтов (код не показывается — он одноразовый)."""
    return db.query(Invite).order_by(Invite.id.desc()).all()


@router.delete("/{invite_id}")
def revoke_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Отозвать неиспользованный инвайт."""
    invite = db.query(Invite).filter(Invite.id == invite_id).first()
    if invite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Инвайт не найден",
        )
    if invite.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Инвайт уже использован",
        )
    db.delete(invite)
    db.commit()
    return {"message": "Инвайт отозван"}
