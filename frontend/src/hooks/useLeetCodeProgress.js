import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getListProgressStats,
  getRecord,
  setSlugSolved,
  syncPoolTotal,
  subscribeProgress,
} from "../utils/leetcodeProblemProgress";

/** @param allProblems full catalog for the current LeetCode tag (progress = solved / allProblems.length). */
export function useLeetCodeProgress(topicId, subtopicId, allProblems) {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => subscribeProgress(refresh), [refresh]);

  const catalog = useMemo(() => (Array.isArray(allProblems) ? allProblems : []), [allProblems]);

  useEffect(() => {
    if (topicId == null || subtopicId == null || !catalog.length) return;
    syncPoolTotal(topicId, subtopicId, catalog.length);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally when catalog size / topic changes
  }, [topicId, subtopicId, catalog.length, refresh]);

  const stats = useMemo(() => {
    void version;
    return topicId != null && subtopicId != null
      ? getListProgressStats(topicId, subtopicId, catalog)
      : null;
  }, [topicId, subtopicId, catalog, version]);

  const record = useMemo(() => {
    void version;
    return topicId != null && subtopicId != null ? getRecord(topicId, subtopicId) : null;
  }, [topicId, subtopicId, version]);

  const toggleSolved = useCallback(
    (titleSlug, nextSolved) => {
      if (topicId == null || subtopicId == null || !titleSlug) return;
      setSlugSolved(topicId, subtopicId, titleSlug, nextSolved);
      refresh();
    },
    [topicId, subtopicId, refresh]
  );

  return { stats, record, toggleSolved, refresh };
}
