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

const topicsData = [
  { id: 1, name: "Arrays" },
  { id: 2, name: "Strings" },
  { id: 3, name: "Linked List" },
];

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

const buildFallbackQuiz = ({ title, count = 5, scope = "general" }) => {
  const size = Math.max(1, Math.min(Number(count) || 5, 10));
  const questions = Array.from({ length: size }).map((_, i) => ({
    id: `${scope}-${i + 1}`,
    question: `Fallback question ${i + 1}: choose the best option.`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    answerIndex: i % 4,
    explanation: "Fallback quiz generated because AI response was unavailable.",
    focusPoint: "Core understanding",
  }));

  return {
    quizId: `${scope}-${Date.now()}`,
    quizTitle: title,
    scope,
    questions,
  };
};

const safeParseQuiz = (text) => {
  if (!text || typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const validateQuizShape = (quiz) => {
  if (!quiz || typeof quiz !== "object") return false;
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) return false;
  for (const q of quiz.questions) {
    if (!q || typeof q !== "object") return false;
    if (typeof q.question !== "string" || !q.question.trim()) return false;
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
    if (typeof q.answerIndex !== "number" || q.answerIndex < 0 || q.answerIndex >= q.options.length) return false;
  }
  return true;
};

const callGeminiText = async (prompt) => {
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
    return { ok: false, text: "", error: "API failed" };
  }

  const aiData = await response.json();
  if (aiData.error?.code === 429) {
    return { ok: false, text: "", error: "RATE_LIMIT" };
  }

  const text = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { ok: true, text };
};

const generateTopicQuiz = async ({ topicName, count = 5, focus = "mixed" }) => {
  const prompt = `
Generate a multiple choice DSA quiz in strict JSON only.
Topic: ${topicName}
Question count: ${Math.max(3, Math.min(Number(count) || 5, 10))}
Focus area: ${focus}

Return JSON object with this exact shape:
{
  "quizId": "string",
  "quizTitle": "string",
  "scope": "dashboard-topic",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answerIndex": 0,
      "explanation": "string",
      "focusPoint": "string"
    }
  ]
}

Rules:
- focus on the requested focus area
- cover different points within the topic
- keep difficulty mixed: easy, medium, hard
- no markdown, no extra text, JSON only
`;

  const result = await callGeminiText(prompt);
  if (!result.ok) return null;
  const parsed = safeParseQuiz(result.text);
  if (!validateQuizShape(parsed)) return null;
  return parsed;
};

// ---------------- TEST ----------------
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ---------------- TOPICS ----------------
app.get("/api/topics", (req, res) => {
  res.json(topicsData);
});

// ---------------- SUBTOPICS ----------------
app.get("/api/subtopics/:topicId", (req, res) => {
  const { topicId } = req.params;
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

// ---------------- QUIZ (TOPIC LEVEL / DASHBOARD) ----------------
app.get("/api/quiz/dashboard", async (req, res) => {
  const { topicId, count = 5 } = req.query;
  const topic = topicsData.find((t) => String(t.id) === String(topicId));
  if (!topic) {
    return res.status(404).json({ error: "Topic not found" });
  }

  try {
    const parsed = await generateTopicQuiz({ topicName: topic.name, count, focus: "mixed" });
    if (!parsed) {
      return res.json(buildFallbackQuiz({ title: `${topic.name} Quiz`, count, scope: "dashboard-topic" }));
    }
    parsed.scope = parsed.scope || "dashboard-topic";
    parsed.quizId = parsed.quizId || `dashboard-topic-${Date.now()}`;
    return res.json(parsed);
  } catch {
    return res.json(buildFallbackQuiz({ title: `${topic.name} Quiz`, count, scope: "dashboard-topic" }));
  }
});

// ---------------- QUIZ SETS (UNIVERSAL TOPIC PAGE) ----------------
app.get("/api/quiz/topic/:topicId/sets", async (req, res) => {
  const { topicId } = req.params;
  const { sets = 3, count = 5 } = req.query;
  const topic = topicsData.find((t) => String(t.id) === String(topicId));
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const setCount = Math.max(1, Math.min(Number(sets) || 3, 6));
  const focusAreas = [
    "fundamentals and definitions",
    "problem solving patterns",
    "edge cases and optimization",
    "code reading and debugging",
    "time and space complexity",
    "interview style tricky scenarios",
  ];

  const quizSets = [];

  for (let i = 0; i < setCount; i++) {
    const focus = focusAreas[i % focusAreas.length];
    let quiz = null;
    try {
      quiz = await generateTopicQuiz({ topicName: topic.name, count, focus });
    } catch {
      quiz = null;
    }
    if (!quiz) {
      quiz = buildFallbackQuiz({
        title: `${topic.name} Quiz Set ${i + 1}`,
        count,
        scope: "topic-set",
      });
    }
    quiz.quizId = quiz.quizId || `topic-${topic.id}-set-${i + 1}`;
    quiz.scope = "topic-set";
    quizSets.push({
      id: `set-${i + 1}`,
      topicId: topic.id,
      topicName: topic.name,
      focus,
      quiz,
    });
  }

  return res.json({
    topicId: topic.id,
    topicName: topic.name,
    sets: quizSets,
  });
});

// ---------------- QUIZ (SESSION + CHAT CONTEXT) ----------------
app.get("/api/quiz/session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const { mode = "step", count = 1 } = req.query;
  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ error: "Session not found" });

  const topic = topicsData.find((t) => String(t.id) === String(session.topicId));
  const subtopic = subtopicDetails[Number(session.topicId)]?.[Number(session.subtopicId)];
  if (!topic || !subtopic) return res.status(404).json({ error: "Topic/Subtopic not found" });

  const currentStep = steps[session.currentStep] || steps[0];
  const historyWindow = session.history.slice(-12).map((h) => `${h.role}: ${h.content}`).join("\n");
  const questionCount = mode === "final" ? Math.max(5, Math.min(Number(count) || 8, 15)) : 1;

  const prompt = `
Generate a multiple choice quiz in strict JSON only.
Topic: ${topic.name}
Subtopic: ${subtopic.name}
Mode: ${mode}
Current teaching step: ${currentStep}
Question count: ${questionCount}

Use this tutor conversation context to create personalized questions:
${historyWindow || "No previous context"}

Return JSON object with this exact shape:
{
  "quizTitle": "string",
  "scope": "session-step|session-final",
  "meta": {
    "topicId": "${session.topicId}",
    "subtopicId": "${session.subtopicId}",
    "step": "${currentStep}",
    "mode": "${mode}"
  },
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answerIndex": 0,
      "explanation": "string",
      "focusPoint": "string",
      "step": "${currentStep}"
    }
  ]
}

Rules:
- for mode=step: generate exactly 1 focused question from current step and recent doubts
- for mode=final: generate multi-question universal quiz covering different points learned
- no markdown, no extra text, JSON only
`;

  try {
    const result = await callGeminiText(prompt);
    if (!result.ok) {
      return res.json(
        buildFallbackQuiz({
          title: mode === "final" ? `${subtopic.name} Final Quiz` : `${subtopic.name} Step Quiz`,
          count: questionCount,
          scope: mode === "final" ? "session-final" : "session-step",
        })
      );
    }
    const parsed = safeParseQuiz(result.text);
    if (!validateQuizShape(parsed)) {
      return res.json(
        buildFallbackQuiz({
          title: mode === "final" ? `${subtopic.name} Final Quiz` : `${subtopic.name} Step Quiz`,
          count: questionCount,
          scope: mode === "final" ? "session-final" : "session-step",
        })
      );
    }
    return res.json(parsed);
  } catch {
    return res.json(
      buildFallbackQuiz({
        title: mode === "final" ? `${subtopic.name} Final Quiz` : `${subtopic.name} Step Quiz`,
        count: questionCount,
        scope: mode === "final" ? "session-final" : "session-step",
      })
    );
  }
});

// ---------------- QUIZ (SUBTOPIC CARD, WITH/WITHOUT SESSION CONTEXT) ----------------
app.get("/api/quiz/subtopic/:topicId/:subtopicId", async (req, res) => {
  const { topicId, subtopicId } = req.params;
  const { sessionId, count = 4 } = req.query;

  const topic = topicsData.find((t) => String(t.id) === String(topicId));
  const subtopic = subtopicDetails[Number(topicId)]?.[Number(subtopicId)];
  if (!topic || !subtopic) return res.status(404).json({ error: "Topic/Subtopic not found" });

  const session = sessionId ? sessions[sessionId] : null;
  const currentStep = session ? steps[session.currentStep] || steps[0] : "Foundations";
  const historyWindow = session
    ? session.history.slice(-10).map((h) => `${h.role}: ${h.content}`).join("\n")
    : "No session context. Use topic/subtopic prompt context.";

  const prompt = `
Generate a multiple choice quiz in strict JSON only.
Topic: ${topic.name}
Subtopic: ${subtopic.name}
Question count: ${Math.max(3, Math.min(Number(count) || 4, 8))}
Current teaching step: ${currentStep}

System prompt context:
${subtopic.systemPrompt}

Conversation context:
${historyWindow}

Return JSON object with this exact shape:
{
  "quizId": "string",
  "quizTitle": "string",
  "scope": "subtopic-card",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answerIndex": 0,
      "explanation": "string",
      "focusPoint": "string"
    }
  ]
}

Rules:
- question set must focus on this subtopic
- if conversation exists, personalize to doubts
- no markdown, no extra text, JSON only
`;

  try {
    const result = await callGeminiText(prompt);
    if (!result.ok) {
      return res.json(buildFallbackQuiz({ title: `${subtopic.name} Quiz`, count, scope: "subtopic-card" }));
    }
    const parsed = safeParseQuiz(result.text);
    if (!validateQuizShape(parsed)) {
      return res.json(buildFallbackQuiz({ title: `${subtopic.name} Quiz`, count, scope: "subtopic-card" }));
    }
    parsed.quizId = parsed.quizId || `subtopic-${topicId}-${subtopicId}-${Date.now()}`;
    parsed.scope = "subtopic-card";
    return res.json(parsed);
  } catch {
    return res.json(buildFallbackQuiz({ title: `${subtopic.name} Quiz`, count, scope: "subtopic-card" }));
  }
});

module.exports = app;