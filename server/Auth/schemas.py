from pydantic import BaseModel

class RegisterRequest(BaseModel):
    userName: str
    email: str
    password: str

class loginRequest(BaseModel):
    email: str
    password: str

class TokenData(BaseModel):
    id: str
    email: str