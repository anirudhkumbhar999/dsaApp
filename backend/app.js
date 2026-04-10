const express = require("express");
const cors = require("cors");
const leetcodeRoutes = require("./routes/leetcodeRoutes");

const app = express();
const sessions = {};
const topicQuizAttempts = {};
const sessionQuizAttempts = {};
const topicQuizSetsCache = {};
const topicQuizQuestionBank = {};

app.use(cors());
app.use(express.json());
app.use("/api/leetcode", leetcodeRoutes);

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

const problemsByTopic = {
  1: [
    {
      id: "array-1",
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "Easy",
      tags: ["arrays", "hash-table"],
      description: "Find two numbers that add up to target.",
    },
    {
      id: "array-2",
      title: "Subarray Sum Equals K",
      slug: "subarray-sum-equals-k",
      difficulty: "Medium",
      tags: ["arrays", "prefix-sum"],
      description: "Count subarrays whose sum equals k.",
    },
    {
      id: "array-3",
      title: "Merge Intervals",
      slug: "merge-intervals",
      difficulty: "Medium",
      tags: ["arrays", "sorting"],
      description: "Merge overlapping intervals into consolidated list.",
    },
  ],
  2: [
    {
      id: "string-1",
      title: "Valid Anagram",
      slug: "valid-anagram",
      difficulty: "Easy",
      tags: ["strings", "hash-table"],
      description: "Check if two strings are anagrams.",
    },
    {
      id: "string-2",
      title: "Longest Palindromic Substring",
      slug: "longest-palindromic-substring",
      difficulty: "Medium",
      tags: ["strings", "dynamic-programming"],
      description: "Return the longest palindromic substring in s.",
    },
    {
      id: "string-3",
      title: "Group Anagrams",
      slug: "group-anagrams",
      difficulty: "Medium",
      tags: ["strings", "hash-table"],
      description: "Group strings into lists of anagrams.",
    },
  ],
  3: [
    {
      id: "linked-1",
      title: "Reverse Linked List",
      slug: "reverse-linked-list",
      difficulty: "Easy",
      tags: ["linked-list"],
      description: "Reverse a singly linked list iteratively or recursively.",
    },
    {
      id: "linked-2",
      title: "Linked List Cycle",
      slug: "linked-list-cycle",
      difficulty: "Easy",
      tags: ["linked-list", "two-pointers"],
      description: "Detect cycle and return meeting node or entry point.",
    },
    {
      id: "linked-3",
      title: "Merge Two Sorted Lists",
      slug: "merge-two-sorted-lists",
      difficulty: "Easy",
      tags: ["linked-list"],
      description: "Merge two sorted linked lists into a single sorted list.",
    },
  ],
};

const solvedProblems = {};

// ---------------- PROBLEMS ----------------
app.get("/api/problems/topics", (req, res) => {
  res.json(
    topicsData.map((topic) => ({
      topicId: topic.id,
      name: topic.name,
    }))
  );
});

app.get("/api/problems/topic/:topicId", (req, res) => {
  const { topicId } = req.params;
  const topic = topicsData.find((t) => String(t.id) === String(topicId));
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const problems = problemsByTopic[topic.id] || [];
  const solvedForTopic = solvedProblems[String(topic.id)] || new Set();

  res.json({
    topicId: topic.id,
    topicName: topic.name,
    problems: problems.map((problem) => ({
      ...problem,
      link: `https://leetcode.com/problems/${problem.slug}/`,
      solved: solvedForTopic.has(problem.id),
    })),
  });
});

app.post("/api/problems/topic/:topicId/solve", (req, res) => {
  const { topicId } = req.params;
  const { problemId } = req.body || {};
  const topic = topicsData.find((t) => String(t.id) === String(topicId));
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  const problem = (problemsByTopic[topic.id] || []).find((item) => item.id === problemId);
  if (!problem) return res.status(404).json({ error: "Problem not found" });

  const key = String(topic.id);
  if (!solvedProblems[key]) solvedProblems[key] = new Set();
  solvedProblems[key].add(problemId);

  res.status(201).json({
    problemId,
    topicId: topic.id,
    solved: true,
  });
});

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

const buildTutorFallbackReply = ({ topicName, currentStep, userMessage = "" }) => {
  const normalizedStep = currentStep || "Intuition";
  const followUp = userMessage && userMessage.trim()
    ? `You asked: "${userMessage}". Based on the current lesson, revise the main idea first and then continue.`
    : "Start with the main idea, then move to one simple example.";

  const stepGuides = {
    Intuition: `Focus on why ${topicName} needs this technique, what pattern to notice, and when to use it.`,
    "Brute Force": `Start from the simplest correct approach for ${topicName}, even if it is slower.`,
    Optimized: `Now compare the brute-force method with a faster method and explain what improves.`,
    Patterns: `Identify the repeated interview pattern in ${topicName} and the signals that reveal it.`,
    Code: `Write the core logic step by step for ${topicName} and explain each important line.`,
    Practice: `Summarize the common variations, edge cases, and what to practice next for ${topicName}.`,
  };

  return [
    `${normalizedStep}: ${stepGuides[normalizedStep] || `Continue learning ${topicName} step by step.`}`,
    "",
    followUp,
    "",
    `Example direction: take one small ${topicName} problem, solve it manually, then explain how this step helps.`,
    "",
    'Say NEXT to continue',
  ].join("\n");
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

const normalizeQuestionText = (value) => {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const dedupeQuizQuestions = (questions = []) => {
  const seen = new Set();
  const unique = [];

  for (const question of questions) {
    const normalized = normalizeQuestionText(question?.question);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(question);
  }

  return unique;
};

const ensureQuizQuestions = (quiz, { count, scope, title }) => {
  if (!quiz || typeof quiz !== "object") return null;

  const desiredCount = Math.max(1, Number(count) || 1);
  const uniqueQuestions = dedupeQuizQuestions(Array.isArray(quiz.questions) ? quiz.questions : []);
  const questions = uniqueQuestions.slice(0, desiredCount).map((question, index) => ({
    ...question,
    id: question?.id || `${scope}-${index + 1}`,
  }));

  if (questions.length < desiredCount) {
    const fallback = buildFallbackQuiz({ title, count: desiredCount, scope });
    const topUp = dedupeQuizQuestions([
      ...questions,
      ...fallback.questions,
    ]).slice(0, desiredCount).map((question, index) => ({
      ...question,
      id: question?.id || `${scope}-${index + 1}`,
    }));

    return {
      ...quiz,
      quizId: quiz.quizId || `${scope}-${Date.now()}`,
      quizTitle: quiz.quizTitle || title,
      scope: quiz.scope || scope,
      questions: topUp,
    };
  }

  return {
    ...quiz,
    quizId: quiz.quizId || `${scope}-${Date.now()}`,
    quizTitle: quiz.quizTitle || title,
    scope: quiz.scope || scope,
    questions,
  };
};

const callGeminiText = async ({ systemPrompt = "", userPrompt }) => {
  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, text: "", error: "MISSING_API_KEY", provider: "gemini" };
  }

  try {
    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
    };

    if (systemPrompt && systemPrompt.trim()) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash"}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      if (response.status === 429) {
        return { ok: false, text: "", error: "RATE_LIMIT", provider: "gemini" };
      }
      return { ok: false, text: "", error: "API_FAILED", provider: "gemini" };
    }

    const data = await response.json();
    if (data?.error?.code === 429) {
      return { ok: false, text: "", error: "RATE_LIMIT", provider: "gemini" };
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text.trim()) {
      return { ok: false, text: "", error: "EMPTY_RESPONSE", provider: "gemini" };
    }

    return { ok: true, text, provider: "gemini" };
  } catch (error) {
    console.error("Gemini network error:", error?.message || error);
    return { ok: false, text: "", error: "NETWORK_ERROR", provider: "gemini" };
  }
};

const callGroqText = async ({ systemPrompt = "", userPrompt }) => {
  if (!process.env.GROQ_API_KEY) {
    return { ok: false, text: "", error: "MISSING_API_KEY", provider: "groq" };
  }

  try {
    const messages = [];
    if (systemPrompt && systemPrompt.trim()) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: userPrompt });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.4,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      if (response.status === 429) {
        return { ok: false, text: "", error: "RATE_LIMIT", provider: "groq" };
      }
      return { ok: false, text: "", error: "API_FAILED", provider: "groq" };
    }

    const data = await response.json();
    if (data?.error?.code === 429 || data?.error?.type === "rate_limit_exceeded") {
      return { ok: false, text: "", error: "RATE_LIMIT", provider: "groq" };
    }

    const text = data?.choices?.[0]?.message?.content || "";
    if (!text.trim()) {
      return { ok: false, text: "", error: "EMPTY_RESPONSE", provider: "groq" };
    }

    return { ok: true, text, provider: "groq" };
  } catch (error) {
    console.error("Groq network error:", error?.message || error);
    return { ok: false, text: "", error: "NETWORK_ERROR", provider: "groq" };
  }
};

const callAiText = async ({ systemPrompt = "", userPrompt }) => {
  const attempts = [];

  if (process.env.GROQ_API_KEY) {
    const groqResult = await callGroqText({ systemPrompt, userPrompt });
    if (groqResult.ok) return groqResult;
    attempts.push(groqResult);
  }

  if (process.env.GEMINI_API_KEY) {
    const geminiResult = await callGeminiText({ systemPrompt, userPrompt });
    if (geminiResult.ok) return geminiResult;
    attempts.push(geminiResult);
  }

  const finalAttempt = attempts[attempts.length - 1] || {
    ok: false,
    text: "",
    error: "NO_PROVIDER_CONFIGURED",
    provider: "none",
  };

  return {
    ok: false,
    text: "",
    error: finalAttempt.error,
    provider: finalAttempt.provider,
    attempts,
  };
};

const generateTopicQuiz = async ({
  topicName,
  count = 5,
  focus = "mixed",
  subtopicName = "",
  avoidQuestions = [],
}) => {
  const avoidList = avoidQuestions
    .map((question, index) => `${index + 1}. ${question}`)
    .join("\n");

  const prompt = `
Generate a multiple choice DSA quiz in strict JSON only.
Topic: ${topicName}
${subtopicName ? `Primary subtopic focus: ${subtopicName}` : ""}
Question count: ${Math.max(3, Math.min(Number(count) || 5, 10))}
Focus area: ${focus}

Previously generated question ideas to avoid repeating:
${avoidList || "None"}

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
- if a primary subtopic is provided, most questions must come from that subtopic
- cover different points within the topic
- keep difficulty mixed: easy, medium, hard
- every question must test a different concept or scenario
- do not repeat the same question idea with rewording
- do not reuse any previously generated question idea from the avoid list
- no markdown, no extra text, JSON only
`;

  const result = await callAiText({
    systemPrompt: "You are a precise DSA quiz generator. Return valid JSON only when requested.",
    userPrompt: prompt,
  });
  if (!result.ok) return null;
  const parsed = safeParseQuiz(result.text);
  if (!validateQuizShape(parsed)) return null;
  return ensureQuizQuestions(parsed, {
    count,
    scope: "dashboard-topic",
    title: subtopicName ? `${topicName} - ${subtopicName} Quiz` : `${topicName} Quiz`,
  });
};

const extractQuizQuestionBank = (sets = []) => {
  return sets.flatMap((entry) =>
    (entry?.quiz?.questions || []).map((question) => normalizeQuestionText(question?.question)).filter(Boolean)
  );
};

const buildTutorReply = async ({ systemPrompt, topicName, currentStep, historyWindow = "", userMessage = "" }) => {
  const prompt = `
You are a professional DSA tutor.
Topic: ${topicName}
Current step: ${currentStep}

Recent conversation:
${historyWindow || "No previous context"}

User message:
${userMessage || "Start teaching this step clearly with one simple example."}

Rules:
- teach clearly and progressively
- keep the response relevant to the current step
- use one compact example when useful
- end with "Say NEXT to continue"
`;

  return callAiText({
    systemPrompt,
    userPrompt: prompt,
  });
};

// ---------------- TEST ----------------
app.get("/", (req, res) => {
  res.send("Backend running");
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
    const historyWindow = session.history.slice(-12).map((entry) => `${entry.role}: ${entry.content}`).join("\n");

    const result = await buildTutorReply({
      systemPrompt: data.systemPrompt,
      topicName: data.name,
      currentStep,
      historyWindow,
      userMessage: "Start the lesson from the current step without skipping ahead.",
    });

    if (!result.ok) {
      console.error("Tutor teaching failed:", result);
      return res.json({
        step: currentStep,
        reply: buildTutorFallbackReply({ topicName: data.name, currentStep }),
      });
    }

    const reply = result.text || "AI failed";
    session.history.push({ role: "ai", content: reply });

    res.json({ step: currentStep, reply });
  } catch {
    res.json({ step: currentStep, reply: "Server error" });
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

  if (message.toLowerCase() === "__start__") {
    const currentStep = steps[session.currentStep];
    const historyWindow = session.history.slice(-12).map((entry) => `${entry.role}: ${entry.content}`).join("\n");

    try {
      const result = await buildTutorReply({
        systemPrompt: data.systemPrompt,
        topicName: data.name,
        currentStep,
        historyWindow,
        userMessage: "Start the lesson from the current step without skipping ahead.",
      });

      if (!result.ok) {
        console.error("Tutor START failed:", result);
        const reply = buildTutorFallbackReply({
          topicName: data.name,
          currentStep,
          userMessage: "Start the lesson from the current step without skipping ahead.",
        });
        return res.json({ step: currentStep, reply });
      }

      const reply = result.text || buildTutorFallbackReply({ topicName: data.name, currentStep });
      session.history.push({ role: "ai", content: reply });

      return res.json({ step: currentStep, reply });
    } catch {
      return res.json({
        step: currentStep,
        reply: buildTutorFallbackReply({ topicName: data.name, currentStep }),
      });
    }
  }

  if (message.toLowerCase() === "next") {
    if (session.currentStep < steps.length - 1) session.currentStep++;

    const currentStep = steps[session.currentStep];
    const historyWindow = session.history.slice(-12).map((entry) => `${entry.role}: ${entry.content}`).join("\n");

    try {
      const result = await buildTutorReply({
        systemPrompt: data.systemPrompt,
        topicName: data.name,
        currentStep,
        historyWindow,
        userMessage: "Continue to the next teaching step.",
      });

      if (!result.ok) {
        console.error("Tutor NEXT failed:", result);
        const reply = buildTutorFallbackReply({
          topicName: data.name,
          currentStep,
          userMessage: "Continue to the next teaching step.",
        });
        return res.json({ step: currentStep, reply });
      }

      const reply = result.text || "AI failed";
      session.history.push({ role: "ai", content: reply });

      return res.json({ step: currentStep, reply });
    } catch {
      return res.json({ step: currentStep, reply: "Server error" });
    }
  }

  try {
    const historyWindow = session.history.slice(-12).map((entry) => `${entry.role}: ${entry.content}`).join("\n");

    const result = await buildTutorReply({
      systemPrompt: data.systemPrompt,
      topicName: data.name,
      currentStep: steps[session.currentStep],
      historyWindow,
      userMessage: message,
    });

    if (!result.ok) {
      console.error("Tutor chat failed:", result);
      const reply = buildTutorFallbackReply({
        topicName: data.name,
        currentStep: steps[session.currentStep],
        userMessage: message,
      });
      return res.json({ reply });
    }

    const reply = result.text || "AI failed";

    session.history.push(
      { role: "user", content: message },
      { role: "ai", content: reply }
    );

    res.json({ reply });
  } catch {
    res.json({ reply: "Server error" });
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
  const { sets = 3, count = 5, refresh = "0" } = req.query;
  const topic = topicsData.find((t) => String(t.id) === String(topicId));
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const cacheKey = String(topicId);
  const shouldRefresh = String(refresh) === "1";

  if (!shouldRefresh && topicQuizSetsCache[cacheKey]) {
    return res.json(topicQuizSetsCache[cacheKey]);
  }

  const topicSubtopics = subtopicsData[topic.id] || [];
  const setCount = Math.max(1, Math.min(Number(sets) || topicSubtopics.length || 3, 6));
  const focusAreas = [
    "fundamentals and definitions",
    "problem solving patterns",
    "edge cases and optimization",
    "code reading and debugging",
    "time and space complexity",
    "interview style tricky scenarios",
  ];

  const quizSets = [];
  const previousQuestionBank = topicQuizQuestionBank[cacheKey] || [];
  const newQuestionBank = [...previousQuestionBank];

  for (let i = 0; i < setCount; i++) {
    const subtopic = topicSubtopics[i % Math.max(topicSubtopics.length, 1)] || null;
    const focus = subtopic
      ? `subtopic: ${subtopic.name}; emphasis: ${focusAreas[i % focusAreas.length]}`
      : focusAreas[i % focusAreas.length];
    let quiz = null;
    try {
      quiz = await generateTopicQuiz({
        topicName: topic.name,
        count,
        focus,
        subtopicName: subtopic?.name || "",
        avoidQuestions: newQuestionBank,
      });
    } catch {
      quiz = null;
    }
    if (!quiz) {
      quiz = buildFallbackQuiz({
        title: subtopic ? `${topic.name} - ${subtopic.name} Quiz` : `${topic.name} Quiz Set ${i + 1}`,
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
      subtopicId: subtopic?.id || null,
      subtopicName: subtopic?.name || null,
      focus,
      quiz,
    });

    newQuestionBank.push(
      ...((quiz?.questions || []).map((question) => normalizeQuestionText(question?.question)).filter(Boolean))
    );
  }

  const payload = {
    topicId: topic.id,
    topicName: topic.name,
    sets: quizSets,
  };

  topicQuizSetsCache[cacheKey] = payload;
  topicQuizQuestionBank[cacheKey] = Array.from(new Set(newQuestionBank)).slice(-500);

  return res.json(payload);
});

// ---------------- QUIZ HISTORY (UNIVERSAL TOPIC PAGE, IN-MEMORY) ----------------
app.get("/api/quiz/topic/:topicId/history", (req, res) => {
  const { topicId } = req.params;
  res.json({
    topicId: Number(topicId),
    attempts: topicQuizAttempts[String(topicId)] || [],
  });
});

app.post("/api/quiz/topic/:topicId/history", (req, res) => {
  const { topicId } = req.params;
  const {
    quizId,
    quizTitle,
    subtopicId = null,
    subtopicName = "",
    score,
    total,
    passed,
  } = req.body || {};

  if (!quizId || !quizTitle || typeof score !== "number" || typeof total !== "number") {
    return res.status(400).json({ error: "Invalid quiz attempt payload" });
  }

  const key = String(topicId);
  const nextAttempt = {
    quizId,
    quizTitle,
    topicId: Number(topicId),
    subtopicId,
    subtopicName,
    score,
    total,
    passed: typeof passed === "boolean" ? passed : score >= Math.ceil(total * 0.6),
    at: new Date().toISOString(),
  };

  topicQuizAttempts[key] = [nextAttempt, ...(topicQuizAttempts[key] || []).filter((item) => item.quizId !== quizId)].slice(0, 20);

  return res.status(201).json(nextAttempt);
});

// ---------------- QUIZ HISTORY (SESSION CONTEXT, IN-MEMORY) ----------------
app.get("/api/quiz/session/:sessionId/history", (req, res) => {
  const { sessionId } = req.params;
  res.json({
    sessionId,
    attempts: sessionQuizAttempts[sessionId] || [],
  });
});

app.post("/api/quiz/session/:sessionId/history", (req, res) => {
  const { sessionId } = req.params;
  const {
    quizId,
    quizTitle,
    mode,
    step = "",
    score,
    total,
    passed,
  } = req.body || {};

  if (!quizId || !quizTitle || !mode || typeof score !== "number" || typeof total !== "number") {
    return res.status(400).json({ error: "Invalid session quiz attempt payload" });
  }

  const nextAttempt = {
    quizId,
    quizTitle,
    sessionId,
    mode,
    step,
    score,
    total,
    passed: typeof passed === "boolean" ? passed : score >= Math.ceil(total * 0.6),
    at: new Date().toISOString(),
  };

  sessionQuizAttempts[sessionId] = [
    nextAttempt,
    ...(sessionQuizAttempts[sessionId] || []).filter((item) => item.quizId !== quizId),
  ].slice(0, 20);

  return res.status(201).json(nextAttempt);
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
- every question must test a different concept or scenario
- do not repeat the same question idea with rewording
- no markdown, no extra text, JSON only
`;

  try {
    const result = await callAiText({
      systemPrompt: "You are a precise DSA quiz generator. Return valid JSON only when requested.",
      userPrompt: prompt,
    });
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
    return res.json(
      ensureQuizQuestions(parsed, {
        count: questionCount,
        scope: mode === "final" ? "session-final" : "session-step",
        title: mode === "final" ? `${subtopic.name} Final Quiz` : `${subtopic.name} Step Quiz`,
      })
    );
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
- every question must test a different concept or scenario
- do not repeat the same question idea with rewording
- no markdown, no extra text, JSON only
`;

  try {
    const result = await callAiText({
      systemPrompt: "You are a precise DSA quiz generator. Return valid JSON only when requested.",
      userPrompt: prompt,
    });
    if (!result.ok) {
      return res.json(buildFallbackQuiz({ title: `${subtopic.name} Quiz`, count, scope: "subtopic-card" }));
    }
    const parsed = safeParseQuiz(result.text);
    if (!validateQuizShape(parsed)) {
      return res.json(buildFallbackQuiz({ title: `${subtopic.name} Quiz`, count, scope: "subtopic-card" }));
    }
    return res.json(
      ensureQuizQuestions(parsed, {
        count,
        scope: "subtopic-card",
        title: `${subtopic.name} Quiz`,
      })
    );
  } catch {
    return res.json(buildFallbackQuiz({ title: `${subtopic.name} Quiz`, count, scope: "subtopic-card" }));
  }
});

module.exports = app;
