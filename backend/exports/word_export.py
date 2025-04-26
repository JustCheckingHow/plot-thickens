from pydantic import BaseModel
import re
import io
from typing import Optional
from docx import Document


class MarkdownToWordRequest(BaseModel):
    markdown_content: str
    filename: Optional[str] = "document"
    author_name: Optional[str] = "PlotDickens"


async def markdown_to_docx_with_comments(request: MarkdownToWordRequest) -> bytes:
    """Converts markdown content to a Microsoft Word document with proper comments"""

    # Regular expression to find comments in the text <comment id=...></comment>
    comment_pattern = re.compile(r"(.*?)<comment id=(.*?)>(.*?)</comment>", re.DOTALL)
    # Regular expression to identify markdown headings
    heading_pattern = re.compile(r"^(#{1,6})\s+(.+?)$", re.MULTILINE)

    # Create a new Word document
    doc = Document()

    # Process the content and extract comments
    remaining_text = request.markdown_content

    while remaining_text:
        # Look for the next comment
        match = comment_pattern.search(remaining_text)

        if not match:
            # No more comments, add the remaining text with heading formatting
            text_to_add = remaining_text
            # Process any headings in the remaining text
            lines = text_to_add.split("\n")
            for line in lines:
                heading_match = heading_pattern.match(line.strip())
                if heading_match:
                    # Get heading level and text
                    level = len(heading_match.group(1))
                    heading_text = heading_match.group(2).strip()
                    # Add as proper Word heading
                    paragraph = doc.add_paragraph(heading_text)
                    paragraph.style = f"Heading {level}"
                else:
                    # Add as normal paragraph if not empty
                    line = line.strip()
                    if line:
                        doc.add_paragraph(line)
            break

        # Add text before the comment with heading formatting
        text_before_comment = match.group(1)
        if text_before_comment:
            lines = text_before_comment.split("\n")
            for line in lines:
                heading_match = heading_pattern.match(line.strip())
                if heading_match:
                    # Get heading level and text
                    level = len(heading_match.group(1))
                    heading_text = heading_match.group(2).strip()
                    # Add as proper Word heading
                    paragraph = doc.add_paragraph(heading_text)
                    paragraph.style = f"Heading {level}"
                else:
                    # Add as normal paragraph if not empty
                    line = line.strip()
                    if line:
                        doc.add_paragraph(line)

        # Add a paragraph with comment
        paragraph = doc.add_paragraph()
        run = paragraph.add_run("⚓")  # Using an anchor symbol as comment marker

        # Add the comment directly using the add_comment method
        comment_id = match.group(2).strip("\"'")  # Remove quotes if present
        comment_text = match.group(3)
        run.add_comment(
            f"{comment_text}", author=request.author_name, initials="A"
        )

        # Continue with text after this comment
        remaining_text = remaining_text[match.end() :]

    # Save the document to a bytes buffer
    docx_buffer = io.BytesIO()
    doc.save(docx_buffer)
    docx_buffer.seek(0)

    # Set up the response with appropriate headers
    filename = f"{request.filename}.docx"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    return docx_buffer.getvalue()


if __name__ == "__main__":
    import asyncio

    # Example markdown content with comments
    markdown_content = """# Sample Document
    
    This is a sample document with some text.
    
    Here is a paragraph with a comment <comment id="123">This is a comment about something important</comment>.
    
    And another paragraph with no comments.
    
    <comment id="456">Another comment</comment> at the beginning of a line.
    """

    # Create the request object
    request = MarkdownToWordRequest(
        markdown_content=markdown_content, filename="example_document"
    )

    # Run the async function and save the result
    async def main():
        docx_bytes = await markdown_to_docx_with_comments(request)

        # Save to a file
        with open("example_document.docx", "wb") as f:
            f.write(docx_bytes)

        print("Document saved as 'example_document.docx'")

    asyncio.run(main())
