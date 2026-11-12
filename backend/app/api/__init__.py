from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .categories import router as categories_router
from .transactions import router as transactions_router
from .invites import router as invites_router
from .profile import router as profile_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(users_router)
router.include_router(categories_router)
router.include_router(transactions_router)
router.include_router(invites_router)
router.include_router(profile_router)
