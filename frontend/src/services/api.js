const BASE_URL = "http://localhost:5000";

export const getSubtopics = async (topicId) => {
  const res = await fetch(`${BASE_URL}/api/subtopics/${topicId}`);
  return res.json();
};
export const getTopics = async () => {
  const res = await fetch(`${BASE_URL}/api/topics`);
  return res.json();
};

export const startSession = async (topicId, subtopicId) => {
  const res = await fetch(`${BASE_URL}/api/start-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topicId, subtopicId }),
  });

  return res.json();
};

export const getTeaching = async (topicId, subtopicId, sessionId) => {
  const res = await fetch(
    `${BASE_URL}/api/topics/${topicId}/subtopics/${subtopicId}?sessionId=${sessionId}`
  );

  return res.json();
};
export const sendMessage = async (message, sessionId) => {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, sessionId }),
  });

  return res.json();
};

export const getDashboardQuiz = async (topicId, count = 5) => {
  const res = await fetch(`${BASE_URL}/api/quiz/dashboard?topicId=${topicId}&count=${count}`);
  return res.json();
};

export const getSessionQuiz = async (sessionId, mode = "step", count = 1) => {
  const res = await fetch(`${BASE_URL}/api/quiz/session/${sessionId}?mode=${mode}&count=${count}`);
  return res.json();
};

export const getSessionQuizHistory = async (sessionId) => {
  const res = await fetch(`${BASE_URL}/api/quiz/session/${sessionId}/history`);
  return res.json();
};

export const saveSessionQuizHistory = async (sessionId, payload) => {
  const res = await fetch(`${BASE_URL}/api/quiz/session/${sessionId}/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const getTopicQuizSets = async (topicId, sets = 3, count = 5, refresh = false) => {
  const res = await fetch(
    `${BASE_URL}/api/quiz/topic/${topicId}/sets?sets=${sets}&count=${count}&refresh=${refresh ? 1 : 0}`
  );
  return res.json();
};

export const getTopicQuizHistory = async (topicId) => {
  const res = await fetch(`${BASE_URL}/api/quiz/topic/${topicId}/history`);
  return res.json();
};

export const saveTopicQuizHistory = async (topicId, payload) => {
  const res = await fetch(`${BASE_URL}/api/quiz/topic/${topicId}/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const getSubtopicQuiz = async (topicId, subtopicId, sessionId = "", count = 4) => {
  const query = new URLSearchParams();
  if (sessionId) query.set("sessionId", sessionId);
  query.set("count", String(count));
  const res = await fetch(`${BASE_URL}/api/quiz/subtopic/${topicId}/${subtopicId}?${query.toString()}`);
  return res.json();
};

export const getProblemsTopics = async () => {
  const res = await fetch(`${BASE_URL}/api/problems/topics`);
  return res.json();
};

/** Full free-problem list for a LeetCode topic tag (no client limit; backend returns all). */
export const getLeetCodeProblemsByCategory = async (slug) => {
  const enc = encodeURIComponent(slug);
  const res = await fetch(`${BASE_URL}/api/leetcode/category/${enc}`);
  return res.json();
};
