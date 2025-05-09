from agents import function_tool
from openai import AsyncOpenAI
from typing_extensions import TypedDict, TYPE_CHECKING
from typing import Callable, List, Union, Awaitable
import inspect
from loguru import logger

if TYPE_CHECKING:
    from ..main import Storyboard


class InsertCommentSuggestion(TypedDict):
    text: str
    comment: str
    suggestion: str = ""


def insert_comment_with_suggestion(callback: Union[Callable, Awaitable]) -> Callable:
    @function_tool
    async def _inner(comment: InsertCommentSuggestion) -> str:
        """
        Insert a comment into the text at the given position.

        Args:
            text: The text to insert the comment into.
            comment: The comment to insert.
            suggestion: Corrected text that fixes the issue. Modify the original text to fix the issue.
        Returns:
            The text with the comment inserted.
        """
        formatted_text = comment["comment"]

        if inspect.iscoroutinefunction(callback):
            return await callback(
                comment["text"], formatted_text, comment["suggestion"]
            )
        else:
            # For regular callbacks, just call it normally
            return callback(comment["text"], formatted_text, comment["suggestion"])

    return _inner


class InsertComment(TypedDict):
    text: str
    comment: str


def insert_comment(callback: Union[Callable, Awaitable]) -> Callable:
    @function_tool
    async def _inner(comment: InsertComment) -> str:
        """
        Insert a comment into the text at the given position.

        Args:
            text: The text to insert the comment into. This should be letter to letter original text, without any paragraph breaks or ellipses.
            comment: The comment to insert.
        Returns:
            The text with the comment inserted.
        """
        formatted_text = comment["comment"]

        if inspect.iscoroutinefunction(callback):
            return await callback(comment["text"], formatted_text)
        else:
            # For regular callbacks, just call it normally
            return callback(comment["text"], formatted_text)

    return _inner


async def get_comment_discussion(comments: List[str], current_storyboard: type["Storyboard"]) -> str:
    """Get model's reply to the comments"""
    comments_oai = []
    for idx, comment in enumerate(comments):
        role = "assistant" if idx % 2 == 0 else "user"
        comments_oai.append({"role": role, "content": comment})
    
    logger.info(f"Comments: {comments}")
    client = AsyncOpenAI()
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": f"""You are a helpful assistant that discusses comments with the user. 
Your objective is to converge to a single comment which will help the user improve the story.
Current Storyboard: {current_storyboard}"""},
            *comments_oai
        ]
    )
    return response.choices[0].message.content