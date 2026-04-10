import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getProblemsTopics, getSubtopics } from "../services/api";
import { getLeetCodeSlugForSubtopic } from "../constants/leetcodeCategorySlugs";
import { useLeetCodeCatalog } from "../hooks/useLeetCodeCatalog";
import { useLeetCodeProgress } from "../hooks/useLeetCodeProgress";
import { clearSubtopicProgress } from "../utils/leetcodeProblemProgress";
import { filterProblems, sortProblems } from "../utils/problemListSortFilter";

const PAGE_SIZE = 30;

function ProblemsPage() {
  const { topicId: topicIdParam, subtopicId: subtopicIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [currentTopic, setCurrentTopic] = useState(topicIdParam || null);
  const [currentSubtopic, setCurrentSubtopic] = useState(subtopicIdParam || null);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("difficulty-asc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sentinelRef = useRef(null);

  useEffect(() => {
    getProblemsTopics().then((data) => {
      setTopics(Array.isArray(data) ? data : []);
      if (!topicIdParam && Array.isArray(data) && data.length > 0) {
        setCurrentTopic(String(data[0].topicId));
      }
    });
  }, [topicIdParam]);

  useEffect(() => {
    if (topicIdParam) setCurrentTopic(String(topicIdParam));
  }, [topicIdParam]);

  useEffect(() => {
    if (subtopicIdParam) setCurrentSubtopic(String(subtopicIdParam));
  }, [subtopicIdParam]);

  useEffect(() => {
    if (!currentTopic) return;
    let mounted = true;
    getSubtopics(currentTopic)
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setSubtopics(list);
        if (!list.length) return;

        if (subtopicIdParam && list.some((s) => String(s.id) === String(subtopicIdParam))) {
          setCurrentSubtopic(String(subtopicIdParam));
          return;
        }

        const firstId = String(list[0].id);
        setCurrentSubtopic(firstId);
        if (!subtopicIdParam || !list.some((s) => String(s.id) === String(subtopicIdParam))) {
          navigate(`/problems/topic/${currentTopic}/subtopic/${firstId}`, { replace: true, state: location.state });
        }
      })
      .catch(() => {
        if (mounted) setSubtopics([]);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- location.state only for navigate(); including location causes redundant refetches
  }, [currentTopic, subtopicIdParam, navigate]);

  const slug = useMemo(
    () => getLeetCodeSlugForSubtopic(currentTopic, currentSubtopic),
    [currentTopic, currentSubtopic]
  );

  const { allProblems, loading: catalogLoading, error: catalogError } = useLeetCodeCatalog(slug);

  const { stats, toggleSolved, refresh } = useLeetCodeProgress(
    currentTopic,
    currentSubtopic,
    allProblems
  );

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
    const el = sentinelRef.current;
    if (!el || catalogLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting;
        if (hit) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredSorted.length));
        }
      },
      { root: null, rootMargin: "240px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [catalogLoading, filteredSorted.length, visibleCount]);

  const topicName = useMemo(
    () => topics.find((t) => String(t.topicId) === String(currentTopic))?.name || "",
    [topics, currentTopic]
  );

  const subtopicName = useMemo(
    () => subtopics.find((s) => String(s.id) === String(currentSubtopic))?.name || "",
    [subtopics, currentSubtopic]
  );

  const handleResetCategory = () => {
    if (!currentTopic || !currentSubtopic) return;
    if (!window.confirm("Clear all solved marks for this subtopic category?")) return;
    clearSubtopicProgress(currentTopic, currentSubtopic);
    refresh();
  };

  const showProgressCard =
    currentTopic && currentSubtopic && stats && !catalogLoading && !catalogError && allProblems.length > 0;

  return (
    <div className="page">
      <p className="page-subtitle">Problems</p>
      <h1 className="page-title">Explore LeetCode by topic</h1>

      <div className="card">
        <div className="quiz-toolbar" style={{ flexWrap: "wrap" }}>
          <select
            className="btn-secondary"
            value={currentTopic || ""}
            onChange={(event) => {
              const next = event.target.value;
              setCurrentTopic(next);
              setCurrentSubtopic(null);
              navigate(`/problems/topic/${next}`, { state: location.state });
            }}
          >
            <option value="" disabled>
              Select topic
            </option>
            {topics.map((topic) => (
              <option key={topic.topicId} value={topic.topicId}>
                {topic.name}
              </option>
            ))}
          </select>

          <select
            className="btn-secondary"
            value={currentSubtopic || ""}
            onChange={(event) => {
              const sid = event.target.value;
              setCurrentSubtopic(sid);
              if (currentTopic) {
                navigate(`/problems/topic/${currentTopic}/subtopic/${sid}`, {
                  replace: true,
                  state: location.state,
                });
              }
            }}
            disabled={!subtopics.length}
          >
            {subtopics.length === 0 ? (
              <option value="">No subtopics</option>
            ) : (
              subtopics.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))
            )}
          </select>

          <span className="topic-meta" style={{ marginLeft: "auto", marginBottom: 0 }}>
            LeetCode tag: <strong>{slug || "—"}</strong>
          </span>
          {currentTopic && (
            <button
              className="btn-secondary"
              type="button"
              onClick={() =>
                navigate(`/learn/${currentTopic}`, {
                  state: { topicName: topicName || location.state?.topicName },
                })
              }
            >
              Go to Learning Path
            </button>
          )}
        </div>
      </div>

      <div className="card problem-filters-card">
        <p className="topic-title" style={{ marginBottom: 10 }}>
          Filters & sort
        </p>
        <div className="problem-filters-grid">
          <label className="problem-filter-field">
            <span className="problem-filter-label">Search title</span>
            <input
              className="problem-filter-input"
              type="search"
              placeholder="Filter by name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <label className="problem-filter-field">
            <span className="problem-filter-label">Difficulty</span>
            <select
              className="btn-secondary problem-filter-select"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>
          <label className="problem-filter-field">
            <span className="problem-filter-label">Sort</span>
            <select
              className="btn-secondary problem-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="difficulty-asc">Difficulty: Easy → Hard</option>
              <option value="difficulty-desc">Difficulty: Hard → Easy</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
            </select>
          </label>
        </div>
        {!catalogLoading && !catalogError && (
          <p className="topic-meta problem-filter-meta">
            Catalog: {allProblems.length} free problems · Showing {visibleProblems.length} of {filteredSorted.length}{" "}
            {filteredSorted.length !== allProblems.length ? "(filtered)" : ""}
            {hasMore ? " · scroll for more" : ""}
          </p>
        )}
      </div>

      {catalogLoading ? (
        <p className="page-subtitle">Loading full problem catalog in background…</p>
      ) : catalogError ? (
        <p className="page-subtitle">{catalogError}</p>
      ) : null}

      {showProgressCard ? (
        <div className="card problem-progress-card">
          <div className="problem-progress-card-top">
            <div>
              <p className="topic-title" style={{ marginBottom: 4 }}>
                Your progress (full catalog)
              </p>
              <p className="topic-meta" style={{ margin: 0 }}>
                {topicName && subtopicName ? `${topicName} · ${subtopicName}` : "This category"} · saved locally
              </p>
            </div>
            <button className="btn-secondary" type="button" onClick={handleResetCategory}>
              Reset category
            </button>
          </div>
          <div className="subtopic-progress">
            <div className="subtopic-progress-top">
              <span>Solved / total problems</span>
              <span>
                {stats.solved}/{stats.total} ({stats.percent}%)
              </span>
            </div>
            <div className="subtopic-progress-bar">
              <div className="subtopic-progress-fill" style={{ width: `${stats.percent}%` }} />
            </div>
          </div>
          <div className="problem-progress-diff-grid">
            {["Easy", "Medium", "Hard"].map((d) => (
              <div key={d} className="problem-progress-diff-pill">
                <span className="problem-progress-diff-label">{d}</span>
                <span className="problem-progress-diff-count">
                  {stats.solvedByDiff[d]}/{stats.byDiff[d] || 0} solved in catalog
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!catalogLoading && !catalogError && allProblems.length === 0 ? (
        <p className="page-subtitle">No free problems in this category.</p>
      ) : null}

      {!catalogLoading && !catalogError && allProblems.length > 0 ? (
        <div className="problem-bank-grid-wrap">
          <div className="grid cards-2">
            {visibleProblems.map((problem) => {
              const solved = stats?.solvedSet?.has(problem.title_slug);
              return (
                <div
                  key={problem.title_slug}
                  className={`card problem-bank-card ${solved ? "is-solved" : ""}`}
                >
                  <div className="topic-card-top">
                    <p className="topic-title" style={{ marginBottom: 0 }}>
                      {problem.title}
                    </p>
                    <span
                      className={
                        problem.difficulty === "Easy"
                          ? "leetcode-difficulty easy"
                          : problem.difficulty === "Medium"
                            ? "leetcode-difficulty medium"
                            : problem.difficulty === "Hard"
                              ? "leetcode-difficulty hard"
                              : "leetcode-difficulty"
                      }
                    >
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="problem-bank-actions">
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() =>
                        window.open(`https://leetcode.com/problems/${problem.title_slug}/`, "_blank")
                      }
                    >
                      Open on LeetCode
                    </button>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => toggleSolved(problem.title_slug, !solved)}
                    >
                      {solved ? "Undo solved" : "Mark solved"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore ? <div ref={sentinelRef} className="problem-scroll-sentinel" aria-hidden /> : null}
          {!hasMore && filteredSorted.length > 0 ? (
            <p className="page-subtitle problem-end-hint">End of list ({filteredSorted.length} problems)</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default ProblemsPage;
