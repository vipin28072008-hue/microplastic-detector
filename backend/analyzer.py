"""
analyzer.py
===========
Core analysis engine:
  1. OpenCV: grayscale → blur → threshold → contour detection → area %
  2. CNN model: binary classify (microplastic vs clean)
  3. Plastic type: heuristic from image color/texture features
  4. Returns annotated image as base64
"""

import cv2
import numpy as np
import tensorflow as tf
from PIL import Image
import base64
import os
import io

# ── Load model once at startup ──
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "microplastic_model.h5")
_model = None

def get_model():
    global _model
    if _model is None:
        print(f"Loading model from: {MODEL_PATH}")
        _model = tf.keras.models.load_model(MODEL_PATH)
        print("✅ Model loaded successfully")
    return _model


def analyze_image(image_bytes: bytes) -> dict:
    """
    Main analysis function.
    Input:  raw image bytes
    Output: dict with all analysis results
    """

    # ── Decode image ──
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise ValueError("Could not decode image. Please upload a valid image file.")

    original_h, original_w = img_bgr.shape[:2]

    # ── STEP 1: OpenCV Image Processing ──
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Reduce noise
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)

    # Adaptive threshold (better than fixed for polarized images)
    thresh_otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    thresh_adapt = cv2.adaptiveThreshold(
        blurred, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )

    # Use Otsu for bright-particle images (polarized = bright on dark)
    _, thresh_val = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Morphological operations to clean up
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    thresh_clean = cv2.morphologyEx(thresh_val, cv2.MORPH_OPEN, kernel, iterations=1)
    thresh_clean = cv2.morphologyEx(thresh_clean, cv2.MORPH_CLOSE, kernel, iterations=1)

    # Find contours
    contours, _ = cv2.findContours(thresh_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter meaningful contours (area > 30 px, not too large)
    total_area = original_h * original_w
    valid_contours = [
        c for c in contours
        if 30 < cv2.contourArea(c) < (total_area * 0.3)
    ]

    plastic_area = sum(cv2.contourArea(c) for c in valid_contours)
    raw_percentage = (plastic_area / total_area) * 100

    # ── STEP 2: CNN Prediction ──
    model = get_model()
    img_resized = cv2.resize(img_bgr, (224, 224))
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    img_array = img_rgb.astype("float32") / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = model.predict(img_array, verbose=0)[0][0]

    # class_indices from training: {'clean': 0, 'microplastic': 1}
    is_microplastic = bool(prediction > 0.5)
    confidence = float(prediction) if is_microplastic else float(1.0 - prediction)
    confidence_pct = round(confidence * 100, 1)

    # ── STEP 3: Finalize percentage ──
    if is_microplastic:
        # Calibrate percentage: CNN is confident → use OpenCV area + boost
        cnn_boost = (confidence - 0.5) * 20  # slight boost from CNN confidence
        percentage = round(min(float(raw_percentage) + cnn_boost, 99.9), 2)
        percentage = max(percentage, 1.0)    # at least 1% if detected
    else:
        percentage = round(min(float(raw_percentage) * 0.3, 8.0), 2)  # suppress if clean

    # ── STEP 4: Plastic type classification ──
    plastic_type = _classify_plastic_type(img_bgr, is_microplastic)

    # ── STEP 5: Risk level ──
    if percentage <= 10:
        risk_level = "Low"
    elif percentage <= 30:
        risk_level = "Medium"
    else:
        risk_level = "High"

    # ── STEP 6: Annotated image ──
    annotated_b64 = _create_annotated_image(img_bgr, valid_contours, is_microplastic, risk_level)

    return {
        "microplastic_present": is_microplastic,
        "percentage": percentage,
        "plastic_type": plastic_type,
        "confidence": confidence_pct,
        "risk_level": risk_level,
        "annotated_image": annotated_b64,
        "particle_count": len(valid_contours),
    }


def _classify_plastic_type(img_bgr: np.ndarray, is_micro: bool) -> str:
    """
    Heuristic plastic type detection based on color channel analysis.
    PE:  tends toward cooler/blue birefringence colors
    PP:  tends toward yellow/orange interference colors
    PET: tends toward bright white/mixed
    """
    if not is_micro:
        return "None"

    # Analyse color channels in brightest regions
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY)

    if cv2.countNonZero(mask) == 0:
        return "PE"

    b_mean = float(cv2.mean(img_bgr[:, :, 0], mask=mask)[0])
    g_mean = float(cv2.mean(img_bgr[:, :, 1], mask=mask)[0])
    r_mean = float(cv2.mean(img_bgr[:, :, 2], mask=mask)[0])

    total = b_mean + g_mean + r_mean
    if total < 1:
        return "PE"

    b_ratio = b_mean / total
    g_ratio = g_mean / total
    r_ratio = r_mean / total

    # Heuristic classification
    if r_ratio > 0.38:
        return "PP"   # Polypropylene: reddish/orange interference
    elif b_ratio > 0.38:
        return "PE"   # Polyethylene: bluish birefringence
    else:
        return "PET"  # PET: balanced / white-ish


def _create_annotated_image(
    img_bgr: np.ndarray,
    contours: list,
    is_micro: bool,
    risk_level: str
) -> str:
    """
    Draw contour annotations on the image.
    Returns base64-encoded JPEG string.
    """
    annotated = img_bgr.copy()

    # Color per risk
    color_map = {
        "Low":    (34, 197, 94),    # green  (BGR)
        "Medium": (59, 130, 246),   # blue
        "High":   (68,  68, 238),   # red (BGR)
    }
    contour_color = color_map.get(risk_level, (0, 255, 255))

    if is_micro and contours:
        for c in contours:
            area = cv2.contourArea(c)
            # Draw contour
            cv2.drawContours(annotated, [c], -1, contour_color, 2)
            # Draw bounding box for larger particles
            if area > 100:
                x, y, w, h = cv2.boundingRect(c)
                cv2.rectangle(annotated, (x, y), (x + w, y + h), contour_color, 1)

        # Add count label
        cv2.putText(
            annotated,
            f"Particles: {len(contours)}",
            (10, 25),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7, contour_color, 2, cv2.LINE_AA
        )

    # Encode to base64
    _, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buffer).decode("utf-8")
