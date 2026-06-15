from fastapi import HTTPException, status
from my_wallet.services.supabase_client import supabase_client as supabase
from my_wallet.models.schemas import P2PTransferRequest


class LedgerService:

    @staticmethod
    def process_p2p_transfer(payload: P2PTransferRequest) -> dict:
        """
        TASK: Implement a secure Peer-to-Peer money transfer ledger execution.
        Follow the sequential blocks below to complete the business logic.
        """

        # ---------------------------------------------------------------------
        # STEP 1: FETCH THE SENDER RECORD
        # ---------------------------------------------------------------------
        sender = (
            supabase.table("profiles").select("id, wallets(wallet_id, balance)").eq("phone_number",payload.sender_phone).execute()
        )

        if not sender.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sender profile not found")

        # Extract the first matching row from the returned data list
        sender_data = sender.data[0]

        # ---------------------------------------------------------------------
        # STEP 2: ENFORCE THE BALANCE INVARIANT
        # ---------------------------------------------------------------------
        sender_wallet_id = sender_data["wallets"]["wallet_id"]
        sender_balance = float(sender_data["wallets"]["balance"])

        # Check total cost (amount + charges) against current available balance
        if sender_balance < (payload.amount + payload.charges):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The amount you want to send exceeds your current wallet balance\nBalance{sender_balance}"
            )

        # ---------------------------------------------------------------------
        # STEP 3: FETCH THE RECIPIENT RECORD
        # ---------------------------------------------------------------------
        receiver = (
            supabase.table("profiles").select("id, wallets(wallet_id, balance)").eq("phone_number",payload.receiver_phone).execute()
        )

        if not receiver.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient profile not found")

        # Extract the first matching row from the returned data list
        receiver_data = receiver.data[0]
        receiver_wallet_id = receiver_data["wallets"]["wallet_id"]
        receiver_balance = float(receiver_data["wallets"]["balance"])

        # ---------------------------------------------------------------------
        # STEP 4: ENFORCE BUSINESS INTEGRITY CHECKS
        # ---------------------------------------------------------------------
        if sender_data["id"] == receiver_data["id"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot send money to yourself")

        # ---------------------------------------------------------------------
        # STEP 5: CALCULATE NEW BALANCES
        # ---------------------------------------------------------------------
        charges: float = payload.amount * 0.02
        sender_new_balance = sender_balance - (payload.amount + charges)
        receiver_new_balance = receiver_balance + payload.amount

        # ---------------------------------------------------------------------
        # STEP 6: ATOMIC LEDGER MUTATION (THE DANGEROUS ZONE)
        # ---------------------------------------------------------------------
        try:
            # A. Log the initial transaction row as PENDING
            txn_res = supabase.table("transactions").insert({
                "sender_id": sender_data["id"],
                "receiver_id": receiver_data["id"],
                "amount": payload.amount,
                "charges": charges,
                "status": "PENDING"
            }).execute()

            transaction_id = txn_res.data[0]["transaction_id"]

            # B. Deduct money from the Sender's wallet
            supabase.table("wallets").update({"balance": sender_new_balance}).eq("wallet_id", sender_wallet_id).execute()

            # C. Credit money to the Receiver's wallet
            supabase.table("wallets").update({"balance": receiver_new_balance}).eq("wallet_id", receiver_wallet_id).execute()

            # D. Commit State to SUCCESS
            supabase.table("transactions").update({"status": "SUCCESS"}).eq("transaction_id", transaction_id).execute()

            # E. Complete the Lifecycle Response
            return {
                "status": "success",
                "transaction_id": transaction_id,
                "message": f"Successfully transferred {payload.amount} XAF to {payload.receiver_phone}."
            }

        except Exception as database_error:
            # ---------------------------------------------------------------------
            # STEP 7: CLEANUP ON ERROR
            # ---------------------------------------------------------------------
            if 'transaction_id' in locals():
                supabase.table("transactions").update({"status": "FAILED"}).eq("id", transaction_id).execute()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ledger compilation failure: {str(database_error)}"
            )

    @staticmethod
    def get_user_transaction_history(user_id: str)->list:
        """

        :param user_id:
        :return:
        """
        try:
            response = supabase.table("transactions") \
                .select("*") \
                .or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}") \
                .order("created_at", descending=True) \
                .execute()

            return response.data
        except Exception as e:
            raise HTTPException(
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail = f"Failed to retrieve ledger history: {str(e)}"
            )