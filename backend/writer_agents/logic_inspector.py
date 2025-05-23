from agents import Agent, Runner
from .utils import insert_comment
from typing import Callable, Optional, Union, Awaitable
from opik import track
import os

LOGIC_INSPECTOR_PROMPT = """
You're an expert book editor. Your task is to inspect each chapter of the book and make sure that the logic of the chapter is correct. 
For example, if character A is mentioned to have died in chapter 1, then it should not be alive in chapter 2.

You will be given a chapter of the book. Your job is to inspect the chapter and make sure that the logic is correct.
You will be given a list of characters and their summaries across multiple chapters.
Don't comment on positive logic - only comment on logical problems with consistency.

Run the comment tool as many times as needed.
"""


class LogicInspector:
    def __init__(
        self,
        character_summary: str,
        location_summary: str,
        callback: Optional[Union[Callable, Awaitable]] = None,
        style: str = ""
    ):
        self.character_summary = character_summary
        self.location_summary = location_summary
        self.style = style
        tools = []
        if callback:
            tools = [insert_comment(callback)]

        self.agent = Agent(
            "Logic Inspector",
            tools=tools,
            instructions=LOGIC_INSPECTOR_PROMPT,
            model=os.environ.get("LOGIC_INSPECTOR_MODEL", "gpt-4o"),
        )
        self.runner = Runner()

    @track(name="inspect_logic")
    async def inspect_logic(self, text: str) -> str:
        # Combine the style prompt and text for the agent
        input_text = f"Character Summaries:```\n{self.character_summary}\n```\n\nLocation Summaries:```\n{self.location_summary}\n```\n\nStyle:```\n{self.style}\n```\n\nText to check:\n```\n{text}\n```\nRemember, comment on all deviations from the logic which are not consistent with the style.\nRemember that the locations can change between chapters."
        return await self.runner.run(self.agent, input_text)
