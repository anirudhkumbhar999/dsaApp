import { Outlet, NavLink } from "react-router-dom";
import "./AppShell.css";

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" className="shell-nav-icon" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems = [
  { to: "/", label: "Dashboard", iconPath: "M3 11l9-8 9 8M5 10v10h14V10" },
  { to: "/learn", label: "Topics", iconPath: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4zM8 4v19" },
  { to: "/problems", label: "Problems", iconPath: "M9 3h6l1 2h4v16H4V5h4l1-2zM9 11h6M9 15h6" },
  { to: "/quiz", label: "Quiz", iconPath: "M9.5 9a2.5 2.5 0 1 1 4.8 1c-.4 1.1-1.7 1.5-2.3 2.3-.2.3-.3.6-.3 1M12 17h.01M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0" },
  { to: "/notes", label: "Notes", iconPath: "M7 3h8l4 4v14H7zM15 3v5h5M10 13h6M10 17h6" },
  { to: "/compiler", label: "Compiler", iconPath: "M8 9l-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" },
];

function AppShell() {
  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <div className="shell-brand-logo">DS</div>
          <div>
            <p className="shell-brand-title">DSA Tutor AI</p>
            <p className="shell-brand-subtitle">Modern Dashboard</p>
          </div>
        </div>

        <nav className="shell-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `shell-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon path={item.iconPath} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="shell-main">
        <header className="shell-header">
          <div className="shell-search-wrap">
            <input className="shell-search" placeholder="Search topics, problems..." />
          </div>
          <div className="shell-header-right">
            <span className="shell-chip">Gemini Tutor</span>
            <div className="shell-avatar">JD</div>
          </div>
        </header>

        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
