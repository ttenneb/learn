from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnableWithMessageHistory
from langchain_core.prompts import ChatPromptTemplate
import json
from typing import Dict, Any, List, Callable, AsyncGenerator
from sqlalchemy.orm import Session
from config import OPENAI_API_KEY, MODEL_NAME, TEMPERATURE
from prompts import (
    TOPIC_GENERATION_PROMPT, 
    SUBJECT_CLASSIFICATION_PROMPT,
    TOPIC_CLASSIFICATION_PROMPT,
    TITLE_GENERATION_PROMPT,
    CHAT_JSON_RESPONSE_PROMPT
)
from enum import Enum
from ChatMessageHistory import PostgresChatMessageHistory
from langchain.chains import SequentialChain
import asyncio

def create_llm():
    """Create and return a ChatOpenAI instance."""
    return ChatOpenAI(
        api_key=OPENAI_API_KEY,
        model_name=MODEL_NAME,
        temperature=TEMPERATURE,
        streaming=True
    )

def generate_subject_content(subject: str) -> Dict[str, Any]:
    """Generate and parse content for a given academic subject."""
    llm = create_llm()
    
    # Create prompt template with double curly braces for JSON structure
    prompt = PromptTemplate.from_template(
        TOPIC_GENERATION_PROMPT
    )
    
    # Generate content
    formatted_prompt = prompt.format(subject=subject)
    response = llm.invoke(formatted_prompt)
    
    try:
        # Extract content from AIMessage and parse JSON
        content_str = response.content.replace("```json", "").replace("```", "")
        content = json.loads(content_str)
        return content
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse JSON response: {str(e)}\nResponse: {response.content}")

def validate_content_structure(content: Dict[str, Any], subject: str) -> bool:
    """Validate the structure of the generated content."""
    if not isinstance(content, dict) or subject not in content:
        return False
    
    subject_content = content[subject]
    if not isinstance(subject_content, dict):
        return False
    
    for chapter in subject_content.values():
        if not isinstance(chapter, dict) or "subtopics" not in chapter:
            return False
        if not isinstance(chapter["subtopics"], list):
            return False
        for topic in chapter["subtopics"]:
            if not isinstance(topic, dict) or "subtopic" not in topic or "difficulty" not in topic:
                return False
            if not isinstance(topic["difficulty"], (int, float)) or not 0 <= topic["difficulty"] <= 1:
                return False
    
    return True

def classify_question_subjects(question: str, available_subjects: list[str]) -> list[str]:
    """
    Classify which subjects a question belongs to from a list of available subjects.
    """
    llm = create_llm()
    
    # Create prompt template
    prompt = PromptTemplate.from_template(SUBJECT_CLASSIFICATION_PROMPT)
    
    try:
        # Format prompt with question and subjects
        formatted_prompt = prompt.format(
            question=question,
            subjects_list=", ".join(available_subjects)
        )
        
        # Get classification response
        response = llm.invoke(formatted_prompt)
        
        # Clean and parse JSON response
        content_str = response.content.strip()
        # Remove any markdown code blocks if present
        content_str = content_str.replace("```json", "").replace("```", "").strip()
        
        # Additional cleanup for common issues
        if content_str.startswith("'") or content_str.startswith('"'):
            content_str = content_str[1:]
        if content_str.endswith("'") or content_str.endswith('"'):
            content_str = content_str[:-1]
            
        # Parse JSON response
        subjects = json.loads(content_str)
        
        # Validate subjects are from available list
        valid_subjects = [s for s in subjects if s in available_subjects]
        
        return valid_subjects
    except Exception as e:
        print(f"Error classifying question: {str(e)}")
        print(f"Raw response content: {response.content}")
        return []

def classify_question_topics(question: str, subject: str, available_topics: list[str]) -> list[str]:
    """
    Classify which topics within a subject are most relevant to a question.
    """
    llm = create_llm()
    prompt = PromptTemplate.from_template(TOPIC_CLASSIFICATION_PROMPT)
    
    try:
        formatted_prompt = prompt.format(
            question=question,
            subject=subject,
            topics_list=", ".join(available_topics)
        )
        
        response = llm.invoke(formatted_prompt)
        
        # Clean and parse JSON response
        content_str = response.content.strip()
        content_str = content_str.replace("```json", "").replace("```", "").strip()
        
        if content_str.startswith(("'", '"')):
            content_str = content_str[1:]
        if content_str.endswith(("'", '"')):
            content_str = content_str[:-1]
            
        topics = json.loads(content_str)
        valid_topics = [t for t in topics if t in available_topics]
        
        return valid_topics
    except Exception as e:
        print(f"Error classifying topics: {str(e)}")
        print(f"Raw response content: {response.content}")
        return []

def classify_question_subtopics(question: str, subject: str, available_subtopics: list[str]) -> list[str]:
    """
    Classify which subtopics within a subject are most relevant to a question.
    """
    llm = create_llm()
    # Use SUBTOPIC_CLASSIFICATION_PROMPT from prompts
    from prompts import SUBTOPIC_CLASSIFICATION_PROMPT
    prompt = PromptTemplate.from_template(SUBTOPIC_CLASSIFICATION_PROMPT)
    
    try:
        formatted_prompt = prompt.format(
            question=question,
            subject=subject,
            subtopics_list=", ".join(available_subtopics)
        )
        
        response = llm.invoke(formatted_prompt)
        
        content_str = response.content.strip().replace("```json", "").replace("```", "").strip()
        if content_str.startswith(("'", '"')):
            content_str = content_str[1:]
        if content_str.endswith(("'", '"')):
            content_str = content_str[:-1]
            
        subtopics = json.loads(content_str)
        valid_subtopics = [s for s in subtopics if s in available_subtopics]
        return valid_subtopics
    except Exception as e:
        print(f"Error classifying subtopics: {str(e)}")
        print(f"Raw response content: {response.content}")
        return []

def generate_title(text: str) -> str:
    """Generate a concise title (max 4 words) for a given text."""
    llm = create_llm()
    prompt = PromptTemplate.from_template(TITLE_GENERATION_PROMPT)
    
    try:
        formatted_prompt = prompt.format(text=text)
        response = llm.invoke(formatted_prompt)
        
        # Clean and parse JSON response
        content_str = response.content.strip()
        content_str = content_str.replace("```json", "").replace("```", "").strip()
        
        if content_str.startswith(("'", '"')):
            content_str = content_str[1:]
        if content_str.endswith(("'", '"')):
            content_str = content_str[:-1]
            
        title_data = json.loads(content_str)
        return title_data["title"]
    except Exception as e:
        print(f"Error generating title: {str(e)}")
        print(f"Raw response content: {response.content}")
        return ""

class KnowledgeLevel(Enum):
    NOVICE = 1
    INTERMEDIATE = 2
    ADVANCED = 3
    EXPERT = 4

    def __lt__(self, other):
        if self.__class__ is other.__class__:
            return self.value < other.value
        return NotImplemented

def clean_llm_response(response_text: str) -> str:
    """Clean the LLM response text while preserving newlines."""
    # Remove code block markers
    cleaned = response_text.replace("```json", "").replace("```", "").strip()
    
    # Split by newlines and handle each line separately
    lines = cleaned.split('\n')
    # Normalize spaces within each line while preserving empty lines
    cleaned_lines = [' '.join(line.split()) if line.strip() else '' for line in lines]
    # Rejoin with newlines
    return '\n'.join(cleaned_lines)

async def generate_chat_response(
    chat_id: int,
    db_session: Session,
    question: str,
    relevant_subjects: List[str],
    relevant_topics: Dict[str, List[str]],
    subject_knowledge: Dict[str, KnowledgeLevel],
    topic_knowledge: Dict[str, KnowledgeLevel]
) -> AsyncGenerator[str, None]:
    """Generate a streaming response using RunnableWithMessageHistory with knowledge level context."""
    try:
        # Get knowledge levels for relevant subjects
        relevant_knowledge_levels = {
            subject: subject_knowledge.get(subject, KnowledgeLevel.NOVICE)
            for subject in relevant_subjects
        }

        # Create LLM instance
        llm = create_llm()

        # Create knowledge context string
        knowledge_context = "\n".join([
            f"For {subject}, the user has {level.name.lower()} knowledge level."
            for subject, level in relevant_knowledge_levels.items()
        ])

        # Determine detail and terminology level based on lowest knowledge level
        min_knowledge = min(
            [level for level in relevant_knowledge_levels.values()],
            default=KnowledgeLevel.NOVICE
        )
        
        detail_map = {
            KnowledgeLevel.NOVICE: "thorough and basic",
            KnowledgeLevel.INTERMEDIATE: "moderately detailed",
            KnowledgeLevel.ADVANCED: "concise but comprehensive",
            KnowledgeLevel.EXPERT: "concise and technical"
        }
        
        terminology_map = {
            KnowledgeLevel.NOVICE: "simple",
            KnowledgeLevel.INTERMEDIATE: "standard",
            KnowledgeLevel.ADVANCED: "technical",
            KnowledgeLevel.EXPERT: "advanced technical"
        }

        # Create prompt template
        prompt = PromptTemplate.from_template(CHAT_JSON_RESPONSE_PROMPT)
        chain = prompt | llm

        # Create message history getter
        def get_session_history(session_id: str):
            return PostgresChatMessageHistory(chat_id=int(session_id), db_session=db_session)

        # Wrap with message history
        chain_with_history = RunnableWithMessageHistory(
            chain,
            get_session_history=get_session_history,
            input_messages_key="input",
            history_messages_key="history"
        )

        # Generate streaming response
        stream = chain_with_history.astream(
            {
                "knowledge_context": knowledge_context,
                "detail_level": detail_map[min_knowledge],
                "terminology_level": terminology_map[min_knowledge],
                "input": question
            },
            config={"configurable": {"session_id": str(chat_id)}}
        )

        # Modified streaming response handling with proper spacing and newlines
        last_chunk_ended_with_space = False
        buffer = ""
        async for chunk in stream:
            if hasattr(chunk, 'content'):
                text = chunk.content
            else:
                text = str(chunk)
            
            buffer += text
            
            # Process complete lines if we have any newlines
            if '\n' in buffer:
                lines = buffer.split('\n')
                # Keep the last partial line in the buffer
                buffer = lines[-1]
                
                # Process all complete lines
                for line in lines[:-1]:
                    cleaned = clean_llm_response(line)
                    if cleaned:
                        yield cleaned + '\n'
                        last_chunk_ended_with_space = False
            
            # Process any remaining text in buffer if it's complete
            elif buffer.endswith(('.', '!', '?', ':', ';')):
                cleaned = clean_llm_response(buffer)
                if cleaned:
                    if not last_chunk_ended_with_space and not cleaned.startswith(' '):
                        yield ' '
                    yield cleaned + ' '
                    last_chunk_ended_with_space = True
                buffer = ""
        
        # Process any remaining buffer at the end
        if buffer:
            cleaned = clean_llm_response(buffer)
            if cleaned:
                if not last_chunk_ended_with_space and not cleaned.startswith(' '):
                    yield ' '
                yield cleaned

    except Exception as e:
        print(f"Error generating chat response: {str(e)}")
        yield "I apologize, but I encountered an error processing your question. Please try again."
