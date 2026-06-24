from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# Auth schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Flashcard request schemas
class FlashcardGenerateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    notes: str = Field(..., min_length=10)

# Review update schema
class FlashcardReviewUpdate(BaseModel):
    card_id: str
    is_known: bool

# Output schemas
class FlashcardOut(BaseModel):
    id: str
    setId: str
    question: str
    answer: str
    status: str  # "Known", "Not Known", or "New"
    weight: int
    createdAt: datetime

class FlashcardSetOut(BaseModel):
    id: str
    userId: str
    title: str
    createdAt: datetime
    cardCount: Optional[int] = 0

# Dashboard statistics schema
class DashboardStats(BaseModel):
    totalSets: int
    totalCards: int
    knownCards: int
    notKnownCards: int
    newCards: int
    accuracyRate: float  # Percentage of known cards
