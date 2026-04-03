const express = require("express");
const cors = require("cors");
// ✅ REQUIRED (Node < 18)

const app = express();
const sessions = {};

app.use(cors());
app.use(express.json());

// ---------------- DATA ----------------
const subtopicDetails = {
  1: {
    103: {
      id: 103,
      name: "Sliding Window",
      systemPrompt:
        "You are an expert DSA tutor specializing in Sliding Window problems.",
    },
  },
};

const steps = [
  "Intuition",
  "Brute Force",
  "Optimized Approach",
  "Patterns",
  "Code",
  "Practice",
];

// ---------------- TEST ----------------
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
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

  const data = subtopicDetails[topicId]?.[subtopicId];

  if (!data) {
    return res.status(404).json({ error: "Subtopic not found" });
  }

  const session = sessions[sessionId];

  // ✅ FIX: session validation
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const stepIndex = session.currentStep;
  const currentStep = steps[stepIndex] || steps[0]; // ✅ safety

  try {
    const prompt = `
${data.systemPrompt}

You are teaching: ${data.name}

CURRENT STEP: ${currentStep}

INSTRUCTIONS:
- Teach ONLY this step
- Do NOT explain other steps
- Keep explanation simple and structured
- Use examples if needed
- End with: "Say NEXT to continue"
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const aiData = await response.json();

    const reply =
      aiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response";

    session.history.push({ role: "ai", content: reply });

    res.json({
      step: currentStep,
      reply,
    });
  } catch (error) {
    console.error("AI ERROR:", error);
    res.status(500).json({ error: "AI error" });
  }
});

// ---------------- CHAT ----------------
app.post("/api/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const { topicId, subtopicId, history } = session;
  const data = subtopicDetails[topicId]?.[subtopicId];

  if (!data) {
    return res.status(404).json({ error: "Subtopic not found" });
  }

  // ---------------- NEXT ----------------
  if (message.trim().toLowerCase() === "next") {
    if (session.currentStep < steps.length - 1) {
      session.currentStep++;
    }

    const currentStep = steps[session.currentStep] || steps[0];

    try {
      const prompt = `
${data.systemPrompt}

You are teaching: ${data.name}

CURRENT STEP: ${currentStep}

INSTRUCTIONS:
- Teach ONLY this step
- Do NOT explain other steps
- Keep explanation simple
- End with: "Say NEXT to continue"
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      const aiData = await response.json();

      const reply =
        aiData.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response";

      session.history.push({ role: "ai", content: reply });

      return res.json({
        step: currentStep,
        reply,
      });
    } catch (error) {
      console.error("AI ERROR:", error);
      return res.status(500).json({ error: "AI error" });
    }
  }

  // ---------------- NORMAL CHAT ----------------
  try {
    let conversation = `${data.systemPrompt}\n\n`;

    history.forEach((msg) => {
      conversation += `${msg.role === "ai" ? "Tutor" : "Student"}: ${
        msg.content
      }\n`;
    });

    conversation += `Student: ${message}\nTutor:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: conversation }],
            },
          ],
        }),
      }
    );

    const aiData = await response.json();

    const reply =
      aiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response";

    session.history.push(
      { role: "user", content: message },
      { role: "ai", content: reply }
    );

    res.json({ reply });
  } catch (error) {
    console.error("AI ERROR:", error);
    res.status(500).json({ error: "AI error" });
  }
});

module.exports = app;