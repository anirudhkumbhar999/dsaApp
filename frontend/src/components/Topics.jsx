import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTopics } from "../services/api";

function Topics() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getTopics()
      .then((data) => {
        if (mounted) {
          setTopics(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (mounted) {
          setTopics([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Topics Roadmap</h1>
      <p className="page-subtitle">Choose a topic to begin structured AI learning.</p>
      {loading ? (
        <p className="page-subtitle">Loading topics...</p>
      ) : (
        <div className="grid cards-3">
          {topics.map((topic) => (
              <div key={topic.id} className="card">
                <p className="topic-title">{topic.name}</p>
                <p className="topic-meta">Open main topic and view all backend subtopics.</p>
                <div className="action-row topic-card-actions">
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => navigate(`/learn/${topic.id}`, { state: { topicName: topic.name } })}
                  >
                    Learn
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => navigate(`/problems/topic/${topic.id}`, { state: { topicName: topic.name } })}
                  >
                    Problems
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => navigate(`/quiz/topic/${topic.id}`, { state: { topicName: topic.name } })}
                  >
                    Quiz
                  </button>
                </div>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Topics;
