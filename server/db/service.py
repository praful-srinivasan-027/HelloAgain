from .database import engine
from sqlalchemy import Select, or_
from .models import Conversation, MessageHistory
from sqlalchemy.orm import Session
import datetime

def getConversation(senderId: int, recieverId: int | None = None) -> Conversation | list[Conversation] | None:
    if recieverId is not None:
        with Session(engine) as session:
            stmt = Select(Conversation).where(
                or_(
                (Conversation.peer1 == senderId) & (Conversation.peer2 == recieverId),
                (Conversation.peer1 == recieverId) & (Conversation.peer2 == senderId),
                )
            )
            for conversation in session.scalars(stmt):
                return conversation
    else:
        with Session(engine) as session:
            stmt = Select(Conversation).where(
                or_(
                (Conversation.peer1 == senderId),
                (Conversation.peer2 == senderId),
                )
            )
            return list(session.scalars(stmt))
        

def createConversation(senderId: int, recieverId: int) -> Conversation:
    aux = getConversation(senderId, recieverId)
    if aux:
        return aux
    with Session(engine) as session:
        newConv = Conversation(peer1=senderId, peer2=recieverId)
        session.add(newConv)
        session.commit()
        return getConversation(senderId, recieverId)

def getMessages(senderId: int, recieverId: int) -> list[MessageHistory]:
    with Session(engine) as session:
        stmt = Select(MessageHistory).join(Conversation).where(
            or_(
                (Conversation.peer1 == senderId) & (Conversation.peer2 == recieverId),
                (Conversation.peer1 == recieverId) & (Conversation.peer2 == senderId),
            )
        )
        return list(session.scalars(stmt))
    
def createMessage(conversation_ids: int, sender_ids: int, content: str, sent_at_: datetime.datetime) -> bool:
    with Session(engine) as session:
        newMessage = MessageHistory(conversation_id=conversation_ids, sender_id=sender_ids, message_content=content, sent_at=sent_at_)
        session.add(newMessage)
        session.commit()
        return True
    return False