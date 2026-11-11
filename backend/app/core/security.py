"""Сессии, пароли и коды инвайтов."""
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

SESSION_SECRET = os.getenv("SESSION_SECRET", "")
# Без секрета сессии подписываются пустым ключом: токен можно подделать.
# Сервер не стартует, пока секрет не задан нормально.
_INSECURE_SECRETS = {"", "dev-secret-change-me"}
if SESSION_SECRET in _INSECURE_SECRETS or len(SESSION_SECRET) < 32:
    raise RuntimeError(
        "SESSION_SECRET не задан или короче 32 символов. Сгенерируйте: openssl rand -hex 32"
    )
SESSION_ALGORITHM = "HS256"
SESSION_TTL_HOURS = 24 * 14  # 14 дней

COOKIE_NAME = "finapp_session"
# В проде за nginx по HTTPS; Secure включается флагом из окружения
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "0") == "1"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(password, password_hash)
    except Exception:
        return False


def create_session_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(hours=SESSION_TTL_HOURS),
    }
    return jwt.encode(payload, SESSION_SECRET, algorithm=SESSION_ALGORITHM)


def read_session_token(token: str) -> int | None:
    """Возвращает user_id из токена или None, если токен невалиден/просрочен."""
    try:
        payload = jwt.decode(token, SESSION_SECRET, algorithms=[SESSION_ALGORITHM])
    except JWTError:
        return None
    sub = payload.get("sub")
    if sub is None or not str(sub).isdigit():
        return None
    return int(sub)


def set_session_cookie(response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=SESSION_TTL_HOURS * 3600,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


# --- Инвайты ---

def generate_invite_code() -> str:
    """Одноразовый код вида XXXX-XXXX-XXXX."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # без похожих символов
    parts = ["".join(secrets.choice(alphabet) for _ in range(4)) for _ in range(3)]
    return "-".join(parts)


def hash_invite_code(code: str) -> str:
    """Код не храним в открытом виде: HMAC с секретом сессий."""
    normalized = code.strip().upper()
    return hmac.new(SESSION_SECRET.encode(), normalized.encode(), hashlib.sha256).hexdigest()


def verify_invite_code(code: str, code_hash: str) -> bool:
    return hmac.compare_digest(hash_invite_code(code), code_hash)
