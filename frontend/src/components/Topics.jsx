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
            <button
              key={topic.id}
              className="card topic-card"
              onClick={() => navigate(`/learn/${topic.id}`, { state: { topicName: topic.name } })}
            >
              <p className="topic-title">{topic.name}</p>
              <p className="topic-meta">Open main topic and view all backend subtopics.</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Topics;