
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


@router.get("/history/{user_id}", status_code=status.HTTP_200_OK)
def fetch_history(user_id: str):
    """
    HTTP Endpoint: Retrieves a chronological log of financial actions for a specific profile.
    """
    try:
        # Call it directly from LedgerService now!
        history = LedgerService.get_user_transaction_history(user_id)
        return {"status": "success", "count": len(history), "data": history}

    except HTTPException as http_error:
        raise http_error
    except Exception as general_error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while routing history extraction: {str(general_error)}"
        )