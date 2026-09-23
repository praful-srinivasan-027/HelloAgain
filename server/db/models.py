from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import Mapped
from sqlalchemy import ForeignKey, String, DateTime, Text
from .database import engine
import datetime

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "userTable"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(30), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    password: Mapped[str] = mapped_column(String(255),nullable=False, unique=True)

class Conversation(Base):
    ''' Here, peer1 and peer2 will be the user ids of the users'''
    __tablename__ = "Conversation"

    id: Mapped[int] = mapped_column(primary_key=True)
    peer1: Mapped[int] = mapped_column(ForeignKey("User.id"))
    peer2: Mapped[int] = mapped_column(ForeignKey("User.id"))

class MessageHistory(Base):
    __tablename__ = "MessageHistory"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("Conversation.id"))
    sender_id: Mapped[int] = mapped_column(ForeignKey("User.id"))
    message_content: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))

Base.metadata.create_all(engine)