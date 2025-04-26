from agents import Agent, Runner
from .utils import insert_comment_with_suggestion
from typing import Callable, Optional, Union, Awaitable
from opik import track
import os

GRAMMAR_INSPECTOR_PROMPT = """
You're an expert editor with an eye for detail. 
Please check the text for any grammar and punctuation errors.
If you find any errors, please insert a comment into the text explaining the issue.
Lack of comments is also an acceptable output.
Do not allow stupid formulations, unless they are used in a literary style.
Unless used in a literary or purposeful style, do not allow:
- colloquialisms
- non-standard punctuation
- non-standard word forms
- incoherent expressions 
- extreme laudations
- extreme deprecations
- awkard formulations

Be very strict, harsh and picky. It's better to be too sensitive than too lenient.
"""


class GrammarInspector:
    def __init__(self, callback: Optional[Union[Callable, Awaitable]] = None):
        super().__init__()
        self.prompt = GRAMMAR_INSPECTOR_PROMPT
        # Only provide the callback if it's specified
        tools = []
        if callback:
            tools = [insert_comment_with_suggestion(callback)]

        self.agent = Agent(
            "Grammar Inspector",
            tools=tools,
            instructions=self.prompt,
            model=os.environ.get("GRAMMAR_INSPECTOR_MODEL", "gpt-4o"),
        )
        self.runner = Runner()

    # @track(name="inspect_grammar")
    async def inspect_grammar(self, text: str) -> str:
        # Combine the style prompt and text for the agent
        input_text = f"Text to check:\n```\n{text}\n```\n"
        return await self.runner.run(self.agent, input_text, max_turns=30)
