import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from ..core.defaults import create_default_categories
from ..core.security import (
    clear_session_cookie,
    create_session_token,
    hash_invite_code,
    hash_password,
    set_session_cookie,
    verify_invite_code,
    verify_password,
)
from ..database import get_db
from ..models.invite import Invite
from ..models.user import User
from ..schemas.auth import LoginInput, RegisterInput
from ..schemas.user import User as UserSchema
from .deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

# --- Ограничение попыток входа: 5 неудач за 15 минут на email и IP ---
MAX_ATTEMPTS = 5
ATTEMPT_WINDOW = timedelta(minutes=15)
_failed_attempts: dict[str, list[float]] = {}


def _prune(now: float, window_seconds: float) -> None:
    for key, stamps in list(_failed_attempts.items()):
        fresh = [s for s in stamps if now - s < window_seconds]
        if fresh:
            _failed_attempts[key] = fresh
        else:
            del _failed_attempts[key]


def _check_login_allowed(email: str, ip: str) -> None:
    now = time.time()
    window = ATTEMPT_WINDOW.total_seconds()
    _prune(now, window)
    for key in (email.lower(), ip):
        if len(_failed_attempts.get(key, [])) >= MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Слишком много неудачных попыток. Подождите 15 минут",
            )


def _register_failed_attempt(email: str, ip: str) -> None:
    now = time.time()
    for key in (email.lower(), ip):
        _failed_attempts.setdefault(key, []).append(now)


def _client_ip(request: Request) -> str:
    # nginx выставляет X-Real-IP из реального адреса соединения и перезаписывает
    # значение клиента. X-Forwarded-For не годится: nginx дописывает адрес в конец,
    # а первый элемент клиент подставляет сам, и это обходит ограничение попыток.
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register_user(data: RegisterInput, db: Session = Depends(get_db)):
    # Регистрация возможна только по действительному инвайту
    invite = (
        db.query(Invite)
        .filter(Invite.code_hash == hash_invite_code(data.invite_code))
        .first()
    )
    if invite is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный код приглашения",
        )
    if invite.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Код приглашения уже использован",
        )
    if invite.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Срок действия кода истёк",
        )
    if invite.email.lower() != data.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Код приглашения выдан на другой email",
        )
    if db.query(User).filter(User.email == data.email.lower()).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует",
        )

    db_user = User(
        email=data.email.lower(),
        name=data.name,
        password_hash=hash_password(data.password),
        role="user",
        is_active=True,
    )
    db.add(db_user)
    db.flush()  # получает id пользователя до commit
    invite.used_at = datetime.now(timezone.utc)
    create_default_categories(db, user_id=db_user.id)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=UserSchema)
def login_user(data: LoginInput, request: Request, response: Response, db: Session = Depends(get_db)):
    ip = _client_ip(request)
    _check_login_allowed(data.email.lower(), ip)

    user = db.query(User).filter(User.email == data.email.lower()).first()
    if user is None or not verify_password(data.password, user.password_hash):
        _register_failed_attempt(data.email.lower(), ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Аккаунт заблокирован",
        )

    # Успешный вход сбрасывает счётчик неудачных попыток
    _failed_attempts.pop(data.email.lower(), None)
    _failed_attempts.pop(ip, None)

    set_session_cookie(response, create_session_token(user.id))
    return user


@router.post("/logout")
def logout_user(response: Response):
    clear_session_cookie(response)
    return {"message": "Вы вышли из аккаунта"}


@router.get("/me", response_model=UserSchema)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
