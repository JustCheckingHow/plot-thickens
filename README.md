# FastAPI and React Project

This project consists of a FastAPI backend and a React frontend.

## Project Structure

```
├── backend/             # FastAPI backend
│   ├── main.py          # Main application entry point
│   ├── requirements.txt # Python dependencies
│   ├── Dockerfile       # Docker configuration for backend
│   └── README.md        # Backend documentation
│
├── frontend/            # React frontend
│   ├── public/          # Static assets
│   ├── src/             # Source code
│   │   ├── App.jsx      # Main application component
│   │   ├── App.css      # Application styles
│   │   ├── main.jsx     # Application entry point
│   │   └── index.css    # Global styles
│   ├── index.html       # HTML template
│   ├── package.json     # NPM dependencies
│   ├── vite.config.js   # Vite configuration
│   ├── Dockerfile       # Docker configuration for production
│   ├── Dockerfile.dev   # Docker configuration for development
│   ├── nginx.conf       # Nginx configuration for serving the app
│   └── README.md        # Frontend documentation
│
├── docker-compose.yml       # Docker Compose configuration for development
├── docker-compose.prod.yml  # Docker Compose configuration for production
├── .dockerignore            # Files to be ignored by Docker
└── README.md                # This file
```

## Getting Started

### Development with Hot Reload

Run the application in development mode with hot reload:

```bash
# Build and start the containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the containers
docker-compose down
```

With this setup:
- FastAPI backend will automatically reload when code changes
- React frontend uses Vite's hot module replacement
- Frontend code changes will reflect immediately in the browser
- Both backend and frontend code is mounted as volumes in the containers

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Production Deployment

For production deployment, use the production Docker Compose file:

```bash
# Build and start the production containers
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop the containers
docker-compose -f docker-compose.prod.yml down
```

The production setup:
- Builds an optimized React application served by Nginx
- Runs the FastAPI backend without reload for better performance
- Does not use file volumes (uses containerized code only)

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## API Documentation

Once the backend server is running, you can access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc 