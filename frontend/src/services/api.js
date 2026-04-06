const BASE_URL = "http://localhost:5000";

export const getSubtopics = async (topicId) => {
  const res = await fetch(`${BASE_URL}/api/subtopics/${topicId}`);
  return res.json();
};
export const getTopics = async () => {
  const res = await fetch("http://localhost:5000/api/topics");
  return res.json();
};

export const startSession = async (topicId, subtopicId) => {
  const res = await fetch("http://localhost:5000/api/start-session", {
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
    `http://localhost:5000/api/topics/${topicId}/subtopics/${subtopicId}?sessionId=${sessionId}`
  );

  return res.json();
};
export const sendMessage = async (message, sessionId) => {
  const res = await fetch("http://localhost:5000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, sessionId }),
  });

  return res.json();
};