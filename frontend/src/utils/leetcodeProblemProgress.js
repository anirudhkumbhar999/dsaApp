const STORAGE_KEY = "dsaLeetcodeProblemProgress";
export const LEETCODE_PROGRESS_EVENT = "dsa-leetcode-progress";

const DEFAULT_POOL = 15;

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRaw(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // quota or private mode
  }
  window.dispatchEvent(new CustomEvent(LEETCODE_PROGRESS_EVENT, { detail: { map } }));
}

export function subtopicKey(topicId, subtopicId) {
  return `${String(topicId)}-${String(subtopicId)}`;
}

export function getRecord(topicId, subtopicId) {
  const map = readRaw();
  const rec = map[subtopicKey(topicId, subtopicId)];
  if (!rec || typeof rec !== "object") {
    return { solvedSlugs: [], poolTotal: 0 };
  }
  return {
    solvedSlugs: Array.isArray(rec.solvedSlugs) ? [...rec.solvedSlugs] : [],
    poolTotal: Math.max(0, Number(rec.poolTotal) || 0),
  };
}

export function setSlugSolved(topicId, subtopicId, titleSlug, solved) {
  if (!titleSlug) return getRecord(topicId, subtopicId);
  const map = readRaw();
  const key = subtopicKey(topicId, subtopicId);
  const cur = map[key] || { solvedSlugs: [], poolTotal: 0 };
  const set = new Set(Array.isArray(cur.solvedSlugs) ? cur.solvedSlugs : []);
  if (solved) set.add(titleSlug);
  else set.delete(titleSlug);
  map[key] = {
    ...cur,
    solvedSlugs: [...set],
    poolTotal: Number(cur.poolTotal) || 0,
  };
  writeRaw(map);
  return map[key];
}

/** Persists catalog size (total free problems in category) for progress bars. */
export function syncPoolTotal(topicId, subtopicId, catalogSize) {
  const n = Math.max(0, Number(catalogSize) || 0);
  const map = readRaw();
  const key = subtopicKey(topicId, subtopicId);
  const cur = map[key] || { solvedSlugs: [], poolTotal: 0 };
  const poolTotal = Math.max(Number(cur.poolTotal) || 0, n);
  map[key] = { ...cur, poolTotal };
  writeRaw(map);
  return map[key];
}

export function clearSubtopicProgress(topicId, subtopicId) {
  const map = readRaw();
  delete map[subtopicKey(topicId, subtopicId)];
  writeRaw(map);
}

/** Total + solved for a subtopic (Learn / sidebar). `poolTotal` is catalog size once synced. */
export function getSubtopicBarStats(topicId, subtopicId) {
  const { solvedSlugs, poolTotal } = getRecord(topicId, subtopicId);
  const solved = solvedSlugs.length;
  const total = poolTotal > 0 ? poolTotal : Math.max(solved, DEFAULT_POOL);
  const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
  return { solved, total, percent, solvedSlugs, catalogKnown: poolTotal > 0 };
}

/**
 * Progress vs full catalog: solved marks that appear in `allProblems`, total = catalog length.
 */
export function getListProgressStats(topicId, subtopicId, allProblems) {
  const list = Array.isArray(allProblems) ? allProblems : [];
  const slugSet = new Set(list.map((p) => p.title_slug));
  const { solvedSlugs } = getRecord(topicId, subtopicId);
  const solvedSet = new Set(solvedSlugs);
  const solvedInCatalog = solvedSlugs.filter((s) => slugSet.has(s)).length;
  const total = list.length;
  const percent = total > 0 ? Math.round((solvedInCatalog / total) * 100) : 0;

  const byDiff = { Easy: 0, Medium: 0, Hard: 0 };
  const solvedByDiff = { Easy: 0, Medium: 0, Hard: 0 };
  for (const p of list) {
    const d = p.difficulty;
    if (byDiff[d] !== undefined) byDiff[d] += 1;
    if (solvedSet.has(p.title_slug) && solvedByDiff[d] !== undefined) solvedByDiff[d] += 1;
  }

  return {
    solved: solvedInCatalog,
    total,
    percent,
    solvedSet,
    inListSolved: solvedInCatalog,
    byDiff,
    solvedByDiff,
  };
}

export function isSlugSolved(topicId, subtopicId, titleSlug) {
  const { solvedSlugs } = getRecord(topicId, subtopicId);
  return solvedSlugs.includes(titleSlug);
}

/** Unique slugs marked solved across all subtopics (for dashboard). */
export function getGlobalUniqueSolvedCount() {
  const map = readRaw();
  const all = new Set();
  for (const rec of Object.values(map)) {
    if (!rec || !Array.isArray(rec.solvedSlugs)) continue;
    rec.solvedSlugs.forEach((s) => all.add(s));
  }
  return all.size;
}

export function subscribeProgress(callback) {
  const handler = () => callback();
  window.addEventListener(LEETCODE_PROGRESS_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(LEETCODE_PROGRESS_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
