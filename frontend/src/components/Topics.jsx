import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTopics } from "../services/api";

function Topics() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    getTopics().then((data) => {
      setTopics(data);
    });
  }, []);

  return (
    <div>
      <h2>Select Topic</h2>

      {topics.map((topic) => (
        <div key={topic.id}>
          <button onClick={() => navigate(`/learn/${topic.id}`)}>
            {topic.name}
          </button>
        </div>
      ))}
    </div>
  );
}

export default Topics;