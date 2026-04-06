import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTeaching } from "../services/api";
import { sendMessage } from "../services/api";


function Tutor() {
  const { topicId, subtopicId, sessionId } = useParams();

  const [step, setStep] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true); // ✅ NEW

  const handleNext = async () => {
  setLoading(true);

  const data = await sendMessage("next", sessionId);

  setStep(data.step);
  setReply(data.reply);

  setLoading(false);
};

  useEffect(() => {
    setLoading(true); // start loading

    getTeaching(topicId, subtopicId, sessionId).then((data) => {
      setStep(data.step);
      setReply(data.reply);
      setLoading(false); // stop loading
    });
  }, [topicId, subtopicId, sessionId]);

  // ✅ SHOW LOADING
  if (loading) {
    return <h2>Loading AI Tutor...</h2>;
  }

  return (
    <div>
    
      <h2>Step: {step}</h2>
      <p>{reply}</p>
       <button onClick={handleNext}>NEXT</button>
    </div>
  );
}

export default Tutor;