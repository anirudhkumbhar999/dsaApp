import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTopicQuizSets, getTopics } from "../services/api";

const TOPIC_QUIZ_HISTORY_KEY = "topicQuizHistory";

function readTopicHistory() {
  try {
    const raw = localStorage.getItem(TOPIC_QUIZ_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeTopicHistory(data) {
  try {
    localStorage.setItem(TOPIC_QUIZ_HISTORY_KEY, JSON.stringify(data));
  } catch {
    // no-op
  }
}

function QuizPage() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [topics, setTopics] = useState([]);
  const [quizSets, setQuizSets] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => readTopicHistory());

  useEffect(() => {
    getTopics().then((data) => {
      const safe = Array.isArray(data) ? data : [];
      setTopics(safe);
    });
  }, []);

  useEffect(() => {
    const loadSets = async () => {
      if (!topicId) return;
      setLoading(true);
      try {
        const data = await getTopicQuizSets(topicId, 4, 5);
        setQuizSets(data?.sets || []);
      } catch {
        setQuizSets([]);
      }
      setActiveQuiz(null);
      setAnswers({});
      setSubmitted(false);
      setLoading(false);
    };
    loadSets();
  }, [topicId]);

  const selectedCount = useMemo(
    () => Object.values(answers).filter((v) => typeof v === "number").length,
    [answers]
  );

  const score = useMemo(() => {
    if (!activeQuiz?.questions) return 0;
    return activeQuiz.questions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.answerIndex ? 1 : 0);
    }, 0);
  }, [activeQuiz, answers]);

  const selectedTopic = topics.find((t) => String(t.id) === String(topicId));
  const topicHistory = history[String(topicId)] || {};

  const handleSubmit = () => {
    if (!activeQuiz?.questions?.length) return;
    setSubmitted(true);
    const calculated = activeQuiz.questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.answerIndex ? 1 : 0),
      0
    );
    const pass = calculated >= Math.ceil(activeQuiz.questions.length * 0.6);
    const next = {
      ...history,
      [String(topicId)]: {
        ...topicHistory,
        [activeQuiz.quizId]: {
          score: calculated,
          total: activeQuiz.questions.length,
          passed: pass,
          at: new Date().toISOString(),
          title: activeQuiz.quizTitle,
        },
      },
    };
    setHistory(next);
    writeTopicHistory(next);
  };

  return (
    <div className="page">
      {!topicId && (
        <>
          <h1 className="page-title">Universal Topic Quizzes</h1>
          <p className="page-subtitle">Pick one topic card to open multiple AI quiz sets.</p>
          <div className="topic-cloud">
            {topics.map((topic) => (
              <button
                key={topic.id}
                className="floating-topic"
                onClick={() => navigate(`/quiz/topic/${topic.id}`)}
              >
                {topic.name}
              </button>
            ))}
          </div>
        </>
      )}

      {topicId && (
        <>
          <div className="quiz-toolbar">
            <button className="btn-secondary" onClick={() => navigate("/quiz")}>
              Back to Topics
            </button>
            <p className="page-subtitle">
              {selectedTopic ? selectedTopic.name : `Topic ${topicId}`} - quiz sets
            </p>
          </div>

          {loading ? <p className="page-subtitle">Generating topic quiz sets...</p> : null}

          {!activeQuiz && (
            <div className="grid cards-2">
              {quizSets.map((item) => {
                const done = topicHistory[item.quiz.quizId];
                return (
                  <div key={item.id} className="card">
                    <p className="topic-title">{item.quiz.quizTitle || `Quiz ${item.id}`}</p>
                    <p className="topic-meta">Focus: {item.focus}</p>
                    <p className="topic-meta">Questions: {item.quiz.questions?.length || 0}</p>
                    <p className="topic-meta">
                      {done ? `✅ Completed ${done.score}/${done.total}` : "Not completed yet"}
                    </p>
                    <button className="btn-primary" onClick={() => setActiveQuiz(item.quiz)}>
                      Take Quiz
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeQuiz && (
            <div className="card">
              <div className="quiz-toolbar">
                <p className="topic-title">{activeQuiz.quizTitle}</p>
                <button className="btn-secondary" onClick={() => setActiveQuiz(null)}>
                  Back to Quiz Sets
                </button>
              </div>

              <p className="topic-meta">
                Questions: {activeQuiz.questions.length} | Answered: {selectedCount}
              </p>

              <div className="quiz-list">
                {activeQuiz.questions.map((q, idx) => (
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
              </div>

              <div className="quiz-actions">
                {!submitted ? (
                  <button className="btn-primary" onClick={handleSubmit} disabled={selectedCount === 0}>
                    Submit
                  </button>
                ) : (
                  <p className="quiz-score">
                    Score: {score}/{activeQuiz.questions.length}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default QuizPage;
