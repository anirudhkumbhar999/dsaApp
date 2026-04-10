import { useEffect, useMemo, useRef, useState } from "react";
import { getLeetCodeSlugForSubtopic } from "../constants/leetcodeCategorySlugs";
import { useLeetCodeCatalog } from "../hooks/useLeetCodeCatalog";
import { useLeetCodeProgress } from "../hooks/useLeetCodeProgress";
import { filterProblems, sortProblems } from "../utils/problemListSortFilter";

const difficultyClass = {
  Easy: "leetcode-difficulty easy",
  Medium: "leetcode-difficulty medium",
  Hard: "leetcode-difficulty hard",
};

const PAGE_SIZE = 25;

function Problems({ topicId, subtopicId, subtopicName = "" }) {
  const slug = getLeetCodeSlugForSubtopic(topicId, subtopicId);
  const label = subtopicName ? `${subtopicName} · ${slug}` : slug;

  const { allProblems, loading, error } = useLeetCodeCatalog(slug);
  const { stats, toggleSolved } = useLeetCodeProgress(topicId, subtopicId, allProblems);

  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("difficulty-asc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const scrollRootRef = useRef(null);
  const sentinelRef = useRef(null);

  const filteredSorted = useMemo(() => {
    const filtered = filterProblems(allProblems, {
      difficulty: difficultyFilter,
      search: searchQuery,
    });
    return sortProblems(filtered, sortBy);
  }, [allProblems, difficultyFilter, searchQuery, sortBy]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [slug, difficultyFilter, searchQuery, sortBy]);

  const visibleProblems = useMemo(
    () => filteredSorted.slice(0, visibleCount),
    [filteredSorted, visibleCount]
  );

  const hasMore = visibleCount < filteredSorted.length;

  useEffect(() => {
    const root = scrollRootRef.current;
    const target = sentinelRef.current;
    if (!target || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredSorted.length));
        }
      },
      { root: root || null, rootMargin: "120px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, filteredSorted.length, visibleCount]);

  if (loading) {
    return <p className="topic-meta">Loading full catalog ({label})…</p>;
  }

  if (error) {
    return <p className="topic-meta">{error}</p>;
  }

  if (!allProblems.length) {
    return <p className="topic-meta">No free problems found for this category.</p>;
  }

  return (
    <div className="problems-embed">
      <p className="topic-meta" style={{ marginBottom: 8 }}>
        <strong>{slug}</strong>
        {subtopicName ? ` · ${subtopicName}` : ""} · {allProblems.length} in catalog
      </p>

      <div className="problems-embed-toolbar">
        <input
          className="problem-filter-input problems-embed-search"
          type="search"
          placeholder="Search…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="btn-secondary btn-compact"
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select
          className="btn-secondary btn-compact"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="difficulty-asc">Easy→Hard</option>
          <option value="difficulty-desc">Hard→Easy</option>
          <option value="title-asc">A–Z</option>
          <option value="title-desc">Z–A</option>
        </select>
      </div>

      {stats ? (
        <div className="subtopic-progress" style={{ marginBottom: 12 }}>
          <div className="subtopic-progress-top">
            <span>Progress (catalog)</span>
            <span>
              {stats.solved}/{stats.total} ({stats.percent}%)
            </span>
          </div>
          <div className="subtopic-progress-bar">
            <div className="subtopic-progress-fill" style={{ width: `${stats.percent}%` }} />
          </div>
        </div>
      ) : null}

      <div className="problems-embed-scroll" ref={scrollRootRef}>
        <div className="problems-embed-list">
          {visibleProblems.map((p) => {
            const solved = stats?.solvedSet?.has(p.title_slug);
            return (
              <div
                key={p.title_slug}
                className={`problems-embed-row problems-embed-row-with-actions ${solved ? "is-solved" : ""}`}
              >
                <span className="problems-embed-title">{p.title}</span>
                <span className={difficultyClass[p.difficulty] || "leetcode-difficulty"}>{p.difficulty}</span>
                <div className="problems-embed-row-btns">
                  <button
                    type="button"
                    className="btn-secondary btn-compact"
                    onClick={() => window.open(`https://leetcode.com/problems/${p.title_slug}/`, "_blank")}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-compact"
                    onClick={() => toggleSolved(p.title_slug, !solved)}
                  >
                    {solved ? "Undo" : "Solved"}
                  </button>
                </div>
              </div>
            );
          })}
          {hasMore ? <div ref={sentinelRef} className="problem-scroll-sentinel" /> : null}
        </div>
        <p className="topic-meta problems-embed-footer">
          {visibleProblems.length}/{filteredSorted.length} shown
          {filteredSorted.length < allProblems.length ? " (filtered)" : ""}
        </p>
      </div>
    </div>
  );
}

export default Problems;
