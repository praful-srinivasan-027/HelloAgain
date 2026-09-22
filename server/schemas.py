from pydantic import BaseModel

class Message(BaseModel):
    JWT_token: str | None = None
    reciever_email_address: str
    sender_email_address: str
    content: str