"""
Test suite for card asset processing.
Verifies:
1. Exactly 21 PNG files exist in frontend/src/assets/cards/.
2. Every image is square (width == height).
3. Every image is in mode 'RGBA'.
4. The 4 corners of every image have alpha == 0 (fully transparent background).
"""
import os
import unittest
from PIL import Image

CARDS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'assets', 'cards')
)


class TestAssetProcessing(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files = sorted([f for f in os.listdir(CARDS_DIR) if f.endswith('.png')])

    def test_file_count(self):
        """1. Exactly 21 PNG files exist in frontend/src/assets/cards/."""
        self.assertEqual(
            len(self.files),
            21,
            f"Expected 21 PNG files in {CARDS_DIR}, found {len(self.files)}: {self.files}"
        )

    def test_images_are_square(self):
        """2. Every image is square (width == height)."""
        non_square = []
        for filename in self.files:
            filepath = os.path.join(CARDS_DIR, filename)
            with Image.open(filepath) as img:
                w, h = img.size
                if w != h:
                    non_square.append(f"{filename} ({w}x{h})")
        self.assertEqual(
            len(non_square),
            0,
            f"Expected all images to be square, but found non-square images: {non_square}"
        )

    def test_images_are_rgba(self):
        """3. Every image is in mode 'RGBA'."""
        non_rgba = []
        for filename in self.files:
            filepath = os.path.join(CARDS_DIR, filename)
            with Image.open(filepath) as img:
                if img.mode != 'RGBA':
                    non_rgba.append(f"{filename} (mode: {img.mode})")
        self.assertEqual(
            len(non_rgba),
            0,
            f"Expected all images to be in mode 'RGBA', but found: {non_rgba}"
        )

    def test_corners_are_transparent(self):
        """4. The 4 corners of every image have alpha == 0 (fully transparent background)."""
        opaque_corners = []
        for filename in self.files:
            filepath = os.path.join(CARDS_DIR, filename)
            with Image.open(filepath) as img:
                img_rgba = img.convert('RGBA') if img.mode != 'RGBA' else img
                w, h = img_rgba.size
                corners = {
                    'top-left': img_rgba.getpixel((0, 0)),
                    'top-right': img_rgba.getpixel((w - 1, 0)),
                    'bottom-left': img_rgba.getpixel((0, h - 1)),
                    'bottom-right': img_rgba.getpixel((w - 1, h - 1)),
                }
                bad_corners = {pos: px for pos, px in corners.items() if px[3] != 0}
                if bad_corners:
                    opaque_corners.append(f"{filename}: {bad_corners}")
        self.assertEqual(
            len(opaque_corners),
            0,
            f"Expected all 4 corners to have alpha == 0, but found opaque corners:\n"
            + "\n".join(opaque_corners)
        )


if __name__ == '__main__':
    unittest.main()
