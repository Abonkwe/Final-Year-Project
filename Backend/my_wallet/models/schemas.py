from pydantic import BaseModel, EmailStr, Field

class UserSignupRequest(BaseModel):
    """
    Validates the inbound payload required to provision a new user account.
    """
    email: EmailStr = Field(..., description="A valid email address for the authentication layer")
    password: str = Field(..., min_length=6, description="Security access password, minimum 6 characters")
    full_name: str = Field(..., min_length=2, description="Legal full name of the user profile")
    phone_number: str = Field(..., min_length=9, max_length=15, description="Unique phone number used as a payment routing address")

class UserLoginRequest(BaseModel):
    """
    Validates inbound credentials during session authentication requests.
    """
    email: EmailStr = Field(..., description="Registered system email address")
    phone_number: str = Field( min_length=9, max_length=9, description="Registered system password")
    password: str = Field(..., description="Account verification password")

class P2PTransferRequest(BaseModel):
    """
    Enforces financial data safety invariants at the application entry gate.
    """
    sender_phone: str = Field(..., description="Routing phone number of the wallet initiating the transfer")
    receiver_phone: str = Field(..., description="Routing phone number of the target recipient wallet")
    amount: float = Field(..., gt=0.00, description="Transaction amount must be strictly greater than zero")