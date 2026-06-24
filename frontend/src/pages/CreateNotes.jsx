import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flashcardAPI } from '../services/api';

const CreateNotes = () => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadingMessages = [
    "Analyzing your study notes using spaCy...",
    "Extracting named entities and grammatical concepts...",
    "Embedding sentences with Sentence-Transformers...",
    "Ranking key concepts by semantic centrality...",
    "Generating active recall questions...",
    "Structuring and saving your new flashcards..."
  ];

  // Increment loading steps to keep user updated on NLP status
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prevStep) => (prevStep + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 3) {
      setError('Please provide a descriptive title (at least 3 characters).');
      return;
    }

    if (notes.trim().length < 50) {
      setError('Please paste more notes content (at least 50 characters) so the NLP models can extract key information.');
      return;
    }

    setLoading(true);
    try {
      const res = await flashcardAPI.generate(title, notes);
      // Retrieve the generated set ID from the response
      const setId = res.data.set.id;
      navigate(`/sets/${setId}`);
    } catch (err) {
      console.error("Flashcard generation failed:", err);
      setError(
        err.response?.data?.detail || 
        'Failed to generate flashcards. Please try again with different notes or verify your backend is running.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 animate-fade-in">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="glass-card p-5">
            <h2 className="fw-bold text-light mb-2">⚡ Generate Flashcards from Notes</h2>
            <p className="text-secondary mb-4">
              Paste your lectures, textbook summaries, or study notes. SmartFlash's local AI engine will process them into question-answer pairs.
            </p>

            {error && (
              <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-20 text-danger" role="alert">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-5">
                <div className="glow-spinner mb-4 mx-auto"></div>
                <h4 className="fw-bold text-light mb-2">Running Local NLP Engine</h4>
                <p className="text-secondary animate-pulse" style={{ fontSize: '1.1rem' }}>
                  {loadingMessages[loadingStep]}
                </p>
                <div className="progress mx-auto mt-4" style={{ maxWidth: '350px', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ 
                      width: `${((loadingStep + 1) / loadingMessages.length) * 100}%`,
                      background: 'var(--primary-glow)',
                      transition: 'width 0.5s ease-in-out'
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label text-secondary small fw-bold">SET TITLE</label>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="e.g., Biology Chapter 3: Photosynthesis"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-secondary small fw-bold">STUDY NOTES</label>
                  <textarea
                    className="form-control glass-input"
                    rows="12"
                    placeholder="Paste notes here (at least 50 characters). For example: 
Photosynthesis is the process by which plants make food. It occurs in the chloroplasts. Chlorophyll absorbs sunlight. Carbon dioxide and water are converted into glucose and oxygen."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                  ></textarea>
                  <div className="form-text text-secondary mt-2">
                    Tip: Provide well-structured sentences. Our NLP models rank sentences based on entity density and grammar definitions to generate clear questions.
                  </div>
                </div>

                <div className="d-flex gap-3 justify-content-end mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="btn btn-outline-glass"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary-glow"
                  >
                    ⚡ Start Generation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNotes;
