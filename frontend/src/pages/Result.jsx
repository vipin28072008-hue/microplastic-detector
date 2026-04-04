import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

export default function Result({ uploadedImage, analysisResult }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!analysisResult) { navigate("/upload"); return; }
    setTimeout(() => setVisible(true), 100);
  }, []);

  if (!analysisResult) return null;

  const {
    microplastic_present,
    percentage,
    plastic_type,
    confidence,
    risk_level,
    annotated_image,
    demo_mode,
  } = analysisResult;

  // ── Color scheme based on risk ──
  const riskConfig = {
    Low:    { color: '#22C55E', bg: 'bg-green-50',  border: 'border-green-200', badge: 'bg-green-100 text-green-700', icon: '✅', label: 'LOW RISK' },
    Medium: { color: '#F59E0B', bg: 'bg-amber-50',  border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700',  icon: '⚠️', label: 'MEDIUM RISK' },
    High:   { color: '#EF4444', bg: 'bg-red-50',    border: 'border-red-200',   badge: 'bg-red-100 text-red-700',      icon: '🚨', label: 'HIGH RISK' },
  };

  const risk = riskConfig[risk_level] || riskConfig.Low;

  const conclusions = {
    Low:    "Water sample shows low microplastic contamination. Considered relatively safe with standard filtration.",
    Medium: "Water sample shows moderate microplastic contamination. Further purification is recommended before use.",
    High:   "Water sample shows high microplastic contamination and may be unsafe. Immediate treatment required.",
  };

  // ── PDF Report Generator ──
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header background
    doc.setFillColor(11, 60, 93);
    doc.rect(0, 0, pageW, 45, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("MicroPlastic Detector", 15, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 180, 216);
    doc.text("Water Sample Analysis Report", 15, 29);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 38);
    if (demo_mode) {
      doc.setTextColor(255, 200, 0);
      doc.text("⚠ DEMO MODE — Connect backend for real analysis", pageW - 15, 38, { align: "right" });
    }

    let y = 55;

    // Risk level banner
    const riskColors = { Low: [34, 197, 94], Medium: [245, 158, 11], High: [239, 68, 68] };
    const [r, g, b] = riskColors[risk_level] || [34, 197, 94];
    doc.setFillColor(r, g, b);
    doc.roundedRect(15, y, pageW - 30, 18, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`${risk.icon}  RISK LEVEL: ${risk_level.toUpperCase()}`, pageW / 2, y + 12, { align: "center" });
    y += 28;

    // Results table
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, y, pageW - 30, 8, 2, 2, "F");
    doc.setTextColor(11, 60, 93);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ANALYSIS RESULTS", 20, y + 5.5);
    y += 13;

    const rows = [
      ["Microplastic Present", microplastic_present ? "YES" : "NO"],
      ["Microplastic Percentage", `${percentage}%`],
      ["Dominant Plastic Type", plastic_type || "None detected"],
      ["Confidence Level", `${confidence}%`],
      ["Risk Level", risk_level],
    ];

    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 3, pageW - 30, 10, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(label, 20, y + 3.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(11, 60, 93);
      doc.text(value, pageW - 20, y + 3.5, { align: "right" });
      y += 11;
    });
    y += 5;

    // Uploaded image
    if (uploadedImage?.preview) {
      try {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(11, 60, 93);
        doc.setFontSize(10);
        doc.text("ORIGINAL SAMPLE IMAGE", 15, y + 5);
        y += 10;
        const imgW = (pageW - 30) / 2 - 3;
        doc.addImage(uploadedImage.preview, "JPEG", 15, y, imgW, 55, "", "MEDIUM");

        if (annotated_image) {
          doc.text("ANNOTATED IMAGE", 15 + imgW + 6, y - 5);
          doc.addImage(
            `data:image/jpeg;base64,${annotated_image}`,
            "JPEG", 15 + imgW + 6, y, imgW, 55, "", "MEDIUM"
          );
        }
        y += 62;
      } catch (e) {
        console.error("Image embed error:", e);
      }
    }

    // Conclusion
    y += 5;
    doc.setFillColor(11, 60, 93);
    doc.roundedRect(15, y, pageW - 30, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CONCLUSION", 20, y + 5.5);
    y += 13;

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const conclusionLines = doc.splitTextToSize(conclusions[risk_level], pageW - 40);
    doc.text(conclusionLines, 20, y);
    y += conclusionLines.length * 6 + 10;

    // Methodology box
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(15, y, pageW - 30, 38, 4, 4, "F");
    doc.setTextColor(11, 60, 93);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Methodology Used:", 20, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const methodText = "1. Density separation (K₂CO₃)  2. Filtration  3. Cross-polarized light imaging (birefringence)\n4. OpenCV image processing (grayscale → blur → threshold → contour detection)\n5. CNN classification (MobileNetV2) → PE, PP, PET identification";
    const methodLines = doc.splitTextToSize(methodText, pageW - 45);
    doc.text(methodLines, 20, y + 15);
    y += 43;

    // Footer
    doc.setFillColor(11, 60, 93);
    doc.rect(0, doc.internal.pageSize.getHeight() - 18, pageW, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("MicroPlastic Detector — B.Tech AI & DS Project | Polarized Optical Sensing + AI", pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });

    doc.save(`microplastic-report-${Date.now()}.pdf`);
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
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-white/70 hover:text-secondary text-sm font-medium transition-colors">Home</button>
            <button onClick={() => navigate("/upload")} className="bg-secondary hover:bg-cyan-400 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all">New Analysis</button>
          </div>
        </div>
      </nav>

      <div className={`max-w-4xl mx-auto px-6 py-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Demo mode warning */}
        {demo_mode && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-700">Demo Mode Active</p>
              <p className="text-amber-600 text-sm">Backend not connected. Showing simulated results. Connect your Flask backend to get real AI analysis.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-secondary text-sm font-semibold tracking-widest uppercase">Analysis Complete</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mt-2">Sample Report</h2>
          <p className="text-gray-400 text-sm mt-1">{new Date().toLocaleString()}</p>
        </div>

        {/* Risk level banner */}
        <div
          className={`rounded-2xl p-6 mb-6 border-2 ${risk.bg} ${risk.border} flex items-center justify-between`}
          style={{ borderLeftWidth: '6px', borderLeftColor: risk.color }}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">{risk.icon}</span>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Risk Assessment</p>
              <h3 className="text-2xl font-extrabold" style={{ color: risk.color }}>{risk.label}</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm">{conclusions[risk_level]}</p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-5xl font-extrabold" style={{ color: risk.color }}>{percentage}%</p>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Contamination</p>
          </div>
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon: microplastic_present ? "🔴" : "🟢",
              label: "Microplastic",
              value: microplastic_present ? "DETECTED" : "NOT FOUND",
              valueColor: microplastic_present ? "text-danger" : "text-success",
              bg: microplastic_present ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200",
            },
            {
              icon: "📊",
              label: "Percentage",
              value: `${percentage}%`,
              valueColor: "text-primary",
              bg: "bg-blue-50 border-blue-200",
            },
            {
              icon: "🧬",
              label: "Plastic Type",
              value: plastic_type || "None",
              valueColor: "text-primary",
              bg: "bg-purple-50 border-purple-200",
            },
            {
              icon: "🎯",
              label: "Confidence",
              value: `${confidence}%`,
              valueColor: "text-secondary",
              bg: "bg-cyan-50 border-cyan-200",
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`glass-card rounded-2xl p-5 border ${card.bg} text-center hover-lift`}
              style={{ animation: `fadeIn 0.5s ease-out ${0.1 + i * 0.1}s forwards`, opacity: 0 }}
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">{card.label}</p>
              <p className={`text-lg font-extrabold ${card.valueColor}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Confidence bar */}
        <div className="glass-card rounded-2xl p-6 mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-primary">AI Confidence Level</span>
            <span className="text-secondary font-extrabold text-lg">{confidence}%</span>
          </div>
          <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${confidence}%`,
                background: 'linear-gradient(90deg, #0B3C5D, #00B4D8)',
                boxShadow: '0 0 8px rgba(0,180,216,0.4)',
                animation: 'growBar 1.5s ease-out forwards',
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-300">0%</span>
            <span className="text-xs text-gray-300">100%</span>
          </div>
        </div>

        {/* Images row */}
        <div className={`grid gap-4 mb-6 ${annotated_image ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Original image */}
          {uploadedImage?.preview && (
            <div className="glass-card rounded-2xl overflow-hidden border border-gray-100">
              <div className="bg-primary px-4 py-3">
                <p className="text-white text-sm font-bold">📷 Original Sample Image</p>
              </div>
              <img src={uploadedImage.preview} alt="Original" className="w-full max-h-64 object-contain bg-gray-900 p-2" />
            </div>
          )}

          {/* Annotated image */}
          {annotated_image && (
            <div className="glass-card rounded-2xl overflow-hidden border border-secondary/30">
              <div className="bg-secondary px-4 py-3">
                <p className="text-white text-sm font-bold">🔍 AI Annotated — Microplastics Highlighted</p>
              </div>
              <img
                src={`data:image/jpeg;base64,${annotated_image}`}
                alt="Annotated"
                className="w-full max-h-64 object-contain bg-gray-900 p-2"
              />
            </div>
          )}
        </div>

        {/* Risk scale */}
        <div className="glass-card rounded-2xl p-6 mb-6 border border-gray-100">
          <p className="text-sm font-bold text-primary mb-4">Risk Scale Reference</p>
          <div className="space-y-3">
            {[
              { range: "0% – 10%", level: "Low Risk", color: "bg-success", width: "w-1/5", desc: "Safe for most uses with standard filtration" },
              { range: "10% – 30%", level: "Medium Risk", color: "bg-warning", width: "w-3/5", desc: "Requires additional purification before use" },
              { range: "30%+", level: "High Risk", color: "bg-danger", width: "w-full", desc: "Unsafe — immediate treatment required" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`h-2 rounded-full ${r.color} ${r.width} min-w-[40px]`}></div>
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold text-gray-500">{r.range}</span>
                  <span className="text-xs text-gray-400">→ {r.level}</span>
                  <span className="text-xs text-gray-300 hidden md:inline">— {r.desc}</span>
                </div>
                {risk_level === r.level.split(" ")[0] && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${risk.badge}`}>← Your Sample</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Methodology used */}
        <div className="glass-card rounded-2xl p-6 mb-6 border border-gray-100">
          <p className="text-sm font-bold text-primary mb-4">⚙️ Analysis Method</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: "🧪", text: "K₂CO₃ density separation" },
              { icon: "🗂️", text: "Micro-filter paper" },
              { icon: "💡", text: "Cross-polarized light" },
              { icon: "👁️", text: "OpenCV contour detection" },
              { icon: "🧠", text: "CNN (MobileNetV2)" },
              { icon: "📐", text: "Area % calculation" },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-2 bg-primary/5 rounded-xl p-3">
                <span className="text-lg">{m.icon}</span>
                <span className="text-xs text-gray-600 font-medium">{m.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={downloadPDF}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-white font-bold px-10 py-4 rounded-full transition-all hover:scale-105 shadow-lg"
          >
            📄 Download PDF Report
          </button>
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center justify-center gap-2 bg-secondary hover:bg-cyan-400 text-white font-bold px-10 py-4 rounded-full transition-all hover:scale-105 shadow-lg shadow-secondary/30"
          >
            🔬 Analyze Another Sample
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-primary text-textdark font-semibold px-8 py-4 rounded-full transition-all"
          >
            🏠 Home
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes growBar {
          from { width: 0%; }
          to { width: ${confidence}%; }
        }
      `}</style>
    </div>
  );
}
