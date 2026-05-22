"""Create app icon: extract person, composite with ABC text."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "source-character.png"
# Fallback to cursor assets path if not copied
CURSOR_SRC = Path(
    r"C:\Users\hjroh75\.cursor\projects\d-0-Project-01-2026-Cursor-Pjt-English-Hybrid-App\assets"
    r"\c__Users_hjroh75_AppData_Roaming_Cursor_User_workspaceStorage_10e4284d4d47a99eaad0daa1f26476ee_images_shared_image-fdb03654-99a7-498c-8932-cc256baf85a6.png"
)

ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def is_checkerboard_pixel(r: int, g: int, b: int) -> bool:
    """Detect neutral gray checkerboard background."""
    chroma = max(r, g, b) - min(r, g, b)
    avg = (r + g + b) / 3
    return chroma < 22 and 165 < avg < 252


def remove_background(im: Image.Image) -> Image.Image:
    """Remove checkerboard only where connected to image edges (preserves white shirt)."""
    rgba = im.convert("RGBA")
    w, h = rgba.size
    pixels = rgba.load()
    visited = [[False] * w for _ in range(h)]
    stack: list[tuple[int, int]] = []

    def try_push(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not visited[y][x]:
            r, g, b, _ = pixels[x, y]
            if is_checkerboard_pixel(r, g, b):
                stack.append((x, y))

    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while stack:
        x, y = stack.pop()
        if visited[y][x]:
            continue
        r, g, b, _ = pixels[x, y]
        if not is_checkerboard_pixel(r, g, b):
            continue
        visited[y][x] = True
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            try_push(nx, ny)

    return rgba


def crop_to_content(im: Image.Image, padding: int = 8) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - padding)
    y0 = max(0, y0 - padding)
    x1 = min(im.width, x1 + padding)
    y1 = min(im.height, y1 + padding)
    return im.crop((x0, y0, x1, y1))


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def create_icon(person: Image.Image, size: int = 1024) -> Image.Image:
    """Square icon: gradient bg, ABC text left, person right."""
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)

    # Background gradient (indigo -> purple, matches app theme)
    for y in range(size):
        t = y / size
        r = int(79 + (49 - 79) * t)
        g = int(70 + (46 - 70) * t)
        b = int(229 + (129 - 229) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Soft circle highlight behind person
    cx, cy = int(size * 0.72), int(size * 0.52)
    radius = int(size * 0.38)
    for r in range(radius, 0, -1):
        alpha = int(30 * (1 - r / radius))
        draw.ellipse(
            (cx - r, cy - r, cx + r, cy + r),
            fill=(255, 255, 255, alpha),
        )

    # ABC text
    font_size = int(size * 0.28)
    font = load_font(font_size)
    text = "ABC"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    tw = text_bbox[2] - text_bbox[0]
    th = text_bbox[3] - text_bbox[1]
    tx = int(size * 0.08)
    ty = int((size - th) / 2) - int(size * 0.02)

    # Text shadow
    draw.text((tx + 4, ty + 4), text, font=font, fill=(0, 0, 0, 90))
    draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 255))
    # Accent underline bar
    draw.rounded_rectangle(
        (tx, ty + th + int(size * 0.04), tx + tw, ty + th + int(size * 0.04) + int(size * 0.02)),
        radius=int(size * 0.01),
        fill=(245, 158, 11, 255),
    )

    # Scale and place person (right side, feet near bottom)
    pw, ph = person.size
    target_h = int(size * 0.88)
    scale = target_h / ph
    target_w = int(pw * scale)
    person_scaled = person.resize((target_w, target_h), Image.Resampling.LANCZOS)

    px = size - target_w + int(size * 0.06)
    py = size - target_h + int(size * 0.02)
    icon.paste(person_scaled, (px, py), person_scaled)

    return icon


def create_round_icon(square: Image.Image) -> Image.Image:
    """Circular mask for round launcher icons."""
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
        icon.resize((px, px), Image.Resampling.LANCZOS).save(
            out_dir / "ic_launcher.png", "PNG"
        )
        round_icon.resize((px, px), Image.Resampling.LANCZOS).save(
            out_dir / "ic_launcher_round.png", "PNG"
        )

    # Adaptive icon foreground
    fg_dir = res / "drawable-nodpi"
    fg_dir.mkdir(parents=True, exist_ok=True)
    fg = icon.resize((432, 432), Image.Resampling.LANCZOS)
    fg.save(fg_dir / "ic_launcher_foreground.png", "PNG")
    # Also in mipmap-xxxhdpi for @mipmap reference
    xxx = res / "mipmap-xxxhdpi"
    xxx.mkdir(parents=True, exist_ok=True)
    fg.save(xxx / "ic_launcher_foreground.png", "PNG")


def main() -> None:
    src_path = SRC if SRC.exists() else CURSOR_SRC
    if not src_path.exists():
        raise FileNotFoundError(f"Source image not found: {src_path}")

    assets_dir = ROOT / "assets"
    assets_dir.mkdir(exist_ok=True)
    if not SRC.exists():
        import shutil

        shutil.copy2(src_path, SRC)

    raw = Image.open(src_path)
    person = crop_to_content(remove_background(raw))

    icon_1024 = create_icon(person, 1024)
    icon_round = create_round_icon(icon_1024)

    public = ROOT / "public"
    public.mkdir(exist_ok=True)
    icon_1024.convert("RGB").save(public / "icon-512.png", "PNG")
    icon_512 = icon_1024.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(public / "icon.png", "PNG")
    icon_round_512 = create_round_icon(icon_512)
    icon_round_512.save(public / "icon-round.png", "PNG")

    assets_dir.mkdir(exist_ok=True)
    icon_1024.save(assets_dir / "app-icon.png", "PNG")
    icon_round.save(assets_dir / "app-icon-round.png", "PNG")

    save_android_icons(icon_1024, icon_round)

    # Web favicon
    fav = icon_1024.resize((32, 32), Image.Resampling.LANCZOS)
    fav.save(public / "favicon.png", "PNG")

    # Update index.html link
    print("Created icons:")
    print(f"  - {assets_dir / 'app-icon.png'}")
    print(f"  - {public / 'icon.png'}")
    print(f"  - Android mipmap folders")


if __name__ == "__main__":
    main()
