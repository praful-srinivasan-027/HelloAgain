from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta, datetime, timezone
from jwt.exceptions import InvalidTokenError
from db.database import engine
from sqlalchemy.orm import Session
from db.models import User
from typing import Annotated
from .schemas import TokenData
from fastapi import HTTPException, Depends
from pwdlib import PasswordHash
from dotenv import load_dotenv
from sqlalchemy import Select
import jwt
import os

load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

password_hash = PasswordHash.recommended()

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)

def get_password_hash(plain_password):
    return password_hash.hash(plain_password)

def get_user(email_addr: str):
    with Session(engine) as session:
        stmt = Select(User).where(User.email == email_addr)
        for user in session.scalars(stmt):
            return user

def create_user(userName: str, password: str, email:str):
    if get_user(email_addr=email):
        return False
    with Session(engine) as session:
        newUser = User(username=f"{userName}", email=f"{email}", password=f"{get_password_hash(password)}")
        session.add(newUser)
        session.commit()
        return get_user(email_addr=email)
    return False

def authenticate_user(email, password):
    user = get_user(email)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

def create_access_token(id: int, email, expires_delta: timedelta|None = None):
    to_encode = _create_token_payload(id, email)
    if expires_delta:
        expiry = datetime.now(timezone.utc) + expires_delta
    else:
        expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expiry})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def _create_token_payload(id, email):
    data = {
        "sub" : str(id),
        "email": email
    }
    return data

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    print("TOKEN:", token)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        id = payload.get("sub")
        email = payload.get("email")
        if id is None or email is None:
            raise credentials_exception
        token_data = TokenData(id=id, email=email)
    except InvalidTokenError as e:
        print(e)
        raise credentials_exception
    user = get_user(email_addr=token_data.email)
    if user is None:
        raise credentials_exception
    return user
