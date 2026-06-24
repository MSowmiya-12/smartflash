import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-transparent border-bottom border-dark py-3">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <span 
            className="me-2" 
            style={{
              background: 'var(--primary-glow)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.5rem',
              fontWeight: '800'
            }}
          >
            ⚡ SMARTFLASH
          </span>
        </Link>
        
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          {user ? (
            <>
              <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
                <li className="nav-item">
                  <Link className="nav-link text-light px-3" to="/">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-light px-3" to="/create">Generate Cards</Link>
                </li>
              </ul>
              <div className="d-flex align-items-center ms-auto">
                <span className="text-secondary me-3 d-none d-md-inline-block">
                  Hello, <strong className="text-light">{user.name}</strong>
                </span>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-sm btn-outline-glass border-danger text-danger hover-bg-danger"
                  style={{ borderRadius: '8px' }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="d-flex ms-auto">
              <Link to="/login" className="btn btn-outline-glass me-2" style={{ borderRadius: '8px' }}>Login</Link>
              <Link to="/register" className="btn btn-primary-glow" style={{ borderRadius: '8px', padding: '6px 16px' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
