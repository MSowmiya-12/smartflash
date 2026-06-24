# SMARTFLASH – AI Powered Study Notes to Flashcard Generator

SmartFlash is a complete, production-ready web application that helps students and professionals convert raw study notes into active recall flashcards using local Natural Language Processing (NLP) techniques. 

The application is built using a React (Vite) frontend, a FastAPI (Uvicorn) backend, and MongoDB Atlas.

---

## Architecture Options Chosen

- **AI/ML Engine (Local Open-Source)**: We selected a completely local AI/ML setup using `spaCy` (`en_core_web_sm` for parsing and NER) and `sentence-transformers` (`all-MiniLM-L6-v2` for semantic centrality scoring). This meets the requirement of running 100% locally without external API keys (such as OpenAI, Gemini, or Claude).
- **Database (MongoDB Atlas Cloud)**: Set up a MongoDB Atlas cluster to store users, flashcard sets, and review tracking, ensuring shared state between local testing and production cloud deployments.
- **Containerization (Docker)**: Configured a Dockerfile for the backend to pre-cache the NLP weights inside the image layer, optimizing deployment build speed and resolving dependency compatibility on Render.

---

## Technical Features

- **User Authentication**: Secure user registration and login using JWT tokens and bcrypt password hashing.
- **AI-Powered Generation**: 
  - **spaCy** parsing for sentence boundary detection, Named Entity Recognition (NER), and Part-of-Speech (POS) tagging.
  - **Sentence-Transformers (`all-MiniLM-L6-v2`)** for computing semantic embeddings and ranking sentences based on document centrality.
  - Custom grammatical pattern matching to extract definitions ("X is Y") and entities to construct high-quality questions.
- **Spaced-Repetition Review**: Weighted prioritization logic where flashcards marked "Not Known" are assigned a higher weight (weight = 5) and appear 5x more frequently than cards marked "Known" (weight = 1).
- **Interactive Dashboard**: Aggregated learning metrics, accuracy rates, and card status breakdown (Known, Not Known, New) alongside flashcard sets.
- **Glassmorphic UI**: High-fidelity modern interface styled with Bootstrap 5 and custom CSS transitions (card flip, loader steppers, interactive glows).

---

## Project Structure

```text
smartflash/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py         # Registration, Login, and Me profile endpoints
│   │   │   ├── flashcards.py   # Generation, List, and Review endpoints
│   │   │   └── dashboard.py    # Analytics aggregation endpoint
│   │   ├── models/
│   │   │   └── schemas.py      # Pydantic input/output validation models
│   │   ├── services/
│   │   │   ├── auth_service.py # Bcrypt hashing & JWT token validation dependency
│   │   │   ├── db_service.py   # MongoDB CRUD operations & review queue logic
│   │   │   └── nlp_service.py  # Local NLP sentence-transformers ranking & Q&A generation
│   │   ├── config.py           # Pydantic Settings management
│   │   ├── database.py         # MongoDB connection initialization
│   │   └── main.py             # FastAPI bootstrap, CORS configuration & startup pre-caching
│   ├── .env.example
│   └── Dockerfile              # Multi-stage production container with model pre-caching
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx      # Glassmorphic header navbar
    │   │   └── ProtectedRoute.jsx # Session security router guard
    │   ├── context/
    │   │   └── AuthContext.jsx # Global user auth state manager
    │   ├── pages/
    │   │   ├── Login.jsx       # Secure Login view
    │   │   ├── Register.jsx    # Signup account creation view
    │   │   ├── Dashboard.jsx   # Analytics cards & list of sets
    │   │   ├── CreateNotes.jsx # Study notes paste area with visual progress steps
    │   │   ├── FlashcardList.jsx # View generated cards list
    │   │   └── ReviewSession.jsx # Core flip-card session manager
    │   ├── services/
    │   │   └── api.js          # Axios config with JWT token interceptors
    │   ├── App.jsx             # React Router routing config
    │   ├── index.css           # Custom dark mode glassmorphism styles
    │   └── main.jsx
    ├── .env.example
    ├── vercel.json             # Single Page Routing overrides for Vercel
    └── package.json
```

---

## Local Development Setup

### Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Download spaCy model:
   ```bash
   python -m spacy download en_core_web_sm
   ```
5. Setup your `.env` file:
   - Copy `.env.example` to `.env`
   - Configure your MongoDB connection string (local or Atlas) and JWT secret key.
6. Start the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser to view the interactive API docs.

### Frontend (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Setup your `.env` file:
   - Copy `.env.example` to `.env`
   - Set `VITE_API_URL` to point to the local backend URL: `http://localhost:8000`
4. Start the Vite server:
   ```bash
   npm run dev
   ```
   Access the app at [http://localhost:5173](http://localhost:5173).

---

## Deployment Guides

### Backend → Render Deployment Guide

To deploy the FastAPI backend on **Render** (via Docker to handle local NLP packages and model caching easily):

1. **Create Render Web Service**:
   - Log in to [Render](https://render.com) and click **New** → **Web Service**.
   - Connect your GitHub repository containing the project.
2. **Configure Settings**:
   - **Name**: `smartflash-api`
   - **Environment**: `Docker`
   - **Region**: Select region closest to your users.
   - **Branch**: `main`
   - **Docker Path**: `backend/Dockerfile` (Under Advanced, set Docker Build Context to `backend`)
   - **Plan**: Starter plan is recommended because spaCy and sentence-transformers require ~512MB-1GB RAM to execute smoothly.
3. **Environment Variables**:
   - Under **Environment**, add the following variables:
     - `MONGODB_URI` = `your_mongodb_atlas_connection_string`
     - `JWT_SECRET` = `your_secure_random_string`
     - `ACCESS_TOKEN_EXPIRE_MINUTES` = `60`
     - `PORT` = `8000`
4. **Deploy**: Click **Deploy Web Service**. Render will build the image, pre-cache the NLP models inside the image layer, and launch the service.

### Frontend → Vercel Deployment Guide

To deploy the React client on **Vercel**:

1. **Initialize Vercel Project**:
   - Log in to [Vercel](https://vercel.com) and click **Add New** → **Project**.
   - Import your GitHub repository.
2. **Configure Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - Add the following variable:
     - `VITE_API_URL` = `https://your-backend-render-url.onrender.com`
4. **Deploy**: Click **Deploy**. Vercel will build the React bundles and host them on their global edge network. The `vercel.json` file handles routing automatically so deep paths like `/review/:id` do not return 404s.

---

## License

This project is licensed under the MIT License.
