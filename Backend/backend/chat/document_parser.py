import io
import json
import os
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path


MAX_ATTACHMENTS = int(os.getenv("MAX_ATTACHMENTS", "4"))
MAX_ATTACHMENT_SIZE_MB = int(os.getenv("MAX_ATTACHMENT_SIZE_MB", "8"))
MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024
MAX_EXTRACTED_TEXT_CHARS = int(os.getenv("MAX_EXTRACTED_TEXT_CHARS", "14000"))
OCR_DEBUG_DIR = Path(os.getenv("OCR_DEBUG_DIR", "chat/data/ocr_debug"))

ALLOWED_EXTENSIONS = {
    ".txt",
    ".csv",
    ".json",
    ".pdf",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}

WINDOWS_TESSERACT_CANDIDATES = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]


def _truncate(text: str) -> str:
    cleaned = (text or "").strip()
    if len(cleaned) <= MAX_EXTRACTED_TEXT_CHARS:
        return cleaned
    return cleaned[:MAX_EXTRACTED_TEXT_CHARS].rstrip() + "\n...[truncated]"


def _extract_text_file(content: bytes) -> str:
    for enc in ("utf-8", "utf-16", "latin-1"):
        try:
            return content.decode(enc)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="ignore")


def _extract_docx(content: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        raw_xml = archive.read("word/document.xml")
    root = ET.fromstring(raw_xml)
    paragraphs = []
    for paragraph in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
        texts = [
            node.text
            for node in paragraph.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t")
            if node.text
        ]
        if texts:
            paragraphs.append("".join(texts))
    return "\n".join(paragraphs)


def _extract_pdf(content: bytes) -> str:
    try:
        from pypdf import PdfReader  # type: ignore
    except ModuleNotFoundError:
        return ""

    reader = PdfReader(io.BytesIO(content))
    chunks = []
    for page in reader.pages:
        try:
            chunks.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(chunks)


def _extract_image_ocr(content: bytes) -> str:
    try:
        from PIL import Image  # type: ignore
        import pytesseract  # type: ignore
    except ModuleNotFoundError:
        return ""

    configured_cmd = os.getenv("TESSERACT_CMD", "").strip()
    if configured_cmd and os.path.exists(configured_cmd):
        pytesseract.pytesseract.tesseract_cmd = configured_cmd
    else:
        for candidate in WINDOWS_TESSERACT_CANDIDATES:
            if os.path.exists(candidate):
                pytesseract.pytesseract.tesseract_cmd = candidate
                break

    image = Image.open(io.BytesIO(content))
    return pytesseract.image_to_string(image)


def parse_uploaded_attachments(files):
    if len(files) > MAX_ATTACHMENTS:
        return {
            "ok": False,
            "error": f"You can upload up to {MAX_ATTACHMENTS} files at a time.",
        }

    extracted_docs = []
    extracted_details = []
    used_files = []
    warnings = []

    for uploaded in files:
        name = (uploaded.name or "file").strip()
        ext = os.path.splitext(name.lower())[1]
        if ext not in ALLOWED_EXTENSIONS:
            return {
                "ok": False,
                "error": f"Unsupported file type for '{name}'.",
            }

        if uploaded.size and uploaded.size > MAX_ATTACHMENT_SIZE_BYTES:
            return {
                "ok": False,
                "error": f"'{name}' exceeds {MAX_ATTACHMENT_SIZE_MB}MB size limit.",
            }

        content = uploaded.read()
        uploaded.seek(0)

        text = ""
        extractor_used = ""
        try:
            if ext in {".txt", ".csv"}:
                text = _extract_text_file(content)
                extractor_used = "plain_text"
            elif ext == ".json":
                parsed = json.loads(_extract_text_file(content))
                text = json.dumps(parsed, indent=2)
                extractor_used = "json_parse"
            elif ext == ".docx":
                text = _extract_docx(content)
                extractor_used = "docx_xml"
            elif ext == ".pdf":
                text = _extract_pdf(content)
                extractor_used = "pdf_native"
                if not text.strip():
                    warnings.append(f"Could not extract text from '{name}'. Install `pypdf` or upload a text-based file.")
            elif ext in {".png", ".jpg", ".jpeg", ".webp"}:
                text = _extract_image_ocr(content)
                extractor_used = "tesseract_local"
                if not text.strip():
                    warnings.append(
                        f"Could not OCR '{name}'. Install/configure `pillow` + `pytesseract`."
                    )
        except Exception as exc:
            warnings.append(f"Could not process '{name}': {exc.__class__.__name__}.")
            text = ""
            extractor_used = "error"

        used_files.append(name)
        normalized_text = _truncate(text) if text.strip() else ""
        extracted_details.append(
            {
                "name": name,
                "extractor": extractor_used or "unknown",
                "chars": len(normalized_text),
                "text": normalized_text,
            }
        )
        if text.strip():
            extracted_docs.append(
                {
                    "name": name,
                    "text": normalized_text,
                }
            )

    return {
        "ok": True,
        "used_files": used_files,
        "extracted_docs": extracted_docs,
        "extracted_details": extracted_details,
        "warnings": warnings,
    }


def persist_ocr_debug_output(*, session_id, user_id, extracted_details, warnings):
    OCR_DEBUG_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    base_name = f"session{session_id}_user{user_id}_{timestamp}"
    json_path = OCR_DEBUG_DIR / f"{base_name}.json"
    txt_path = OCR_DEBUG_DIR / f"{base_name}.txt"

    payload = {
        "session_id": session_id,
        "user_id": user_id,
        "created_at": datetime.now().isoformat(),
        "warnings": warnings,
        "files": extracted_details,
    }

    with json_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    chunks = []
    for item in extracted_details:
        chunks.append(
            "\n".join(
                [
                    f"FILE: {item.get('name', '')}",
                    f"EXTRACTOR: {item.get('extractor', '')}",
                    f"CHARS: {item.get('chars', 0)}",
                    "TEXT:",
                    item.get("text", "") or "(empty)",
                    "-" * 80,
                ]
            )
        )
    if warnings:
        chunks.append("WARNINGS:\n" + "\n".join(warnings))

    with txt_path.open("w", encoding="utf-8") as f:
        f.write("\n\n".join(chunks))

    return str(json_path), str(txt_path)
