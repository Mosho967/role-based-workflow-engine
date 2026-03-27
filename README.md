# Role-Based Workflow Engine

A configurable workflow engine that models business approval processes as state machines.
Built with FastAPI, PostgreSQL, and React.

## Project Structure

```
role-based-workflow-engine/
├── backend/        # FastAPI application
├── frontend/       # React (Vite) application
└── docs/           # Architecture diagrams and requirements
```

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy, Alembic, PostgreSQL
- **Auth**: JWT (python-jose), bcrypt (passlib)
- **Frontend**: React 18, Vite, Tailwind CSS, Axios
- **Testing**: Pytest

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in your values
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
