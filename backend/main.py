from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from writer_agents.style_inspector import StyleGuard

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/style-guard")
def style_guard(request: Request):
    style_guard = StyleGuard(
        style_prompt=request.json()["style_prompt"],
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 