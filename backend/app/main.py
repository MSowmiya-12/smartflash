import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables
load_dotenv()

from app.api import auth, flashcards, dashboard

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartflash.main")

app = FastAPI(
    title="SmartFlash AI API",
    description="Backend API for AI-Powered Study Notes to Flashcard Generator",
    version="1.0.0"
)

# CORS configuration
# Allow React client running locally or from Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(flashcards.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to SmartFlash AI Powered Study Notes API"
    }

# Explicitly ensure modules load on startup
@app.on_event("startup")
def startup_event():
    logger.info("Initializing models on startup...")
    # Trigger lazy loading of spaCy and Sentence-Transformers on startup
    from app.services.nlp_service import get_nlp_model, get_embedder_model
    try:
        get_nlp_model()
        get_embedder_model()
        logger.info("NLP Models successfully loaded.")
    except Exception as e:
        logger.error(f"Failed to load NLP models on startup: {e}")
