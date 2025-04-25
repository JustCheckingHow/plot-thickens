# backend/storyboarding/storyboard_builder.py

from agents import Agent, Runner
from chunking_utils import chunk_text
import os
from loguru import logger

CHARACTER_EXTRACTOR_PROMPT = """
You are an expert at storyboard writer. 
You are given a chapter of a book. 

Your task is to extract all the characters, main or minor ones, and summarize their roles in the chapter.
Remember to cite in verbatim their descriptions, their motivations, and their goals, if those are mentioned 
in the text provided to you.

DO NOT include any characters that are not mentioned in the text.
DO NOT add your judgement of the character's role, or their motivations.
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
            chunk_id += 1
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
