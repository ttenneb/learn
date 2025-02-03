# config.py
import os
from dotenv import load_dotenv

load_dotenv()  # Load .env file if present

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MODEL_NAME = "o1-mini"
ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022"
TEMPERATURE = 1
