const express = require("express");
const cors = require("cors");

const app = express();
const sessions = {};

app.use(cors());
app.use(express.json());

// ---------------- DATA ----------------
const subtopicDetails = {
  1: {
    101: { id: 101, name: "Array Basics", systemPrompt: "You are an expert DSA tutor teaching array basics." },
    102: { id: 102, name: "Two Pointer", systemPrompt: "You are an expert DSA tutor teaching two pointer." },
    103: { id: 103, name: "Sliding Window", systemPrompt: "You are an expert DSA tutor teaching sliding window." },
  },
  2: {
    201: { id: 201, name: "String Basics", systemPrompt: "You are an expert DSA tutor teaching strings." },
    202: { id: 202, name: "Palindrome", systemPrompt: "You are an expert DSA tutor teaching palindrome." },
    203: { id: 203, name: "Anagrams", systemPrompt: "You are an expert DSA tutor teaching anagrams." },
  },
  3: {
    301: { id: 301, name: "Linked List Basics", systemPrompt: "You are an expert DSA tutor teaching linked list." },
    302: { id: 302, name: "Reversal", systemPrompt: "You are an expert DSA tutor teaching reversal." },
    303: { id: 303, name: "Cycle Detection", systemPrompt: "You are an expert DSA tutor teaching cycle detection." },
  },
};

const steps = ["Intuition", "Brute Force", "Optimized", "Patterns", "Code", "Practice"];

// ---------------- TEST ----------------
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ---------------- TOPICS ----------------
app.get("/api/topics", (req, res) => {
  res.json([
    { id: 1, name: "Arrays" },
    { id: 2, name: "Strings" },
    { id: 3, name: "Linked List" },
  ]);
});

// ---------------- SUBTOPICS ----------------
app.get("/api/subtopics/:topicId", (req, res) => {
  const { topicId } = req.params;

  const subtopicsData = {
    1: [
      { id: 101, name: "Basics" },
      { id: 102, name: "Two Pointer" },
      { id: 103, name: "Sliding Window" },
    ],
    2: [
      { id: 201, name: "String Basics" },
      { id: 202, name: "Palindrome" },
      { id: 203, name: "Anagrams" },
    ],
    3: [
      { id: 301, name: "Basics" },
      { id: 302, name: "Reversal" },
      { id: 303, name: "Cycle Detection" },
    ],
  };

  res.json(subtopicsData[topicId] || []);
});

// ---------------- START SESSION ----------------
app.post("/api/start-session", (req, res) => {
  const { topicId, subtopicId } = req.body;

  const sessionId = Date.now().toString();

  sessions[sessionId] = {
    topicId,
    subtopicId,
    history: [],
    currentStep: 0,
  };

  res.json({ sessionId });
});

// ---------------- TEACHING ----------------
app.get("/api/topics/:topicId/subtopics/:subtopicId", async (req, res) => {
  const { topicId, subtopicId } = req.params;
  const { sessionId } = req.query;

  const topic = Number(topicId);
  const subtopic = Number(subtopicId);

  const data = subtopicDetails[topic]?.[subtopic];
  if (!data) return res.status(404).json({ error: "Subtopic not found" });

  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ error: "Session not found" });

  const currentStep = steps[session.currentStep];

  try {
    const prompt = `
You are a professional DSA tutor.
Topic: ${data.name}
Step: ${currentStep}
Explain clearly with example.
End with "Say NEXT to continue"
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      return res.json({ step: currentStep, reply: "⚠️ API failed" });
    }

    const aiData = await response.json();

    if (aiData.error?.code === 429) {
      return res.json({
        step: currentStep,
        reply: "⏳ Rate limit reached. Wait 30–60 sec.",
      });
    }

    let reply =
      aiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ AI failed";

    session.history.push({ role: "ai", content: reply });

    res.json({ step: currentStep, reply });
  } catch {
    res.json({ step: currentStep, reply: "⚠️ Server error" });
  }
});

// ---------------- CHAT ----------------
app.post("/api/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ error: "Session not found" });

  const topic = Number(session.topicId);
  const subtopic = Number(session.subtopicId);

  const data = subtopicDetails[topic]?.[subtopic];
  if (!data) return res.status(404).json({ error: "Subtopic not found" });

  // NEXT
  if (message.toLowerCase() === "next") {
    if (session.currentStep < steps.length - 1) session.currentStep++;

    const currentStep = steps[session.currentStep];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${data.systemPrompt}\nStep: ${currentStep}` }] }],
          }),
        }
      );

      if (!response.ok) {
        return res.json({ step: currentStep, reply: "⚠️ API failed" });
      }

      const aiData = await response.json();

      let reply =
        aiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ AI failed";

      session.history.push({ role: "ai", content: reply });

      return res.json({ step: currentStep, reply });
    } catch {
      return res.json({ step: currentStep, reply: "⚠️ Server error" });
    }
  }

  // NORMAL CHAT
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      }
    );

    if (!response.ok) {
      return res.json({ reply: "⚠️ API failed" });
    }

    const aiData = await response.json();

    let reply =
      aiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ AI failed";

    session.history.push(
      { role: "user", content: message },
      { role: "ai", content: reply }
    );

    res.json({ reply });
  } catch {
    res.json({ reply: "⚠️ Server error" });
  }
});

module.exports = app;