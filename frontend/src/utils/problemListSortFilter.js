const DIFF_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

export function difficultyRank(d) {
  return DIFF_ORDER[d] ?? 99;
}

/**
 * @param {Array<{ title: string, title_slug: string, difficulty: string }>} list
 * @param {'difficulty-asc' | 'difficulty-desc' | 'title-asc' | 'title-desc'} sortBy
 */
export function sortProblems(list, sortBy) {
  const out = [...list];
  switch (sortBy) {
    case "difficulty-asc":
      return out.sort((a, b) => {
        const dr = difficultyRank(a.difficulty) - difficultyRank(b.difficulty);
        if (dr !== 0) return dr;
        return a.title.localeCompare(b.title);
      });
    case "difficulty-desc":
      return out.sort((a, b) => {
        const dr = difficultyRank(b.difficulty) - difficultyRank(a.difficulty);
        if (dr !== 0) return dr;
        return a.title.localeCompare(b.title);
      });
    case "title-desc":
      return out.sort((a, b) => b.title.localeCompare(a.title));
    case "title-asc":
    default:
      return out.sort((a, b) => a.title.localeCompare(b.title));
  }
}

/**
 * @param {Array<{ title: string, difficulty: string }>} list
 * @param {{ difficulty: 'all' | 'Easy' | 'Medium' | 'Hard', search: string }} filters
 */
export function filterProblems(list, filters) {
  const search = (filters.search || "").trim().toLowerCase();
  const diff = filters.difficulty || "all";

  return list.filter((p) => {
    if (diff !== "all" && p.difficulty !== diff) return false;
    if (search && !p.title.toLowerCase().includes(search)) return false;
    return true;
  });
}
