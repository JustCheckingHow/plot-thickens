# backend/storyboarding/storyboard_builder.py

from agents import Agent, Runner, set_trace_processors
from chunking_utils import chunk_text
from loguru import logger
from opik.integrations.openai.agents import OpikTracingProcessor

import os

set_trace_processors(processors=[OpikTracingProcessor()])
CHARACTER_EXTRACTOR_PROMPT = """
You are an expert at storyboard writer. 
You are given a chapter of a book. 

Your task is to extract all the characters, main or minor ones, and summarize their roles in the chapter.
Remember to cite in verbatim their descriptions, their motivations, and their goals, if those are mentioned 
in the text provided to you. Make sure you include the relationship each character has with other characters.

DO NOT include any characters that are not mentioned in the text.
DO NOT add your judgement of the character's role, or their motivations.
DO NOT write about what doesn't exist -- if there is no relationship between characters, don't mention.
If given a list of characters from chapter chunks, combine them into consistent character summaries.
Provide your response in the follwing format:

# Character
 ** Character Name **
 ...
 ** Character Description **
 ... 
 ** Character Relationships **
<other character name>: <description of the relationship>
"""

LOCATION_EXTRACTOR_PROMPT = """
You are an expert at storyboard writer. 
You are given a chapter of a book. 

Your task is to extract all the locations, main or minor ones, and summarize their roles in the chapter.
Remember to describe the location in detail. 
DO NOT include any locations that are not mentioned in the text.
DO NOT add your judgement of the location's role, or its importance or do not add details that are not mentioned in the text.
If given a list of locations from chapter chunks, combine them into consistent location summaries.

Provide your response in the follwing format:

# Location 
 ** Location Name **
 ...
 ** Location Description **

# Location 
 ** Location Name **
 ...
"""


class StoryBoardBuilder:
    def __init__(self):
        self.model = os.environ.get("STORYBOARD_MODEL", "gpt-4.1-nano")

        self.agents = {
            "character_extractor": Agent(
                "Character Extractor",
                instructions=CHARACTER_EXTRACTOR_PROMPT,
                model=self.model,
            ),
            "location_extractor": Agent(
                "Location Extractor",
                instructions=LOCATION_EXTRACTOR_PROMPT,
                model=self.model,
            ),
        }
        self.runner = Runner()
        self.book_chapters = []
        self.character_summaries = {}
        self.location_summaries = {}
        self.relationship_data = {}

    async def _extract_chapter_characters(self, prompt: str):
        response = await self.runner.run(self.agents["character_extractor"], prompt)
        return response.final_output

    async def _extract_chapter_locations(self, prompt: str):
        """Extract locations from a chapter"""
        response = await self.runner.run(self.agents["location_extractor"], prompt)
        return response.final_output

    async def process_chapter(
        self, chapter_text: str, chunk_size: int = 1000, overlap: int = 0
    ):
        """Process a chapter and extract key events"""
        chapter_chunked_data = []
        chunk_id = 0
        for chunk in chunk_text(chapter_text, chunk_size, overlap):
            logger.info(
                f"Processing chunk {chunk_id} of {len(chapter_text) // chunk_size}"
            )
            prompt = f"""
            HERE IS THE CHAPTER:
            {chunk}
            """
            location_chapter_summary = await self._extract_chapter_locations(prompt)
            character_chapter_summary = await self._extract_chapter_characters(prompt)

            chapter_chunked_data.append(
                {
                    "location_chapter_summary": location_chapter_summary,
                    "character_chapter_summary": character_chapter_summary,
                }
            )
            chunk_id += 1
        combined_character_data = [
            d["character_chapter_summary"] for d in chapter_chunked_data
        ]
        combined_location_data = [
            d["location_chapter_summary"] for d in chapter_chunked_data
        ]

        logger.info("Synthesizing character and location summaries...")
        summary_prompt = f"""
        HERE ARE THE CHAPTER CHUNKS:
        {combined_character_data}
        """
        summary_character_data = await self._extract_chapter_locations(summary_prompt)

        summary_prompt = f"""
        HERE ARE THE CHAPTER CHUNKS:
        {combined_location_data}
        """
        summary_location_data = await self._extract_chapter_characters(summary_prompt)
        logger.info("Finished processing chapter...")
        return {
            "character_summaries": summary_character_data,
            "location_summaries": summary_location_data,
        }

    async def create_character_relationship_graph(self, character_summaries: str):
        """Create a Mermaid graph of relationships between characters from character summaries."""
        # Create a relationship extractor agent
        relationship_agent = Agent(
            "Relationship Extractor",
            instructions="""
You are an expert at analyzing character relationships in stories.
Given character summaries, identify all relationships between characters.
Format your response as a Mermaid graph diagram showing these relationships.

For each relationship:
1. Identify the characters involved
2. Determine the nature of their relationship (friend, enemy, family, etc.)
3. Note any key details about their interactions

Output ONLY valid Mermaid graph syntax in the format:
```mermaid
graph TD
    character1-->|relationship|character2
    character3-->|relationship|character1
    etc.
```
Use character names as node IDs and relationship types as edge labels.
""",
            model=self.model,
        )

        # Prepare the prompt with character summaries
        prompt = f"""
HERE ARE THE CHARACTER SUMMARIES:
{character_summaries}

Create a Mermaid relationship graph based on these summaries.
"""

        # Run the agent and get the response
        response = await self.runner.run(relationship_agent, prompt)

        # Extract the Mermaid graph from the response
        return response.final_output
