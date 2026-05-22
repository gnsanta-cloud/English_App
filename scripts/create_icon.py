"""Julia Voca 아이콘 생성 (선택 시안: 04 대각선 분할)."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from create_icon_variants import variant_04  # noqa: E402

SELECTED_VARIANT = 4

ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def create_eng_note_icon(size: int = 1024) -> Image.Image:
    """04 대각선 분할 — 좌상 Julia / 우하 Voca."""
    return variant_04(size)


def create_round_icon(square: Image.Image) -> Image.Image:
    size = square.size[0]
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rounded.paste(square, (0, 0), mask)
    return rounded


def save_android_icons(icon: Image.Image, round_icon: Image.Image) -> None:
    res = ROOT / "android" / "app" / "src" / "main" / "res"
    for folder, px in ICON_SIZES.items():
        out_dir = res / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        icon.resize((px, px), Image.Resampling.LANCZOS).save(out_dir / "ic_launcher.png", "PNG")
        round_icon.resize((px, px), Image.Resampling.LANCZOS).save(
            out_dir / "ic_launcher_round.png", "PNG"
        )

    fg_dir = res / "drawable-nodpi"
    fg_dir.mkdir(parents=True, exist_ok=True)
    fg = icon.resize((432, 432), Image.Resampling.LANCZOS)
    fg.save(fg_dir / "ic_launcher_foreground.png", "PNG")
    xxx = res / "mipmap-xxxhdpi"
    xxx.mkdir(parents=True, exist_ok=True)
    fg.save(xxx / "ic_launcher_foreground.png", "PNG")


def main() -> None:
    icon_1024 = create_eng_note_icon(1024)
    icon_round = create_round_icon(icon_1024)

    public = ROOT / "public"
    public.mkdir(exist_ok=True)
    assets_dir = ROOT / "assets"
    assets_dir.mkdir(exist_ok=True)

    icon_1024.convert("RGB").save(public / "icon-512.png", "PNG")
    icon_512 = icon_1024.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(public / "icon.png", "PNG")
    create_round_icon(icon_512).save(public / "icon-round.png", "PNG")

    icon_1024.save(assets_dir / "app-icon.png", "PNG")
    icon_round.save(assets_dir / "app-icon-round.png", "PNG")

    fav = icon_1024.resize((32, 32), Image.Resampling.LANCZOS)
    fav.save(public / "favicon.png", "PNG")

    save_android_icons(icon_1024, icon_round)

    print(f"Applied icon variant {SELECTED_VARIANT} (diagonal Julia/Voca):")
    print(f"  - {assets_dir / 'app-icon.png'}")
    print(f"  - {public / 'icon.png'}")
    print(f"  - Android mipmap folders")


if __name__ == "__main__":
    main()
