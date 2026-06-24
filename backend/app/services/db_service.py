from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.database import flashcard_sets_collection, flashcards_collection
import random

def create_flashcard_set(user_id: str, title: str, flashcards_list: list) -> dict:
    """
    Creates a new flashcard set in the database and saves its associated flashcards.
    """
    # Create the set doc
    set_doc = {
        "userId": user_id,
        "title": title,
        "createdAt": datetime.utcnow()
    }
    set_result = flashcard_sets_collection.insert_one(set_doc)
    set_id = str(set_result.inserted_id)
    
    # Create flashcards linked to the set
    saved_cards = []
    for card in flashcards_list:
        card_doc = {
            "setId": set_id,
            "question": card["question"],
            "answer": card["answer"],
            "status": card.get("status", "New"),
            "weight": card.get("weight", 5), # Default weight is 5
            "createdAt": datetime.utcnow()
        }
        card_result = flashcards_collection.insert_one(card_doc)
        card_doc["id"] = str(card_result.inserted_id)
        card_doc.pop("_id", None)
        saved_cards.append(card_doc)
        
    set_doc["id"] = set_id
    set_doc.pop("_id", None)
    set_doc["cardCount"] = len(saved_cards)
    return {
        "set": set_doc,
        "cards": saved_cards
    }

def get_user_flashcard_sets(user_id: str) -> list:
    """
    Retrieves all flashcard sets for a user along with the count of cards in each set.
    """
    sets = list(flashcard_sets_collection.find({"userId": user_id}))
    result = []
    for s in sets:
        s_id = str(s["_id"])
        card_count = flashcards_collection.count_documents({"setId": s_id})
        result.append({
            "id": s_id,
            "userId": s["userId"],
            "title": s["title"],
            "createdAt": s["createdAt"],
            "cardCount": card_count
        })
    # Sort by creation date descending
    result.sort(key=lambda x: x["createdAt"], reverse=True)
    return result

def delete_user_flashcard_set(set_id: str, user_id: str) -> bool:
    """
    Deletes a flashcard set and all its associated flashcards.
    Verifies that the set belongs to the user.
    """
    s = flashcard_sets_collection.find_one({"_id": ObjectId(set_id), "userId": user_id})
    if not s:
        return False
        
    # Delete cards first
    flashcards_collection.delete_many({"setId": set_id})
    # Delete set
    flashcard_sets_collection.delete_one({"_id": ObjectId(set_id)})
    return True

def get_flashcards_by_set(set_id: str, user_id: str, prioritized: bool = False) -> list:
    """
    Retrieves all cards in a flashcard set.
    If prioritized is True, we implement weighted retrieval:
    - Standard review returns cards sorted by weight descending (Not Known = 5, Known = 1).
    - Also shuffles cards of similar weights to keep the review session engaging.
    """
    # Verify owner
    s = flashcard_sets_collection.find_one({"_id": ObjectId(set_id), "userId": user_id})
    if not s:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard set not found or unauthorized"
        )
        
    cards = list(flashcards_collection.find({"setId": set_id}))
    
    # Map to schema-friendly format
    formatted_cards = []
    for c in cards:
        formatted_cards.append({
            "id": str(c["_id"]),
            "setId": c["setId"],
            "question": c["question"],
            "answer": c["answer"],
            "status": c.get("status", "New"),
            "weight": c.get("weight", 5),
            "createdAt": c.get("createdAt", datetime.utcnow())
        })
        
    if prioritized:
        # Sort by weight descending, then shuffle within identical weight classes
        weight_5 = [c for c in formatted_cards if c["weight"] == 5]
        weight_1 = [c for c in formatted_cards if c["weight"] == 1]
        
        random.shuffle(weight_5)
        random.shuffle(weight_1)
        
        return weight_5 + weight_1
        
    return formatted_cards

def update_flashcard_review_status(card_id: str, is_known: bool, user_id: str) -> dict:
    """
    Updates the review status and weight of a card.
    Known: weight = 1, status = "Known"
    Not Known: weight = 5, status = "Not Known"
    """
    card = flashcards_collection.find_one({"_id": ObjectId(card_id)})
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard not found"
        )
        
    set_id = card["setId"]
    # Check ownership
    s = flashcard_sets_collection.find_one({"_id": ObjectId(set_id), "userId": user_id})
    if not s:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to update this flashcard"
        )
        
    new_status = "Known" if is_known else "Not Known"
    new_weight = 1 if is_known else 5
    
    flashcards_collection.update_one(
        {"_id": ObjectId(card_id)},
        {"$set": {"status": new_status, "weight": new_weight}}
    )
    
    updated_card = flashcards_collection.find_one({"_id": ObjectId(card_id)})
    return {
        "id": str(updated_card["_id"]),
        "setId": updated_card["setId"],
        "question": updated_card["question"],
        "answer": updated_card["answer"],
        "status": updated_card["status"],
        "weight": updated_card["weight"],
        "createdAt": updated_card["createdAt"]
    }

def get_user_dashboard_stats(user_id: str) -> dict:
    """
    Calculates statistics for a user's dashboard.
    """
    # Get all sets
    sets = list(flashcard_sets_collection.find({"userId": user_id}))
    set_ids = [str(s["_id"]) for s in sets]
    
    total_sets = len(sets)
    if total_sets == 0:
        return {
            "totalSets": 0,
            "totalCards": 0,
            "knownCards": 0,
            "notKnownCards": 0,
            "newCards": 0,
            "accuracyRate": 0.0
        }
        
    # Get all cards linked to these sets
    cards = list(flashcards_collection.find({"setId": {"$in": set_ids}}))
    total_cards = len(cards)
    
    known_cards = sum(1 for c in cards if c.get("status") == "Known")
    not_known_cards = sum(1 for c in cards if c.get("status") == "Not Known")
    new_cards = sum(1 for c in cards if c.get("status") in ("New", None))
    
    accuracy_rate = 0.0
    reviewed_cards = known_cards + not_known_cards
    if reviewed_cards > 0:
        accuracy_rate = round((known_cards / reviewed_cards) * 100, 1)
        
    return {
        "totalSets": total_sets,
        "totalCards": total_cards,
        "knownCards": known_cards,
        "notKnownCards": not_known_cards,
        "newCards": new_cards,
        "accuracyRate": accuracy_rate
    }
