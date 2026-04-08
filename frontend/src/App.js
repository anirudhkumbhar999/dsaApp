import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Tutor from "./pages/Tutor";
import ProblemsPage from "./pages/ProblemsPage";

function App() {
  return (
    <Router>

      <Header /> {/* ✅ GLOBAL HEADER */}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn/:topicId" element={<Learn />} />
        <Route path="/learn/:topicId/:subtopicId/:sessionId" element={<Tutor />} />
        <Route path="/problems" element={<ProblemsPage />} />
      </Routes>

    </Router>
  );
}

export default App;