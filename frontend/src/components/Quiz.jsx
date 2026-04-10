import { useEffect, useMemo, useState } from "react";
import {
  getSessionQuiz,
  getSessionQuizHistory,
  saveSessionQuizHistory,
} from "../services/api";

function Quiz({ sessionId }) {
  const [mode, setMode] = useState("step");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const answered = useMemo(
    () => Object.values(answers).filter((value) => typeof value === "number").length,
    [answers]
  );

  const score = useMemo(() => {
    if (!quiz?.questions?.length) return 0;
    return quiz.questions.reduce((acc, question) => acc + (answers[question.id] === question.answerIndex ? 1 : 0), 0);
  }, [quiz, answers]);

  const loadHistory = async () => {
    if (!sessionId) return;
    setHistoryLoading(true);
    try {
      const data = await getSessionQuizHistory(sessionId);
      setHistory(Array.isArray(data?.attempts) ? data.attempts : []);
    } catch {
      setHistory([]);
    }
    setHistoryLoading(false);
  };

  const loadQuiz = async (nextMode = mode) => {
    if (!sessionId) return;
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    try {
      const count = nextMode === "final" ? 8 : 1;
      const data = await getSessionQuiz(sessionId, nextMode, count);
      setQuiz(data);
      setMode(nextMode);
    } catch {
      setQuiz(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!sessionId) return;
    loadQuiz("step");
    loadHistory();
  }, [sessionId]);

  const handleSubmit = async () => {
    if (!quiz?.questions?.length || !sessionId) return;

    const calculated = quiz.questions.reduce(
      (acc, question) => acc + (answers[question.id] === question.answerIndex ? 1 : 0),
      0
    );
    const total = quiz.questions.length;
    const passed = calculated >= Math.ceil(total * 0.6);
    const savedPayload = {
      quizId: quiz.quizId || `session-${Date.now()}`,
      quizTitle: quiz.quizTitle || "Session Quiz",
      mode,
      step: quiz?.meta?.step || "",
      score: calculated,
      total,
      passed,
    };

    setSubmitted(true);

    try {
      const saved = await saveSessionQuizHistory(sessionId, savedPayload);
      setHistory((prev) => [saved, ...prev.filter((item) => item.quizId !== saved.quizId)].slice(0, 20));
    } catch {
      // Keep result visible even if save fails.
    }
  };

  const reattemptQuiz = async (attempt) => {
    await loadQuiz(attempt.mode === "final" ? "final" : "step");
  };

  return (
    <div className="subtopic-layout">
      <div className="quiz-panel">
        <div className="quiz-toolbar">
          <button
            className={`btn-secondary ${mode === "step" ? "is-active" : ""}`}
            onClick={() => loadQuiz("step")}
            disabled={loading}
          >
            Current Step Quiz
          </button>
          <button
            className={`btn-secondary ${mode === "final" ? "is-active" : ""}`}
            onClick={() => loadQuiz("final")}
            disabled={loading}
          >
            Final Universal Quiz
          </button>
          <span className="topic-meta">
            {loading ? "Generating quiz..." : "Generated from current tutor chat and teaching flow"}
          </span>
        </div>

        {!sessionId && <p className="topic-meta">Session not found. Open quiz from active tutor session.</p>}

        {quiz?.questions?.length > 0 && (
          <div className="quiz-list">
            <p className="topic-title">{quiz.quizTitle || "Session Quiz"}</p>
            <p className="topic-meta">
              Step: {quiz?.meta?.step || "Current"} | Questions: {quiz.questions.length} | Answered: {answered}
            </p>

            {quiz.questions.map((question, index) => (
              <div key={question.id || index} className="quiz-question">
                <p className="quiz-q">
                  Q{index + 1}. {question.question}
                </p>
                <div className="quiz-options">
                  {question.options.map((option, optionIndex) => {
                    const active = answers[question.id] === optionIndex;
                    const correct = submitted && question.answerIndex === optionIndex;
                    const wrong = submitted && active && question.answerIndex !== optionIndex;
                    return (
                      <button
                        key={`${question.id}-${optionIndex}`}
                        className={`quiz-option ${active ? "active" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                        onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                        disabled={submitted}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {submitted && <p className="quiz-exp">{question.explanation}</p>}
              </div>
            ))}

            <div className="quiz-actions">
              {!submitted ? (
                <button className="btn-primary" onClick={handleSubmit} disabled={answered !== quiz.questions.length}>
                  Submit Quiz
                </button>
              ) : (
                <p className="quiz-score">
                  Result: {score}/{quiz.questions.length}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <aside className="subtopic-side">
        <div className="card">
          <p className="topic-title">Solved Quizzes</p>
          {historyLoading ? (
            <p className="topic-meta">Loading solved quizzes...</p>
          ) : history.length === 0 ? (
            <p className="topic-meta">No solved quiz yet for this session.</p>
          ) : (
            <div className="grid">
              {history.map((item) => (
                <div key={`${item.quizId}-${item.at}`} className="card">
                  <p className="topic-title">{item.mode === "final" ? "Final Quiz" : "Step Quiz"}</p>
                  <p className="topic-meta">{item.quizTitle}</p>
                  <p className="topic-meta">Flow Step: {item.step || "Current"}</p>
                  <p className="topic-meta">
                    Score: {item.score}/{item.total} {item.passed ? "(Passed)" : "(Retry needed)"}
                  </p>
                  <button className="btn-secondary" onClick={() => reattemptQuiz(item)}>
                    Re-attempt
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default Quiz;
