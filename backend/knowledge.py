from sqlalchemy.orm import Session
from sqlalchemy import func
from models.database import Subject, Topic, Subtopic
from generator import generate_subject_content

def get_empty_subjects(db: Session) -> list:
    """
    Get all subjects that have no associated topics.
    """
    # Subquery to get subjects that have topics
    subjects_with_topics = db.query(Topic.subject_id).distinct()
    
    # Get subjects that don't appear in the above subquery
    empty_subjects = db.query(Subject).filter(
        ~Subject.id.in_(subjects_with_topics)
    ).all()
    
    return empty_subjects

def add_topics_and_subtopics(db: Session, subject_name: str, content: dict):
    """
    Add generated topics and subtopics to the database.
    """
    try:
        # Get the subject from the database
        subject = db.query(Subject).filter(Subject.name == subject_name).first()
        if not subject:
            return False

        # Process each topic in the content
        subject_data = content[subject_name]
        for topic_name, topic_data in subject_data.items():
            # Create new topic
            new_topic = Topic(
                subject_id=subject.id,
                name=topic_name
            )
            db.add(new_topic)
            db.flush()  # Get the topic ID

            # Add subtopics
            for subtopic_data in topic_data['subtopics']:
                new_subtopic = Subtopic(
                    topic_id=new_topic.id,
                    name=subtopic_data['subtopic']
                )
                db.add(new_subtopic)

        db.commit()
        return True
    except Exception as e:
        print(f"Error adding topics for {subject_name}: {str(e)}")
        db.rollback()
        return False

def process_empty_subjects(db: Session):
    """
    Process all subjects without topics by generating content and adding it to the database.
    """
    empty_subjects = get_empty_subjects(db)
    results = []
    
    for subject in empty_subjects:
        try:
            # Generate content for the subject
            content = generate_subject_content(subject.name)
            if content:
                # Add the generated content to the database
                success = add_topics_and_subtopics(db, subject.name, content)
                results.append({
                    "subject": subject.name,
                    "success": success
                })
        except Exception as e:
            print(f"Error processing subject {subject.name}: {str(e)}")
            results.append({
                "subject": subject.name,
                "success": False,
                "error": str(e)
            })
    
    return results
