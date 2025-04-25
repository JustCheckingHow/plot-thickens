from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from writer_agents.style_inspector import StyleGuard
from style_definer import StyleDefiner
from storyboarding.storyboard_builder import StoryBoardBuilder
from pydantic import BaseModel
from typing import Optional, List
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


class Storyboard(BaseModel):
    character_summaries: str
    location_summaries: str
    character_relationship_graph: Optional[str] = None


class FinalStoryboardRequest(BaseModel):
    chapter_storyboards: List[Storyboard]


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
async def style_define(request: Request) -> str:
    """Returns a string that describes the style of the book in detail"""
    style_definer = StyleDefiner()
    data = await request.json()
    return await style_definer.define_style(data["book_text"])


@app.post("/api/storyboard")
async def storyboard(storyboard_request: FinalStoryboardRequest) -> Storyboard:
    """Returns a Storyboard object that contains the character summaries, location summaries, and character relationship graph for a book"""
    storyboard_builder = StoryBoardBuilder()
    chapter_character_summaries = [
        chapter_storyboard.character_summaries
        for chapter_storyboard in storyboard_request.chapter_storyboards
    ]
    chapter_location_summaries = [
        chapter_storyboard.location_summaries
        for chapter_storyboard in storyboard_request.chapter_storyboards
    ]

    character_summaries = await storyboard_builder._extract_chapter_characters(
        f"Here are the character summaries for the book. Combine them into a single summary: {chapter_character_summaries}"
    )
    location_summaries = await storyboard_builder._extract_chapter_locations(
        f"Here are the location summaries for the book. Combine them into a single summary: {chapter_location_summaries}"
    )
    character_relationship_graph = (
        await storyboard_builder.create_character_relationship_graph(
            character_summaries
        )
    )
    return {
        "character_relationship_graph": character_relationship_graph,
        "character_summaries": character_summaries,
        "location_summaries": location_summaries,
    }


@app.post("/api/chapter-storyboard")
async def chapter_storyboard(chapter_request: ChapterRequest) -> Storyboard:
    """Returns a ChapterStoryboard object that contains the character summaries, location summaries, and character relationship graph for a chapter"""
    storyboard_builder = StoryBoardBuilder()
    chapter_loc_char_summaries = await storyboard_builder.process_chapter(
        chapter_request.chapter_text,
        chapter_request.chunk_size,
        chapter_request.overlap,
    )
    character_relationship_graph = (
        await storyboard_builder.create_character_relationship_graph(
            chapter_loc_char_summaries["character_summaries"]
        )
    )
    return {
        "character_relationship_graph": character_relationship_graph,
        "character_summaries": chapter_loc_char_summaries["character_summaries"],
        "location_summaries": chapter_loc_char_summaries["location_summaries"],
    }


@app.websocket("/api/style-guard")
async def websocket_style_guard(websocket: WebSocket):
    async def send_comment(original_text, text_with_comments):
        await websocket.send_json(
            {"original_text": original_text, "comment": text_with_comments}
        )
        return text_with_comments

    await websocket.accept()

    # Create StyleGuard instance
    style_guard = None

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
                if "text" not in data:
                    await websocket.send_json({"status": "style_prompt_updated"})
                    continue

            # Get text for checking
            text = data.get("text", "")

            if not text:
                await websocket.send_json({"error": "No text provided"})
                continue

            if style_guard is None:
                await websocket.send_json({"error": "Style guard not initialized"})
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
