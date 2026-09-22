from pydantic import BaseModel

class Message(BaseModel):
    reciever_id: str
    content: str