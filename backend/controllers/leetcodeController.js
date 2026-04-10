const { getProblemsByTopic } = require("../services/leetcodeService");

const getCategoryProblems = async (req, res) => {
  const { slug } = req.params;

  try {
    const problems = await getProblemsByTopic(slug);
    return res.json(problems);
  } catch (error) {
    const status = error.status || 500;
    const message =
      status === 500 ? "Failed to fetch LeetCode problems" : error.message || "Failed to fetch LeetCode problems";
    return res.status(status).json({ error: message });
  }
};

module.exports = {
  getCategoryProblems,
};
