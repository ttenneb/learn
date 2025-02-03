from prompts import TOPIC_GENERATION_PROMPT
from generator import generate_subject_content, classify_question_subjects
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from generator import generate_chat_response, KnowledgeLevel

def test_prompt(subject: str):
    """
    Test the topic generation prompt with a given subject.
    Args:
        subject (str): The subject to generate topics for
    """
    formatted_prompt = TOPIC_GENERATION_PROMPT.format(subject=subject)
    print(formatted_prompt)

def find_hardest_subtopic(data):
    """
    Find the hardest subtopic in the hardest topic.
    Args:
        data (dict): The generated subject content
    Returns:
        tuple: (hardest_topic, hardest_subtopic, difficulty)
    """
    subject = list(data.keys())[0]
    topics = data[subject]
    
    hardest_topic = max(topics.items(), key=lambda x: x[1]['difficulty'])
    hardest_subtopic = max(hardest_topic[1]['subtopics'], key=lambda x: x['difficulty'])
    
    return (hardest_topic[0], hardest_subtopic['subtopic'], hardest_subtopic['difficulty'])

POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "Igloo!23"
POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5432"
POSTGRES_DB = "aichat"
POSTGRES_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
engine = create_engine(POSTGRES_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

if __name__ == "__main__":
    # Example usage
    # data = generate_subject_content("Algorithm Design")
    # print(data)
    
    # topic, subtopic, difficulty = find_hardest_subtopic(data)
    # print(f"\nHardest topic: {topic}")
    # print(f"Hardest subtopic: {subtopic}")
    # print(f"Difficulty score: {difficulty}")

    data  = classify_question_subjects("What is the time complexity of the bubble sort algorithm?", ["Quantum Mechanics", "Linear Algebra", "Calculus", "Computer Science"])
    print(data)

    db = SessionLocal()
    answer = generate_chat_response(
        chat_id=1,
        db_session=db,
        question="What is the best sorting algorithm for large data sets?",
        relevant_subjects=["Computer Science"],
        relevant_topics={"Computer Science": ["Sorting"]},
        subject_knowledge={"Computer Science": KnowledgeLevel.INTERMEDIATE},
        topic_knowledge={"Sorting": KnowledgeLevel.INTERMEDIATE}
    )
    print("Chat Response:", answer)