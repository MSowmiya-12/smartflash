FROM python:3.11

# Prevent python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /code

# Install python requirements
COPY requirements.txt .

# Install packages. Use the PyTorch CPU index to download the lightweight CPU version of PyTorch (~120MB instead of 1.2GB GPU version).
# This avoids running out of memory (OOM) on the Render free tier during build/installation.
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Download spaCy NLP model during build
RUN python -m spacy download en_core_web_sm

# Pre-download SentenceTransformer model to cache it in the Docker image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application source
COPY . .

# Expose port
EXPOSE 8000

# Start server using Uvicorn
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
