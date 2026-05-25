import { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import styles from "../App.module.scss";

type AuthorizedLayoutProps = {
  isDarkTheme: boolean;
  toggleTheme: () => void;
};

const hasAuthorizedSession = () => {
  const accessToken = localStorage.getItem("accessToken");
  const authUser = localStorage.getItem("authUser");

  if (!accessToken || !authUser) return false;

  try {
    return Boolean(JSON.parse(authUser));
  } catch {
    return false;
  }
};

export default function AuthorizedLayout({
  isDarkTheme,
  toggleTheme,
}: AuthorizedLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  if (!hasAuthorizedSession()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <>
      {isSidebarOpen ? (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <div className={styles.sidebarHeader}>
              <Link className={styles.brandLink} to="/home">
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
        <Outlet />
      </main>
    </>
  );
}
