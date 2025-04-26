from agents import Agent, Runner
from .utils import insert_comment
from typing import Callable, Optional, Union, Awaitable


LOGIC_INSPECTOR_PROMPT = """
You're an expert book editor. Your task is to inspect each chapter of the book and 
make sure that the logic of the chapter is correct. 

For example, if character A is mentioned to have died in chapter 1, then it should not be alive in chapter 2.

You will be given a chapter of the book. Your job is to inspect the chapter and make sure that the logic is correct.

You will be given a list of characters and their summaries across multiple chapters.

"""


class LogicInspector:
    def __init__(
        self,
        character_summaries: str,
        location_summaries: str,
        callback: Optional[Union[Callable, Awaitable]] = None,
    ):
        self.character_summaries = character_summaries
        self.location_summaries = location_summaries
        tools = []
        if callback:
            tools = [insert_comment(callback)]

        self.agent = Agent(
            "Logic Inspector", tools=tools, instructions=LOGIC_INSPECTOR_PROMPT
        )
        self.runner = Runner()

    async def inspect_logic(self, text: str) -> str:
        # Combine the style prompt and text for the agent
        input_text = f"Character Summaries:```\n{self.character_summaries}\n```\n\nLocation Summaries:```\n{self.location_summaries}\n```\n\nText to check:\n```\n{text}\n```\nRemember, comment only on stark deviations from the logic."
        return await self.runner.run(self.agent, input_text)
