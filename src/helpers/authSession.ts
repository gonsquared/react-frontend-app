const sessionKeys = ["accessToken", "tokenType", "authUser"] as const;

const publicPaths = ["/login", "/register", "/activate-account"];

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
