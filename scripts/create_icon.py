"""Julia Voca 아이콘 — 컬러 글자 블록 스타일 (WORD 레퍼런스)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]

ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

BLACK = (15, 15, 20, 255)
WHITE = (248, 250, 252, 255)
YELLOW_BG_TOP = (254, 249, 195, 255)
YELLOW_BG_BOTTOM = (253, 224, 71, 255)

# 레퍼런스 WORD 타일 색 (V/O/C/A)
TILE_COLORS = [
    (52, 211, 153, 255),   # V — 민트
    (236, 72, 153, 255),   # O — 핑크
    (250, 204, 21, 255),   # C — 노랑
    (251, 146, 60, 255),   # A — 오렌지
]

# 2x2 겹침 배치 — WORD와 동일 레이아웃, 글자 VOCA
BLOCKS = [
    ("V", 0.06, 0.10, 0),
    ("O", 0.50, 0.06, 1),
    ("C", 0.04, 0.48, 2),
    ("A", 0.48, 0.44, 3),
]

# 귀여운 두꺼운 폰트 (Comic Sans Bold → Arial Rounded Bold)
CUTE_FONT_PATHS = (
    "C:/Windows/Fonts/comicbd.ttf",
    "C:/Windows/Fonts/ARLRDBD.TTF",
    "C:/Windows/Fonts/comic.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
)


def load_cute_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in CUTE_FONT_PATHS:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_yellow_bg(draw: ImageDraw.ImageDraw, size: int) -> None:
    for y in range(size):
        t = y / max(size - 1, 1)
        r = int(YELLOW_BG_TOP[0] + (YELLOW_BG_BOTTOM[0] - YELLOW_BG_TOP[0]) * t)
        g = int(YELLOW_BG_TOP[1] + (YELLOW_BG_BOTTOM[1] - YELLOW_BG_TOP[1]) * t)
        b = int(YELLOW_BG_TOP[2] + (YELLOW_BG_BOTTOM[2] - YELLOW_BG_TOP[2]) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))


def draw_letter_tile(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    tile: int,
    letter: str,
    border_rgb: tuple[int, int, int, int],
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
) -> None:
    """검은 외곽 + 컬러 테두리 + 흰 중앙 + 글자 (WORD 블록 스타일)."""
    outer = max(6, tile // 14)
    frame = max(10, tile // 9)
    r = max(12, tile // 10)

    # 그림자
    shadow = 5
    draw.rounded_rectangle(
        (x + shadow, y + shadow, x + tile + shadow, y + tile + shadow),
        radius=r,
        fill=(0, 0, 0, 45),
    )

    # 검은 외곽
    draw.rounded_rectangle((x, y, x + tile, y + tile), radius=r, fill=BLACK)

    # 컬러 프레임
    ix, iy = x + outer, y + outer
    isize = tile - outer * 2
    draw.rounded_rectangle(
        (ix, iy, ix + isize, iy + isize),
        radius=max(8, r - 4),
        fill=border_rgb,
    )

    # 흰 내부
    inner = frame
    wx, wy = ix + inner, iy + inner
    wsize = isize - inner * 2
    draw.rounded_rectangle(
        (wx, wy, wx + wsize, wy + wsize),
        radius=max(6, r - 8),
        fill=WHITE,
    )

    # 글자
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = wx + (wsize - tw) // 2 - bbox[0]
    ty = wy + (wsize - th) // 2 - bbox[1]
    draw.text((tx, ty), letter, font=font, fill=BLACK)


def create_julia_blocks_icon(size: int = 1024) -> Image.Image:
    """V O C A 컬러 블록 타일 (WORD 스타일, 귀여운 두꺼운 폰트)."""
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)
    draw_yellow_bg(draw, size)

    tile = int(size * 0.44)
    font = load_cute_font(int(tile * 0.52))

    for letter, rx, ry, ci in BLOCKS:
        x = int(size * rx)
        y = int(size * ry)
        draw_letter_tile(draw, x, y, tile, letter, TILE_COLORS[ci], font)

    return icon


def create_round_icon(square: Image.Image) -> Image.Image:
    sz = square.size[0]
    mask = Image.new("L", (sz, sz), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, sz - 1, sz - 1), fill=255)
    rounded = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
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
    icon_1024 = create_julia_blocks_icon(1024)
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

    print("Created Julia Voca letter-block icons (V-O-C-A, cute bold font):")
    print(f"  - {assets_dir / 'app-icon.png'}")
    print(f"  - {public / 'icon.png'}")
    print(f"  - Android mipmap folders")


if __name__ == "__main__":
    main()
