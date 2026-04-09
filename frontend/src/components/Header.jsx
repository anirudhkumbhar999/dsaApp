import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
  const navigate = useNavigate();

  return (
    <div className="header">

      {/* 🔹 LOGO */}
      <div className="header-left" onClick={() => navigate("/")}>
        <div className="logo-box">DS</div>
        <span className="logo-text">DSA Master</span>
      </div>

      {/* 🔹 SEARCH */}
      <div className="header-center">
        <input
          type="text"
          placeholder="Search problems, topics..."
          className="search-bar"
        />
      </div>

      {/* 🔹 NAV ICONS */}
      <div className="header-right">

        <span className="icon" onClick={() => navigate("/")}>🏠</span>

        <span className="icon" onClick={() => navigate("/learn")}>
          📘
        </span>

        <span className="icon" onClick={() => navigate("/problems")}>
          📚
        </span>

        {/* TEMP (not full pages yet) */}
        <span className="icon">📝</span>
        <span className="icon">📒</span>
        <span className="icon">⚙️</span>

      </div>

    </div>
  );
}

export default Header;