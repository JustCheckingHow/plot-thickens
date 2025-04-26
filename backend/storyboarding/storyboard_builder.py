# backend/storyboarding/storyboard_builder.py

from agents import Agent, Runner
from chunking_utils import chunk_text
from loguru import logger
from opik import track
import os

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
Always include from which chapter the information is from. You must indicate it by writing [chapter: chapter_number] next to that information.
When summarizing combined chapter chunks, make sure you correlate each information with the correct chapter.
Provide your response in the following format:

 ## ** Character Name **
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
When summarizing combined chapter chunks, make sure you correlate each information with the correct chapter.
Always include from which chapter the information is from. You must indicate it by writing [chapter: chapter_number] next to that information.
Provide your response in the following format:

 ## ** Location Name **
 ...
 ** Location Description **
 
 ## ** Location Name **
 ...
"""

TIMELINE_BUILDER_PROMPT = """
You are an expert at storyboard writer. 
You are given a chapter of a book. 

Your task is to extract all the key events in the chapter.
Remember to describe the event in detail. 
DO NOT include any events that are not mentioned in the text.
DO NOT add your judgement of the event's importance or do not add details that are not mentioned in the text.
If given a list of events from chapter chunks, combine them into consistent event summaries.
When summarizing combined chapter chunks, make sure you correlate each information with the correct chapter.
Always include from which chapter the information is from. You must indicate it by writing [chapter: chapter_number] next to that information.
Provide your response in the following format:

 ## ** Event Name **
 ** Chapter Number **
 ...
 ** Event Description **
 ...
"""

PLOTPOINTS_PROMPT = """
You are an expert at storyboard writer. 
You are given a chapter of a book. 

Your task is to extract all the major plotpoints in the chapter.
Remember to describe the plotpoint in detail. 
DO NOT include any plotpoints that are not mentioned in the text.
If given a list of plotpoints from chapter chunks, combine them into consistent plotpoint summaries.
When summarizing combined chapter chunks, make sure you correlate each information with the correct chapter.
Always include from which chapter the information is from. You must indicate it by writing [chapter: chapter_number] next to that information.
Provide your response in the following format:

## ** Plotpoint Name **
** Opened in [chapter: chapter_number] **
** Mentioned in [chapter: chapter_number] **
** Status: [open, closed, or ongoing] **
** Short Description **
...

"""


class StoryBoardBuilder:
    def __init__(self):
        self.model = os.environ.get("STORYBOARD_MODEL", "gpt-4o")

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
            "timeline_builder": Agent(
                "Timeline Builder",
                instructions=TIMELINE_BUILDER_PROMPT,
                model=self.model,
            ),
            "plotpoints_extractor": Agent(
                "Plotpoints Extractor",
                instructions=PLOTPOINTS_PROMPT,
                model=self.model,
            ),
        }
        self.runner = Runner()

    @track(name="timeline_builder")
    async def _build_timeline(self, prompt: str):
        response = await self.runner.run(self.agents["timeline_builder"], prompt)
        return response.final_output

    @track(name="extract_chapter_characters")
    async def _extract_chapter_characters(self, prompt: str):
        response = await self.runner.run(self.agents["character_extractor"], prompt)
        return response.final_output

    @track(name="extract_chapter_locations")
    async def _extract_chapter_locations(self, prompt: str):
        """Extract locations from a chapter"""
        response = await self.runner.run(self.agents["location_extractor"], prompt)
        return response.final_output

    @track(name="extract_chapter_plotpoints")
    async def _extract_chapter_plotpoints(self, prompt: str):
        """Extract plotpoints from a chapter"""
        response = await self.runner.run(self.agents["plotpoints_extractor"], prompt)
        return response.final_output

    async def process_chapter(
        self,
        chapter_number: int,
        chapter_text: str,
        chunk_size: int = 1000,
        overlap: int = 50,
    ):
        """Process a chapter and extract key events"""
        chapter_chunked_data = []
        chunk_id = 0
        for chunk in chunk_text(chapter_text, chunk_size, overlap):
            logger.info(
                f"Processing chunk {chunk_id} of {len(chapter_text) // chunk_size}"
            )
            prompt = f"""
            CHUNK from chapter {chapter_number}:
            {chunk}
            """
            location_chapter_summary = await self._extract_chapter_locations(prompt)
            character_chapter_summary = await self._extract_chapter_characters(prompt)
            timeline_chapter_summary = await self._build_timeline(prompt)
            plotpoints_chapter_summary = await self._extract_chapter_plotpoints(prompt)
            chapter_chunked_data.append(
                {
                    "location_chapter_summary": location_chapter_summary,
                    "character_chapter_summary": character_chapter_summary,
                    "timeline_chapter_summary": timeline_chapter_summary,
                    "plotpoints_chapter_summary": plotpoints_chapter_summary,
                }
            )
            chunk_id += 1
        combined_character_data = ""
        combined_location_data = ""
        combined_timeline_data = ""
        combined_plotpoints_data = ""
        for i, data_element in enumerate(chapter_chunked_data):
            combined_character_data += f"{data_element['character_chapter_summary']}\n"
            combined_location_data += f"{data_element['location_chapter_summary']}\n"
            combined_timeline_data += f"{data_element['timeline_chapter_summary']}\n"
            combined_plotpoints_data += f"{data_element['plotpoints_chapter_summary']}\n"
        logger.info("Synthesizing character and location summaries...")
        summary_character_prompt = f"""
        HERE ARE THE CHAPTER {chapter_number} CHUNKS:
        {combined_character_data}
        """
        summary_character_data = await self._extract_chapter_characters(
            summary_character_prompt
        )

        summary_location_prompt = f"""
        HERE ARE THE CHAPTER {chapter_number} CHUNKS:
        {combined_location_data}
        """
        summary_location_data = await self._extract_chapter_locations(
            summary_location_prompt
        )

        summary_timeline_prompt = f"""
        HERE ARE THE CHAPTER {chapter_number} CHUNKS:
        {combined_timeline_data}
        """
        summary_timeline_data = await self._build_timeline(summary_timeline_prompt)

        summary_plotpoints_prompt = f"""
        HERE ARE THE CHAPTER {chapter_number} CHUNKS:
        {combined_plotpoints_data}
        """
        summary_plotpoints_data = await self._extract_chapter_plotpoints(summary_plotpoints_prompt)
        
        logger.info("Finished processing chapter...")
        return {
            "character_summaries": summary_character_data,
            "location_summaries": summary_location_data,
            "timeline_summaries": summary_timeline_data,
            "plotpoints_summaries": summary_plotpoints_data,
        }

    @track(name="create_character_relationship_graph")
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
        resp = response.final_output
        # remove the ```mermaid and ``` from the response
        resp = resp.replace("```mermaid", "").replace("```", "").replace("’", "'")
        return resp
