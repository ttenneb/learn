from langchain.schema import BaseChatMessageHistory, BaseMessage, HumanMessage, AIMessage
from typing import List
from sqlalchemy.orm import Session
from models.database import Chat, Message
import json

class PostgresChatMessageHistory(BaseChatMessageHistory):
    """Chat message history that stores messages in PostgreSQL."""
    
    def __init__(self, chat_id: int, db_session: Session):
        self.chat_id = chat_id
        self.db_session = db_session
        self._messages: List[BaseMessage] = None  # Cache for messages

    @property
    def messages(self) -> List[BaseMessage]:
        """Return list of messages."""
        if self._messages is None:
            self._messages = self.get_messages()
        return self._messages

    def get_messages(self) -> List[BaseMessage]:
        """Retrieve the messages from PostgreSQL."""
        db_messages = (
            self.db_session.query(Message)
            .filter(Message.chat_id == self.chat_id)
            .order_by(Message.created_at.asc())
            .all()
        )
        
        messages = []
        for db_msg in db_messages:
            # Convert the content field from JSON array to string if needed
            if isinstance(db_msg.content, list):
                # Extract text content from the JSON structure
                text_content = next(
                    (item['value'] for item in db_msg.content if item['type'] == 'text'),
                    str(db_msg.content)  # Fallback to string representation
                )
            else:
                text_content = str(db_msg.content)
            
            # Create appropriate message type
            if db_msg.is_bot:
                messages.append(AIMessage(content=text_content))
            else:
                messages.append(HumanMessage(content=text_content))
        
        self._messages = messages
        return messages

    def clean_bot_message(self, content: str) -> str:
        """Clean bot message content and extract response from JSON if present."""
        try:
            # Remove code block markers
            cleaned = content.replace("```json", "").replace("```", "").strip()
            
            # Handle control characters and escape sequences
            cleaned = cleaned.encode('utf-8').decode('unicode_escape')
            cleaned = ''.join(char for char in cleaned if ord(char) >= 32 or char in '\n\r\t')
            
            # Parse JSON with relaxed rules
            content_data = json.loads(cleaned, strict=False)
            
            # Extract response field if present
            if "response" in content_data:
                return content_data["response"]
                
            return cleaned
        except json.JSONDecodeError:
            # If JSON parsing fails, return cleaned content
            return ''.join(char for char in content if ord(char) >= 32 or char in '\n\r\t')

    def add_message(self, message: BaseMessage) -> None:
        """Add a message to the store."""
        # Determine if it's a bot message
        is_bot = isinstance(message, AIMessage)
        
        # Clean message content
        clean_content = self.clean_bot_message(message.content) if is_bot else message.content
        
        # Create new message in DB
        db_message = Message(
            chat_id=self.chat_id,
            content=[{"type": "text", "value": clean_content}],
            is_bot=is_bot
        )
        
        self.db_session.add(db_message)
        self.db_session.commit()
        
        # Update cache with original message
        if self._messages is not None:
            self._messages.append(message)

    def add_user_message(self, message: str) -> None:
        """Convenience method to add a user message."""
        self.add_message(HumanMessage(content=message))

    def add_ai_message(self, message: str) -> None:
        """Convenience method to add an AI message."""
        self.add_message(AIMessage(content=message))

    def clear(self) -> None:
        """Clear message history."""
        self.db_session.query(Message).filter(
            Message.chat_id == self.chat_id
        ).delete()
        self.db_session.commit()
        self._messages = []
