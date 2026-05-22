"""Eng Note 아이콘 시안 10종 생성 → assets/icon-options/"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "icon-options"

YELLOW_TOP = (254, 240, 138)
YELLOW_MID = (250, 204, 21)
YELLOW_BOTTOM = (245, 158, 11)
AMBER = (251, 191, 36)
DARK = (30, 41, 59)
BROWN = (120, 53, 15)
NAVY = (30, 58, 138)
WHITE = (255, 255, 255)


def load_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = (
        ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
        if bold
        else ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
    )
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def yellow_gradient(draw: ImageDraw.ImageDraw, size: int, top=YELLOW_TOP, bottom=YELLOW_BOTTOM) -> None:
    for y in range(size):
        t = y / max(size - 1, 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))


def center_text(draw, text: str, font, cx: int, cy: int, fill) -> None:
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw // 2 - bbox[0], cy - th // 2 - bbox[1]), text, font=font, fill=fill)


def variant_01(size: int) -> Image.Image:
    """01 미니멀 — 노란 그라데이션 + 텍스트만"""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    yellow_gradient(d, size)
    center_text(d, "Eng", load_font(int(size * 0.24)), size // 2, int(size * 0.42), DARK)
    center_text(d, "Note", load_font(int(size * 0.19)), size // 2, int(size * 0.58), BROWN)
    return im


def variant_02(size: int) -> Image.Image:
    """02 흰 노트 카드 (클래식)"""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    yellow_gradient(d, size)
    p = int(size * 0.12)
    d.rounded_rectangle((p, p, size - p, size - p), radius=int(size * 0.14),
                        fill=(*WHITE, 235), outline=(*AMBER, 200), width=max(3, size // 200))
    center_text(d, "Eng", load_font(int(size * 0.21)), size // 2, int(size * 0.44), DARK)
    d.rounded_rectangle((size // 2 - int(size * 0.14), int(size * 0.52),
                         size // 2 + int(size * 0.14), int(size * 0.52) + max(4, size // 180)),
                        radius=2, fill=YELLOW_MID)
    center_text(d, "Note", load_font(int(size * 0.16)), size // 2, int(size * 0.62), BROWN)
    return im


def variant_03(size: int) -> Image.Image:
    """03 알약 라벨 — Eng / Note 각각 둥근 배지"""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    yellow_gradient(d, size, YELLOW_MID, YELLOW_BOTTOM)
    cx = size // 2
    for text, y, bg, fg in [("Eng", 0.38, DARK, WHITE), ("Note", 0.58, WHITE, BROWN)]:
        bw, bh = int(size * 0.55), int(size * 0.16)
        x0, y0 = cx - bw // 2, int(size * y) - bh // 2
        d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), radius=bh // 2, fill=bg)
        center_text(d, text, load_font(int(size * (0.14 if text == "Eng" else 0.11))), cx, int(size * y), fg)
    return im


def variant_04(size: int) -> Image.Image:
    """04 대각선 분할 — 좌상 Julia / 우하 Voca"""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(0, 0), (size, 0), (0, size)], fill=(*YELLOW_TOP, 255))
    d.polygon([(size, 0), (size, size), (0, size)], fill=(*YELLOW_BOTTOM, 255))
    center_text(d, "Julia", load_font(int(size * 0.15)), int(size * 0.34), int(size * 0.34), DARK)
    center_text(d, "Voca", load_font(int(size * 0.17)), int(size * 0.66), int(size * 0.68), (*WHITE, 255))
    return im


def variant_05(size: int) -> Image.Image:
    """05 공책 — 왼쪽 빨간 여백선"""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    yellow_gradient(d, size, (255, 251, 235), YELLOW_MID)
    margin = int(size * 0.14)
    d.rectangle((margin, int(size * 0.1), margin + max(6, size // 80), size - int(size * 0.1)),
                fill=(239, 68, 68, 230))
    for i in range(4):
        ly = int(size * (0.72 - i * 0.06))
        d.line((margin + int(size * 0.06), ly, size - int(size * 0.1), ly),
               fill=(254, 243, 199, 200), width=max(2, size // 300))
    center_text(d, "Eng", load_font(int(size * 0.22)), int(size * 0.55), int(size * 0.4), DARK)
    center_text(d, "Note", load_font(int(size * 0.15)), int(size * 0.55), int(size * 0.55), BROWN)
    return im


def variant_06(size: int) -> Image.Image:
    """06 원형 앰버 배지"""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    yellow_gradient(d, size)
    r = int(size * 0.38)
    cx, cy = size // 2, size // 2
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=YELLOW_BOTTOM, outline=(*DARK, 80), width=max(4, size // 128))
    center_text(d, "Eng", load_font(int(size * 0.17)), cx, cy - int(size * 0.05), WHITE)
    center_text(d, "Note", load_font(int(size * 0.12)), cx, cy + int(size * 0.09), (254, 243, 199))
    return im


def variant_07(size: int) -> Image.Image:
    """07 네이비 사각 뱃지 + 노란 배경"""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    yellow_gradient(d, size)
    s = int(size * 0.62)
    x0 = (size - s) // 2
    d.rounded_rectangle((x0, x0, x0 + s, x0 + s), radius=int(size * 0.1), fill=NAVY)
    center_text(d, "Eng", load_font(int(size * 0.19)), size // 2, int(size * 0.44), WHITE)
    center_text(d, "Note", load_font(int(size * 0.14)), size // 2, int(size * 0.58), AMBER)
    return im


def variant_08(size: int) -> Image.Image:
    """08 큰 Eng + 작은 Note (타이포 위계)"""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, size, size), fill=YELLOW_MID)
    d.rectangle((0, int(size * 0.85), size, size), fill=YELLOW_BOTTOM)
    center_text(d, "Eng", load_font(int(size * 0.32)), size // 2, int(size * 0.42), DARK)
    center_text(d, "note", load_font(int(size * 0.1), bold=False), size // 2, int(size * 0.72), BROWN)
    return im


def variant_09(size: int) -> Image.Image:
    """09 스티커 2장 겹침"""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    yellow_gradient(d, size)
    off = int(size * 0.04)
    for text, x, y, rot_color in [("Eng", 0.22, 0.28, WHITE), ("Note", 0.38, 0.48, (255, 237, 213))]:
        w, h = int(size * 0.42), int(size * 0.22)
        x0, y0 = int(size * x), int(size * y)
        d.rounded_rectangle((x0 + off, y0 + off, x0 + w + off, y0 + h + off),
                          radius=int(size * 0.04), fill=(0, 0, 0, 25))
        d.rounded_rectangle((x0, y0, x0 + w, y0 + h), radius=int(size * 0.04), fill=rot_color,
                            outline=(*AMBER, 255), width=max(2, size // 256))
        center_text(d, text, load_font(int(size * 0.12)), x0 + w // 2, y0 + h // 2, DARK if text == "Eng" else BROWN)
    return im


def variant_10(size: int) -> Image.Image:
    """10 모노그램 EN — 큰 E 안에 ng, 아래 Note"""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    yellow_gradient(d, size, (253, 224, 71), (234, 179, 8))
    center_text(d, "E", load_font(int(size * 0.42)), size // 2, int(size * 0.4), DARK)
    center_text(d, "ng", load_font(int(size * 0.11), bold=False), int(size * 0.58), int(size * 0.48), BROWN)
    d.rounded_rectangle((int(size * 0.25), int(size * 0.68), int(size * 0.75), int(size * 0.82)),
                        radius=int(size * 0.04), fill=(*WHITE, 220))
    center_text(d, "Note", load_font(int(size * 0.1)), size // 2, int(size * 0.75), NAVY)
    return im


VARIANTS = [
    ("01-minimal", "01 미니멀: 노란 그라데이션 + 텍스트만", variant_01),
    ("02-card", "02 흰 노트 카드", variant_02),
    ("03-pills", "03 알약 배지 (Eng / Note)", variant_03),
    ("04-diagonal", "04 대각선 분할", variant_04),
    ("05-notebook", "05 공책 빨간 여백선", variant_05),
    ("06-circle", "06 원형 앰버 배지", variant_06),
    ("07-navy", "07 네이비 사각 뱃지", variant_07),
    ("08-typo", "08 큰 Eng + 작은 note", variant_08),
    ("09-stickers", "09 스티커 2장 겹침", variant_09),
    ("10-monogram", "10 모노그램 E + ng + Note", variant_10),
]


def write_preview_html(labels: list[tuple[str, str]]) -> None:
    rows = "\n".join(
        f"""    <div class="item">
      <img src="{fname}.png" alt="{label}" width="256" height="256" />
      <p class="num">{fname}</p>
      <p class="label">{label}</p>
    </div>"""
        for fname, label in labels
    )
    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>Eng Note 아이콘 시안</title>
  <style>
    body {{ font-family: system-ui, sans-serif; background: #1e293b; color: #f8fafc; padding: 24px; }}
    h1 {{ text-align: center; }}
    .hint {{ text-align: center; color: #94a3b8; margin-bottom: 24px; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto; }}
    .item {{ background: #334155; border-radius: 12px; padding: 16px; text-align: center; }}
    .item img {{ border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,.4); }}
    .num {{ font-size: 1.25rem; font-weight: 700; margin: 12px 0 4px; color: #fbbf24; }}
    .label {{ font-size: 0.85rem; color: #cbd5e1; margin: 0; }}
  </style>
</head>
<body>
  <h1>Eng Note 아이콘 시안 (10종)</h1>
  <p class="hint">마음에 드는 번호를 채팅에 알려주세요. (예: 3번, 07-navy)</p>
  <div class="grid">
{rows}
  </div>
</body>
</html>
"""
    (OUT_DIR / "preview.html").write_text(html, encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    labels: list[tuple[str, str]] = []
    for fname, label, fn in VARIANTS:
        icon = fn(512)
        path = OUT_DIR / f"{fname}.png"
        icon.save(path, "PNG")
        labels.append((fname, label))
        print(f"  {path.name} - {label}")

    write_preview_html(labels)
    print(f"\n미리보기: {OUT_DIR / 'preview.html'}")
    print("브라우저에서 열거나 assets/icon-options 폴더의 PNG를 확인하세요.")


if __name__ == "__main__":
    main()
