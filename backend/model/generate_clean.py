"""
generate_clean.py
Run this ONCE in Google Colab to create synthetic clean water images.
These are used to balance the dataset (microplastic vs clean water).
"""

import numpy as np
import cv2
import os
import random

OUTPUT_DIR = "/content/dataset/clean_water"
NUM_IMAGES = 800  # generate same count as microplastic images

os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_clean_water_image(idx):
    """
    Simulates a dark-field polarized microscope image of CLEAN water.
    - Dark background (no bright birefringent particles)
    - Only small, dark, non-bright natural particles (dust, minerals)
    - Subtle camera noise
    """
    img = np.zeros((224, 224, 3), dtype=np.uint8)

    # Dark blue/teal background (like real polarized microscope)
    for i in range(224):
        val = int(15 + (i / 224) * 10)
        img[i, :] = [val + 8, val + 4, val]   # slight blue tint

    # Subtle gaussian noise (camera sensor noise)
    noise = np.random.normal(0, 4, (224, 224, 3)).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Add 0–5 small DARK natural particles (NOT bright like plastics)
    num_particles = random.randint(0, 5)
    for _ in range(num_particles):
        x = random.randint(5, 219)
        y = random.randint(5, 219)
        r = random.randint(1, 5)
        # Dark gray — will NOT trigger birefringence detection
        brightness = random.randint(25, 55)
        color = (brightness, brightness, brightness)
        cv2.circle(img, (x, y), r, color, -1)

    # Occasionally add very faint texture (water ripple effect)
    if random.random() > 0.6:
        for _ in range(random.randint(2, 8)):
            x1, y1 = random.randint(0, 224), random.randint(0, 224)
            x2, y2 = random.randint(0, 224), random.randint(0, 224)
            cv2.line(img, (x1, y1), (x2, y2), (20, 20, 22), 1)

    filename = os.path.join(OUTPUT_DIR, f"clean_{idx:04d}.jpg")
    cv2.imwrite(filename, img, [cv2.IMWRITE_JPEG_QUALITY, 90])

print(f"Generating {NUM_IMAGES} clean water images...")
for i in range(NUM_IMAGES):
    generate_clean_water_image(i)
    if (i + 1) % 100 == 0:
        print(f"  ✅ {i + 1}/{NUM_IMAGES} done")

print(f"\n✅ All {NUM_IMAGES} clean water images saved to: {OUTPUT_DIR}")
print(f"Total files: {len(os.listdir(OUTPUT_DIR))}")
