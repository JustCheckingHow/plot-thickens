from agents import function_tool
from typing_extensions import TypedDict
from typing import Callable

class InsertComment(TypedDict):
    text: str
    comment: str
    position: int


def insert_comment(callback: Callable) -> Callable:
    @function_tool
    def _inner(comment: InsertComment) -> str:
        """
        Insert a comment into the text at the given position.

        Args:
            text: The text to insert the comment into.
            comment: The comment to insert.
            position: The position to insert the comment at.

        Returns:
            The text with the comment inserted.
        """
        return callback(
            comment["text"],
            comment["text"][: comment["position"]]
            + f"{{{comment['comment']}}}"
            + comment["text"][comment["position"] :]
        )
    return _inner