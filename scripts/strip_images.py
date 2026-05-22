"""Remove image fields from word JSON and delete word images folder."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

for folder in (ROOT / "src" / "data", ROOT / "public" / "data"):
    if not folder.exists():
        continue
    for path in folder.glob("*.json"):
        data = json.loads(path.read_text(encoding="utf-8"))
        for item in data:
            item.pop("image", None)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Stripped {path.name}: {len(data)} items")

img_dir = ROOT / "public" / "images" / "words"
if img_dir.exists():
    shutil.rmtree(img_dir)
    print(f"Deleted {img_dir}")

print("Done.")
