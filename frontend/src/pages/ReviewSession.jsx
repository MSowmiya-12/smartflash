import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { flashcardAPI } from '../services/api';

const ReviewSession = () => {
  const { setId } = useParams();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setTitle, setSetTitle] = useState('Study Set');
  
  // Track statistics for the current session
  const [sessionKnown, setSessionKnown] = useState(0);
  const [sessionNotKnown, setSessionNotKnown] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  const fetchSessionCards = async () => {
    try {
      setLoading(true);
      setCurrentIndex(0);
      setFlipped(false);
      setSessionKnown(0);
      setSessionNotKnown(0);
      setSessionComplete(false);

      // Fetch sets to get the title and prioritized cards (which puts Not Known first)
      const [setsRes, cardsRes] = await Promise.all([
        flashcardAPI.getSets(),
        flashcardAPI.getCards(setId, true) // prioritized = true
      ]);
      
      const currentSet = setsRes.data.find(s => s.id === setId);
      if (currentSet) {
        setSetTitle(currentSet.title);
      }
      
      setCards(cardsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch cards for review. Verify your database connection.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionCards();
  }, [setId]);

  const handleReview = async (isKnown) => {
    const currentCard = cards[currentIndex];
    
    // Optimistically update session counters
    if (isKnown) {
      setSessionKnown(prev => prev + 1);
    } else {
      setSessionNotKnown(prev => prev + 1);
    }

    try {
      // Send review update to backend
      await flashcardAPI.review(currentCard.id, isKnown);
    } catch (err) {
      console.error("Failed to update flashcard review state:", err);
    }

    // Go to next card or complete session
    setFlipped(false);
    
    // Wait for the flip-back animation (0.3s) before transitioning content
    setTimeout(() => {
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setSessionComplete(true);
      }
    }, 300);
  };

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '70vh' }}>
        <div className="glow-spinner"></div>
        <p className="mt-3 text-secondary">Preparing your personalized review session...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="glass-card p-5 max-w-500 mx-auto">
          <h3>No cards to review</h3>
          <p className="text-secondary mb-4">Please generate cards for this set first.</p>
          <Link to="/" className="btn btn-primary-glow">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = ((currentIndex) / cards.length) * 100;

  return (
    <div className="container py-5 animate-fade-in d-flex flex-column align-items-center">
      <div className="w-100 max-w-550 mb-4 d-flex justify-content-between align-items-center">
        <div>
          <Link to={`/sets/${setId}`} className="text-secondary text-decoration-none small fw-bold">
            ← EXIT SESSION
          </Link>
          <h2 className="fw-bold text-light mt-1 mb-0">{setTitle}</h2>
        </div>
        <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25 px-3 py-2">
          Card {currentIndex + 1} of {cards.length}
        </span>
      </div>

      {error && (
        <div className="w-100 max-w-550 alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-20 text-danger" role="alert">
          {error}
        </div>
      )}

      {/* Main Review Session Stepper / Card UI */}
      {!sessionComplete ? (
        <>
          {/* Progress bar */}
          <div className="w-100 max-w-550 progress mb-5" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ 
                width: `${progressPercent}%`,
                background: 'var(--primary-glow)',
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>

          {/* Flashcard wrapper */}
          <div 
            className={`flashcard-wrapper ${flipped ? 'flipped' : ''} mb-5`}
            onClick={() => setFlipped(!flipped)}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <span className="text-secondary small fw-bold uppercase position-absolute top-0 start-0 m-4">QUESTION</span>
                <p className="fs-3 fw-bold text-center px-3">{currentCard?.question}</p>
                <span className="text-secondary small position-absolute bottom-0 m-4">Click Card to Reveal Answer</span>
              </div>
              <div className="flashcard-back">
                <span className="text-secondary small fw-bold uppercase position-absolute top-0 start-0 m-4">ANSWER</span>
                <p className="fs-4 text-center px-3">{currentCard?.answer}</p>
                <span className="text-secondary small position-absolute bottom-0 m-4">Click Card to View Question</span>
              </div>
            </div>
          </div>

          {/* Buttons panel */}
          <div className="w-100 max-w-550 d-flex gap-3">
            <button
              onClick={() => handleReview(false)}
              className="btn btn-danger-glow flex-grow-1 py-3"
              style={{
                borderRadius: '12px',
                background: 'var(--danger-glow)',
                border: 'none',
                color: 'white',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.25)'
              }}
            >
              ❌ Not Known (Weight 5)
            </button>
            <button
              onClick={() => handleReview(true)}
              className="btn btn-success-glow flex-grow-1 py-3"
              style={{
                borderRadius: '12px',
                background: 'var(--success-glow)',
                border: 'none',
                color: 'white',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
              }}
            >
              ✅ Known (Weight 1)
            </button>
          </div>
        </>
      ) : (
        /* Session Completed Summary Dashboard */
        <div className="glass-card p-5 w-100 max-w-550 text-center animate-fade-in mt-4">
          <span style={{ fontSize: '4rem' }}>🏆</span>
          <h2 className="fw-bold text-light mt-3">Session Complete!</h2>
          <p className="text-secondary">Great work! You have finished reviewing all cards.</p>
          
          <div className="row g-3 my-5">
            <div className="col-6">
              <div className="bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 p-3">
                <h3 className="fw-bold text-success mb-1">{sessionKnown}</h3>
                <span className="text-secondary small fw-bold">KNOWN</span>
              </div>
            </div>
            <div className="col-6">
              <div className="bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3 p-3">
                <h3 className="fw-bold text-danger mb-1">{sessionNotKnown}</h3>
                <span className="text-secondary small fw-bold">NOT KNOWN</span>
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-center">
            <button 
              onClick={fetchSessionCards} 
              className="btn btn-outline-glass flex-grow-1"
            >
              🔄 Restart Review
            </button>
            <Link 
              to="/" 
              className="btn btn-primary-glow flex-grow-1"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSession;
