import logging
import certifi
from pymongo import MongoClient
from app.config import settings

logger = logging.getLogger("smartflash.database")

try:
    client = MongoClient(settings.MONGODB_URI, tlsCAFile=certifi.where())
    db = client[settings.DATABASE_NAME]
    # Simple ping check to verify connection
    client.admin.command('ping')
    logger.info("Successfully connected to MongoDB.")
except Exception as e:
    logger.error(f"Error connecting to MongoDB: {e}")
    raise e

# Export collections
users_collection = db["users"]
flashcard_sets_collection = db["flashcard_sets"]
flashcards_collection = db["flashcards"]
