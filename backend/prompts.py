TOPIC_GENERATION_PROMPT = """
Generate a detailed, comprehensive, and accurate table of contents for an Introduction to {subject} Text Book. Only include topics within {subject}, avoiding any indirectly related subjects or applications. Each topic/subtopic should be a specific concept. Include a short introduction only touching on motivations, formalism, and historical context. Do not include chapter numbers in the table of contents. 

Assign a difficulty score to each chapter and subtopic on a standardized scale from 0 to 1, where the scale is normalized across all subjects to ensure comparability. The difficulty scores should reflect the relative complexity and prerequisite nature of each topic within and across different subjects (e.g., Algebra I topics might range lower on the scale, whereas Quantum Field Theory topics would be higher). Estimate these scores based on average assumed difficulty without overthinking it.

Ensure your response follows this **EXACT** JSON structure:

{{
  "{subject}": {{
    "Introduction to {subject}": {{
      "subtopics": [{{"subtopic": "topic1", "difficulty": 0.1}}, {{"subtopic": "topic2", "difficulty": 0.2}}],
      "difficulty": 0.1
    }},
    "Chapter Name": {{
      "subtopics": [{{"subtopic": "topic1", "difficulty": 0.3}}, {{"subtopic": "topic2", "difficulty": 0.4}}],
      "difficulty": 0.2
    }}
  }}
}}

NO LaTeX code in any of the topics or subtopics.

NO nonspecific chapters or subtopics like "Advanced Topics in {subject}", or "Examples of ...", "Applications of ...", "Advanced ..." or "Conclusion".

Extensively and exhaustively outline all concepts, include detailed chapters on both advanced and fundamental concepts in {subject}. Order topics in a logical sequence, ensuring that each topic is a prerequisite for the next.
"""

SUBJECT_CLASSIFICATION_PROMPT = """Given the following question and list of subjects, determine which subjects are most relevant to answering the question.
Return your response as a JSON array of subject names. Choose only from the provided subjects.

Question: {question}
Available Subjects: {subjects_list}

Response format example: ["Mathematics", "Physics"]"""

TOPIC_CLASSIFICATION_PROMPT = """Given the following question and a list of topics from {subject}, determine which topics are most relevant to answering the question.
Return your response as a JSON array of topic names. Choose only from the provided topics.

Question: {question}
Available Topics: {topics_list}

Response format example: ["Vectors", "Vector Operations"]"""

TITLE_GENERATION_PROMPT = """Generate a concise title (maximum 4 words) for the following question or conversation.
The title should be descriptive but brief, focusing on the main concept or topic.

Question or Content: {text}

Return your response as a JSON string with a single "title" key.
Response format example: {{"title": "Matrix Vector Multiplication"}}"""

CHAT_JSON_RESPONSE_PROMPT = """
You are a tutor who adapts responses according to the user's knowledge context.

Knowledge context:
{knowledge_context}

The user's question is provided as input, and you must return an EXACT JSON object
with a single key, "response", containing your answer.

For example:
{{
  "response": "... your explanation here ..."
}}

Keep explanations {detail_level} and use {terminology_level} terminology.

User Question: {input}"""
"""

# Exmaple
# TOPIC_GENERATION_PROMPT = """
# Generate a detailed, comprehensive, and accurate table of contents for a Introduction to Linear Algebra Text Book. Only include topics within Linear Algebra, avoiding any indirectly related subjects or applications. Avoid unpsecific chapters like "Advanced Topics in Linear Algebra" or "Conclusion". Include a short introduction only touchings on motivations, formulaism, and historical context. Do not include chapter numbers in the table of contents.




# Ensure your response follows this **EXACT** JSON structure:




# {{
#   "Linear Algebra": {{
#     "Introduction to Linear Algebra": {{
#       "subtopics": ["topic1", "topic2", ...]
#     }},
#     "Chapter Name": {{
#       "subtopics": ["topic1", "topic2", ...]
#     }}
#   }}
# }}

# No LaTeX code in any of the topics or subtopics.

# Extensively and exhaustively outline all concepts, include detailed chapters on both advanced and fundamental concepts in {subject}. Order topics in a logical sequence, ensuring that each topic is a prerequisite for the next.
# """








