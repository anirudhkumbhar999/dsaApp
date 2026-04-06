import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSubtopics, startSession } from "../services/api";

function Learn() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [subtopics, setSubtopics] = useState([]);

  // 🔹 Fetch subtopics
  useEffect(() => {
    getSubtopics(topicId).then((data) => {
      setSubtopics(data);
    });
  }, [topicId]);

  // 🔹 Handle subtopic click → start session
  const handleSubtopicClick = async (subtopicId) => {
    try {
      const data = await startSession(topicId, subtopicId);
      const sessionId = data.sessionId;

      navigate(`/learn/${topicId}/${subtopicId}/${sessionId}`);
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  return (
    <div>
      <h2>Select Subtopic</h2>

      {subtopics.map((sub) => (
        <div key={sub.id}>
          <button onClick={() => handleSubtopicClick(sub.id)}>
            {sub.name}
          </button>
        </div>
      ))}
    </div>
  );
}

export default Learn;