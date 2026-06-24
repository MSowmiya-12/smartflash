from fastapi import APIRouter, Depends
from app.models.schemas import DashboardStats
from app.services.auth_service import get_current_user
from app.services.db_service import get_user_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardStats)
def get_dashboard(current_user: dict = Depends(get_current_user)):
    """
    Returns total sets, total cards, status counts, and accuracy statistics for the current user.
    """
    stats = get_user_dashboard_stats(current_user["id"])
    return stats
