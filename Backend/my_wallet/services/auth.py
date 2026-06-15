from fastapi import HTTPException, status
from my_wallet.services.supabase_client import supabase_client as supabase
from my_wallet.models.schemas import UserSignupRequest, UserLoginRequest

class AuthService:

    @staticmethod
    def register_user(payload: UserSignupRequest) -> dict:
        """
        Coordinates user account creation across the secure authentication schema
        and provisions the corresponding public profile and transactional wallet.
        """
        user_id = None

        try:
            auth_res = supabase.auth.sign_up({
                "email": payload.email,
                "password": payload.password
            })

            if not auth_res.user:
                raise Exception("Authentication record provisioning failed.")

            user_id = auth_res.user.id

            supabase.table("profiles").insert({
                "id": user_id,
                "full_name": payload.full_name,
                "phone_number": payload.phone_number
            }).execute()

            # Connect a brand new local currency wallet to this user account
            supabase.table("wallets").insert({
                # "wallet_id": user_id,
                "user_id": user_id,
                "balance": 1000.00,
                "currency": "XAF"
            }).execute()

            return {
                "status": "success",
                "user_id": user_id,
                "message": "User account and wallet successfully provisioned."
            }

        except Exception as error:
            # If the public profile or wallet setup fails (e.g., phone number
            # is a duplicate), we must delete the auth account to prevent orphans.
            if user_id is not None:
                try:
                    supabase.auth.admin.delete_user(user_id)
                except Exception:
                    pass  # Prevent cleanup errors from masking the original error

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration execution failure: {str(error)}"
            )

    @staticmethod
    def login_user(payload: UserLoginRequest) -> dict:
        """
        Authenticates user credentials against the secure schema and issues
        a temporary JSON Web Token (JWT) access token for the mobile app session.
        """
        try:
            session_res = supabase.auth.sign_in_with_password({
                "email": payload.email,
                "password": payload.password
            })

            if not session_res.session:
                raise Exception("Session token generation failed.")

            return {
                "status": "success",
                "access_token": session_res.session.access_token,
                "token_type": "bearer"
            }

        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password credentials provided."
            )