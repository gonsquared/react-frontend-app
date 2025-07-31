import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/HomePage";
import Users from "./pages/UsersPage";
import styles from "./App.module.scss";

export default function App() {
  return (
    <Router>
      <nav className={styles.navbar}>
        <div className={styles.navLinks}>
          <Link to="/">Home</Link>
          <Link to="/users">Users</Link>
        </div>
      </nav>
      <div className={styles.content}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </div>
    </Router>
  );
}
