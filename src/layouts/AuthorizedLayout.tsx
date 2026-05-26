import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  clearStoredSession,
  getAuthorizedUser,
  hasPermission,
} from "../helpers/authSession";
import styles from "../App.module.scss";

type AuthorizedLayoutProps = {
  isDarkTheme: boolean;
  toggleTheme: () => void;
};

const avatarPlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='24' fill='%23d9dee7'/%3E%3Ccircle cx='24' cy='19' r='8' fill='%23747f8f'/%3E%3Cpath d='M10 42c2.7-8.6 8-13 14-13s11.3 4.4 14 13' fill='%23747f8f'/%3E%3C/svg%3E";

const getSafeAvatarUrl = (avatarUrl?: string): string => {
  if (!avatarUrl) return avatarPlaceholder;

  if (/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(avatarUrl)) {
    return avatarUrl;
  }

  try {
    const url = new URL(avatarUrl, window.location.origin);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return avatarPlaceholder;
  }

  return avatarPlaceholder;
};

export default function AuthorizedLayout({
  isDarkTheme,
  toggleTheme,
}: AuthorizedLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileNavMenuOpen, setIsMobileNavMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileNavMenuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const authUser = getAuthorizedUser();

  useEffect(() => {
    const handleDocumentPointerDown = (event: PointerEvent) => {
      const eventTarget = event.target;

      if (!(eventTarget instanceof Node)) return;

      if (!accountMenuRef.current?.contains(eventTarget)) {
        setIsAccountMenuOpen(false);
      }

      if (!mobileNavMenuRef.current?.contains(eventTarget)) {
        setIsMobileNavMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, []);

  if (!authUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const canManageUsers = hasPermission(authUser, "manage_users");
  const canManageNotes = hasPermission(authUser, "manage_notes");
  const canManageOwnNotes = hasPermission(authUser, "manage_own_notes");
  const accountAvatarUrl = getSafeAvatarUrl(authUser.avatarUrl);
  const hasMobileNavLinks =
    canManageUsers || canManageNotes || canManageOwnNotes;

  return (
    <>
      {isSidebarOpen ? (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <div className={styles.sidebarHeader}>
              <Link className={styles.brandLink} to="/home">
                Home
              </Link>
              {hasMobileNavLinks ? (
                <div className={styles.mobileNavMenu} ref={mobileNavMenuRef}>
                  <button
                    className={styles.mobileNavMenuButton}
                    type="button"
                    aria-expanded={isMobileNavMenuOpen}
                    onClick={() =>
                      setIsMobileNavMenuOpen(
                        (currentNavMenuState) => !currentNavMenuState,
                      )
                    }
                  >
                    <span>Menu</span>
                    <span
                      className={`${styles.accountMenuCaret} ${
                        isMobileNavMenuOpen ? styles.accountMenuCaretOpen : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                  {isMobileNavMenuOpen ? (
                    <div className={styles.mobileNavDropdown}>
                      {canManageUsers ? <Link to="/users">Users</Link> : null}
                      {canManageNotes ? <Link to="/notes">Notes</Link> : null}
                      {canManageOwnNotes ? (
                        <Link to="/my-notes">My Notes</Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <button
                className={styles.sidebarToggle}
                type="button"
                aria-label="Hide sidebar"
                onClick={() => setIsSidebarOpen(false)}
              >
                ‹
              </button>
            </div>
            {hasMobileNavLinks ? (
              <div className={styles.desktopNavLinks}>
                {canManageUsers ? <Link to="/users">Users</Link> : null}
                {canManageNotes ? <Link to="/notes">Notes</Link> : null}
                {canManageOwnNotes ? (
                  <Link to="/my-notes">My Notes</Link>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className={styles.sidebarFooter} ref={accountMenuRef}>
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
                src={accountAvatarUrl}
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
                    clearStoredSession();
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
        id="main-content"
        className={`${styles.content} ${
          isSidebarOpen ? "" : styles.contentWithClosedSidebar
        }`}
        tabIndex={-1}
      >
        <Outlet />
      </main>
    </>
  );
}
