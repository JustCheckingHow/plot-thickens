from agents import Agent, Runner
from .utils import insert_comment
from typing import Callable, Optional, Union, Awaitable
import os


class StyleGuard:
    def __init__(self, style_prompt: str, callback: Optional[Union[Callable, Awaitable]] = None):
        super().__init__()
        self.style_prompt = style_prompt
        self.prompt = """ You are a style inspector. You need to make sure that the text adheres to the style guide.
You will be given a style guide and a text. If, and only if, the text does not adhere to the style guide, you need to insert a comment into the text explaining the issue.
Remember that the text could be a background text, so comment only on stark deviations from the style guide. Lack of comments is also an acceptable output.
Don't overlap comments. One fragment of text should not have multiple comments.
"""
        # Only provide the callback if it's specified
        tools = []
        if callback:
            tools = [insert_comment(callback)]
            
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
        input_text = f"Style Guide:\n{self.style_prompt}\n\nText to check:\n{text}\nRemember, comment only on stark deviations from the style guide."
        return await self.runner.run(self.agent, input_text)