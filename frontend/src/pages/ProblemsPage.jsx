import { useLocation, useParams } from "react-router-dom";

function ProblemsPage() {
  const { topicId } = useParams();
  const location = useLocation();
  const topicName = location.state?.topicName || (topicId ? `Topic ${topicId}` : "Problems");

  return (
    <div className="page">
      <h1 className="page-title">{topicId ? `${topicName} Problems` : "Problems"}</h1>
      <p className="page-subtitle">
        {topicId
          ? `Problem bank for ${topicName}. This route is ready for topic-specific problem mapping.`
          : "Problem bank UI is ready; full backend data mapping comes next."}
      </p>
      <div className="card">
        <p className="topic-title">{topicId ? "Topic Problems" : "Coming soon"}</p>
        <p className="topic-meta">
          {topicId
            ? `This section will show ${topicName} problems by subtopic, difficulty, and solve progress.`
            : "This section will show backend-driven problem lists by topic, difficulty, and progress."}
        </p>
      </div>
    </div>
  );
}

export default ProblemsPage;
