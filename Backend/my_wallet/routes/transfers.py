
from fastapi import APIRouter, HTTPException, status
from my_wallet.models.schemas import P2PTransferRequest
from my_wallet.services.ledger_service import LedgerService


router = APIRouter(
    prefix="/transfers",
    tags=["Transfers"]
)

@router.post("/", status_code=status.HTTP_200_OK)
def initiate_p2p_transfer(payload: P2PTransferRequest):
    """
    HTTP Endpoint: Handles inbound P2P wallet transfer requests from the mobile UI.
    """
    try:
        result = LedgerService.process_p2p_transfer(payload)
        return result
    except HTTPException as http_error:
        # Re-raise explicit accounting errors (like 404 Profile Not Found or 400 Insufficient Funds)
        raise http_error

    except Exception as general_error:
        # Catch unexpected infrastructure breaks (like network dropouts)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during routing execution: {str(general_error)}"
        )