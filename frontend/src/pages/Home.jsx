import Topics from "../components/Topics";
import Problems from "../components/Problems";
import Quiz from "../components/Quiz";
import Compiler from "../components/Compiler";

function Home() {
  return (
    <div>
      <h1>DSA AI Tutor 🚀</h1>

      <Topics />
      <Problems />
      <Quiz />
      <Compiler />
    </div>
  );
}

export default Home;