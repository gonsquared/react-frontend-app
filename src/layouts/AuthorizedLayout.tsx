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

const avatarPlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='24' fill='%23d9dee7'/%3E%3Ccircle cx='24' cy='19' r='8' fill='%23747f8f'/%3E%3Cpath d='M10 42c2.7-8.6 8-13 14-13s11.3 4.4 14 13' fill='%23747f8f'/%3E%3C/svg%3E";

export default function AuthorizedLayout({
  isDarkTheme,
  toggleTheme,
}: AuthorizedLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
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
            <button
              className={styles.accountMenuButton}
              type="button"
              aria-label={`${authUser.firstName} account menu`}
              aria-expanded={isAccountMenuOpen}
              onClick={() =>
                setIsAccountMenuOpen(
                  (currentAccountMenuState) => !currentAccountMenuState,
                )
              }
            >
              <img
                className={styles.accountAvatar}
                src={avatarPlaceholder}
                alt=""
                aria-hidden="true"
              />
              <span className={styles.accountFirstName}>
                {authUser.firstName}
              </span>
              <span
                className={`${styles.accountMenuCaret} ${
                  isAccountMenuOpen ? styles.accountMenuCaretOpen : ""
                }`}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>
            {isAccountMenuOpen ? (
              <div className={styles.accountMenu}>
                <Link className={styles.accountMenuItem} to="/profile">
                  Profile
                </Link>
                <Link
                  className={styles.accountMenuItem}
                  to="/login"
                  replace
                  onClick={() => {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("tokenType");
                    localStorage.removeItem("authUser");
                  }}
                >
                  Logout
                </Link>
                <div className={styles.accountMenuTheme}>
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
              </div>
            ) : null}
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
