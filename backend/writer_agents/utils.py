from agents import function_tool
from typing_extensions import TypedDict
from typing import Callable, Union, Awaitable
import inspect


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
            text: The text to insert the comment into.
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
