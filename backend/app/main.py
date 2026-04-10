from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, audit, tasks, transitions, workflows

app = FastAPI(title="Role-Based Workflow Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(workflows.router)
app.include_router(tasks.router)
app.include_router(transitions.router)
app.include_router(audit.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
