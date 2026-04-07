import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getTeaching, sendMessage } from "../services/api";


function Tutor() {
  const { topicId, subtopicId, sessionId } = useParams();

  const [messages, setMessages] = useState([]); // ✅ FIXED
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

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

  try {
    const data = await sendMessage(userMessage, sessionId);

    setMessages((prev) => [
      ...prev,
      { type: "user", text: userMessage },
      { type: "ai", text: data.reply || "⚠️ No response" },
    ]);
  } catch {
    setMessages((prev) => [
      ...prev,
      { type: "user", text: userMessage },
      { type: "ai", text: "⚠️ AI failed" },
    ]);
  }

  setLoading(false);
};

  return (
    <div>

      {/* 🔹 MESSAGES */}
      {messages.map((msg, index) => (
        <div key={index}>
          {msg.type === "user" ? (
            <p><b>You:</b> {msg.text}</p>
          ) : (
            <div>
              {msg.step && <h3>Step {index + 1}: {msg.step}</h3>}
              <p><b>AI:</b> {msg.text}</p>
            </div>
          )}
          <hr />
        </div>
      ))}

      <div ref={bottomRef}></div>

      {/* 🔹 LOADING */}
      {loading && <p>AI is thinking...</p>}

      {/* 🔹 NEXT BUTTON */}
      <button onClick={handleNext}>NEXT</button>

      {/* 🔹 INPUT */}
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a doubt..."
        />
        <button onClick={handleSend}>Send</button>
      </div>

    </div>
  );
}

export default Tutor;