from fastapi import FastAPI, HTTPException, Depends, status, Cookie, Response, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import List, Optional  # Added Optional here
import uuid
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from knowledge import process_empty_subjects
from generator import classify_question_subjects, classify_question_topics, generate_title, generate_chat_response, KnowledgeLevel  # Add this import
from pydantic import BaseModel  # Add this if not already imported
from contextlib import asynccontextmanager
from models.database import Base, User, Chat, Message, KnowledgeModel, Subject, Topic
from schemas.pydantic_models import (
    UserBase, UserCreate, UserResponse, ChatBase, ChatCreate, 
    ChatResponse, MessageCreate, MessageResponse, Token, TokenData
)

# Add this import near the top with other imports
from pydantic import BaseModel

# Add these class definitions after other BaseModel classes
class ChatResponseRequest(BaseModel):
    chat_id: int
    question: str  # Changed from List to str
    subjects: list[str]

    class Config:
        json_schema_extra = {
            "example": {
                "chat_id": 1,
                "question": "What is Newton's First Law?",
                "subjects": ["Physics", "Classical Mechanics"]
            }
        }

# Add this with other Pydantic models at the top
class GenerateResponseModel(BaseModel):
    response: str

# Load environment variables
load_dotenv()

# FastAPI app initialization


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    scheduler.add_job(process_subjects_task, 'interval', minutes=15, id='process_subjects')
    scheduler.start()
    yield
    # Shutdown tasks
    scheduler.shutdown()

app = FastAPI(title="AI Chat API", lifespan=lifespan)

# Update CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*", "Authorization", "Content-Type"],
    expose_headers=["*"],
    max_age=86400,  # 24 hours
)

# Database configuration
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "aichat")

POSTGRES_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
engine = create_engine(POSTGRES_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

EXAMPLE_CHATS = [
    {
        "title": "Introduction to Physics",
        "tags": ["Physics"],  # Removed "Beginner" tag
        "notes": """# Math Example
Here's a mathematical formula:
\`\`\`math
f(x) = ax^2 + bx + c
\`\`\`

## Video Example
youtube:dQw4w9WgXcQ

## Code Example
\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`
# Math Example
Here's a mathematical formula:
\`\`\`math
f(x) = ax^2 + bx + c
\`\`\`

## Video Example
youtube:dQw4w9WgXcQ

## Code Example
\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`
# Math Example
Here's a mathematical formula:
\`\`\`math
f(x) = ax^2 + bx + c
\`\`\`

## Video Example
youtube:dQw4w9WgXcQ

## Code Example
\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`
# Math Example
Here's a mathematical formula:
\`\`\`math
f(x) = ax^2 + bx + c
\`\`\`

## Video Example
youtube:dQw4w9WgXcQ

## Code Example
\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`
# Math Example
Here's a mathematical formula:
\`\`\`math
f(x) = ax^2 + bx + c
\`\`\`

## Video Example
youtube:dQw4w9WgXcQ

## Code Example
\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`
# Math Example
Here's a mathematical formula:
\`\`\`math
f(x) = ax^2 + bx + c
\`\`\`

## Video Example
youtube:dQw4w9WgXcQ

## Code Example
\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`
# Math Example
Here's a mathematical formula:
\`\`\`math
f(x) = ax^2 + bx + c
\`\`\`

## Video Example
youtube:dQw4w9WgXcQ

## Code Example
\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`
""",
        "messages": [
            {
                "content": [
                    {"type": "text", "value": "Welcome! Here's a key physics concept:"},
                    {"type": "latex", "value": "$$ E = mc^2 $$"},
                    {"type": "text", "value": "Watch this video for a detailed explanation:"},
                    {"type": "video", "value": "uC9VtVnuPD0"}
                ],
                "is_bot": True
            }
        ]
    },
    {
        "title": "Linear Algebra Basics",
        "tags": ["Mathematics", "Linear Algebra"],
        "messages": [
            {
                "content": [
                    {"type": "text", "value": "Let's explore matrices. Here's a basic matrix:"},
                    {"type": "latex", "value": "$$ \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} $$"}
                ],
                "is_bot": True
            },
            {
                "content": [
                    {"type": "text", "value": "Welcome! Here's a key physics concept:"},
                    {"type": "latex", "value": "$$ E = mc^2 $$"},
                    {"type": "text", "value": "Watch this video for a detailed explanation:"},
                    {"type": "video", "value": "uC9VtVnuPD0"}
                ],
                "is_bot": True
            }
        ]
    }
]

# Secret key for JWT
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Change here: make auto_error=False
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def init_example_data(db: Session, user_id: int):
    # Check if user already has any chats
    if db.query(Chat).filter(Chat.user_id == user_id).first() is None:
        for chat_data in EXAMPLE_CHATS:
            # Create chat with user_id
            chat = Chat(
                title=chat_data["title"],
                tags=chat_data["tags"],
                notes=chat_data.get("notes"),
                user_id=user_id  # Add user_id
            )
            db.add(chat)
            db.commit()
            db.refresh(chat)
 
            # Add messages
            for msg_data in chat_data["messages"]:
                message = Message(
                    chat_id=chat.id,
                    content=msg_data["content"],
                    is_bot=msg_data["is_bot"]
                )
                db.add(message)
            
            db.commit()

# Create tables
Base.metadata.create_all(bind=engine)

# Dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utility functions for authentication
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(db, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_or_create_guest_user(request: Request, db: Session) -> User:
    client_ip = request.client.host
    guest_user = db.query(User).filter(
        User.guest_id == client_ip,
        User.is_guest == True
    ).first()

    if not guest_user:
        guest_username = f"guest_{client_ip.replace('.', '_')}"
        guest_user = User(
            username=guest_username,
            email=None,
            is_guest=True,
            guest_id=client_ip,
            disabled=False
        )
        db.add(guest_user)
        db.commit()
        db.refresh(guest_user)
        
        # Initialize example chats for new guest user
        init_example_data(db, guest_user.id)

    return guest_user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if (current_user.disabled):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def transfer_guest_data(db: Session, guest_user: User, new_user: User):
    """Transfer all data from guest user to new user"""
    try:
        # Transfer knowledge models
        knowledge_models = db.query(KnowledgeModel).filter(
            KnowledgeModel.user_id == guest_user.id
        ).all()
        
        for model in knowledge_models:
            model.user_id = new_user.id

        # Transfer chats (if you have user_id in chats)
        # Transfer any other user-related data here
        
        # Delete guest user
        db.delete(guest_user)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error transferring guest data: {str(e)}")
        return False

# Add this new dependency
async def get_current_user_or_guest(
    request: Request,
    token: str = Depends(oauth2_scheme),  # Now optional
    db: Session = Depends(get_db)
):
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if username:
                user = db.query(User).filter(User.username == username).first()
                if user:
                    return user
        except JWTError:
            pass
    
    # If no valid token or user not found, create/get guest user
    return await get_or_create_guest_user(request, db)

# Routes
@app.get("/chats/", response_model=List[ChatResponse])
async def get_chats(
    request: Request,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_guest)  # Changed this line
):
    # Get chats belonging to the current user (authenticated or guest)
    chats = db.query(Chat).filter(
        Chat.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    # Add last message to each chat
    for chat in chats:
        last_message = db.query(Message).filter(Message.chat_id == chat.id).order_by(Message.created_at.desc()).first()
        if last_message:
            text_content = next((item['value'] for item in last_message.content if item['type'] == 'text'), None)
            setattr(chat, 'lastMessage', text_content or "No text content")
        else:
            setattr(chat, 'lastMessage', "No messages yet")
    
    return chats

@app.post("/chats/", response_model=ChatResponse)
async def create_chat(
    chat: ChatBase,  # Changed from ChatCreate to ChatBase
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_guest)
):
    try:
        db_chat = Chat(
            title=chat.title,
            tags=chat.tags,
            user_id=current_user.id
        )
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)
        return db_chat
    except Exception as e:
        db.rollback()
        print(f"Error creating chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create chat: {str(e)}"
        )

# Update the messages endpoint to verify user ownership
@app.get("/chats/{chat_id}/messages/", response_model=List[MessageResponse])
async def get_chat_messages(
    chat_id: int,
    request: Request,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_guest)  # Added this line
):
    # Verify chat belongs to user
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = db.query(Message).filter(Message.chat_id == chat_id).offset(skip).limit(limit).all()
    return messages

@app.post("/messages/", response_model=MessageResponse)
async def create_message(message: MessageCreate, db: Session = Depends(get_db)):
    # Verify chat exists
    chat = db.query(Chat).filter(Chat.id == message.chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Create message with dict content
    db_message = Message(
        chat_id=message.chat_id,
        content=[dict(item) if not isinstance(item, dict) else item for item in message.content],
        is_bot=message.is_bot
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@app.get("/tags/")
async def get_tags(db: Session = Depends(get_db)):
    # Get unique tags from all chats, filtering out empty and knowledge level tags
    chats = db.query(Chat).all()
    tags = set()
    knowledge_level_tags = {"beginner", "intermediate", "advanced", "expert"}
    for chat in chats:
        filtered_tags = {tag for tag in chat.tags if tag and tag.lower() not in knowledge_level_tags}
        tags.update(filtered_tags)
    return sorted(list(tags))

@app.get("/chats/{chat_id}/notes")
async def get_chat_notes(chat_id: int, db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"notes": chat.notes}

@app.put("/chats/{chat_id}/notes")
async def update_chat_notes(chat_id: int, notes: str, db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat.notes = notes
    db.commit()
    return {"status": "success"}

@app.put("/chats/{chat_id}/title", response_model=ChatResponse)
async def update_chat_title(
    chat_id: int,
    request: Request,
    title: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_guest)
):
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    try:
        chat.title = title.get('title')
        chat.updated_at = datetime.utcnow()  # Update timestamp
        db.commit()
        db.refresh(chat)
        return chat
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.username == form_data.username,
        User.is_guest == False
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "is_guest": False},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Initialize example chats for new user
    init_example_data(db, db_user.id)
    
    return db_user

@app.post("/register", response_model=UserResponse)
async def register_user(
    user: UserCreate,
    guest_id: str = Cookie(None),
    db: Session = Depends(get_db)
):
    # Check if username already exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email already exists (if provided)
    if user.email and db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        is_guest=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If guest_id provided, try to transfer data
    if guest_id:
        guest_user = db.query(User).filter(
            User.guest_id == guest_id,
            User.is_guest == True
        ).first()
        
        if guest_user:
            transfer_success = await transfer_guest_data(db, guest_user, new_user)
            if not transfer_success:
                # Log the failure but don't fail the registration
                print(f"Failed to transfer guest data for guest_id: {guest_id}")

    return new_user

@app.get("/users/me/", response_model=UserResponse)
async def read_users_me(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        # First try to get user from token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        user = db.query(User).filter(User.username == username).first()
        if user:
            return user

        # If no user found, fallback to guest
        return await get_or_create_guest_user(request, db)
    except JWTError:
        # Token invalid, fallback to guest
        return await get_or_create_guest_user(request, db)

@app.post("/guest-token", response_model=Token)  # Changed from @app.get to @app.post
async def create_guest_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    try:
        guest_user = await get_or_create_guest_user(request, db)
        
        access_token = create_access_token(
            data={"sub": guest_user.username, "is_guest": True},
            expires_delta=timedelta(days=30)
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Error creating guest token: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/claim-guest-account", response_model=UserResponse)
async def claim_guest_account(
    user: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_guest:
        raise HTTPException(status_code=400, detail="Only guest accounts can be claimed")
    
    # Check if username/email already exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Update guest user with real user info
    current_user.username = user.username
    current_user.email = user.email
    current_user.full_name = user.full_name
    current_user.hashed_password = get_password_hash(user.password)
    current_user.is_guest = False
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

# Initialize scheduler
scheduler = AsyncIOScheduler()

async def process_subjects_task():
    """Background task to process empty subjects"""
    db = SessionLocal()
    """Background task to process empty subjects"""
    db = SessionLocal()
    try:
        results = process_empty_subjects(db)
        print(f"Subject processing results: {results}")
    finally:
        db.close()

class QuestionClassificationRequest(BaseModel):
    question: str

class TopicClassificationRequest(BaseModel):
    question: str
    subject: str

class TitleGenerationRequest(BaseModel):
    text: str

@app.post("/generate-title/")
async def generate_chat_title(
    request: TitleGenerationRequest,
    db: Session = Depends(get_db)
):
    """Generate a concise title for a question or chat content."""
    try:
        title = generate_title(request.text)
        
        if not title:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate title"
            )
        
        return {
            "text": request.text,
            "title": title
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating title: {str(e)}"
        )

# Rename existing endpoint
@app.post("/classify-subject/")
async def classify_subject(
    request: QuestionClassificationRequest,
    db: Session = Depends(get_db)
):
    """Classify a question to determine relevant subjects."""
    try:
        available_subjects = [subject.name for subject in db.query(Subject).all()]
        
        if not available_subjects:
            raise HTTPException(
                status_code=404,
                detail="No subjects available in the database"
            )
        
        relevant_subjects = classify_question_subjects(
            question=request.question,
            available_subjects=available_subjects
        )
        
        return {
            "question": request.question,
            "relevant_subjects": relevant_subjects
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error classifying question: {str(e)}"
        )

@app.post("/classify-topic/")
async def classify_topic(
    request: TopicClassificationRequest,
    db: Session = Depends(get_db)
):
    """Classify a question to determine relevant topics within a subject."""
    try:
        # Get the subject from the database
        subject = db.query(Subject).filter(Subject.name == request.subject).first()
        if not subject:
            raise HTTPException(
                status_code=404,
                detail=f"Subject '{request.subject}' not found"
            )
        
        # Get all topics for the subject
        topics = db.query(Topic).filter(Topic.subject_id == subject.id).all()
        available_topics = [topic.name for topic in topics]
        
        if not available_topics:
            raise HTTPException(
                status_code=404,
                detail=f"No topics available for subject '{request.subject}'"
            )
        
        # Classify the question
        relevant_topics = classify_question_topics(
            question=request.question,
            subject=request.subject,
            available_topics=available_topics
        )
        
        return {
            "question": request.question,
            "subject": request.subject,
            "relevant_topics": relevant_topics
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error classifying topics: {str(e)}"
        )

@app.get("/subjects/")
async def get_subjects(db: Session = Depends(get_db)):
    """Get all subjects."""
    subjects = db.query(Subject).all()
    return [{"id": subject.id, "name": subject.name} for subject in subjects]

@app.get("/subjects/{subject_id}/topics/")
async def get_topics(subject_id: int, db: Session = Depends(get_db)):
    """Get topics for a specific subject."""
    topics = db.query(Topic).filter(Topic.subject_id == subject_id).all()
    if not topics:
        raise HTTPException(status_code=404, detail="No topics found for this subject")
    return [{"id": topic.id, "name": topic.name} for topic in topics]

@app.post("/generate-response/", response_model=GenerateResponseModel)
async def generate_response(
    request: ChatResponseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_guest)
):
    """Generate a chat response for a specific chat."""
    try:
        # Verify chat belongs to user
        chat = db.query(Chat).filter(
            Chat.id == request.chat_id,
            Chat.user_id == current_user.id
        ).first()
        
        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found or access denied"
            )

        if not request.question or not request.subjects:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question and subjects are required"
            )

        # Use default knowledge levels for now
        subject_knowledge = {
            subject: KnowledgeLevel.INTERMEDIATE 
            for subject in request.subjects
        }
        
        # Generate response
        response = generate_chat_response(
            chat_id=request.chat_id,
            db_session=db,
            question=request.question,
            relevant_subjects=request.subjects,
            relevant_topics={},  # Empty for now
            subject_knowledge=subject_knowledge,
            topic_knowledge={}
        )

        return GenerateResponseModel(response=response)
    
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error generating response: {str(e)}")  # Add logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
