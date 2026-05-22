"""
EnglishApp (Android) 단어 JSON → 하이브리드 앱 형식으로 변환

원본 (assets/word-sources):
  words_middle.json, words_high.json
  { "words": [ { "id", "e", "k", "p", "ex", "exk", "l" }, ... ] }

출력 (src/data + public/data):
  middleSchool.json, highSchool.json
  [ { "word", "meaning", "example", "exampleKo" }, ... ]
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "word-sources"
OUT_DIR = ROOT / "src" / "data"
PUB_DIR = ROOT / "public" / "data"

MAPPING = {
    "words_middle.json": "middleSchool.json",
    "words_high.json": "highSchool.json",
}


def convert_entry(entry: dict) -> dict:
    return {
        "word": entry["e"],
        "meaning": entry["k"],
        "example": entry["ex"],
        "exampleKo": entry["exk"],
    }


def convert_file(src_name: str, out_name: str) -> int:
    src = SOURCE_DIR / src_name
    if not src.is_file():
        raise FileNotFoundError(f"Missing source: {src}")

    root = json.loads(src.read_text(encoding="utf-8"))
    words = [convert_entry(w) for w in root["words"]]
    payload = json.dumps(words, ensure_ascii=False, indent=2)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUB_DIR.mkdir(parents=True, exist_ok=True)

    (OUT_DIR / out_name).write_text(payload, encoding="utf-8")
    (PUB_DIR / out_name).write_text(payload, encoding="utf-8")
    print(f"{out_name}: {len(words)} words -> src/data + public/data")
    return len(words)


def main() -> None:
    total = 0
    for src, dst in MAPPING.items():
        total += convert_file(src, dst)
    print(f"Done. {total} words total.")


if __name__ == "__main__":
    main()
