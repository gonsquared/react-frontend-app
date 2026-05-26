import { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import type User from "../interfaces/User";
import type { UserPermission } from "../interfaces/User";
import styles from "../App.module.scss";

type AuthorizedLayoutProps = {
  isDarkTheme: boolean;
  toggleTheme: () => void;
};

const getAuthorizedUser = (): User | null => {
  const accessToken = localStorage.getItem("accessToken");
  const authUser = localStorage.getItem("authUser");

  if (!accessToken || !authUser) return null;

  try {
    return JSON.parse(authUser) as User;
  } catch {
    return null;
  }
};

const hasPermission = (user: User, permission: UserPermission): boolean =>
  user.role === "admin" || (user.permissions?.includes(permission) ?? false);

export default function AuthorizedLayout({
  isDarkTheme,
  toggleTheme,
}: AuthorizedLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const authUser = getAuthorizedUser();

  if (!authUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const canManageUsers = hasPermission(authUser, "manage_users");

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
            {canManageUsers ? <Link to="/users">Users</Link> : null}
          </div>
          <div className={styles.sidebarFooter}>
            <Link className={styles.profileLink} to="/profile">
              Profile
            </Link>
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
