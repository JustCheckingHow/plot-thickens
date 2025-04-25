from agents import Agent
from .utils import insert_comment
from typing import Callable


class StyleGuard(Agent):
    def __init__(self, style_prompt: str, callback: Callable):
        super().__init__()
        self.style_prompt = style_prompt
        self.prompt = """ You are a style inspector. You need to make sure that the text adheres to the style guide.
You will be given a style guide and a text. If, and only if, the text does not adhere to the style guide, you need to insert a comment into the text explaining the issue.
"""
        self.agent = Agent(
            name="Style Inspector",
            tools=[insert_comment(callback)],
            instructions=self.prompt,
            model="o3-mini"
        )

    def inspect_style(self, text: str) -> str:
        return self.agent.run(text)