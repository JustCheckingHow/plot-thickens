from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from writer_agents.style_inspector import StyleGuard
from style_definer import StyleDefiner
from storyboarding.storyboard_builder import StoryBoardBuilder
from pydantic import BaseModel
from typing import Optional
from loguru import logger

app = FastAPI()


class BookModel(BaseModel):
    book_text: str
    book_title: str
    book_author: str = Optional[str]


class ChapterRequest(BaseModel):
    chapter_text: str
    chunk_size: int = 1000
    overlap: int = 0


class ChapterStoryboard(BaseModel):
    character_summaries: str
    location_summaries: str


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
    data = await request.json()
    return await style_definer.define_style(data["book_text"])


@app.post("/api/storyboard")
async def storyboard(chapter_request: ChapterRequest):
    storyboard_builder = StoryBoardBuilder()
    return await storyboard_builder.process_chapter(
        chapter_request.chapter_text, 
        chapter_request.chunk_size, 
        chapter_request.overlap
    )


@app.websocket("/api/style-guard")
async def websocket_style_guard(websocket: WebSocket):
    async def send_comment(original_text, text_with_comments):
        await websocket.send_json(
            {"original_text": original_text, "text_with_comments": text_with_comments}
        )
        return text_with_comments

    await websocket.accept()

    # Receive style prompt once at connection establishment
    initial_data = await websocket.receive_json()
    style_prompt = initial_data.get("style_prompt", "")

    # Create StyleGuard instance
    style_guard = StyleGuard(style_prompt=style_prompt, callback=send_comment)

    try:
        while True:
            # Receive next message
            data = await websocket.receive_json()

            # Check if style_prompt is provided in this message
            if "style_prompt" in data:
                # Update style prompt and recreate StyleGuard instance
                style_prompt = data.get("style_prompt", "")
                style_guard = StyleGuard(
                    style_prompt=style_prompt, callback=send_comment
                )

            # Get text for checking
            text = data.get("text", "")

            if not text:
                await websocket.send_json({"error": "No text provided"})
                continue

            # Process the text
            await style_guard.inspect_style(text)
            
            logger.info("Text processed.")
            await websocket.send_json({"status": "done"})
            
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
