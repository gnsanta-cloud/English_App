"""영어 단어장 앱 아이콘 생성 (플래시카드 + A, 산뜻한 플랫 스타일)."""
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

PRIMARY = (79, 70, 229, 255)
PRIMARY_LIGHT = (199, 210, 254, 255)
ACCENT = (245, 158, 11, 255)
WHITE = (255, 255, 255, 255)


def load_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = (
        [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ]
        if bold
        else [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
    )
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_gradient_bg(draw: ImageDraw.ImageDraw, size: int) -> None:
    for y in range(size):
        t = y / max(size - 1, 1)
        r = int(238 + (79 - 238) * t)
        g = int(242 + (70 - 242) * t)
        b = int(255 + (229 - 255) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))


def create_vocab_icon(size: int = 1024) -> Image.Image:
    """플래시카드 + A — 영어 단어장 앱 아이콘."""
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(icon)

    draw_gradient_bg(draw, size)

    pad = int(size * 0.1)
    draw.rounded_rectangle(
        (pad, pad, size - pad, size - pad),
        radius=int(size * 0.2),
        fill=(*PRIMARY[:3], 255),
    )

    cx, cy = size // 2, int(size * 0.46)
    cw, ch = int(size * 0.52), int(size * 0.44)
    x0, y0 = cx - cw // 2, cy - ch // 2
    offset = int(size * 0.035)

    # 뒤 카드
    draw.rounded_rectangle(
        (x0 + offset, y0 + offset, x0 + cw + offset, y0 + ch + offset),
        radius=int(size * 0.06),
        fill=PRIMARY_LIGHT,
    )

    # 앞 카드
    draw.rounded_rectangle(
        (x0, y0, x0 + cw, y0 + ch),
        radius=int(size * 0.06),
        fill=WHITE,
        outline=(*PRIMARY[:3], 40),
        width=max(2, size // 256),
    )

    # 카드 상단 라인 (단어장 느낌)
    line_y = y0 + int(ch * 0.18)
    draw.line(
        (x0 + int(cw * 0.15), line_y, x0 + int(cw * 0.85), line_y),
        fill=PRIMARY_LIGHT,
        width=max(3, size // 200),
    )
    draw.line(
        (x0 + int(cw * 0.15), line_y + int(ch * 0.1), x0 + int(cw * 0.7), line_y + int(ch * 0.1)),
        fill=PRIMARY_LIGHT,
        width=max(3, size // 220),
    )

    # 큰 A
    font_a = load_font(int(size * 0.26))
    text = "A"
    bbox = draw.textbbox((0, 0), text, font=font_a)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = cx - tw // 2 - bbox[0]
    ty = cy - th // 2 - bbox[1] + int(size * 0.02)
    draw.text((tx, ty), text, font=font_a, fill=PRIMARY)

    # 하단 abc
    font_sm = load_font(int(size * 0.07), bold=False)
    abc = "abc"
    bbox2 = draw.textbbox((0, 0), abc, font=font_sm)
    tw2 = bbox2[2] - bbox2[0]
    draw.text(
        (cx - tw2 // 2 - bbox2[0], y0 + ch - int(size * 0.11)),
        abc,
        font=font_sm,
        fill=(100, 116, 139, 255),
    )

    # EN 뱃지
    badge_w, badge_h = int(size * 0.2), int(size * 0.09)
    bx = size - pad - badge_w - int(size * 0.02)
    by = pad + int(size * 0.02)
    draw.rounded_rectangle(
        (bx, by, bx + badge_w, by + badge_h),
        radius=badge_h // 2,
        fill=ACCENT,
    )
    font_badge = load_font(int(size * 0.045))
    en = "EN"
    eb = draw.textbbox((0, 0), en, font=font_badge)
    ew, eh = eb[2] - eb[0], eb[3] - eb[1]
    draw.text(
        (bx + (badge_w - ew) // 2 - eb[0], by + (badge_h - eh) // 2 - eb[1]),
        en,
        font=font_badge,
        fill=WHITE,
    )

    return icon


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
    icon_1024 = create_vocab_icon(1024)
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

    print("Created vocabulary app icons:")
    print(f"  - {assets_dir / 'app-icon.png'}")
    print(f"  - {public / 'icon.png'}")
    print(f"  - Android mipmap folders")


if __name__ == "__main__":
    main()
