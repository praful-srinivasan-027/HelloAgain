from fastapi import FastAPI, WebSocket, Depends
from Auth.service import get_current_user
from db.models import User
from typing import Annotated
from schemas import Message
from Auth.router import chatRouter
import json
app = FastAPI(title="Messaging Application")
app.include_router(chatRouter)

@app.get("/")
def heakth_check():
    return {
        "message": "Hello gng"
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        message = Message.model_validate(data)
        await websocket.send_text(data)