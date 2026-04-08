import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getTeaching, sendMessage } from "../services/api";

import Problems from "../components/Problems";
import Compiler from "../components/Compiler";
import Notes from "../components/Notes";
import Quiz from "../components/Quiz"; // optional if you use it

import "./Tutor.css";

function Tutor() {
  const { topicId, subtopicId, sessionId } = useParams();

  const [messages, setMessages] = useState([]); // ✅ FIXED
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const [activeTab, setActiveTab] = useState("tutor");

  // 🔹 Load first step
  useEffect(() => {
    setLoading(true);

    getTeaching(topicId, subtopicId, sessionId).then((data) => {
      setMessages([
        {
          type: "ai",
          step: data.step,
          text: data.reply,
        },
      ]);
      setLoading(false);
    });
  }, [topicId, subtopicId, sessionId]);

  useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

  // 🔹 NEXT button
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
        text: data.reply || "⚠️ No response",
      },
    ]);
  } catch {
    setMessages((prev) => [
      ...prev,
      { type: "ai", text: "⚠️ Failed to load next step" },
    ]);
  }

  setLoading(false);
};
  // 🔹 Send doubt
const handleSend = async () => {
  if (loading) return;
  if (!input.trim()) return;

  const userMessage = input;
  setInput("");
  setLoading(true);

  // add user message first
  setMessages((prev) => [
    ...prev,
    { type: "user", text: userMessage },
  ]);

  try {
    const data = await sendMessage(userMessage, sessionId);

    if (data.reply && !data.reply.includes("API failed")) {
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: data.reply },
      ]);
    } else {
      // do NOT overwrite good UI
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: "⏳ AI busy, try again in few seconds." },
      ]);
    }
  } catch {
    setMessages((prev) => [
      ...prev,
      { type: "ai", text: "⚠️ Network issue" },
    ]);
  }

  setLoading(false);
};

  return (
  <div className="tutor-container">

    {/* 🔹 TABS */}
    <div className="tabs">
  <button
    className={activeTab === "tutor" ? "active" : ""}
    onClick={() => setActiveTab("tutor")}
  >
    Tutor
  </button>

  <button
    className={activeTab === "problems" ? "active" : ""}
    onClick={() => setActiveTab("problems")}
  >
    Problems
  </button>

  <button
    className={activeTab === "compiler" ? "active" : ""}
    onClick={() => setActiveTab("compiler")}
  >
    Compiler
  </button>

  <button
    className={activeTab === "quiz" ? "active" : ""}
    onClick={() => setActiveTab("quiz")}
  >
    Quiz
  </button>

  <button
    className={activeTab === "notes" ? "active" : ""}
    onClick={() => setActiveTab("notes")}
  >
    Notes
  </button>
</div>

    {/* 🔹 CONTENT AREA */}
    <div className="chat-area">

      {activeTab === "tutor" && (
        <>
          {messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.type}`}>
              <div className={`message-bubble ${msg.type}`}>
                {msg.step && <strong>{msg.step}</strong>}
                <div>{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </>
      )}

      {activeTab === "problems" && <Problems />}
      {activeTab === "compiler" && <Compiler />}
      {activeTab === "quiz" && <Quiz />}
      {activeTab === "notes" && <Notes />}
    </div>

    {/* 🔹 INPUT AREA ONLY FOR TUTOR */}
    {activeTab === "tutor" && (
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a doubt..."
          className="input-box"
        />

        <button onClick={handleSend} disabled={loading} className="btn">
          Send
        </button>

        <button onClick={handleNext} disabled={loading} className="btn">
          NEXT
        </button>
      </div>
    )}

  </div>
);
}

export default Tutor;