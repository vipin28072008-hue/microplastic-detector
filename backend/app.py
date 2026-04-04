"""
app.py
======
Flask REST API for MicroPlastic Detector backend.

Endpoints:
  GET  /health      → health check
  POST /analyze     → analyze uploaded image

Deployment: Render (gunicorn)
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from analyzer import analyze_image

app = Flask(__name__)

# ── Allow requests from your Vercel frontend ──
# Add your Vercel URL here after deploying frontend
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://*.vercel.app",
    os.environ.get("FRONTEND_URL", "*"),
]

CORS(app, resources={r"/*": {"origins": "*"}})  # open for now — restrict after deployment


# ── Routes ──

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "app": "MicroPlastic Detector API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "GET /health",
            "analyze": "POST /analyze  (multipart: image file)"
        }
    })


@app.route("/health", methods=["GET"])
def health():
    """Health check — Render uses this to confirm service is up."""
    return jsonify({"status": "ok", "message": "MicroPlastic Detector API is running ✅"})


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Accepts a multipart/form-data POST with key 'image'.
    Returns JSON with:
      - microplastic_present (bool)
      - percentage (float)
      - plastic_type (str)
      - confidence (float)
      - risk_level (str)
      - annotated_image (base64 JPEG string)
      - particle_count (int)
    """

    # ── Validate request ──
    if "image" not in request.files:
        return jsonify({"error": "No image file provided. Use key 'image' in form-data."}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "Empty filename. Please select a file."}), 400

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}
    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in allowed_extensions:
        return jsonify({"error": f"Unsupported file type: {ext}. Use JPG, PNG, WEBP, or TIFF."}), 400

    # ── Read image bytes ──
    image_bytes = file.read()

    if len(image_bytes) == 0:
        return jsonify({"error": "Uploaded file is empty."}), 400

    if len(image_bytes) > 20 * 1024 * 1024:   # 20MB limit
        return jsonify({"error": "File too large. Maximum size is 20MB."}), 400

    # ── Run analysis ──
    try:
        result = analyze_image(image_bytes)
        return jsonify(result), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 422

    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return jsonify({"error": "Internal analysis error. Please try again."}), 500


# ── Run locally ──
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("DEBUG", "false").lower() == "true"
    print(f"🚀 Starting MicroPlastic Detector API on port {port}")
    print(f"   Debug mode: {debug}")
    app.run(host="0.0.0.0", port=port, debug=debug)
