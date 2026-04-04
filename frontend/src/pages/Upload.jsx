import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function Upload({ setUploadedImage, setAnalysisResult }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFile = (f) => {
    setError("");
    if (!f) return;
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/tiff"];
    if (!validTypes.includes(f.type)) {
      setError("Please upload a valid image file (JPG, PNG, WEBP, TIFF).");
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError("File too large. Max size is 15MB.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const onFileChange = (e) => handleFile(e.target.files[0]);

  const handleAnalyze = () => {
    if (!file) { setError("Please upload an image first."); return; }
    setUploadedImage({ file, preview });
    setAnalysisResult(null);
    navigate("/processing");
  };

  return (
    <div className="min-h-screen bg-bglight">
      {/* Navbar */}
      <nav className="water-bg shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
            <span className="text-3xl">🔬</span>
            <div>
              <h1 className="text-white font-bold text-lg leading-none group-hover:text-secondary transition-colors">MicroPlastic</h1>
              <p className="text-secondary text-xs font-medium tracking-widest uppercase">Detector</p>
            </div>
          </button>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/")} className="text-white/70 hover:text-secondary text-sm font-medium transition-colors">← Home</button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
          <span className="text-secondary text-sm font-semibold tracking-widest uppercase">Step 1 of 3</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mt-2 mb-3">
            Upload Water Sample
          </h2>
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
            Upload a polarized microscope image of your filtered water sample. Supported: JPG, PNG, WEBP, TIFF (max 15MB)
          </p>
        </div>

        {/* Upload card */}
        <div className="glass-card rounded-3xl p-8 shadow-xl" style={{ animation: 'fadeIn 0.5s ease-out 0.1s forwards', opacity: 0 }}>
          
          {/* Tips row */}
          <div className="flex flex-wrap gap-3 mb-6 justify-center">
            {["Use polarized microscope image", "Filter sample first", "Good lighting = better results"].map((t, i) => (
              <span key={i} className="bg-secondary/10 text-secondary text-xs font-semibold px-3 py-1.5 rounded-full border border-secondary/20">
                ✓ {t}
              </span>
            ))}
          </div>

          {/* Drop zone */}
          {!preview ? (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 select-none
                ${dragOver
                  ? 'border-secondary bg-secondary/10 scale-[1.02]'
                  : 'border-secondary/40 hover:border-secondary hover:bg-secondary/5'
                }`}
            >
              <div className="text-6xl mb-4">{dragOver ? "📥" : "🔬"}</div>
              <h3 className="text-primary font-bold text-xl mb-2">
                {dragOver ? "Drop your image here!" : "Drag & Drop your image"}
              </h3>
              <p className="text-gray-400 text-sm mb-6">or click to browse files</p>
              <button
                type="button"
                className="bg-primary hover:bg-primary/80 text-white font-semibold px-8 py-3 rounded-full text-sm transition-all hover:scale-105 shadow-md"
              >
                Choose File
              </button>
              <p className="text-gray-300 text-xs mt-4">JPG, PNG, WEBP, TIFF · Max 15MB</p>
            </div>
          ) : (
            /* Preview */
            <div className="relative rounded-2xl overflow-hidden border-2 border-secondary/30" style={{ animation: 'fadeIn 0.4s ease-out forwards' }}>
              <img
                src={preview}
                alt="Sample preview"
                className="w-full max-h-80 object-contain bg-gray-900"
              />
              {/* Overlay info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-semibold truncate max-w-[200px]">{file?.name}</p>
                    <p className="text-white/60 text-xs">{(file?.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-success/20 text-success text-xs font-bold px-3 py-1 rounded-full border border-success/30">
                      ✓ Ready
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}
                      className="bg-danger/20 hover:bg-danger/40 text-danger text-xs font-bold px-3 py-1 rounded-full border border-danger/30 transition-colors"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />

          {/* Error */}
          {error && (
            <div className="mt-4 bg-danger/10 border border-danger/30 rounded-xl p-3 flex items-center gap-2">
              <span className="text-danger text-lg">⚠️</span>
              <p className="text-danger text-sm font-medium">{error}</p>
            </div>
          )}

          {/* File info card when preview is showing */}
          {preview && (
            <div className="mt-4 bg-primary/5 rounded-xl p-4 border border-primary/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Format</p>
                  <p className="text-primary font-bold text-sm mt-1">{file?.type.split('/')[1].toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Size</p>
                  <p className="text-primary font-bold text-sm mt-1">{(file?.size / 1024).toFixed(0)} KB</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
                  <p className="text-success font-bold text-sm mt-1">✓ Valid</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center" style={{ animation: 'fadeIn 0.5s ease-out 0.2s forwards', opacity: 0 }}>
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-primary text-textdark font-semibold px-8 py-3.5 rounded-full transition-all hover:shadow-md"
          >
            ← Back to Home
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!file}
            className={`flex items-center justify-center gap-2 font-bold px-10 py-3.5 rounded-full text-white transition-all duration-200
              ${file
                ? 'bg-secondary hover:bg-cyan-400 shadow-lg shadow-secondary/30 hover:scale-105'
                : 'bg-gray-300 cursor-not-allowed'
              }`}
          >
            🧠 Analyze Sample →
          </button>
        </div>

        {/* Notice */}
        <p className="text-center text-gray-400 text-xs mt-6">
          🔒 Your image is processed securely and not stored permanently.
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
