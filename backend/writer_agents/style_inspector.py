from agents import Agent, Runner
from .utils import insert_comment_with_suggestion
from typing import Callable, Optional, Union, Awaitable
import os

STYLE_GUARD_PROMPT = """ You are a style inspector. You need to make sure that the text adheres to the style guide.
You will be given a style guide and a text. If, and only if, the text does not adhere to the style guide, 
you need to insert a comment into the text explaining the issue.
Remember that the text could be a background text, so comment only on stark deviations from the style guide. 
Lack of comments is also an acceptable output.
Don't overlap comments. If you have more than one comment for a given text fragment, merge them into one comment.
Make sure that the style is consistent throughout the text. If the style is not consistent, comment on it.
Be extremely harsh and strict, but remain professional. 
"""

class StyleGuard:
    def __init__(self, style_prompt: str, callback: Optional[Union[Callable, Awaitable]] = None):
        super().__init__()
        self.style_prompt = style_prompt
        self.prompt = STYLE_GUARD_PROMPT
        # Only provide the callback if it's specified
        tools = []
        if callback:
            tools = [insert_comment_with_suggestion(callback)]
            
        self.agent = Agent(
            "Style Inspector",
            tools=tools,
            instructions=self.prompt,
            # model="o4-mini"
            model=os.environ.get("STYLE_GUARD_MODEL", "gpt-4o")
        )
        self.runner = Runner()

    async def inspect_style(self, text: str) -> str:
        # Combine the style prompt and text for the agent
        input_text = f"Style Guide:```\n{self.style_prompt}\n```\n\nText to check:\n```\n{text}\n```\nRemember, comment only on stark deviations from the style guide - but all deviations are important."
        return await self.runner.run(self.agent, input_text)