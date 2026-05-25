import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import Home from "./pages/home/HomePage";
import LoginPage from "./pages/login/LoginPage";
import RegisterPage from "./pages/register/RegisterPage";
import Users from "./pages/users/UsersPage";
import styles from "./App.module.scss";

type Theme = "light" | "dark";

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isDarkTheme = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  return (
    <Router>
      <div className={`${styles.app} ${isDarkTheme ? styles.darkTheme : ""}`}>
        <div className={styles.appBody}>
          {isSidebarOpen ? (
            <aside className={styles.sidebar}>
              <div className={styles.sidebarTop}>
                <div className={styles.sidebarHeader}>
                  <Link className={styles.brandLink} to="/">
                    Home
                  </Link>
                  <button
                    className={styles.sidebarToggle}
                    type="button"
                    aria-label="Hide sidebar"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    ‹
                  </button>
                </div>
                <Link to="/users">Users</Link>
              </div>
              <div className={styles.sidebarFooter}>
                <button
                  className={`${styles.themeToggle} ${
                    isDarkTheme ? styles.themeToggleDark : ""
                  }`}
                  type="button"
                  aria-label="Toggle light and dark theme"
                  aria-pressed={isDarkTheme}
                  onClick={toggleTheme}
                >
                  <span className={styles.sunIcon} aria-hidden="true">
                    ☀
                  </span>
                  <span className={styles.moonIcon} aria-hidden="true">
                    ●
                  </span>
                </button>
              </div>
            </aside>
          ) : (
            <button
              className={styles.floatingSidebarToggle}
              type="button"
              aria-label="Show sidebar"
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
          )}
          <main
            className={`${styles.content} ${
              isSidebarOpen ? "" : styles.contentWithClosedSidebar
            }`}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/users" element={<Users />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
