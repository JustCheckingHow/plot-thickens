def chunk_text(text: str, chunk_size: int = 10000, overlap: int = 0):
    """
    Generator that divides text into chunks of specified size with optional overlap.

    Args:
        text: The input text to be chunked
        chunk_size: The maximum size of each chunk
        overlap: The number of characters to overlap between chunks (default: 0)

    Yields:
        Chunks of text of size chunk_size (or smaller for the last chunk)
    """
    text_length = len(text)
    start = 0

    while start < text_length:
        end = min(start + chunk_size, text_length)
        yield text[start:end]
        start = end - overlap if overlap > 0 else end
