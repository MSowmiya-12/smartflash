import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { flashcardAPI } from '../services/api';

const FlashcardList = () => {
  const { setId } = useParams();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setTitle, setSetTitle] = useState('Study Set');

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        // We get both the set titles and cards
        const [setsRes, cardsRes] = await Promise.all([
          flashcardAPI.getSets(),
          flashcardAPI.getCards(setId, false) // Fetch all, not prioritized for listing
        ]);
        
        // Find current set title
        const currentSet = setsRes.data.find(s => s.id === setId);
        if (currentSet) {
          setSetTitle(currentSet.title);
        }
        
        setCards(cardsRes.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch flashcards for this set.');
        setLoading(false);
      }
    };
    fetchCards();
  }, [setId]);

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '70vh' }}>
        <div className="glow-spinner"></div>
        <p className="mt-3 text-secondary">Loading your flashcards...</p>
      </div>
    );
  }

  return (
    <div className="container py-5 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <Link to="/" className="text-secondary text-decoration-none small fw-bold d-block mb-2">
            ← BACK TO DASHBOARD
          </Link>
          <h1 className="fw-bold text-light mb-1">{setTitle}</h1>
          <p className="text-secondary">Viewing all {cards.length} generated flashcards.</p>
        </div>
        <Link to={`/review/${setId}`} className="btn btn-primary-glow">
          ⚡ Start Review Session
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-20 text-danger" role="alert">
          {error}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="glass-card p-5 text-center">
          <p className="text-secondary">No cards found in this set.</p>
        </div>
      ) : (
        <div className="row g-4">
          {cards.map((card, index) => (
            <div className="col-12" key={card.id}>
              <div className="glass-card p-4">
                <div className="row align-items-center">
                  <div className="col-md-1">
                    <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25 px-2 py-1">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="col-md-5 my-2 my-md-0">
                    <span className="text-secondary small fw-bold d-block uppercase mb-1">QUESTION</span>
                    <p className="mb-0 text-light fw-bold">{card.question}</p>
                  </div>
                  
                  <div className="col-md-4 my-2 my-md-0">
                    <span className="text-secondary small fw-bold d-block uppercase mb-1">ANSWER</span>
                    <p className="mb-0 text-light">{card.answer}</p>
                  </div>
                  
                  <div className="col-md-2 text-md-end mt-2 mt-md-0">
                    <span className={`badge ${
                      card.status === 'Known' 
                        ? 'bg-success bg-opacity-15 text-success border-success border-opacity-25' 
                        : card.status === 'Not Known'
                        ? 'bg-danger bg-opacity-15 text-danger border-danger border-opacity-25'
                        : 'bg-secondary bg-opacity-15 text-light border-light border-opacity-15'
                    } border px-3 py-2`}>
                      {card.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardList;
