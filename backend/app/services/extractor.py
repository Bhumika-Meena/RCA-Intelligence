import pymupdf
from fastapi import UploadFile, HTTPException
import io
import re

def normalize_text(text: str) -> str:
    """Clean and normalize whitespace, remove null bytes, and standardize line breaks."""
    if not text:
        return ""
    text = text.replace("\x00", "")
    text = re.sub(r"\r\n|\r", "\n", text)
    # Strip excessive empty lines while preserving paragraph boundaries
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def extract_text_from_pdf_bytes(pdf_bytes: bytes, filename: str = "document.pdf") -> str:
    """
    Extract text content from a PDF byte stream using PyMuPDF.
    If the document contains no extractable text (e.g. scanned image), raises an informative error.
    """
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read PDF file '{filename}'. Ensure it is a valid PDF document."
        )

    extracted_pages = []
    total_pages = len(doc)
    
    if total_pages == 0:
        raise HTTPException(status_code=400, detail="The provided PDF document has zero pages.")

    for page_idx in range(total_pages):
        page = doc.load_page(page_idx)
        page_text = page.get_text("text")
        if page_text.strip():
            extracted_pages.append(f"--- Page {page_idx + 1} ---\n{page_text}")

    full_text = "\n\n".join(extracted_pages)
    normalized = normalize_text(full_text)

    if not normalized or len(normalized) < 20:
        raise HTTPException(
            status_code=422,
            detail=(
                f"The PDF '{filename}' contains no extractable text. Scanned raster PDFs are not supported "
                "by this text-based intake pipeline; please provide a digital text-based PDF or paste the text directly."
            )
        )

    return normalized

async def extract_text_from_upload(file: UploadFile) -> str:
    """Extract and normalize text from an uploaded file (PDF or text)."""
    filename = file.filename or "uploaded_file"
    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if filename.lower().endswith(".pdf") or file.content_type == "application/pdf":
        return extract_text_from_pdf_bytes(content, filename)
    
    # Otherwise treat as plain text / markdown / email
    try:
        decoded = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            decoded = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="File encoding could not be determined. Please upload UTF-8 text or PDF.")

    normalized = normalize_text(decoded)
    if len(normalized) < 10:
        raise HTTPException(status_code=422, detail="Provided text contains fewer than 10 characters.")

    return normalized
