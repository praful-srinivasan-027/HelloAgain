from typing import Annotated
from db.models import User
from fastapi import APIRouter, HTTPException, Response, Depends
from fastapi.responses import RedirectResponse
from .service import authenticate_user, create_access_token, get_current_user, create_user
from .schemas import loginRequest, RegisterRequest

chatRouter = APIRouter()

@chatRouter.post("/login")
def login(request: loginRequest, response: Response):
    email = request.email
    password = request.password
    user = authenticate_user(email, password)
    if user:
        user_id = user.id
        jwt_token = create_access_token(user_id, email)
        response.set_cookie(
            key="access_token",
            value=jwt_token,
            secure=True, #TODO: Change to True During Production
            httponly=True,
            samesite="lax"
        )
        return {"message": "Logged In"}
    raise HTTPException(status_code=401, detail="Authentication Failed")

@chatRouter.post("/register")
def register(request: RegisterRequest):
    userName = request.userName
    email = request.email
    password = request.password
    user = create_user(userName, password, email)
    if user:
        user_id = user.id
        jwt_token = create_access_token(user_id, user.email)
        return jwt_token
    raise HTTPException(status_code=503, detail="User Already Exists")