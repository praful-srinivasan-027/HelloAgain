from pydantic import BaseModel
import datetime

class Message(BaseModel):
    JWT_token: str | None = None
    reciever_email_address: str
    sender_email_address: str
    content: str
    sent_at: datetime.datetime