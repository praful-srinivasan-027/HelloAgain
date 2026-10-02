from fastapi import FastAPI, WebSocket, WebSocketException, HTTPException, status, Cookie, Depends, Query
from Auth.service import connection_registry, get_current_user, get_user, get_username, get_current_user_http, get_user_email
from contextlib import asynccontextmanager
import redis
from Redis.connection import create_client, destroy_client
from Redis.pubsub import subscribe, publish
from db.models import User
from typing import Annotated
from schemas import Message
from Auth.router import chatRouter
from db.service import getConversation, createConversation, getMessages, createMessage
import asyncio
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = create_client()
    yield
    await destroy_client(app.state.redis)

app = FastAPI(title="Messaging Application", lifespan=lifespan)

def get_redis():
    return app.state.redis

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["https://hello-again-omega.vercel.app"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(chatRouter)

@app.get("/")
async def heakth_check(r: Annotated[redis.Redis, Depends(get_redis)]):
    try:
        response = await r.ping()
        print(response)
    except Exception as e:
        return {
            "message" : "hello gng",
            "error" : "redis is down tho"
        }
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
async def websocket_endpoint(websocket: WebSocket, cookie_or_token: Annotated[str | None, Depends(get_cookie)], r: Annotated[redis.Redis, Depends(get_redis)]):
    try:
        user = await get_current_user(cookie_or_token)
        connection_registry[user.id] = websocket
        print("CONNECTED USER:", user.id)
        print("REGISTRY:", connection_registry)
        publish_task = asyncio.create_task(publish(r, user.id, websocket))
        subscribe_task = asyncio.create_task(subscribe(r, user.id))
        await asyncio.gather(
            publish_task,
            subscribe_task
        )   
    finally:
        publish_task.cancel()
        subscribe_task.cancel()
        connection_registry.pop(user.id, None)

@app.get("/userinfo")
async def get_user_info(cookie: Annotated[str | None, Depends(get_cookie_http)]):
    user = await get_current_user_http(cookie)
    userid = user.id
    username = user.username
    email = user.email
    conversations = getConversation(user.id)
    conv = []
    for conversation in conversations:
        reciever_id = conversation.peer1 if conversation.peer1!=userid else conversation.peer2
        conversation_id = conversation.id
        conv.append((get_username(reciever_id), get_user_email(reciever_id), conversation_id))
    return {
        "id" : userid,
        "username" : username,
        "email" : email,
        "all conversation" : conv
    }

@app.get("/messageHistory")
async def get_message_history(reciever_email_addr: str, cookie: Annotated[str | None, Depends(get_cookie_http)]):
    user = await get_current_user_http(cookie)
    sender_id = user.id
    reciever_id = get_user(reciever_email_addr).id
    messages = getMessages(sender_id, reciever_id)
    message_list = []
    for message in messages:
        message_list.append((message.sender_id, message.message_content, message.sent_at))
    return {
        "Messages" : message_list
    }
