import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, flashcardAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, setsRes] = await Promise.all([
        dashboardAPI.getStats(),
        flashcardAPI.getSets()
      ]);
      setStats(statsRes.data);
      setSets(setsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteSet = async (setId) => {
    if (window.confirm("Are you sure you want to delete this set and all its flashcards? This action cannot be undone.")) {
      try {
        await flashcardAPI.deleteSet(setId);
        // Refresh data
        fetchDashboardData();
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete the set. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '70vh' }}>
        <div className="glow-spinner"></div>
        <p className="mt-3 text-secondary">Analyzing your dashboard statistics...</p>
      </div>
    );
  }

  return (
    <div className="container py-5 animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-bold text-light mb-1">Your Learning Dashboard</h1>
          <p className="text-secondary">Track your progress and review generated flashcards.</p>
        </div>
        <Link to="/create" className="btn btn-primary-glow">
          ⚡ Generate Flashcards
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-20 text-danger" role="alert">
          {error}
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
            <span className="text-secondary small fw-bold uppercase">TOTAL SETS</span>
            <div className="mt-3">
              <h2 className="display-5 fw-bold text-light mb-0">{stats?.totalSets || 0}</h2>
              <span className="text-secondary small">study guides processed</span>
            </div>
          </div>
        </div>
        
        <div className="col-12 col-md-6 col-lg-3">
          <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
            <span className="text-secondary small fw-bold uppercase">TOTAL CARDS</span>
            <div className="mt-3">
              <h2 className="display-5 fw-bold text-light mb-0">{stats?.totalCards || 0}</h2>
              <span className="text-secondary small">cards generated</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
            <span className="text-secondary small fw-bold uppercase">ACCURACY RATE</span>
            <div className="mt-3">
              <h2 className="display-5 fw-bold mb-0" style={{
                background: 'var(--success-glow)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>{stats?.accuracyRate || 0}%</h2>
              <span className="text-secondary small">of reviewed cards known</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="glass-card p-4 h-100">
            <span className="text-secondary small fw-bold uppercase">CARD STATUS</span>
            <div className="mt-3">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-success small fw-bold">● Known</span>
                <span className="text-light small">{stats?.knownCards || 0}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-danger small fw-bold">● Not Known</span>
                <span className="text-light small">{stats?.notKnownCards || 0}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary small fw-bold">● Unreviewed</span>
                <span className="text-light small">{stats?.newCards || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard Sets List */}
      <h3 className="fw-bold mb-4 text-light">Your Flashcard Sets</h3>
      
      {sets.length === 0 ? (
        <div className="glass-card p-5 text-center my-4">
          <span style={{ fontSize: '3.5rem' }}>📇</span>
          <h4 className="fw-bold mt-3 text-light">No Flashcard Sets Yet</h4>
          <p className="text-secondary max-w-500 mx-auto">
            Ready to convert your boring study notes into engaging, AI-generated active recall flashcards? Paste your notes now!
          </p>
          <Link to="/create" className="btn btn-primary-glow mt-2">
            Create First Set
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {sets.map((set) => (
            <div className="col-12 col-md-6 col-lg-4" key={set.id}>
              <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25 px-3 py-2">
                      {set.cardCount} Cards
                    </span>
                    <button 
                      onClick={() => handleDeleteSet(set.id)}
                      className="btn btn-sm btn-link text-secondary hover-text-danger p-0 border-0"
                      title="Delete Set"
                    >
                      🗑️
                    </button>
                  </div>
                  <h4 className="fw-bold text-light mb-2">{set.title}</h4>
                  <p className="text-secondary small">
                    Created on {new Date(set.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <Link 
                    to={`/review/${set.id}`} 
                    className="btn btn-primary-glow flex-grow-1 text-center py-2"
                  >
                    ⚡ Review
                  </Link>
                  <Link 
                    to={`/sets/${set.id}`} 
                    className="btn btn-outline-glass flex-grow-1 text-center py-2"
                  >
                    View Cards
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
