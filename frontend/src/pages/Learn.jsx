import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSubtopics, getSubtopicQuiz, startSession } from "../services/api";
import { useSubtopicBarProgress } from "../hooks/useSubtopicBarProgress";
import { getRecord } from "../utils/leetcodeProblemProgress";

function Learn() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const topicName = location.state?.topicName || `Topic ${topicId}`;

  const [subtopics, setSubtopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingSessionId, setCreatingSessionId] = useState(null);
  const [sessionQuizHistory, setSessionQuizHistory] = useState({});
  const [openQuizSubtopicId, setOpenQuizSubtopicId] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const problemProgress = useSubtopicBarProgress(topicId, subtopics);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sessionQuizHistory");
      setSessionQuizHistory(raw ? JSON.parse(raw) : {});
    } catch {
      setSessionQuizHistory({});
    }
  }, []);

  const openSubtopicQuiz = async (subtopicId) => {
    setOpenQuizSubtopicId(subtopicId);
    setQuizLoading(true);
    setQuizSubmitted(false);
    setQuizAnswers({});
    try {
      const data = await getSubtopicQuiz(topicId, subtopicId, "", 4);
      setQuizData(data);
    } catch {
      setQuizData(null);
    }
    setQuizLoading(false);
  };

  const submitSubtopicQuiz = (sub) => {
    if (!quizData?.questions?.length) return;
    const score = quizData.questions.reduce(
      (acc, q) => acc + (quizAnswers[q.id] === q.answerIndex ? 1 : 0),
      0
    );
    const total = quizData.questions.length;
    const passed = score >= Math.ceil(total * 0.6);
    const key = `${topicId}-${sub.id}`;
    const entry = {
      quizId: quizData.quizId || `subtopic-${Date.now()}`,
      mode: "subtopic-card",
      score,
      total,
      passed,
      at: new Date().toISOString(),
    };
    const next = {
      ...sessionQuizHistory,
      [key]: [entry, ...(sessionQuizHistory[key] || [])].slice(0, 12),
    };
    setSessionQuizHistory(next);
    try {
      localStorage.setItem("sessionQuizHistory", JSON.stringify(next));
    } catch {
      // no-op
    }
    setQuizSubmitted(true);
  };

  // 🔹 Fetch subtopics
  useEffect(() => {
    if (!topicId) {
      setSubtopics([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    getSubtopics(topicId)
      .then((data) => {
        if (mounted) {
          setSubtopics(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (mounted) {
          setSubtopics([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [topicId]);

  // 🔹 Handle subtopic click → start session
  const handleSubtopicClick = async (subtopicId) => {
    try {
      setCreatingSessionId(subtopicId);
      const data = await startSession(topicId, subtopicId);
      const sessionId = data.sessionId;
      const selectedSubtopic = subtopics.find((sub) => String(sub.id) === String(subtopicId));

      navigate(`/tutor/${topicId}/${subtopicId}/${sessionId}`, {
        state: {
          topicName,
          subtopicName: selectedSubtopic?.name || `Subtopic ${subtopicId}`,
        },
      });
    } catch (error) {
      console.error("Error starting session:", error);
    } finally {
      setCreatingSessionId(null);
    }
  };

  return (
    <div className="page">
      <p className="page-subtitle">Topics / {topicName}</p>
      <h1 className="page-title">{topicName}</h1>
      {!topicId && <p>Please select a topic first.</p>}
      <p className="page-subtitle">Choose a subtopic and start tutor learning.</p>

      {loading ? (
        <p className="page-subtitle">Loading subtopics...</p>
      ) : (
        <div className="subtopic-layout">
          <div className="grid cards-2">
            {subtopics.map((sub) => {
              const key = `${topicId}-${sub.id}`;
              const solved = sessionQuizHistory[key]?.[0];
              const p = problemProgress[sub.id] || {
                solved: 0,
                total: 15,
                percent: 0,
                catalogKnown: false,
              };
              const barPct = p.catalogKnown ? p.percent : 0;
              return (
                <div key={sub.id} className="card">
                  <p className="topic-title">{sub.name}</p>
                  <p className="topic-meta">Intuition -> Brute Force -> Optimized -> Patterns -> Code -> Practice</p>
                  <div className="subtopic-progress">
                    <div className="subtopic-progress-top">
                      <span>Solved / catalog</span>
                      <span>
                        {p.solved}/{p.catalogKnown ? p.total : "—"}{" "}
                        {p.catalogKnown ? `(${p.percent}%)` : "(open Problems)"}
                      </span>
                    </div>
                    <div className="subtopic-progress-bar">
                      <div className="subtopic-progress-fill" style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                  {solved ? (
                    <p className="topic-meta">
                      Last Quiz: {solved.passed ? "✅" : "❌"} {solved.score}/{solved.total}
                    </p>
                  ) : (
                    <p className="topic-meta">No solved quiz yet</p>
                  )}
                  <div className="action-row">
                    <button
                      className="btn-primary"
                      onClick={() => handleSubtopicClick(sub.id)}
                      disabled={creatingSessionId === sub.id}
                    >
                      {creatingSessionId === sub.id ? "Starting..." : "Tutor"}
                    </button>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() =>
                        navigate(`/problems/topic/${topicId}/subtopic/${sub.id}`, {
                          state: { topicName, subtopicName: sub.name },
                        })
                      }
                    >
                      Problems
                    </button>
                    <button className="btn-secondary" type="button">
                      Notes
                    </button>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => openSubtopicQuiz(sub.id)}
                    >
                      Take Quiz
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          <aside className="subtopic-side">
            <div className="card">
              <p className="topic-title">Notes</p>
              <p className="topic-meta">
                Temporary note panel for this topic. We can connect this to AI-generated notes and cloud storage later.
              </p>
            </div>
            <div className="card">
              <p className="topic-title">Solved problems (local)</p>
              <p className="topic-meta">
                Marks sync with the Problems page and Tutor tab. Open a slug on LeetCode from the list below.
              </p>
              <div className="learn-solved-by-subtopic">
                {subtopics.map((sub) => {
                  const rec = getRecord(topicId, sub.id);
                  const slugs = rec.solvedSlugs.slice(0, 8);
                  return (
                    <div key={`p-${sub.id}`} className="learn-solved-block">
                      <div className="learn-solved-block-head">
                        <span>{sub.name}</span>
                        <button
                          type="button"
                          className="btn-secondary btn-compact"
                          onClick={() =>
                            navigate(`/problems/topic/${topicId}/subtopic/${sub.id}`, {
                              state: { topicName, subtopicName: sub.name },
                            })
                          }
                        >
                          Open bank
                        </button>
                      </div>
                      {slugs.length === 0 ? (
                        <p className="topic-meta learn-solved-empty">No problems marked yet.</p>
                      ) : (
                        <ul className="learn-solved-slugs">
                          {slugs.map((slug) => (
                            <li key={slug}>
                              <a
                                href={`https://leetcode.com/problems/${slug}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="learn-solved-link"
                              >
                                {slug.replace(/-/g, " ")}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <p className="topic-title">Quiz History (Local)</p>
              <div className="history-list">
                {subtopics.map((sub) => {
                  const key = `${topicId}-${sub.id}`;
                  const latest = sessionQuizHistory[key]?.[0];
                  return (
                    <div key={`h-${sub.id}`} className="history-item">
                      <span>{sub.name}</span>
                      <span>{latest ? `${latest.passed ? "✅" : "❌"} ${latest.score}/${latest.total}` : "-"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}

      {openQuizSubtopicId && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal">
            <div className="quiz-modal-header">
              <p className="topic-title">
                {subtopics.find((s) => s.id === openQuizSubtopicId)?.name || "Subtopic"} Quiz
              </p>
              <button
                className="btn-secondary"
                onClick={() => {
                  setOpenQuizSubtopicId(null);
                  setQuizData(null);
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                }}
              >
                Close
              </button>
            </div>

            {quizLoading && <p className="topic-meta">Generating quiz...</p>}

            {!quizLoading && quizData?.questions?.length > 0 && (
              <div className="quiz-list">
                <p className="topic-meta">{quizData.quizTitle || "Subtopic Quiz"}</p>
                {quizData.questions.map((q, idx) => (
                  <div key={q.id || idx} className="quiz-question">
                    <p className="quiz-q">
                      Q{idx + 1}. {q.question}
                    </p>
                    <div className="quiz-options">
                      {q.options.map((opt, optIdx) => {
                        const active = quizAnswers[q.id] === optIdx;
                        const correct = quizSubmitted && q.answerIndex === optIdx;
                        const wrong = quizSubmitted && active && q.answerIndex !== optIdx;
                        return (
                          <button
                            key={`${q.id}-${optIdx}`}
                            className={`quiz-option ${active ? "active" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                            onClick={() =>
                              setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                            }
                            disabled={quizSubmitted}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && <p className="quiz-exp">{q.explanation}</p>}
                  </div>
                ))}
                <div className="quiz-actions">
                  {!quizSubmitted ? (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        const sub = subtopics.find((s) => s.id === openQuizSubtopicId);
                        if (sub) submitSubtopicQuiz(sub);
                      }}
                    >
                      Submit
                    </button>
                  ) : (
                    <p className="quiz-score">
                      Saved to side history
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Learn;
