import type User from "../interfaces/User";
import type { UserPermission } from "../interfaces/User";

const sessionKeys = ["accessToken", "tokenType", "authUser"] as const;

const publicPaths = ["/login", "/register", "/activate-account"];

export const getStoredAccessToken = () => localStorage.getItem("accessToken");

export const getStoredAuthUser = (): User | null => {
  const authUser = localStorage.getItem("authUser");
  if (!authUser) return null;

  try {
    return JSON.parse(authUser) as User;
  } catch {
    clearStoredSession();
    return null;
  }
};

export const getAuthorizedUser = (): User | null => {
  const accessToken = getStoredAccessToken();
  const authUser = getStoredAuthUser();

  if (!accessToken || !authUser) {
    clearStoredSession();
    return null;
  }

  return authUser;
};

export const getUserPermissions = (user: User): UserPermission[] => {
  if (user.permissions) return user.permissions;

  return user.role === "admin"
    ? ["manage_users", "manage_own", "manage_notes", "manage_own_notes"]
    : ["manage_own", "manage_own_notes"];
};

export const hasPermission = (
  user: User | null,
  permission: UserPermission,
): boolean => (user ? getUserPermissions(user).includes(permission) : false);

export const getAuthHeaders = (
  baseHeaders: Record<string, string> = {},
): Record<string, string> => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) return baseHeaders;

  return {
    ...baseHeaders,
    Authorization: `Bearer ${accessToken}`,
  };
};

export const clearStoredSession = () => {
  sessionKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
};

export const isPublicPath = (pathname: string) =>
  publicPaths.some((publicPath) => pathname.startsWith(publicPath));

export const redirectToLogin = () => {
  if (window.location.pathname === "/login") return;

  window.history.replaceState({}, "", "/login");
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export const forceLogout = () => {
  clearStoredSession();
  redirectToLogin();
};

export const handleUnauthorizedResponse = (response: Response) => {
  if (response.status !== 401 || isPublicPath(window.location.pathname)) {
    return false;
  }

  forceLogout();
  return true;
};
