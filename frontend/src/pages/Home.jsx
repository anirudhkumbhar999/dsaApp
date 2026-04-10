import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTopics } from "../services/api";
import "./Home.css";

function StatIcon({ path }) {
  return (
    <svg viewBox="0 0 24 24" className="stat-icon" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Home() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

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
          setLoadingTopics(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page">
      <div className="hero-card">
        <p className="hero-label">Daily Challenge</p>
        <h1>Reverse Linked List II</h1>
        <p>Practice one medium-level linked-list challenge and keep your streak alive.</p>
      </div>

      <div className="grid cards-4">
        <div className="card">
          <div className="stat-head">
            <StatIcon path="M9 3h6l1 2h4v16H4V5h4l1-2zM9 11h6M9 15h6" />
          </div>
          <p className="stat-label">Problems Solved</p>
          <p className="stat-value">123</p>
        </div>
        <div className="card">
          <div className="stat-head">
            <StatIcon path="M12 7v5l3 3M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0" />
          </div>
          <p className="stat-label">Current Streak</p>
          <p className="stat-value">7 days</p>
        </div>
        <div className="card">
          <div className="stat-head">
            <StatIcon path="M4 18l6-6 4 4 6-8M4 6h16M4 10h10" />
          </div>
          <p className="stat-label">Acceptance</p>
          <p className="stat-value">68%</p>
        </div>
        <div className="card">
          <div className="stat-head">
            <StatIcon path="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6L3.3 9.4l6-.9L12 3z" />
          </div>
          <p className="stat-label">Rank</p>
          <p className="stat-value">#2,481</p>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <h2 className="topic-title">Topics</h2>
            <p className="topic-meta">Fetched from backend API and ready for learning flow.</p>
          </div>
        </div>

        {loadingTopics ? (
          <p className="page-subtitle">Loading topics...</p>
        ) : (
          <div className="grid cards-3">
            {topics.map((topic) => (
                <div key={topic.id} className="card">
                  <p className="topic-title">{topic.name}</p>
                  <p className="topic-meta">Open main track and continue with subtopics.</p>
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
    </div>
  );
}

export default Home;
