from sqlalchemy import Column, Integer, String, ARRAY, JSON, DateTime, ForeignKey, Boolean, Enum, Float
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Chat(Base):
    __tablename__ = "chats"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Add this line
    title = Column(String, nullable=False)
    tags = Column(ARRAY(String))
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    content = Column(JSON, nullable=False)
    is_bot = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    name = Column(String, nullable=False)

class Subtopic(Base):
    __tablename__ = "subtopics"
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    name = Column(String, nullable=False)

class Prerequisites(Base):
    __tablename__ = "prerequisites"
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, nullable=False)
    source_type = Column(Enum('subject', 'topic', 'subtopic', name='item_types'), nullable=False)
    prerequisite_id = Column(Integer, nullable=False)
    prerequisite_type = Column(Enum('subject', 'topic', 'subtopic', name='item_types'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=True)
    full_name = Column(String, nullable=True)
    disabled = Column(Boolean, default=False)
    is_guest = Column(Boolean, default=False)
    guest_id = Column(String, unique=True, nullable=True)

class KnowledgeModel(Base):
    __tablename__ = "knowledge_models"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    concept = Column(String, nullable=False)
    p_transit = Column(Float, nullable=False)
    p_known = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
