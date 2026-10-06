import { NavLink } from "react-router-dom";
import "./Navbar.css";

const LINKS = [
  { to: "/", label: "Add Expense" },
  { to: "/categories", label: "Category" },
  { to: "/history", label: "Expenditure History" },
  { to: "/analytics", label: "Expenses" },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">Expense Tracker</span>
      <ul className="navbar-links">
        {LINKS.map(({ to, label }) => (
          <li key={to}>
            <NavLink to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
