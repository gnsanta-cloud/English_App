"""Build middle/high 1000 words + YouTube daily phrases + images."""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

from wordfreq import top_n_list

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
IMG_DIR = ROOT / "public" / "images" / "words"
CACHE_FILE = Path(__file__).parent / "kr_cache.json"

# Import image helpers from sibling script
import sys

sys.path.insert(0, str(Path(__file__).parent))
from generate_words_images import make_image, slug  # noqa: E402
from youtube_daily_phrases import YOUTUBE_DAILY  # noqa: E402

STOP = {
    "the", "to", "and", "of", "a", "in", "is", "it", "you", "that", "he", "was", "for",
    "on", "are", "as", "with", "his", "they", "at", "be", "this", "from", "i", "have",
    "or", "by", "one", "had", "not", "but", "what", "all", "were", "when", "we", "there",
    "can", "an", "your", "which", "their", "said", "if", "do", "will", "each", "about",
    "how", "up", "out", "them", "then", "she", "many", "some", "so", "her", "would",
    "make", "like", "into", "him", "time", "two", "more", "go", "no", "way", "could",
    "my", "than", "first", "been", "call", "who", "its", "now", "find", "down", "day",
    "did", "get", "come", "made", "may", "part",
}


def load_cache() -> dict[str, str]:
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=0), encoding="utf-8")


def translate_word(word: str, cache: dict[str, str]) -> str:
    key = word.lower()
    if key in cache:
        return cache[key]
    try:
        from deep_translator import GoogleTranslator

        kr = GoogleTranslator(source="en", target="ko").translate(word)
        cache[key] = kr
        time.sleep(0.08)
        if len(cache) % 50 == 0:
            save_cache(cache)
        return kr
    except Exception:
        fallback = f"({word})"
        cache[key] = fallback
        return fallback


def pick_word_lists() -> tuple[list[str], list[str]]:
    raw = top_n_list("en", 8000)
    filtered = [
        w for w in raw
        if w.isalpha() and 3 <= len(w) <= 20 and w.lower() not in STOP
    ]
    middle = filtered[:1000]
    middle_set = set(middle)
    high_pool = [w for w in filtered if w not in middle_set and len(w) >= 5]
    high = high_pool[:1000]
    if len(high) < 1000:
        high = filtered[1000:2000]
    return middle[:1000], high[:1000]


def word_entry(word: str, meaning: str, index: int) -> dict:
    s = slug(word)
    image_path = IMG_DIR / f"{s}.png"
    if not image_path.exists():
        make_image(word, image_path, index)
    return {
        "word": word,
        "meaning": meaning,
        "example": f"Today I learned the word '{word}'.",
        "exampleKo": f"오늘 '{word}' 단어를 배웠어요.",
        "image": f"/images/words/{s}.png",
    }


def phrase_entry(phrase: str, meaning: str, example: str, example_ko: str, index: int) -> dict:
    s = slug(phrase)[:80]
    image_path = IMG_DIR / f"{s}.png"
    if not image_path.exists():
        make_image(phrase[:30], image_path, index)
    return {
        "word": phrase,
        "meaning": meaning,
        "example": example,
        "exampleKo": example_ko,
        "image": f"/images/words/{s}.png",
    }


def main() -> None:
    print("Loading cache...")
    cache = load_cache()
    middle_words, high_words = pick_word_lists()
    print(f"Middle: {len(middle_words)}, High: {len(high_words)}, Daily: {len(YOUTUBE_DAILY)}")

    middle_data = []
    for i, w in enumerate(middle_words):
        if i % 100 == 0:
            print(f"  middle {i}/1000")
        kr = translate_word(w, cache)
        middle_data.append(word_entry(w, kr, i))

    high_data = []
    for i, w in enumerate(high_words):
        if i % 100 == 0:
            print(f"  high {i}/1000")
        kr = translate_word(w, cache)
        high_data.append(word_entry(w, kr, i))

    daily_data = []
    for i, (phrase, meaning, ex, exko) in enumerate(YOUTUBE_DAILY):
        daily_data.append(phrase_entry(phrase, meaning, ex, exko, i))

    save_cache(cache)

    (DATA / "middleSchool.json").write_text(
        json.dumps(middle_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA / "highSchool.json").write_text(
        json.dumps(high_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA / "dailyConversation.json").write_text(
        json.dumps(daily_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("Done! Wrote JSON + images.")


if __name__ == "__main__":
    main()
