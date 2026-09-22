from fastapi import FastAPI, WebSocket, WebSocketException, status, Cookie, Depends, Query
from Auth.service import connection_registry, get_current_user, get_user, get_current_user_http
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

async def get_cookie(websocket: WebSocket, access_token: Annotated[str | None, Cookie()] = None, token: Annotated[str | None, Query()] = None):
    print("WEBSOCKET COOKIES:", websocket.cookies)
    if access_token is None and token is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    return access_token or token

async def get_cookie_http(
    access_token: Annotated[str | None, Cookie()] = None
):
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    return access_token

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, cookie_or_token: Annotated[str | None, Depends(get_cookie)]):
    user = await get_current_user(cookie_or_token)
    connection_registry[user.id] = websocket
    print("CONNECTED USER:", user.id)
    print("REGISTRY:", connection_registry)
    await websocket.accept()
    while True:
        data = await websocket.receive_json()
        message = Message.model_validate(data)
        print("SENDER:", user.id)
        print("RECIPIENT EMAIL:", message.reciever_email_address)
        reciever_id = get_user(message.reciever_email_address).id
        print("RECIPIENT ID:", reciever_id)
        print("TARGET SOCKET:", connection_registry.get(reciever_id))
        print("SENDING TO:", reciever_id)
        websocket2 = connection_registry[reciever_id]
        print("SENT")
        print(message.model_dump())
        await websocket2.send_json(message.model_dump())

@app.get("/username")
async def get_username(cookie: Annotated[str | None, Depends(get_cookie_http)]):
    user = await get_current_user_http(cookie)
    return user.username

@app.get("/email")
async def get_email(cookie: Annotated[str | None, Depends(get_cookie_http)]):
    user = await get_current_user_http(cookie)
    return user.email