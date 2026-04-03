const express = require("express");
const cors = require("cors");

const app = express();
const sessions = {};

// Gemini setup
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// ---------------------- TEST ----------------------
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ---------------------- DATA ----------------------
const subtopicDetails = {
  1: {
    103: {
      id: 103,
      name: "Sliding Window",
      difficulty: "Intermediate",
      systemPrompt:
        "You are an expert DSA tutor specializing in Sliding Window problems.",
      teachingPrompt: `
Teach Sliding Window in this order:
1. Start with real-life analogy
2. Explain brute force
3. Show optimized approach
4. Explain window movement
5. Give patterns
6. Provide code
7. Give practice problem
      `,
    },
  },
};

// ---------------------- TOPICS ----------------------
app.get("/api/topics", (req, res) => {
  res.json([
    { id: 1, name: "Arrays" },
    { id: 2, name: "Strings" },
    { id: 3, name: "Linked List" },
  ]);
});

// ---------------------- SUBTOPICS ----------------------
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

// ---------------------- TEACHING (AI) ----------------------
app.get(
  "/api/topics/:topicId/subtopics/:subtopicId",
  async (req, res) => {
    const { topicId, subtopicId } = req.params;
    const { sessionId } = req.query;

    const data = subtopicDetails[topicId]?.[subtopicId];

    if (!data) {
      return res.status(404).json({ error: "Subtopic not found" });
    }

    try {
      const prompt = `
${data.systemPrompt}

${data.teachingPrompt}
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

      // Store AI teaching in session
      if (sessionId && sessions[sessionId]) {
        sessions[sessionId].history.push({
          role: "ai",
          content: reply,
        });
      }

      res.json({
        subtopic: data.name,
        reply,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "AI error" });
    }
  }
);

// ---------------------- START SESSION ----------------------
app.post("/api/start-session", (req, res) => {
  const { topicId, subtopicId } = req.body;

  const sessionId = Date.now().toString();

  sessions[sessionId] = {
    topicId,
    subtopicId,
    history: [],
  };

  res.json({ sessionId });
});

// ---------------------- CHAT (WITH MEMORY) ----------------------
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

  try {
    let conversation = `${data.systemPrompt}\n\n`;

    history.forEach((msg) => {
      if (msg.role === "ai") {
        conversation += `Tutor: ${msg.content}\n`;
      } else {
        conversation += `Student: ${msg.content}\n`;
      }
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

    // Save conversation
    session.history.push(
      { role: "user", content: message },
      { role: "ai", content: reply }
    );

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI error" });
  }
});

module.exports = app;