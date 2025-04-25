from agents import Agent, Runner
from loguru import logger
import os
from opik import track

STYLE_AGENT_INSTRUCTIONS = """
    You are an experienced book editor. 
    Your task is to consume a book text and define the key characteristics 
    of the style of the book. 

    Pay attention to the following aspects of the book:
    - the tone of the book -- whether it's formal or informal
    - the language used -- whether it's technical or not
    - the structure of the book -- whether it's linear or non-linear
    - level of humor
    - use of metaphors and similes -- whether it's heavy on metaphors and similes or not
    - use of literary devices -- whether it's heavy on literary devices or not
    
    Incldue also any other characteristics of the style of book that you deem important.
    If you detect a style simialrity with one of the well-known artists or books, 
    mention it in your response.
    Do not output judgement about the quality of the book, only analyze the style professionally.
"""


class StyleDefiner:
    def __init__(self):
        self.model = os.getenv("STYLE_DEFINE_MODEL", "gpt-4o")
        self.agent = Agent(
            name="Style Define Agent",
            instructions=STYLE_AGENT_INSTRUCTIONS,
            model=self.model,
        )
        self.runner = Runner()

    @track(name="define_style")
    async def define_style(
        self,
        book_text: str,
        chunk_size: int = 2000,
        max_chunks: int = 5,
    ) -> dict:
        """
        Define the style of a book by processing it in chunks.

        Args:
            book_text: The full text of the book
            chunk_size: Number of words per chunk

        Returns:
            Combined style analysis from all chunks
        """
        # Split the book into chunks
        words = book_text.split()
        chunks = [
            " ".join(words[i : i + chunk_size])
            for i in range(0, min(len(words), chunk_size * max_chunks), chunk_size)
        ]

        # Process each chunk and collect results
        chunk_results = []
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing style of chunk {i+1}/{len(chunks)}...")
            result = await self.runner.run(
                self.agent, f"CHUNK {i+1}/{len(chunks)}:\n\n{chunk}"
            )
            chunk_results.append(result.final_output)

        # Ask the agent to synthesize all results
        logger.info("Synthesizing style results...")
        synthesis_prompt = f"I've analyzed {len(chunks)} chunks of a book separately. Here are the individual style analyses:\n\n"
        for i, result in enumerate(chunk_results):
            synthesis_prompt += f"CHUNK {i+1} ANALYSIS:\n{result}\n\n"
        synthesis_prompt += "Please synthesize these analyses into a unified style definition for the entire book."

        final_result = await self.runner.run(self.agent, synthesis_prompt)
        return final_result.final_output


if __name__ == "__main__":
    import asyncio

    async def main():
        with open("./data/hamlet.txt", "r") as f:
            book_text = f.read()[:10000]
        style_definer = StyleDefiner()
        result = await style_definer.define_style(
            book_text, chunk_size=1000, max_chunks=3
        )
        logger.info(result)

    asyncio.run(main())
