import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from my_wallet.routes.transfers import router as transfers_router
from my_wallet.routes.auth import router as auth_router

app = FastAPI(
    title="Digital Payment and Wallet System Backend API for ABO Wallet",
    description="Backend logic tier coordinating ledger entries, user profiles, and wallets via Supabase.",
    version="1.0.0"
)

origins = [
    "*",  # Permits all inbound cross-origin development traffic safely
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transfers_router, prefix="/wallet_api/v1")
app.include_router(auth_router, prefix="/wallet_api/v1")


# @app.get("/", tags=["Health"])
# def system_health_check():
#     """
#     Root endpoint used to verify that the server engine is up and running.
#     """
#     return {
#         "status": "online",
#         "project": "Digital Wallet System API",
#         "version": "1.0.0"
#     }

if __name__ == "__main__":
    # uvicorn.run(app="my_wallet.app:app", host="127.0.0.1", port=8000, reload=True)
    # uvicorn.run("my_wallet.routes.wallet:app", host="127.0.0.1", port=8000, reload=True)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)