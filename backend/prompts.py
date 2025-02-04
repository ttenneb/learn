TOPIC_GENERATION_PROMPT = """
Generate a detailed, comprehensive, and accurate table of contents for a Text Book. Avoiding any indirectly related subjects or applications. Each topic/subtopic should be haev a concise, specific concept. Include a short introduction only touching on motivations, formalism, and historical context. Do not include chapter numbers in the table of contents. 

Assign a difficulty score to each chapter and subtopic on a standardized scale from 0 to 1, where the scale is normalized across all subjects to ensure comparability. The difficulty scores should reflect the relative complexity and prerequisite nature of each topic within and across different subjects (e.g., Algebra I topics might range lower on the scale, whereas Quantum Field Theory topics would be higher). Estimate these scores based on average assumed difficulty without overthinking it.

Ensure your response follows this **EXACT** JSON structure:

NO LaTeX code in any of the topics or subtopics.


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


Only include topics within {subject},

NO nonspecific chapters or subtopics like "Advanced Topics in {subject}", or "Examples of ...", "Applications of ...", "Advanced ..." or "Conclusion".

Extensively and exhaustively outline all concepts, include detailed chapters on both advanced and fundamental concepts in {subject}. Order topics in a logical sequence, ensuring that each topic is a prerequisite for the next.
"""

SUBJECT_CLASSIFICATION_PROMPT = """Given the following question and list of subjects, determine which subjects are most relevant to answering the question.
Return your response as a JSON array of subject names. Choose only from the provided subjects.

Response format example: ["Mathematics", "Physics"]

Question: {question}
Available Subjects: {subjects_list}"""

TOPIC_CLASSIFICATION_PROMPT = """Given the following question and a list of topics from {subject}, determine which topics are most relevant to answering the question.
Return your response as a JSON array of topic names. Choose only from the provided topics.

Response format example: ["Vectors", "Vector Operations"]

Question: {question}
Available Topics: {topics_list}"""

SUBTOPIC_CLASSIFICATION_PROMPT = """Given the following question and a list of subtopics from {subject}, determine which subtopics are most relevant to answering the question.

Return your response as a JSON array of subtopic names. Choose only from the provided subtopics. 

Response format example: ["Vector Addition", "Vector Subtraction"]

Question: {question}
Available Subtopics: {subtopics_list}"""


TITLE_GENERATION_PROMPT = """Generate a concise title (maximum 4 words) for the following question or conversation.
The title should be descriptive but brief, focusing on the main concept or topic.

Return your response as a JSON string with a single "title" key.
Response format example: {{"title": "Matrix Vector Multiplication"}}

Question or Content: {text}"""

CHAT_JSON_RESPONSE_PROMPT = """
You are a tutor who adapts responses according to the user's knowledge context.

**STRICT RULES:** 
- **NEVER** use parentheses outside LaTeX.
- **NEVER** format or encase any math, symbols, or variables in parentheses or brackets.
- **EVERY** mathematical expression, symbol, or variable **must** be in LaTeX.
- **EVERY** LaTeX code **must** be enclosed in `$...$` for inline math and `$$...$$` for block math.  
- **DO NOT** use plaintext symbols or notation.

Utilize Markdown for headers and emphasis. Use Heading 1 for topics and Heading 2 for subtopics. **Bold** important terms or concepts.

Knowledge context:  
{knowledge_context}

Keep explanations {detail_level} and use {terminology_level} terminology.

User Question: {input}
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








