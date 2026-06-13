from fastapi import APIRouter, HTTPException, status
from my_wallet.models.schemas import UserSignupRequest, UserLoginRequest
from my_wallet.services.auth import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup_user(new_user: UserSignupRequest):

    try:
        result = AuthService.register_user(new_user)
        return result
    except HTTPException as http_error:
        raise http_error
    except Exception as general_error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during signup routing: {str(general_error)}"
        )

@router.post("/login", status_code=status.HTTP_200_OK)
def login_user(new_user: UserLoginRequest):

    try:
        result = AuthService.login_user(new_user)
        return result
    except HTTPException as http_error:
        raise http_error
    except Exception as general_error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during login routing: {str(general_error)}"
        )