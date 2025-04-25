from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from writer_agents.style_inspector import StyleGuard
from style_definer import StyleDefiner
from pydantic import BaseModel
from typing import Optional

app = FastAPI()


class BookModel(BaseModel):
    book_text: str
    book_title: str
    book_author: str = Optional[str]


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


@app.post("/api/style-define")
async def style_define(request: Request):
    style_definer = StyleDefiner()
    return await style_definer.define_style(request.json()["book_text"])


@app.post("/api/style-guard")
def style_guard(request: Request):
    style_guard = StyleGuard(
        style_prompt=request.json()["style_prompt"],
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
