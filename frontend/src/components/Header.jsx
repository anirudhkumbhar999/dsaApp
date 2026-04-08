import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  return (
    <div className="header">

      <div className="logo" onClick={() => navigate("/")}>
        DSA Tutor AI
      </div>

      <div className="nav-items">
        <span onClick={() => navigate("/")}>🏠 Home</span>
        <span onClick={() => navigate("/problems")}>📚 Problems</span>
      </div>

      <div className="right-section">
        <span>Topic</span>
        <span>Step</span>
      </div>

    </div>
  );
}

export default Header;