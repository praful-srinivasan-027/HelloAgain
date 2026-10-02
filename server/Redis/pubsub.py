import asyncio
from Auth.service import connection_registry, get_user
from schemas import Message
from fastapi import WebSocket
from db.service import getConversation, createConversation, getMessages, createMessage
import redis.asyncio as redis

async def subscribe(r: redis.Redis, userid: str):
    async with r.pubsub() as pubsub:
        await pubsub.subscribe(f"user:{userid}")
        async def reader():
            async for message in pubsub.listen():
                if(message['type'] == 'message'):
                    message = Message.model_validate_json(message['data'])
                    websocket = connection_registry.get(userid)
                    if websocket:
                        await websocket.send_json(message.model_dump(mode='json'))
        reader_task = asyncio.create_task(reader())
        await reader_task

async def publish(r: redis.Redis, userid, websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_json()
        message = Message.model_validate(data)
        reciever = get_user(message.reciever_email_address)
        conversation = createConversation(userid, reciever.id)
        createMessage(conversation.id, userid, message.content, message.sent_at)
        await r.publish(f'user:{reciever.id}', message.model_dump_json())