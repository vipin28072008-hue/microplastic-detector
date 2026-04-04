import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Processing from "./pages/Processing";
import Result from "./pages/Result";

export default function App() {
  // Shared state: uploaded image + analysis result
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/upload"
          element={
            <Upload
              setUploadedImage={setUploadedImage}
              setAnalysisResult={setAnalysisResult}
            />
          }
        />
        <Route
          path="/processing"
          element={
            <Processing
              uploadedImage={uploadedImage}
              setAnalysisResult={setAnalysisResult}
            />
          }
        />
        <Route
          path="/result"
          element={
            <Result
              uploadedImage={uploadedImage}
              analysisResult={analysisResult}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
