import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const features = [
    {
      icon: "🔬",
      title: "Polarized Optical Sensing",
      desc: "Uses birefringence properties of plastics to detect particles invisible to normal light.",
    },
    {
      icon: "🤖",
      title: "AI-Powered CNN",
      desc: "Deep learning model classifies PE, PP, and PET microplastics with high accuracy.",
    },
    {
      icon: "📊",
      title: "Instant Risk Report",
      desc: "Get percentage contamination, plastic type, confidence score and risk level in seconds.",
    },
    {
      icon: "🌊",
      title: "Water Safety Focus",
      desc: "Designed to assess drinking water, wastewater, and environmental water samples.",
    },
  ];

  const steps = [
    { num: "01", title: "Upload Sample", desc: "Upload your polarized microscope water image" },
    { num: "02", title: "AI Analysis", desc: "CNN model processes and detects microplastics" },
    { num: "03", title: "Get Report", desc: "View results and download detailed PDF report" },
  ];

  return (
    <div className="min-h-screen bg-bglight">
      {/* ── NAVBAR ── */}
      <nav className="water-bg shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔬</span>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">MicroPlastic</h1>
              <p className="text-secondary text-xs font-medium tracking-widest uppercase">Detector</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/80 hover:text-secondary text-sm font-medium transition-colors">Features</a>
            <a href="#how" className="text-white/80 hover:text-secondary text-sm font-medium transition-colors">How It Works</a>
            <button
              onClick={() => navigate("/upload")}
              className="bg-secondary hover:bg-cyan-400 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 hover:scale-105"
            >
              Start Analysis
            </button>
          </div>
          {/* Mobile button */}
          <button
            onClick={() => navigate("/upload")}
            className="md:hidden bg-secondary text-white text-xs font-semibold px-4 py-2 rounded-full"
          >
            Analyze
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="water-bg relative overflow-hidden">
        {/* Animated water circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-blue-300/10 blur-3xl animate-pulse" style={{animationDelay:'1s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-3xl"></div>
        </div>

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-secondary/40"
            style={{
              left: `${10 + i * 8}%`,
              top: `${20 + (i % 4) * 20}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out ${i * 0.3}s infinite alternate`,
            }}
          />
        ))}

        <div className={`max-w-5xl mx-auto px-6 py-24 md:py-32 text-center relative z-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-white/10 text-secondary text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-secondary/30">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            AI-Powered Water Quality Analysis
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Detect{" "}
            <span className="text-secondary">Microplastics</span>
            <br />in Water Samples
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload a polarized microscope image of your water sample. Our AI analyzes it instantly — detecting presence, percentage, plastic type, and risk level.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/upload")}
              className="group bg-secondary hover:bg-cyan-400 text-white font-bold px-10 py-4 rounded-full text-lg shadow-lg shadow-secondary/30 transition-all duration-200 hover:scale-105 hover:shadow-secondary/50 flex items-center justify-center gap-3"
            >
              <span>🚀</span>
              Start Analysis
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <a
              href="#how"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-10 py-4 rounded-full text-lg border border-white/20 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>📖</span>
              How It Works
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { val: "80%+", label: "Accuracy" },
              { val: "3", label: "Plastic Types" },
              { val: "< 5s", label: "Analysis Time" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <div className="text-secondary font-extrabold text-2xl">{s.val}</div>
                <div className="text-white/60 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <div className="relative h-16">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F5F7FA" />
          </svg>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-secondary text-sm font-semibold tracking-widest uppercase">Capabilities</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mt-2">
            Why Use <span className="gradient-text">MicroPlastic Detector?</span>
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Combining cutting-edge polarized optical sensing with deep learning for fast, reliable water quality assessment.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 hover-lift"
              style={{ animation: `fadeIn 0.6s ease-out ${0.1 + i * 0.1}s forwards`, opacity: 0 }}
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-primary text-base mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="bg-primary/5 dots-bg py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-secondary text-sm font-semibold tracking-widest uppercase">Process</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mt-2">How It Works</h2>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {steps.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-secondary to-secondary/20 z-0"></div>
                )}
                <div className="w-16 h-16 rounded-full water-bg flex items-center justify-center text-secondary font-extrabold text-xl shadow-lg mb-4 relative z-10 border-4 border-white">
                  {s.num}
                </div>
                <h3 className="font-bold text-primary text-lg mb-1">{s.title}</h3>
                <p className="text-gray-500 text-sm px-4">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── METHODOLOGY SECTION ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-secondary text-sm font-semibold tracking-widest uppercase">Science</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mt-2">Our Methodology</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "🧪", step: "Step 1–2", title: "Sample Prep", desc: "K₂CO₃ density separation floats microplastics. Micro filter paper captures particles for imaging." },
            { icon: "💡", step: "Step 3", title: "Polarized Imaging", desc: "Cross-polarized light exploits birefringence — plastics glow bright, other particles stay dark." },
            { icon: "🧠", step: "Step 4–5", title: "AI Detection", desc: "OpenCV detects contours. CNN classifies PE, PP, PET. Percentage calculated from particle areas." },
          ].map((m, i) => (
            <div key={i} className="glass-card rounded-2xl p-8 border-t-4 border-secondary hover-lift">
              <div className="text-3xl mb-3">{m.icon}</div>
              <div className="text-xs text-secondary font-bold uppercase tracking-widest mb-1">{m.step}</div>
              <h3 className="font-bold text-primary text-lg mb-2">{m.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="water-bg py-16 relative overflow-hidden">
        <div className="absolute inset-0 dots-bg opacity-10"></div>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to Analyze Your Water Sample?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Upload a polarized microscope image and get your full microplastic report in seconds.
          </p>
          <button
            onClick={() => navigate("/upload")}
            className="bg-secondary hover:bg-cyan-400 text-white font-bold px-12 py-4 rounded-full text-lg shadow-lg shadow-secondary/30 transition-all duration-200 hover:scale-105"
          >
            🔬 Start Free Analysis
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-primary py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔬</span>
            <span className="text-white font-bold">MicroPlastic Detector</span>
          </div>
          <p className="text-white/40 text-sm text-center">
            B.Tech AI & DS Project — Microplastic Detection Using Polarized Optical Sensing & AI
          </p>
          <p className="text-white/40 text-sm">© 2025</p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px); }
          to { transform: translateY(-12px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
