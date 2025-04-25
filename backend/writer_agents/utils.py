from agents import function_tool
from typing_extensions import TypedDict
from typing import Callable, Union, Awaitable
import inspect

class InsertComment(TypedDict):
    text: str
    comment: str
    position: int


def insert_comment(callback: Union[Callable, Awaitable]) -> Callable:
    @function_tool
    async def _inner(comment: InsertComment) -> str:
        """
        Insert a comment into the text at the given position.

        Args:
            text: The text to insert the comment into.
            comment: The comment to insert.
            position: The position to insert the comment at.

        Returns:
            The text with the comment inserted.
        """
        formatted_text = comment['comment']
        
        if inspect.iscoroutinefunction(callback):
            return await callback(comment["text"], formatted_text)
        else:
            # For regular callbacks, just call it normally
            return callback(comment["text"], formatted_text)
    
    return _inner