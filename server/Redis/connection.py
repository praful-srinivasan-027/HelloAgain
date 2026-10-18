import redis.asyncio as redis 
from dotenv import load_dotenv
import os

load_dotenv()

def create_client():
    r = redis.Redis(
        host=os.getenv("REDIS_CLIENT"), 
        port=os.getenv("REDIS_PORT"), 
        decode_responses=True,
        username='default',
        password=os.getenv("REDIS_PASSWORD"),
        max_connections=100
    )
    return r

async def destroy_client(r: redis.Redis):
    await r.aclose()

