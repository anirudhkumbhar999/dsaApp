import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getTeaching, sendMessage } from "../services/api";

import Problems from "../components/Problems";
import Compiler from "../components/Compiler";
import Notes from "../components/Notes";
import Quiz from "../components/Quiz";

import "./Tutor.css";

function Tutor() {
  const { topicId, subtopicId, sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const topicName = location.state?.topicName || `Topic ${topicId}`;
  const subtopicName = location.state?.subtopicName || `Subtopic ${subtopicId}`;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const [activeTab, setActiveTab] = useState("tutor");

  useEffect(() => {
    let mounted = true;

    const loadInitialTeaching = async () => {
      setLoading(true);

      try {
        const data = await getTeaching(topicId, subtopicId, sessionId);
        if (!mounted) return;

        const badInitialReply =
          !data?.reply ||
          data.reply === "API failed" ||
          data.reply === "Server error" ||
          data.reply === "AI failed";

        if (badInitialReply) {
          const retryData = await sendMessage("__start__", sessionId);
          if (!mounted) return;

          setMessages([
            {
              type: "ai",
              step: retryData?.step || data?.step,
              text: retryData?.reply || "Failed to load teaching content.",
            },
          ]);
          return;
        }

        setMessages([
          {
            type: "ai",
            step: data.step,
            text: data.reply,
          },
        ]);
      } catch {
        if (!mounted) return;
        setMessages([{ type: "ai", text: "Failed to load teaching content." }]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitialTeaching();

    return () => {
      mounted = false;
    };
  }, [topicId, subtopicId, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNext = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const data = await sendMessage("next", sessionId);

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          step: data.step,
          text: data.reply || "No response",
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { type: "ai", text: "Failed to load next step" }]);
    }

    setLoading(false);
  };

  const handleSend = async () => {
    if (loading) return;
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { type: "user", text: userMessage }]);

    try {
      const data = await sendMessage(userMessage, sessionId);
      setMessages((prev) => [...prev, { type: "ai", text: data.reply || "No response" }]);
    } catch {
      setMessages((prev) => [...prev, { type: "ai", text: "Network issue" }]);
    }

    setLoading(false);
  };

  return (
    <div className="tutor-layout">
      <div className="tutor-main">
        <div className="tutor-top">
          <p className="page-subtitle">Topics / {topicName} / {subtopicName}</p>
          <div className="tutor-top-actions">
            <button className="btn-secondary" onClick={() => navigate(`/learn/${topicId}`, { state: { topicName } })}>
              Back to Subtopics
            </button>
            <button className="btn-primary" onClick={handleNext} disabled={loading}>
              NEXT Step
            </button>
          </div>
        </div>

        <h1 className="page-title">{topicName} - {subtopicName}</h1>

        <div className="tutor-container">
          <div className="tabs">
            <button className={activeTab === "tutor" ? "active" : ""} onClick={() => setActiveTab("tutor")}>
              Tutor
            </button>
            <button className={activeTab === "problems" ? "active" : ""} onClick={() => setActiveTab("problems")}>
              Problems
            </button>
            <button className={activeTab === "compiler" ? "active" : ""} onClick={() => setActiveTab("compiler")}>
              Compiler
            </button>
            <button className={activeTab === "quiz" ? "active" : ""} onClick={() => setActiveTab("quiz")}>
              Quiz
            </button>
            <button className={activeTab === "notes" ? "active" : ""} onClick={() => setActiveTab("notes")}>
              Notes
            </button>
          </div>

          <div className="chat-area">
            {activeTab === "tutor" && (
              <>
                {messages.map((msg, index) => (
                  <div key={index} className={`message-row ${msg.type}`}>
                    <div className={`message-bubble ${msg.type}`}>
                      {msg.step && <strong className="step-pill">{msg.step}</strong>}
                      <div>{msg.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef}></div>
              </>
            )}

            {activeTab === "problems" && (
              <Problems topicId={topicId} subtopicId={subtopicId} subtopicName={subtopicName} />
            )}
            {activeTab === "compiler" && <Compiler />}
            {activeTab === "quiz" && (
              <Quiz sessionId={sessionId} topicId={topicId} subtopicId={subtopicId} />
            )}
            {activeTab === "notes" && <Notes />}
          </div>

          {activeTab === "tutor" && (
            <div className="input-area">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask a doubt..."
                className="input-box"
              />

              <button onClick={handleSend} disabled={loading} className="btn">
                Send
              </button>
              <button onClick={handleNext} disabled={loading} className="btn btn-outline">
                NEXT
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className="tutor-side">
        <div className="card">
          <p className="topic-title">Actions</p>
          <div className="side-actions">
            <button className="btn-primary" onClick={() => setActiveTab("problems")}>Solve Problems</button>
            <button className="btn-secondary" onClick={() => setActiveTab("quiz")}>Take Quiz</button>
            <button className="btn-secondary" onClick={() => setActiveTab("notes")}>View Notes</button>
            <button className="btn-secondary" onClick={() => setActiveTab("compiler")}>Open Compiler</button>
          </div>
        </div>

        <div className="card">
          <p className="topic-title">Flow</p>
          <div className="flow-list">
            {["Intuition", "Brute Force", "Optimized", "Patterns", "Code", "Practice"].map((step) => (
              <p key={step} className="flow-item">{step}</p>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default Tutor;
