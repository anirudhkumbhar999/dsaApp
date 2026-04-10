import { useEffect, useMemo, useState } from "react";
import { getSubtopicBarStats, subscribeProgress } from "../utils/leetcodeProblemProgress";

/** Live-updating per-subtopic bar stats for Learn (no problem list required). */
export function useSubtopicBarProgress(topicId, subtopics) {
  const [version, setVersion] = useState(0);

  useEffect(() => subscribeProgress(() => setVersion((v) => v + 1)), []);

  return useMemo(() => {
    void version;
    const map = {};
    for (const sub of subtopics) {
      map[sub.id] = getSubtopicBarStats(topicId, sub.id);
    }
    return map;
  }, [topicId, subtopics, version]);
}
