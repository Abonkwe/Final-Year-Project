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
                "phone_number": payload.phone_number,
                "email": payload.email
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

            user_id = session_res.user.id
            fullName = ""
            phone = ""
            balance = 0.0

            try:
                profile_res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
                profile_data = profile_res.data
                if profile_data:
                    fullName = profile_data.get("full_name", "")
                    phone = profile_data.get("phone_number", "")
            except Exception as pe:
                print(f"Error fetching profile details in login: {pe}")

            try:
                wallet_res = supabase.table("wallets").select("*").eq("user_id", user_id).single().execute()
                wallet_data = wallet_res.data
                if wallet_data:
                    balance = wallet_data.get("balance", 0.0)
            except Exception as we:
                print(f"Error fetching wallet details in login: {we}")

            return {
                "status": "success",
                "access_token": session_res.session.access_token,
                "token": session_res.session.access_token,
                "token_type": "bearer",
                "user": {
                    "id": user_id,
                    "fullName": fullName,
                    "phone": phone,
                    "email": payload.email,
                    "balance": balance
                }
            }

        except Exception as error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid email or password credentials provided: {str(error)}"
            )

    @staticmethod
    def get_user_profile(user_id: str) -> dict:
        """
        Retrieves public user profile details and current wallet balance.
        """
        try:
            profile_res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
            profile_data = profile_res.data
            if not profile_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Public user profile record not found."
                )

            wallet_res = supabase.table("wallets").select("*").eq("user_id", user_id).single().execute()
            wallet_data = wallet_res.data

            return {
                "status": "success",
                "user": {
                    "id": user_id,
                    "fullName": profile_data.get("full_name", ""),
                    "phone": profile_data.get("phone_number", ""),
                    "email": profile_data.get("email", ""),
                    "balance": wallet_data.get("balance", 0.0) if wallet_data else 0.0
                }
            }
        except HTTPException as http_error:
            raise http_error
        except Exception as error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch profile details: {str(error)}"
            )