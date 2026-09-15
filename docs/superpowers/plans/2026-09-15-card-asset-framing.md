# Card Asset Framing & Visual Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate opaque rectangular background clashes and metric icon distortion by creating an automated Python PIL alpha extraction and 1:1 square re-centering pipeline, accompanied by refined Canvas 2D geometric framing backings across all 4 styles.

**Architecture:** 
1. Offline Python PIL pipeline processes all 21 PNG assets in `frontend/src/assets/cards/`: removes opaque backgrounds using chroma-key masking with feathering, extracts content bounding boxes, and re-centers them onto 1:1 square RGBA canvases with uniform optical padding.
2. `ticketIconKits.js` and `cardGenerator.js` refactor `drawHeroAsset` and `drawMetricAsset` to render authentic architectural backings (CAD crosshairs for Blueprint, die-cut sticker shadow for Neobrutalist, VisionOS radial glow for Aurora, letterpress seal for Hangtag).
3. Comprehensive verification via headless card rendering script and `npm run build`, followed by VPS deployment.

**Tech Stack:** Python 3 (PIL / Pillow), JavaScript (ES Modules, HTML5 Canvas 2D), Vite/React.

---

### Task 1: Python Asset Pipeline — Alpha Transparency & 1:1 Square Re-centering

**Files:**
- Create: `scripts/process_card_assets.py`
- Test: `scripts/test_asset_processing.py`
- Modify: `frontend/src/assets/cards/*.png` (21 PNG files)

- [ ] **Step 1: Write the unit test script for asset processing**

```python
# scripts/test_asset_processing.py
import os
import sys
from PIL import Image

CARDS_DIR = "frontend/src/assets/cards"

def test_all_assets_square_and_transparent():
    files = [f for f in os.listdir(CARDS_DIR) if f.endswith(".png")]
    assert len(files) == 21, f"Expected 21 PNG files, found {len(files)}"
    
    for filename in sorted(files):
        path = os.path.join(CARDS_DIR, filename)
        with Image.open(path) as img:
            w, h = img.size
            # Check 1: Must be square
            assert w == h, f"{filename} is not square: {w}x{h}"
            # Check 2: Must be RGBA
            assert img.mode == "RGBA", f"{filename} is not RGBA: {img.mode}"
            # Check 3: Corner pixel must be fully transparent (alpha == 0)
            corner_alpha = img.getpixel((0, 0))[3]
            assert corner_alpha == 0, f"{filename} corner (0,0) is not transparent: alpha={corner_alpha}"

    print("ALL 21 CARD ASSETS PASSED INTEGRITY TESTS!")

if __name__ == "__main__":
    test_all_assets_square_and_transparent()
```

- [ ] **Step 2: Run test to verify it fails on current raw assets**

Run: `python3 scripts/test_asset_processing.py`
Expected: FAIL (e.g. non-square dimensions like 320x430 or opaque corners).

- [ ] **Step 3: Write the asset processing script**

```python
# scripts/process_card_assets.py
import os
from PIL import Image, ImageFilter

CARDS_DIR = "frontend/src/assets/cards"

# Color key definitions for opaque hero backgrounds
HERO_BG_COLORS = {
    "blueprint_hero.png": (2, 28, 51),
    "neobrutalist_hero.png": (235, 240, 244),
    "aurora_hero.png": (29, 32, 39),
    "hangtag_hero.png": (246, 240, 228),
}

def remove_background(img, bg_color, tolerance=35):
    img = img.convert("RGBA")
    data = img.getdata()
    new_data = []
    br, bg, bb = bg_color
    for item in data:
        r, g, b, a = item
        # Euclidean color distance in RGB space
        dist = ((r - br)**2 + (g - bg)**2 + (b - bb)**2) ** 0.5
        if dist < tolerance:
            new_data.append((r, g, b, 0))
        elif dist < tolerance + 15:
            # Smooth feathering gradient
            alpha = int(255 * ((dist - tolerance) / 15.0))
            new_data.append((r, g, b, alpha))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def make_square_centered(img, padding_ratio=0.12):
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
    for filename in sorted(os.listdir(CARDS_DIR)):
        if not filename.endswith(".png"):
            continue
        filepath = os.path.join(CARDS_DIR, filename)
        img = Image.open(filepath).convert("RGBA")
        
        # 1. Background removal if hero
        if filename in HERO_BG_COLORS:
            img = remove_background(img, HERO_BG_COLORS[filename])
        elif img.getpixel((0, 0))[3] == 255:
            # Metric with opaque background
            corner = img.getpixel((0, 0))[:3]
            img = remove_background(img, corner)
            
        # 2. Re-center in square canvas
        square_img = make_square_centered(img)
        # Normalize size to 440x440 for consistency
        final_img = square_img.resize((440, 440), Image.Resampling.LANCZOS)
        final_img.save(filepath, "PNG", optimize=True)
        print(f"Processed: {filename} -> 440x440 RGBA (transparent)")

if __name__ == "__main__":
    process_all_assets()
```

- [ ] **Step 4: Execute processing script and re-run test to verify PASS**

Run: `python3 scripts/process_card_assets.py && python3 scripts/test_asset_processing.py`
Expected: PASS (all 21 assets are 440x440 square, RGBA, corner alpha = 0).

- [ ] **Step 5: Commit processed assets**

```bash
git add scripts/process_card_assets.py scripts/test_asset_processing.py frontend/src/assets/cards/*.png
git commit -m "feat: process card assets to 1:1 square RGBA with clean alpha masking"
```

---

### Task 2: Canvas Framing Engine Refactoring in `ticketIconKits.js`

**Files:**
- Modify: `frontend/src/utils/ticketIconKits.js:160-220`

- [ ] **Step 1: Update `drawHeroAsset` with dedicated architectural backings**

Update `drawHeroAsset` in `frontend/src/utils/ticketIconKits.js` to draw style-specific framing behind the hero:
- **Blueprint**: Draws a subtle circular radial glow `rgba(0, 210, 255, 0.15)`, a dashed circular boundary `setLineDash([4, 4])`, and 4 corner crosshairs with label `[CAD-PAT.01]`.
- **Neo-Brutalist**: Draws a die-cut sticker base (rounded rect with `#CBFD3C` or `#FFFFFF`), solid 2.5px black border, and 3px black shadow offset.
- **Aurora**: Draws a visionOS radial glow with violet-magenta gradient (`rgba(168, 85, 247, 0.3) -> transparent`) and soft blur.
- **Hangtag**: Draws a circular embossed seal ring in sepia `rgba(44, 24, 16, 0.08)`.

- [ ] **Step 2: Update `drawMetricAsset` with strict square centering**

Ensure `drawMetricAsset` draws the asset exactly in square aspect ratio without offsets.

- [ ] **Step 3: Verify with unit test or browser rendering**

Run test to verify exports and syntax.

- [ ] **Step 4: Commit `ticketIconKits.js`**

```bash
git add frontend/src/utils/ticketIconKits.js
git commit -m "feat(cards): add architectural framing backings and strict 1:1 metric rendering"
```

---

### Task 3: Canvas Card Generator Integration in `cardGenerator.js`

**Files:**
- Modify: `frontend/src/utils/cardGenerator.js`

- [ ] **Step 1: Audit and align Hero dimensions and vertical positioning**

Ensure Hero image bounds in:
- `renderBlueprintCard` / `renderBlueprintBeanCard`
- `renderNeobrutalistCard` / `renderNeobrutalistBeanCard`
- `renderAuroraCard` / `renderAuroraBeanCard`
- `renderHangtagCard` / `renderHangtagBeanCard`
are positioned with generous breathing room and appropriate aspect bounding boxes (`dWidth == dHeight`).

- [ ] **Step 2: Audit metric icon centering in parameter grids**

Ensure metric box call sites in all 4 styles pass square dimension bounds and center icons inside their badges.

- [ ] **Step 3: Commit `cardGenerator.js`**

```bash
git add frontend/src/utils/cardGenerator.js
git commit -m "feat(cards): integrate refined framing and metric alignment in cardGenerator"
```

---

### Task 4: Automated Verification Script & Frontend Build

**Files:**
- Create: `scripts/verify_cards_render.mjs`

- [ ] **Step 1: Write headless rendering test for all 8 card variants**

Create a script that instantiates `cardGenerator.js`, runs all 8 styles (4 styles × 2 modes: solo grano vs recipe), and checks that canvas output produces valid high-resolution image data.

- [ ] **Step 2: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Commit verification script**

```bash
git add scripts/verify_cards_render.mjs
git commit -m "test(cards): add automated card rendering verification script"
```

---

### Task 5: Remote VPS Deployment & Live Verification

- [ ] **Step 1: Push changes to GitHub repository**

Run: `git push origin main`

- [ ] **Step 2: Pull and build on VPS (`5.189.152.68`)**

Connect via Zerker / SSH, run `git pull`, `cd frontend && npm run build`, and `pm2 restart beantag`.

- [ ] **Step 3: Verify live endpoint**

Verify HTTP 200 status and healthy service response on `http://5.189.152.68`.
