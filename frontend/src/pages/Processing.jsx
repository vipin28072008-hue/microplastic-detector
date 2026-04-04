import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ⚠️ IMPORTANT: Change this URL to your deployed backend URL after deployment!
// For local testing use: "http://localhost:5000"
// For production use: "https://your-backend.onrender.com"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const STEPS = [
  { label: "Uploading image...", icon: "📤", pct: 10 },
  { label: "Preprocessing with OpenCV...", icon: "🖼️", pct: 30 },
  { label: "Detecting particles...", icon: "🔍", pct: 50 },
  { label: "Identifying microplastics...", icon: "🔬", pct: 65 },
  { label: "Running CNN model...", icon: "🤖", pct: 80 },
  { label: "Calculating percentage...", icon: "📊", pct: 92 },
  { label: "Generating report...", icon: "📋", pct: 100 },
];

export default function Processing({ uploadedImage, setAnalysisResult }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!uploadedImage) { navigate("/upload"); return; }
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Animate steps while API call runs in background
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < STEPS.length - 1) {
        stepIndex++;
        setCurrentStep(stepIndex);
        setProgress(STEPS[stepIndex].pct);
      }
    }, 900);

    // Call real backend
    const callAPI = async () => {
      try {
        const formData = new FormData();
        formData.append("image", uploadedImage.file);
        const response = await axios.post(`${BACKEND_URL}/analyze`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
        });
        clearInterval(stepInterval);
        setCurrentStep(STEPS.length - 1);
        setProgress(100);
        setAnalysisResult(response.data);
        setTimeout(() => navigate("/result"), 800);
      } catch (err) {
        clearInterval(stepInterval);
        // ── DEMO MODE: If backend not available, use mock data ──
        console.warn("Backend not available — using demo mode:", err.message);
        const mockResult = generateMockResult();
        setAnalysisResult(mockResult);
        setCurrentStep(STEPS.length - 1);
        setProgress(100);
        setTimeout(() => navigate("/result"), 800);
      }
    };

    callAPI();
    return () => clearInterval(stepInterval);
  }, []);

  const generateMockResult = () => {
    const pct = parseFloat((Math.random() * 45 + 2).toFixed(2));
    const types = ["PE", "PP", "PET"];
    const plastic_type = types[Math.floor(Math.random() * types.length)];
    const confidence = parseFloat((75 + Math.random() * 20).toFixed(1));
    const risk = pct <= 10 ? "Low" : pct <= 30 ? "Medium" : "High";
    return {
      microplastic_present: pct > 5,
      percentage: pct,
      plastic_type: pct > 5 ? plastic_type : "None",
      confidence,
      risk_level: risk,
      annotated_image: null,
      demo_mode: true,
    };
  };

  return (
    <div className="min-h-screen ai-dark-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-secondary/10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl animate-pulse" style={{animationDelay:'1.5s'}}></div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-secondary/20"
          style={{
            width: `${2 + (i % 4)}px`,
            height: `${2 + (i % 4)}px`,
            left: `${5 + i * 4.5}%`,
            top: `${10 + (i % 8) * 10}%`,
            animation: `floatUp ${4 + (i % 4)}s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}

      <div className="relative z-10 max-w-lg w-full mx-auto px-6 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <span className="text-2xl">🔬</span>
          <span className="text-white/60 text-sm font-semibold tracking-widest uppercase">MicroPlastic Detector</span>
        </div>

        {/* Main spinner */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" style={{animationDuration:'1.2s'}}></div>
          {/* Middle ring */}
          <div className="absolute inset-3 rounded-full border-4 border-blue-400/20 border-b-blue-400 animate-spin" style={{animationDuration:'2s', animationDirection:'reverse'}}></div>
          {/* Inner icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl" style={{ animation: 'iconPulse 1.5s ease-in-out infinite' }}>
              {STEPS[currentStep]?.icon}
            </span>
          </div>
        </div>

        {/* Step label */}
        <div className="mb-8">
          <h2 className="text-white font-bold text-2xl mb-2">AI Analyzing...</h2>
          <p
            key={currentStep}
            className="text-secondary text-lg font-medium"
            style={{ animation: 'fadeSlide 0.4s ease-out forwards' }}
          >
            {STEPS[currentStep]?.label}
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-white/10 rounded-full h-3 mb-6 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #0B3C5D, #00B4D8)',
              boxShadow: '0 0 10px rgba(0,180,216,0.6)',
            }}
          ></div>
        </div>

        {/* Percentage */}
        <p className="text-white/50 text-sm mb-10">{progress}% complete</p>

        {/* Steps checklist */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-left space-y-2">
          {STEPS.slice(0, 6).map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                i < currentStep
                  ? 'text-success'
                  : i === currentStep
                  ? 'text-white'
                  : 'text-white/30'
              }`}
            >
              <span className="text-base">
                {i < currentStep ? '✓' : i === currentStep ? '◉' : '○'}
              </span>
              <span>{step.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 bg-danger/10 border border-danger/30 rounded-xl p-4 text-danger text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0px); opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-30px); opacity: 0.1; }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
