from fastapi import FastAPI

app = FastAPI(title="Role-Based Workflow Engine")


@app.get("/health")
def health_check():
    return {"status": "ok"}
