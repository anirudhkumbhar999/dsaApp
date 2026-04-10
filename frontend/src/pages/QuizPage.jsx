import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTopicQuizHistory,
  getTopicQuizSets,
  getTopics,
  saveTopicQuizHistory,
} from "../services/api";

function QuizPage() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [topics, setTopics] = useState([]);
  const [quizSets, setQuizSets] = useState([]);
  const [activeQuizEntry, setActiveQuizEntry] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getTopics().then((data) => {
      setTopics(Array.isArray(data) ? data : []);
    });
  }, []);

  useEffect(() => {
    const loadData = async (refresh = false) => {
      if (!topicId) return;
      setLoading(true);
      setHistoryLoading(true);
      try {
        const [setsData, historyData] = await Promise.all([
          getTopicQuizSets(topicId, 6, 5, refresh),
          getTopicQuizHistory(topicId),
        ]);
        setQuizSets(Array.isArray(setsData?.sets) ? setsData.sets : []);
        setHistory(Array.isArray(historyData?.attempts) ? historyData.attempts : []);
      } catch {
        setQuizSets([]);
        setHistory([]);
      } finally {
        setActiveQuizEntry(null);
        setAnswers({});
        setSubmitted(false);
        setLoading(false);
        setHistoryLoading(false);
      }
    };

    loadData();
  }, [topicId]);

  const activeQuiz = activeQuizEntry?.quiz || null;

  const selectedCount = useMemo(
    () => Object.values(answers).filter((value) => typeof value === "number").length,
    [answers]
  );

  const score = useMemo(() => {
    if (!activeQuiz?.questions?.length) return 0;
    return activeQuiz.questions.reduce((acc, question) => {
      return acc + (answers[question.id] === question.answerIndex ? 1 : 0);
    }, 0);
  }, [activeQuiz, answers]);

  const selectedTopic = topics.find((topic) => String(topic.id) === String(topicId));

  const solvedLookup = useMemo(() => {
    return history.reduce((acc, item) => {
      acc[item.quizId] = item;
      return acc;
    }, {});
  }, [history]);

  const unsolvedQuizSets = useMemo(() => {
    return quizSets.filter((entry) => !solvedLookup[entry.quiz.quizId]);
  }, [quizSets, solvedLookup]);

  const allCurrentQuizzesSolved =
    quizSets.length > 0 && quizSets.every((entry) => Boolean(solvedLookup[entry.quiz.quizId]));

  const openQuiz = (entry) => {
    setActiveQuizEntry(entry);
    setAnswers({});
    setSubmitted(false);
  };

  const reopenSolvedQuiz = (attempt) => {
    const matchedEntry = quizSets.find((entry) => entry.quiz.quizId === attempt.quizId);
    if (matchedEntry) {
      openQuiz(matchedEntry);
    }
  };

  const handleSubmit = async () => {
    if (!activeQuiz?.questions?.length || !topicId) return;

    const calculated = activeQuiz.questions.reduce(
      (acc, question) => acc + (answers[question.id] === question.answerIndex ? 1 : 0),
      0
    );
    const total = activeQuiz.questions.length;
    const passed = calculated >= Math.ceil(total * 0.6);

    setSubmitted(true);

    try {
      const saved = await saveTopicQuizHistory(topicId, {
        quizId: activeQuiz.quizId,
        quizTitle: activeQuiz.quizTitle,
        subtopicId: activeQuizEntry?.subtopicId || null,
        subtopicName: activeQuizEntry?.subtopicName || "",
        score: calculated,
        total,
        passed,
      });

      setHistory((prev) => [saved, ...prev.filter((item) => item.quizId !== saved.quizId)].slice(0, 20));
    } catch {
      // Keep the result visible even if saving fails.
    }
  };

  const handleGenerateNewQuizzes = async () => {
    if (!topicId) return;
    setLoading(true);
    try {
      const data = await getTopicQuizSets(topicId, 6, 5, true);
      setQuizSets(Array.isArray(data?.sets) ? data.sets : []);
      setActiveQuizEntry(null);
      setAnswers({});
      setSubmitted(false);
    } catch {
      // no-op
    }
    setLoading(false);
  };

  return (
    <div className="page">
      {!topicId && (
        <>
          <h1 className="page-title">Universal Topic Quizzes</h1>
          <p className="page-subtitle">Pick one topic to open multiple quizzes, each centered on a different subtopic.</p>
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
              {selectedTopic ? selectedTopic.name : `Topic ${topicId}`} - subtopic-focused quiz sets
            </p>
            {allCurrentQuizzesSolved ? (
              <button className="btn-primary" onClick={handleGenerateNewQuizzes} disabled={loading}>
                Generate New Quizzes
              </button>
            ) : null}
          </div>

          {loading ? <p className="page-subtitle">Generating quizzes for topic subtopics...</p> : null}

          {!activeQuiz && (
            <div className="subtopic-layout">
              <div className="grid cards-2">
                {unsolvedQuizSets.length === 0 ? (
                  <div className="card">
                    <p className="topic-title">No Unsolved Quizzes</p>
                    <p className="topic-meta">
                      {allCurrentQuizzesSolved
                        ? "All current quizzes are solved. Generate a new batch when you want a fresh set."
                        : "New quizzes will appear here when available."}
                    </p>
                  </div>
                ) : unsolvedQuizSets.map((entry) => {
                  return (
                    <div key={entry.id} className="card">
                      <p className="topic-title">{entry.subtopicName || entry.quiz.quizTitle || `Quiz ${entry.id}`}</p>
                      <p className="topic-meta">{entry.quiz.quizTitle || "Universal topic quiz"}</p>
                      <p className="topic-meta">Subtopic: {entry.subtopicName || "Mixed topic coverage"}</p>
                      <p className="topic-meta">Questions: {entry.quiz.questions?.length || 0}</p>
                      <p className="topic-meta">Ready to solve</p>
                      <button className="btn-primary" onClick={() => openQuiz(entry)}>
                        Take Quiz
                      </button>
                    </div>
                  );
                })}
              </div>

              <aside className="subtopic-side">
                <div className="card">
                  <p className="topic-title">Solved Quizzes</p>
                  {historyLoading ? (
                    <p className="topic-meta">Loading solved quizzes...</p>
                  ) : history.length === 0 ? (
                    <p className="topic-meta">No solved quizzes yet for this topic.</p>
                  ) : (
                    <div className="grid">
                      {history.map((item) => (
                        <div key={`${item.quizId}-${item.at}`} className="card">
                          <p className="topic-title">{item.subtopicName || item.quizTitle}</p>
                          <p className="topic-meta">{item.quizTitle}</p>
                          <p className="topic-meta">
                            Score: {item.score}/{item.total} {item.passed ? "(Passed)" : "(Retry needed)"}
                          </p>
                          <button
                            className="btn-secondary"
                            onClick={() => reopenSolvedQuiz(item)}
                            disabled={!quizSets.some((entry) => entry.quiz.quizId === item.quizId)}
                          >
                            Re-attempt
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}

          {activeQuiz && (
            <div className="subtopic-layout">
              <div className="card">
                <div className="quiz-toolbar">
                  <div>
                    <p className="topic-title">{activeQuizEntry?.subtopicName || activeQuiz.quizTitle}</p>
                    <p className="topic-meta">{activeQuiz.quizTitle}</p>
                  </div>
                  <button className="btn-secondary" onClick={() => setActiveQuizEntry(null)}>
                    Back to Quiz Sets
                  </button>
                </div>

                <p className="topic-meta">
                  Questions: {activeQuiz.questions.length} | Answered: {selectedCount}
                </p>

                <div className="quiz-list">
                  {activeQuiz.questions.map((question, index) => (
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
                </div>

                <div className="quiz-actions">
                  {!submitted ? (
                    <button className="btn-primary" onClick={handleSubmit} disabled={selectedCount !== activeQuiz.questions.length}>
                      Submit Quiz
                    </button>
                  ) : (
                    <p className="quiz-score">
                      Result: {score}/{activeQuiz.questions.length}
                    </p>
                  )}
                </div>
              </div>

              <aside className="subtopic-side">
                <div className="card">
                  <p className="topic-title">Solved Quizzes</p>
                  {history.length === 0 ? (
                    <p className="topic-meta">No solved quizzes yet for this topic.</p>
                  ) : (
                    <div className="grid">
                      {history.map((item) => (
                        <div key={`${item.quizId}-${item.at}`} className="card">
                          <p className="topic-title">{item.subtopicName || item.quizTitle}</p>
                          <p className="topic-meta">{item.quizTitle}</p>
                          <p className="topic-meta">
                            Score: {item.score}/{item.total} {item.passed ? "(Passed)" : "(Retry needed)"}
                          </p>
                          <button
                            className="btn-secondary"
                            onClick={() => reopenSolvedQuiz(item)}
                            disabled={!quizSets.some((entry) => entry.quiz.quizId === item.quizId)}
                          >
                            Re-attempt
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default QuizPage;
