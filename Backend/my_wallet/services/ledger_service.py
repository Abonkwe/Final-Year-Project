from fastapi import HTTPException, status
from my_wallet.services.supabase_client import supabase_client
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
        # TODO: Query the 'profiles' table where 'phone_number' matches the sender's phone.
        # HINT: Use Supabase's inner join syntax to select the profile ID AND its
        # related nested wallet data (id and balance) in a single query block.
        # Ensure you call .single().execute() to get a single row dictionary.


        # TODO: Check if the sender record exists. If it does not exist,
        # raise an HTTPException with a 404 Not Found status code.

        # ---------------------------------------------------------------------
        # STEP 2: ENFORCE THE BALANCE INVARIANT
        # ---------------------------------------------------------------------
        # TODO: Extract the sender's wallet ID and current balance from your query result.
        # TODO: Compare the current balance against the requested transfer amount.
        # If the balance is less than the amount, raise an HTTPException with a
        # 400 Bad Request status code stating "Insufficient wallet funds".

        # ---------------------------------------------------------------------
        # STEP 3: FETCH THE RECIPIENT RECORD
        # ---------------------------------------------------------------------
        # TODO: Repeat the query tracking from Step 1, but this time search for the
        # profile where 'phone_number' matches the receiver's phone.

        # TODO: Check if the receiver record exists. If it does not exist,
        # raise an HTTPException with a 404 Not Found status code.

        # ---------------------------------------------------------------------
        # STEP 4: ENFORCE BUSINESS INTEGRITY CHECKS
        # ---------------------------------------------------------------------
        # TODO: Extract the receiver's profile ID and wallet ID.
        # TODO: Verify that the sender's profile ID is NOT equal to the receiver's profile ID.
        # If they match, raise an HTTPException (400 Bad Request) to block self-transfers.

        # ---------------------------------------------------------------------
        # STEP 5: CALCULATE NEW BALANCES
        # ---------------------------------------------------------------------
        # TODO: Compute the math variables:
        # - Subtract the transfer amount from the sender's current balance.
        # - Add the transfer amount to the receiver's current balance.

        # ---------------------------------------------------------------------
        # STEP 6: ATOMIC LEDGER MUTATION (THE DANGEROUS ZONE)
        # ---------------------------------------------------------------------
        # TODO: Wrap the following database mutations inside a try/except block
        # to catch any network drops or backend data writing failures.
        try:
        # A. Log the initial transaction row:
        # TODO: Insert a row into the 'transactions' table with sender_id,
        # receiver_id, the amount, and a status explicitly marked as "PENDING".
        # Grab the generated transaction ID from the insertion response metadata.

        # B. Deduct money from the Sender:
        # TODO: Update the 'wallets' table, setting the 'balance' to the new sender
        # balance, filtering where 'id' matches the sender's wallet ID.

        # C. Credit money to the Receiver:
        # TODO: Update the 'wallets' table, setting the 'balance' to the new receiver
        # balance, filtering where 'id' matches the receiver's wallet ID.

        # D. Commit State to Success:
        # TODO: Update the 'transactions' table, altering the 'status' column
        # from "PENDING" to "SUCCESS" for this transaction ID.

        # E. Complete the Lifecycle Response:
        # TODO: Return a successful payload dictionary containing:
        # {"status": "success", "transaction_id": ... , "message": ...}

        except Exception as error:
            # ---------------------------------------------------------------------
            # STEP 7: CLEANUP ON ERROR
            # ---------------------------------------------------------------------
            # TODO: Check if the transaction ID was already generated in the try block.
            # If it exists, execute an update query on the 'transactions' table to set
            # its status to "FAILED" so your ledger record is mathematically accurate.

            # TODO: Finally, raise a clean HTTPException with a status code of
            # 500 Internal Server Error, passing the raw error details as a string description.
            pass