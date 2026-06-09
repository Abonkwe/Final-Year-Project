import uvicorn
from fastapi import FastAPI

# app = FastAPI()
#
#
# @app.get("/")
# async def index():
#     return {"message": "This is Abonkwe"}

if __name__ == "__main__":
    # uvicorn.run(app="my_wallet.app:app", host="127.0.0.1", port=8000, reload=True)
    uvicorn.run("my_wallet.routes.wallet:app", host="127.0.0.1", port=8000, reload=True)