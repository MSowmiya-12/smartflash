import logging
import spacy
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re

logger = logging.getLogger("smartflash.nlp")

# Lazy loading of models to optimize startup times
_nlp = None
_embedder = None

def get_nlp_model():
    global _nlp
    if _nlp is None:
        try:
            logger.info("Loading spaCy model...")
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.info("spaCy model 'en_core_web_sm' not found. Downloading...")
            from spacy.cli import download
            download("en_core_web_sm")
            _nlp = spacy.load("en_core_web_sm")
    return _nlp

def get_embedder_model():
    global _embedder
    if _embedder is None:
        logger.info("Loading SentenceTransformer model...")
        # Load lightweight model for deployment compatibility
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder

def clean_text(text: str) -> str:
    """Basic text cleanup."""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_definitions_spacy(doc_sent) -> tuple:
    """
    Tries to parse a sentence to extract a definition.
    Looks for pattern 'X is Y' or 'X refers to Y'.
    Returns (concept, description) or (None, None).
    """
    concept = None
    description = None
    
    # Common linking verbs / terms
    linking_verbs = ["is", "are", "was", "were", "refers to", "refers", "defined as", "means", "represents"]
    
    sent_text = doc_sent.text.strip()
    
    # 1. Look for grammatical subject and attribute/object relation using dependency parsing
    # Typically, in "Photosynthesis is the process...", "Photosynthesis" is the nsubj, "is" is ROOT, and "process" is attr.
    nsubj = None
    attr_tokens = []
    root_verb = None
    
    for token in doc_sent:
        if token.dep_ in ("nsubj", "nsubjpass") and token.head.lemma_ in ("be", "refer", "mean", "represent"):
            # Get full subject phrase (e.g. "Photosynthesis")
            subj_tokens = [t.text for t in token.subtree]
            nsubj = " ".join(subj_tokens)
            root_verb = token.head
            break
            
    if nsubj and root_verb:
        # Find everything after the verb or the attribute
        # We look for the attribute (attr) or direct object (dobj)
        after_verb = []
        start_collecting = False
        for token in doc_sent:
            if token == root_verb:
                start_collecting = True
                continue
            if start_collecting:
                after_verb.append(token.text_with_ws)
        
        description = "".join(after_verb).strip()
        concept = nsubj
        
        # Clean trailing symbols
        if description.endswith('.'):
            description = description[:-1].strip()
        return concept, description

    # 2. String matching fallback for 'is/are' split
    for verb in [" is ", " are ", " was ", " were ", " refers to ", " is defined as "]:
        if verb in sent_text.lower():
            parts = re.split(re.escape(verb), sent_text, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2 and 3 <= len(parts[0].split()) <= 10:
                # Subject should be relatively short (concept-like), not a whole sentence
                concept = parts[0].strip()
                description = parts[1].strip()
                if description.endswith('.'):
                    description = description[:-1].strip()
                return concept, description
                
    return None, None

def generate_question_from_pattern(sentence: str, nlp) -> dict:
    """
    Attempts to generate a question-answer pair from a sentence using spaCy NLP.
    """
    doc = nlp(sentence)
    
    # Method 1: Definition Extraction
    concept, description = extract_definitions_spacy(doc)
    if concept and description:
        # Capitalize first letter of description
        if len(description) > 0:
            description = description[0].upper() + description[1:]
        return {
            "question": f"What is {concept}?",
            "answer": description
        }
        
    # Method 2: Named Entity based questions
    # E.g., "Albert Einstein developed the theory of relativity."
    # If we find PERSON/ORG/GPE + verb + object, we can replace the entity with Who/What/Where.
    for ent in doc.ents:
        if ent.label_ in ("PERSON", "ORG", "GPE", "DATE"):
            ent_text = ent.text
            # Simple replacement
            if ent.label_ == "PERSON":
                q_word = "Who"
            elif ent.label_ == "DATE":
                q_word = "When"
            elif ent.label_ == "GPE":
                q_word = "Where"
            else:
                q_word = "What"
                
            # Create a Cloze-style or direct Q
            # Replacing entity at the start of sentence
            if sentence.startswith(ent_text):
                rem_sentence = sentence[len(ent_text):].strip()
                # Clean up initial punctuation
                if rem_sentence.startswith(','):
                    rem_sentence = rem_sentence[1:].strip()
                
                # Turn "developed the theory of relativity." -> "Who developed the theory of relativity?"
                if rem_sentence.endswith('.'):
                    rem_sentence = rem_sentence[:-1]
                return {
                    "question": f"{q_word} {rem_sentence}?",
                    "answer": ent_text
                }
                
    # Method 3: Cloze Deletion (Fill in the blanks) fallback for important terms
    # Select the most important noun chunk or entity in the sentence
    noun_chunks = list(doc.noun_chunks)
    if noun_chunks:
        # Sort chunks by length (usually longer chunks are more descriptive, or pick first chunk)
        # Avoid pronouns
        valid_chunks = [nc for nc in noun_chunks if nc.root.pos_ not in ("PRON")]
        if valid_chunks:
            target_chunk = valid_chunks[0].text
            # Replace target chunk with blank
            pattern = re.compile(re.escape(target_chunk), re.IGNORECASE)
            masked_sentence = pattern.sub("________", sentence, count=1)
            return {
                "question": f"Fill in the blank:\n{masked_sentence}",
                "answer": target_chunk
            }
            
    # Absolute Fallback: Turn the sentence itself into a question
    # E.g., "Mitochondria produces ATP energy." -> Q: "Explain: Mitochondria produces ATP energy."
    clean_sent = sentence[:-1] if sentence.endswith('.') else sentence
    return {
        "question": f"Explain the concept: {clean_sent}",
        "answer": "Refer to the concept description above."
    }

def generate_flashcards_from_notes(notes: str, limit: int = 10) -> list:
    """
    Main pipeline for flashcard generation:
    1. Parse text & detect sentences
    2. Rank sentences using sentence-transformers (centrality)
    3. Generate Q&A flashcards using POS/NER rules
    """
    logger.info("Starting flashcard generation pipeline...")
    nlp = get_nlp_model()
    embedder = get_embedder_model()
    
    # 1. Parse text and split sentences
    doc = nlp(notes)
    raw_sentences = [sent.text.strip() for sent in doc.sents]
    
    # Filter sentences (remove very short ones, keep meaningful ones)
    sentences = [s for s in raw_sentences if len(s.split()) >= 5]
    if not sentences:
        return []
        
    logger.info(f"Extracted {len(sentences)} candidate sentences.")
    
    # 2. Rank sentences using SentenceTransformers semantic centrality
    # Embed all sentences
    embeddings = embedder.encode(sentences)
    
    # Calculate the mean document embedding (centroid)
    doc_embedding = np.mean(embeddings, axis=0).reshape(1, -1)
    
    # Calculate cosine similarity of each sentence to the centroid
    similarities = cosine_similarity(embeddings, doc_embedding).flatten()
    
    # Compute keyword/linguistic density to weight the score
    # Sentences with definitions or entities get a boost
    scores = []
    for idx, sent in enumerate(sentences):
        sent_doc = nlp(sent)
        # Boost for named entities (NER)
        ner_boost = 0.1 * min(len(sent_doc.ents), 3)
        # Boost for definition pattern matches
        def_concept, _ = extract_definitions_spacy(sent_doc)
        def_boost = 0.25 if def_concept else 0.0
        
        # Calculate combined score
        score = similarities[idx] + ner_boost + def_boost
        scores.append((score, sent))
        
    # Sort sentences by score in descending order
    scores.sort(key=lambda x: x[0], reverse=True)
    top_sentences = [sent for _, sent in scores[:limit * 2]] # select pool of top sentences
    
    # 3. Generate Flashcards (Q&A Pairs)
    flashcards = []
    seen_questions = set()
    
    for sent in top_sentences:
        card = generate_question_from_pattern(sent, nlp)
        if card:
            # Basic validation
            q_clean = card["question"].strip()
            a_clean = card["answer"].strip()
            
            # Avoid duplicate questions or empty values
            if q_clean and a_clean and q_clean not in seen_questions:
                seen_questions.add(q_clean)
                flashcards.append({
                    "question": q_clean,
                    "answer": a_clean,
                    "status": "New", # Default status
                    "weight": 5      # Default weight for new/unreviewed cards
                })
                
        if len(flashcards) >= limit:
            break
            
    logger.info(f"Successfully generated {len(flashcards)} flashcards.")
    return flashcards
