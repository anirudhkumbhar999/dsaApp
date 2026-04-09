import { useEffect, useMemo, useState } from "react";
import { getSessionQuiz } from "../services/api";

const SESSION_HISTORY_KEY = "sessionQuizHistory";

function readHistory() {
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeHistory(data) {
  try {
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(data));
  } catch {
    // no-op
  }
}

function Quiz({ sessionId, topicId, subtopicId }) {
  const [mode, setMode] = useState("step");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => readHistory());

  const answered = useMemo(
    () => Object.values(answers).filter((v) => typeof v === "number").length,
    [answers]
  );

  const score = useMemo(() => {
    if (!quiz?.questions) return 0;
    return quiz.questions.reduce((acc, q) => acc + (answers[q.id] === q.answerIndex ? 1 : 0), 0);
  }, [quiz, answers]);

  const loadQuiz = async () => {
    if (!sessionId) return;
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    try {
      const count = mode === "final" ? 8 : 1;
      const data = await getSessionQuiz(sessionId, mode, count);
      setQuiz(data);
    } catch {
      setQuiz(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (sessionId) {
      loadQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, mode]);

  const historyKey = `${topicId || "t"}-${subtopicId || "s"}`;
  const solved = history[historyKey] || [];

  const handleSubmit = () => {
    setSubmitted(true);
    if (!quiz?.questions?.length) return;
    const calculated = quiz.questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.answerIndex ? 1 : 0),
      0
    );
    const entry = {
      quizId: quiz.quizId || `session-${Date.now()}`,
      mode,
      score: calculated,
      total: quiz.questions.length,
      at: new Date().toISOString(),
      passed: calculated >= Math.ceil(quiz.questions.length * 0.6),
    };
    const next = {
      ...history,
      [historyKey]: [entry, ...solved].slice(0, 12),
    };
    setHistory(next);
    writeHistory(next);
  };

  return (
    <div className="quiz-panel">
      <div className="quiz-toolbar">
        <button
          className={`btn-secondary ${mode === "step" ? "is-active" : ""}`}
          onClick={() => setMode("step")}
        >
          Current Step Quiz
        </button>
        <button
          className={`btn-secondary ${mode === "final" ? "is-active" : ""}`}
          onClick={() => setMode("final")}
        >
          Final Universal Quiz
        </button>
        <span className="topic-meta">{loading ? "Generating quiz..." : "Auto-generated from current session context"}</span>
      </div>

      {!sessionId && <p className="topic-meta">Session not found. Open quiz from active tutor session.</p>}

      {quiz?.questions?.length > 0 && (
        <div className="quiz-list">
          <p className="topic-title">{quiz.quizTitle || "Session Quiz"}</p>
          <p className="topic-meta">
            Questions: {quiz.questions.length} | Answered: {answered}
          </p>

          {quiz.questions.map((q, idx) => (
            <div key={q.id || idx} className="quiz-question">
              <p className="quiz-q">
                Q{idx + 1}. {q.question}
              </p>
              <div className="quiz-options">
                {q.options.map((opt, optIdx) => {
                  const active = answers[q.id] === optIdx;
                  const correct = submitted && q.answerIndex === optIdx;
                  const wrong = submitted && active && q.answerIndex !== optIdx;
                  return (
                    <button
                      key={`${q.id}-${optIdx}`}
                      className={`quiz-option ${active ? "active" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                      disabled={submitted}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && <p className="quiz-exp">{q.explanation}</p>}
            </div>
          ))}

          <div className="quiz-actions">
            {!submitted ? (
              <button className="btn-primary" onClick={handleSubmit} disabled={answered === 0}>
                Submit
              </button>
            ) : (
              <p className="quiz-score">
                Score: {score}/{quiz.questions.length}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <p className="topic-title">Previous Solved (Temporary)</p>
        {solved.length === 0 ? (
          <p className="topic-meta">No solved quiz yet for this subtopic.</p>
        ) : (
          <div className="history-list">
            {solved.map((item) => (
              <div key={`${item.quizId}-${item.at}`} className="history-item">
                <span>{item.mode === "final" ? "Final Quiz" : "Step Quiz"}</span>
                <span>
                  {item.passed ? "✅" : "❌"} {item.score}/{item.total}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;