"""일상 회화만 생성. 중·고등은 assets/word-sources → import_words_from_englishapp.py 사용."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
PUB = ROOT / "public" / "data"

sys.path.insert(0, str(Path(__file__).parent))
from travel_phrases import TRAVEL_PHRASES  # noqa: E402
from youtube_daily_phrases import YOUTUBE_DAILY  # noqa: E402


def log(msg: str) -> None:
    print(msg, flush=True)


def build_travel() -> list[dict]:
    log(f"Building travel ({len(TRAVEL_PHRASES)} phrases)...")
    return [
        {"word": phrase, "meaning": meaning, "example": ex, "exampleKo": exko}
        for phrase, meaning, ex, exko in TRAVEL_PHRASES
    ]


def build_daily() -> list[dict]:
    log(f"Building daily ({len(YOUTUBE_DAILY)} phrases)...")
    return [
        {
            "word": phrase,
            "meaning": meaning,
            "example": ex,
            "exampleKo": exko,
        }
        for phrase, meaning, ex, exko in YOUTUBE_DAILY
    ]


def import_middle_high() -> None:
    script = Path(__file__).parent / "import_words_from_englishapp.py"
    log("Importing middle/high from assets/word-sources...")
    subprocess.run([sys.executable, str(script)], check=True)


def main() -> None:
    import_middle_high()

    for name, data in (
        ("dailyConversation.json", build_daily()),
        ("travelConversation.json", build_travel()),
    ):
        payload = json.dumps(data, ensure_ascii=False, indent=2)
        DATA.mkdir(parents=True, exist_ok=True)
        PUB.mkdir(parents=True, exist_ok=True)
        (DATA / name).write_text(payload, encoding="utf-8")
        (PUB / name).write_text(payload, encoding="utf-8")
        log(f"Wrote {name}: {len(data)} -> src/data + public/data")
    log("Done!")


if __name__ == "__main__":
    main()
