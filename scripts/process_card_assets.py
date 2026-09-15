"""
Process card assets for BeanTag.
- Converts opaque hero/metric backgrounds to transparent RGBA with 15-step color feathering.
- Calculates tight getbbox() of visible content.
- Centers cropped illustration into a 1:1 square canvas with balanced 12% padding.
- Normalizes size to 440x440 px with LANCZOS resampling.
- Saves back with optimize=True.
"""
import os
from PIL import Image

CARDS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "assets", "cards")
)

# Color key definitions for opaque hero backgrounds
HERO_BG_COLORS = {
    "blueprint_hero.png": (2, 28, 51),
    "neobrutalist_hero.png": (235, 240, 244),
    "aurora_hero.png": (29, 32, 39),
    "hangtag_hero.png": (246, 240, 228),
}


def remove_background(img: Image.Image, bg_color: tuple, tolerance: float = 35.0) -> Image.Image:
    img = img.convert("RGBA")
    data = img.getdata()
    new_data = []
    br, bg, bb = bg_color[:3]
    for item in data:
        r, g, b, a = item
        # Euclidean color distance in RGB space
        dist = ((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2) ** 0.5
        if dist < tolerance:
            new_data.append((r, g, b, 0))
        elif dist < tolerance + 15:
            # Smooth 15-step feathering gradient
            feathered_alpha = int(255 * ((dist - tolerance) / 15.0))
            new_data.append((r, g, b, min(a, feathered_alpha)))
        else:
            new_data.append((r, g, b, a))
    img.putdata(new_data)
    return img


def make_square_centered(img: Image.Image, padding_ratio: float = 0.12) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    cropped = img.crop(bbox)
    cw, ch = cropped.size
    max_dim = max(cw, ch)
    target_dim = int(max_dim * (1 + padding_ratio * 2))

    square = Image.new("RGBA", (target_dim, target_dim), (0, 0, 0, 0))
    offset_x = (target_dim - cw) // 2
    offset_y = (target_dim - ch) // 2
    square.paste(cropped, (offset_x, offset_y), cropped)
    return square


def process_all_assets():
    if not os.path.exists(CARDS_DIR):
        raise FileNotFoundError(f"Cards directory not found: {CARDS_DIR}")

    files = sorted([f for f in os.listdir(CARDS_DIR) if f.endswith(".png")])
    print(f"Processing {len(files)} card assets from {CARDS_DIR}...")

    for filename in files:
        filepath = os.path.join(CARDS_DIR, filename)
        with Image.open(filepath) as raw_img:
            img = raw_img.convert("RGBA")

        # 1. Background removal if hero or opaque metric
        if filename in HERO_BG_COLORS:
            img = remove_background(img, HERO_BG_COLORS[filename])
        elif img.getpixel((0, 0))[3] == 255:
            corner_color = img.getpixel((0, 0))[:3]
            img = remove_background(img, corner_color)

        # 2. Re-center in square canvas with balanced 12% padding
        square_img = make_square_centered(img, padding_ratio=0.12)

        # 3. Normalize size to 440x440 with LANCZOS resampling
        final_img = square_img.resize((440, 440), Image.Resampling.LANCZOS)

        # 4. Save back with optimize=True
        final_img.save(filepath, "PNG", optimize=True)
        print(f"✓ Processed: {filename} -> 440x440 RGBA (optimized)")


if __name__ == "__main__":
    process_all_assets()
