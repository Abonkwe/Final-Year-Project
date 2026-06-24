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
        # STEP 2: CALCULATE CHARGES
        # ---------------------------------------------------------------------
        charges: float = payload.amount * 0.02

        # ---------------------------------------------------------------------
        # STEP 3: ENFORCE THE BALANCE INVARIANT
        # ---------------------------------------------------------------------
        sender_wallets = sender_data.get("wallets")
        if isinstance(sender_wallets, list):
            if not sender_wallets:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sender wallet not found")
            sender_wallet_id = sender_wallets[0]["wallet_id"]
            sender_balance = float(sender_wallets[0]["balance"])
        else:
            sender_wallet_id = sender_wallets["wallet_id"]
            sender_balance = float(sender_wallets["balance"])

        # Check total cost (amount + charges) against current available balance
        if sender_balance < (payload.amount + charges):
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
        receiver_wallets = receiver_data.get("wallets")
        if isinstance(receiver_wallets, list):
            if not receiver_wallets:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient wallet not found")
            receiver_wallet_id = receiver_wallets[0]["wallet_id"]
            receiver_balance = float(receiver_wallets[0]["balance"])
        else:
            receiver_wallet_id = receiver_wallets["wallet_id"]
            receiver_balance = float(receiver_wallets["balance"])

        # ---------------------------------------------------------------------
        # STEP 4: ENFORCE BUSINESS INTEGRITY CHECKS
        # ---------------------------------------------------------------------
        if sender_data["id"] == receiver_data["id"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot send money to yourself")

        # ---------------------------------------------------------------------
        # STEP 5: CALCULATE NEW BALANCES
        # ---------------------------------------------------------------------
        sender_new_balance = sender_balance - (payload.amount + charges)
        receiver_new_balance = receiver_balance + payload.amount

        # ---------------------------------------------------------------------
        # STEP 6: ATOMIC LEDGER MUTATION (THE DANGEROUS ZONE)
        # ---------------------------------------------------------------------
        sender_deducted = False
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
            sender_deducted = True

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
            if sender_deducted:
                try:
                    # Roll back the sender's balance if the receiver credit or status commit failed
                    supabase.table("wallets").update({"balance": sender_balance}).eq("wallet_id", sender_wallet_id).execute()
                except Exception:
                    pass  # Prevent rollback errors from masking the original database error

            if 'transaction_id' in locals():
                supabase.table("transactions").update({"status": "FAILED"}).eq("transaction_id", transaction_id).execute()

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
                .order("created_at", desc=True) \
                .execute()

            return response.data
        except Exception as e:
            raise HTTPException(
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail = f"Failed to retrieve ledger history: {str(e)}"
            )