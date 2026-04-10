import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Tutor from "./pages/Tutor";
import ProblemsPage from "./pages/ProblemsPage";
import NotesPage from "./pages/NotesPage";
import Topics from "./components/Topics";
import AppShell from "./components/layout/AppShell";
import PlaceholderPage from "./pages/PlaceholderPage";
import QuizPage from "./pages/QuizPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Topics />} />
          <Route path="/learn/:topicId" element={<Learn />} />
          <Route path="/tutor/:topicId/:subtopicId/:sessionId" element={<Tutor />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/problems/topic/:topicId" element={<ProblemsPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/quiz/topic/:topicId" element={<QuizPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route
            path="/compiler"
            element={<PlaceholderPage title="Compiler" description="Code compiler integration is planned and will be integrated soon." />}
          />
          <Route
            path="/learn/:topicId/:subtopicId/:sessionId"
            element={<Navigate to="/learn" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
