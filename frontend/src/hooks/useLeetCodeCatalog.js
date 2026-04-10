import { useEffect, useState } from "react";
import { getLeetCodeProblemsByCategory } from "../services/api";

/** Loads the full free-problem list for a LeetCode topic tag (backend returns all). */
export function useLeetCodeCatalog(slug) {
  const [allProblems, setAllProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) {
      setAllProblems([]);
      setError("");
      return;
    }

    let mounted = true;
    setLoading(true);
    setError("");

    getLeetCodeProblemsByCategory(slug)
      .then((data) => {
        if (!mounted) return;
        if (!Array.isArray(data)) {
          setAllProblems([]);
          setError(data?.error || "Failed to load problems.");
          return;
        }
        setAllProblems(data);
      })
      .catch(() => {
        if (!mounted) return;
        setAllProblems([]);
        setError("Unable to fetch problems.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  return { allProblems, loading, error };
}
