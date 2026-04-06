import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Tutor from "./pages/Tutor";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn/:topicId" element={<Learn />} />
        <Route path="/learn/:topicId/:subtopicId/:sessionId" element={<Tutor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;