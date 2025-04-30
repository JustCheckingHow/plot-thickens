from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, HTTPException
from writer_agents.style_inspector import StyleGuard
from style_definer import StyleDefiner
from writer_agents.logic_inspector import LogicInspector
from storyboarding.storyboard_builder import StoryBoardBuilder
from writer_agents.grammar_inspector import GrammarInspector
from pydantic import BaseModel
from typing import Optional, List
from loguru import logger
from exports.word_export import markdown_to_docx_with_comments, MarkdownToWordRequest
from exports.word2mkdn import docx_to_markdown_chapters, pdf_to_markdown_chapters
import tempfile
from writer_agents.utils import get_comment_discussion

import base64

app = FastAPI()


class BookModel(BaseModel):
    book_text: str
    book_title: str
    book_author: str = Optional[str]

class ChapterRequest(BaseModel):
    chapter_number: int
    chapter_text: str
    chunk_size: int = 1000
    overlap: int = 0

class Storyboard(BaseModel):
    character_summary: str
    location_summary: str
    timeline_summary: str
    character_relationship_graph: Optional[str] = None
    chapter_number: Optional[int] = None
    plotpoint_summary: str
    
class IncrementalStoryboardRequest(BaseModel):
    chapter_number: int
    chapter_text: str
    chunk_size: int = 1000
    overlap: int = 0
    previous_storyboards: List[Storyboard]

class FinalStoryboardRequest(BaseModel):
    chapter_storyboards: List[Storyboard]

class CommentDiscussionRequest(BaseModel):
    chapter_number: int
    chapter_text: str
    comments: List[str]
    current_storyboard: Storyboard

class CommentDiscussionReply(BaseModel):
    reply: str

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://api.scriber.ink", "https://app.scriber.ink"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/doc-to-style")
async def doc_to_style(file: UploadFile):
    # Create a temporary file to store the uploaded content
    suffix = ".docx"
    process_fn = docx_to_markdown_chapters
    if file.content_type == "application/pdf":
        suffix = ".pdf"
        process_fn = pdf_to_markdown_chapters
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file_path = temp_file.name
        # Write the uploaded file content to the temporary file
        content = await file.read()
        temp_file.write(content)

    try:
        # Convert the docx file to markdown chapters
        markdown_chapters, _ = process_fn(temp_file_path)
        markdown_chapters_str = "\n".join(markdown_chapters)

        style_definer = StyleDefiner()
        style_prompt = await style_definer.define_style(markdown_chapters_str)
        return {"style_prompt": style_prompt}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/doc-to-markdown")
async def doc_to_markdown(file: UploadFile) -> dict:
    # Create a temporary file to store the uploaded content
    suffix = ".docx"
    process_fn = docx_to_markdown_chapters
    logger.info(f"File content type: {file.content_type}")
    if file.content_type == "application/pdf" or file.filename.endswith(".pdf"):
        logger.info("Converting PDF to markdown")
        suffix = ".pdf"
        process_fn = pdf_to_markdown_chapters
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file_path = temp_file.name
        # Write the uploaded file content to the temporary file
        content = await file.read()
        temp_file.write(content)

    try:
        # Convert the docx file to markdown chapters
        markdown_chapters, chapter_names = process_fn(temp_file_path)
        return {"chapters": markdown_chapters, "chapter_names": chapter_names}
    except Exception as e:
        logger.error(f"Error converting document to markdown: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/markdown-to-docx-with-comments")
async def markdown_to_docx_with_comments_endpoint(
    request: MarkdownToWordRequest,
):
    docx_bytes = await markdown_to_docx_with_comments(request)
    return Response(
        content=base64.b64encode(docx_bytes).decode("utf-8"),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename={request.filename}.docx"
        },
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
    chapter_character_summary = ""
    chapter_location_summary = ""
    chapter_timeline_summary = ""
    chapter_plotpoint_summary = ""
    for chapter_storyboard in sorted(
        storyboard_request.chapter_storyboards, key=lambda x: x.chapter_number
    ):
        chapter_character_summary += f"Chapter {chapter_storyboard.chapter_number}:\n{chapter_storyboard.character_summary}\n"
        chapter_location_summary += f"Chapter {chapter_storyboard.chapter_number}:\n{chapter_storyboard.location_summary}\n"
        chapter_timeline_summary += f"Chapter {chapter_storyboard.chapter_number}:\n{chapter_storyboard.timeline_summary}\n"
        chapter_plotpoint_summary += f"Chapter {chapter_storyboard.chapter_number}:\n{chapter_storyboard.plotpoint_summary}\n"

    character_summary = await storyboard_builder._extract_chapter_characters(
        f"Here are the character summaries for the book. Combine them into a single summary: {chapter_character_summary}"
    )
    location_summary = await storyboard_builder._extract_chapter_locations(
        f"Here are the location summaries for the book. Combine them into a single summary: {chapter_location_summary}"
    )
    timeline_summary = await storyboard_builder._build_timeline(
        f"Here are the timeline summaries for the book. Combine them into a single summary: {chapter_timeline_summary}"
    )
    plotpoint_summary = await storyboard_builder._extract_chapter_plotpoints(
        f"Here are the plotpoints summaries for the book. Combine them into a single summary: {chapter_plotpoint_summary}"
    )
    character_relationship_graph = (
        await storyboard_builder.create_character_relationship_graph(
            chapter_character_summary
        )
    )
    return {
        "character_relationship_graph": character_relationship_graph,
        "character_summary": character_summary,
        "location_summary": location_summary,
        "timeline_summary": timeline_summary,
        "plotpoint_summary": plotpoint_summary,
    }


@app.post("/api/chapter-storyboard")
async def chapter_storyboard(chapter_request: ChapterRequest) -> Storyboard:
    """Returns a ChapterStoryboard object that contains the character summaries, location summaries, and character relationship graph for a chapter"""
    storyboard_builder = StoryBoardBuilder()
    chapter_loc_char_summaries = await storyboard_builder.process_chapter(
        chapter_number=chapter_request.chapter_number,
        chapter_text=chapter_request.chapter_text,
        chunk_size=chapter_request.chunk_size,
        overlap=chapter_request.overlap,
    )
    character_relationship_graph = (
        await storyboard_builder.create_character_relationship_graph(
            chapter_loc_char_summaries["character_summary"]
        )
    )
    return {
        "character_relationship_graph": character_relationship_graph,
        "character_summary": chapter_loc_char_summaries["character_summary"],
        "location_summary": chapter_loc_char_summaries["location_summary"],
        "timeline_summary": chapter_loc_char_summaries["timeline_summary"],
        "plotpoint_summary": chapter_loc_char_summaries["plotpoint_summary"],
        "chapter_number": chapter_request.chapter_number,
    }

@app.post("/api/incremental-storyboard")
async def incremental_storyboard(chapter_request: IncrementalStoryboardRequest) -> Storyboard:
    """Returns a ChapterStoryboard object that contains the character summaries, location summaries, and character relationship graph for a chapter"""
    storyboard_builder = StoryBoardBuilder()
    chapter_character_summary = ""
    chapter_location_summary = ""
    chapter_timeline_summary = ""
    chapter_plotpoint_summary = ""
    
    for chapter_storyboard in sorted(
        chapter_request.previous_storyboards, key=lambda x: x.chapter_number
    ):
        chapter_character_summary += f"Chapter {chapter_storyboard.chapter_number}:\n{chapter_storyboard.character_summary}\n"
        chapter_location_summary += f"Chapter {chapter_storyboard.chapter_number}:\n{chapter_storyboard.location_summary}\n"
        chapter_timeline_summary += f"Chapter {chapter_storyboard.chapter_number}:\n{chapter_storyboard.timeline_summary}\n"
        chapter_plotpoint_summary += f"Chapter {chapter_storyboard.chapter_number}:\n{chapter_storyboard.plotpoint_summary}\n"
        
    character_summary = await storyboard_builder._extract_chapter_characters(
        f"Here are the character summaries for the book: ```{chapter_character_summary}```\n This is the new chapter text: ```{chapter_request.chapter_text}```\n Combine the previous character summaries with the new chapter text to create a new character summary for the chapter."
    )
    location_summary = await storyboard_builder._extract_chapter_locations(
        f"Here are the location summaries for the book: ```{chapter_location_summary}```\n This is the new chapter text: ```{chapter_request.chapter_text}```\n Combine the previous location summaries with the new chapter text to create a new location summary for the chapter."
    )
    timeline_summary = await storyboard_builder._build_timeline(
        f"Here are the timeline summaries for the book: ```{chapter_timeline_summary}```\n This is the new chapter text: ```{chapter_request.chapter_text}```\n Combine the previous timeline summaries with the new chapter text to create a new timeline summary for the chapter."
    )
    plotpoint_summary = await storyboard_builder._extract_chapter_plotpoints(
        f"Here are the plotpoints summaries for the book: ```{chapter_plotpoint_summary}```\n This is the new chapter text: ```{chapter_request.chapter_text}```\n Combine the previous plotpoints summaries with the new chapter text to create a new plotpoints summary for the chapter."
    )
    character_relationship_graph = (
        await storyboard_builder.create_character_relationship_graph(
            chapter_character_summary + f"\n\nThis is the new chapter text: ```{chapter_request.chapter_text}```\n"
        )
    )
    return {
        "character_relationship_graph": character_relationship_graph,
        "character_summary": character_summary,
        "location_summary": location_summary,
        "timeline_summary": timeline_summary,
        "plotpoint_summary": plotpoint_summary,
    }
    
@app.post("/api/comment-discussion")
async def comment_discussion(comment_discussion_request: CommentDiscussionRequest) -> CommentDiscussionReply:
    """Returns a CommentDiscussion object that contains the comment discussion for a chapter"""
    return {"reply": await get_comment_discussion(comment_discussion_request.comments, comment_discussion_request.current_storyboard)}

@app.websocket("/api/style-guard")
async def websocket_style_guard(websocket: WebSocket):
    issues_found = False

    async def send_comment(original_text, text_with_comments, suggestion):
        nonlocal issues_found
        issues_found = True
        logger.info(f"Issues found: {text_with_comments} ({original_text})")
        await websocket.send_json(
            {
                "original_text": original_text,
                "comment": text_with_comments,
                "suggestion": suggestion,
            }
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
            issues_found = False
            await style_guard.inspect_style(text)

            logger.info("Text processed.")
            if not issues_found:
                await websocket.send_json({"status": "no_issues_found"})
            await websocket.send_json({"status": "style_done"})

    except WebSocketDisconnect:
        pass


@app.websocket("/api/grammar-inspector")
async def websocket_grammar_inspector(websocket: WebSocket):
    issues_found = False

    async def send_comment(original_text, text_with_comments, suggestion):
        nonlocal issues_found
        issues_found = True
        try:
            await websocket.send_json(
                {
                    "original_text": original_text,
                    "comment": text_with_comments,
                    "suggestion": suggestion,
                }
            )
        except RuntimeError as e:
            # Connection already closed
            logger.info(f"Connection already closed: {e}")
            pass
        return text_with_comments

    await websocket.accept()

    # Create StyleGuard instance
    grammar_inspector = GrammarInspector(callback=send_comment)

    try:
        while True:
            # Receive next message
            data = await websocket.receive_json()

            # Get text for checking
            text = data.get("text", "")

            if not text:
                await websocket.send_json({"error": "No text provided"})
                continue

            # Process the text
            issues_found = False
            await grammar_inspector.inspect_grammar(text)

            logger.info("Text processed.")
            try:
                if not issues_found:
                    await websocket.send_json({"status": "no_issues_found"})
                await websocket.send_json({"status": "done"})
            except RuntimeError as e:
                # Connection already closed
                logger.info(f"Connection already closed: {e}")
                break

    except WebSocketDisconnect:
        pass


@app.websocket("/api/logic-inspector")
async def websocket_logic_inspector(websocket: WebSocket):
    issues_found = False

    async def send_comment(original_text, text_with_comments):
        nonlocal issues_found
        issues_found = True
        logger.info(f"Issues found: {text_with_comments} ({original_text})")
        await websocket.send_json(
            {
                "original_text": original_text,
                "comment": text_with_comments,
            }
        )
        return text_with_comments

    await websocket.accept()

    # Create StyleGuard instance
    logic_inspector = None

    try:
        while True:
            # Receive next message
            data = await websocket.receive_json()

            # Check if style_prompt is provided in this message
            if "character_summary" in data and "location_summary" in data:
                # Update style prompt and recreate StyleGuard instance
                character_summary = data.get("character_summary", "")
                location_summary = data.get("location_summary", "")
                logic_inspector = LogicInspector(
                    character_summary=character_summary,
                    location_summary=location_summary,
                    callback=send_comment,
                )

            # Get text for checking
            text = data.get("text", "")

            if not text:
                if "character_summary" in data and "location_summary" in data:
                    await websocket.send_json({"status": "logic_inspector_initialized", "chapterNumber": data.get("chapter", None)})
                    continue
                else:
                    await websocket.send_json({"error": "No text provided", "chapterNumber": data.get("chapter", None)})
                    continue

            if logic_inspector is None:
                await websocket.send_json({"error": "Logic inspector not initialized", "chapterNumber": data.get("chapter", None)})
                continue

            # Process the text
            await logic_inspector.inspect_logic(text)

            logger.info("Text processed.")

            if not issues_found:
                await websocket.send_json({"status": "no_issues_found", "chapterNumber": data.get("chapter", None)})

            await websocket.send_json({"status": "done", "chapterNumber": data.get("chapter", None)})

    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
