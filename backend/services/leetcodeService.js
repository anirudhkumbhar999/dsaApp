const axios = require("axios");

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const TOPIC_PROBLEMS_QUERY = `
  query getTopicProblems($slug: String!) {
    topicTag(slug: $slug) {
      name
      questions {
        title
        titleSlug
        difficulty
        isPaidOnly
      }
    }
  }
`;

const getProblemsByTopic = async (slug) => {
  const normalizedSlug = String(slug || "").trim().toLowerCase();

  if (!normalizedSlug) {
    const error = new Error("Topic slug is required");
    error.status = 400;
    throw error;
  }

  const response = await axios.post(
    LEETCODE_GRAPHQL_URL,
    {
      query: TOPIC_PROBLEMS_QUERY,
      variables: { slug: normalizedSlug },
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 120000,
    }
  );

  const questions = response?.data?.data?.topicTag?.questions;
  if (!Array.isArray(questions)) {
    const error = new Error("Invalid response from LeetCode");
    error.status = 502;
    throw error;
  }

  return questions
    .filter((question) => !question.isPaidOnly)
    .map((question) => ({
      title: question.title,
      title_slug: question.titleSlug,
      difficulty: question.difficulty,
      url: `https://leetcode.com/problems/${question.titleSlug}`,
    }));
};

module.exports = {
  getProblemsByTopic,
};
