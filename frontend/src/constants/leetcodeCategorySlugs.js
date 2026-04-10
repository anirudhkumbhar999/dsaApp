/**
 * Maps app topic/subtopic IDs (backend `topicsData` / `subtopicsData`) to LeetCode
 * topic tag slugs used by GraphQL `topicTag(slug: ...)`.
 */
const SUBTOPIC_TO_LEETCODE_SLUG = {
  "1-101": "array",
  "1-102": "two-pointers",
  "1-103": "sliding-window",
  "2-201": "string",
  "2-202": "string",
  "2-203": "hash-table",
  "3-301": "linked-list",
  "3-302": "linked-list",
  "3-303": "linked-list",
};

const TOPIC_DEFAULT_SLUG = {
  1: "array",
  2: "string",
  3: "linked-list",
};

export function getDefaultLeetCodeSlugForTopic(topicId) {
  const id = Number(topicId);
  return TOPIC_DEFAULT_SLUG[id] || "array";
}

export function getLeetCodeSlugForSubtopic(topicId, subtopicId) {
  if (subtopicId == null || subtopicId === "") {
    return getDefaultLeetCodeSlugForTopic(topicId);
  }
  const key = `${String(topicId)}-${String(subtopicId)}`;
  return SUBTOPIC_TO_LEETCODE_SLUG[key] || getDefaultLeetCodeSlugForTopic(topicId);
}
