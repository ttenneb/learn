from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    is_guest: Optional[bool] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class ChatBase(BaseModel):
    title: str
    tags: List[str]

class ChatCreate(ChatBase):
    pass  # Remove user_id requirement

class ChatResponse(ChatBase):
    id: int
    user_id: int  # Add this line
    created_at: datetime
    updated_at: datetime
    lastMessage: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

class MessageContent(BaseModel):
    type: str
    value: str

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    chat_id: int
    content: List[dict]
    is_bot: bool = False

class MessageResponse(BaseModel):
    id: int
    chat_id: int
    content: List[dict]
    is_bot: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
