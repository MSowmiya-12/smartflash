from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Union, Dict, Any
from app.models.schemas import (
    FlashcardGenerateRequest,
    FlashcardReviewUpdate,
    FlashcardOut,
    FlashcardSetOut
)
from app.services.auth_service import get_current_user
from app.services.nlp_service import generate_flashcards_from_notes
from app.services.db_service import (
    create_flashcard_set,
    get_user_flashcard_sets,
    get_flashcards_by_set,
    update_flashcard_review_status,
    delete_user_flashcard_set
)

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])

@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_cards(
    payload: FlashcardGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generates flashcards from notes and saves the set.
    """
    # 1. Generate Q&A flashcards using local NLP service
    cards = generate_flashcards_from_notes(payload.notes, limit=10)
    
    if not cards:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate any flashcards from the provided notes. Please ensure notes contain clear, descriptive sentences."
        )
        
    # 2. Save the flashcard set and cards to MongoDB Atlas
    result = create_flashcard_set(
        user_id=current_user["id"],
        title=payload.title,
        flashcards_list=cards
    )
    return result

@router.get("", response_model=Union[List[FlashcardSetOut], List[FlashcardOut]])
def get_cards_or_sets(
    setId: str = Query(None),
    prioritized: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    """
    If setId is provided: Returns cards in that set.
    If setId is NOT provided: Returns all flashcard sets for the user.
    """
    if setId:
        return get_flashcards_by_set(setId, current_user["id"], prioritized=prioritized)
    else:
        return get_user_flashcard_sets(current_user["id"])

@router.post("/review", response_model=FlashcardOut)
def review_card(
    payload: FlashcardReviewUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Updates the Known / Not Known review status of a flashcard.
    """
    return update_flashcard_review_status(
        card_id=payload.card_id,
        is_known=payload.is_known,
        user_id=current_user["id"]
    )

@router.delete("/{setId}", status_code=status.HTTP_200_OK)
def delete_set(
    setId: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Deletes a flashcard set and its cards.
    """
    success = delete_user_flashcard_set(setId, current_user["id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard set not found or unauthorized to delete"
        )
    return {"message": "Flashcard set deleted successfully"}
