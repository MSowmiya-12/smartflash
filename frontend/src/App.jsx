import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateNotes from './pages/CreateNotes';
import FlashcardList from './pages/FlashcardList';
import ReviewSession from './pages/ReviewSession';

// Helper route wrapper for public auth pages so authenticated users don't see login again
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="d-flex flex-column min-height-vh">
        <Navbar />
        <main className="flex-grow-1">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create" 
              element={
                <ProtectedRoute>
                  <CreateNotes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sets/:setId" 
              element={
                <ProtectedRoute>
                  <FlashcardList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/review/:setId" 
              element={
                <ProtectedRoute>
                  <ReviewSession />
                </ProtectedRoute>
              } 
            />

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
